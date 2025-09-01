import { prisma } from '@/services/database';
import { Logger } from '@/utils/logger';
import { VotingWeightService } from './voting-weight.service';
import { TreasuryService } from './treasury.service';

export enum ExecutionStatus {
  PENDING = 'PENDING',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface ExecutionTask {
  proposalId: string;
  type: string;
  scheduledTime: Date;
  status: ExecutionStatus;
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export class ProposalExecutionService {
  private static executionQueue: Map<string, ExecutionTask> = new Map();
  private static isProcessing = false;
  private static readonly EXECUTION_DELAY_MS = 24 * 60 * 60 * 1000; // 24小时时间锁
  private static readonly MAX_RETRIES = 3;

  /**
   * 添加提案到执行队列
   */
  static async queueProposalExecution(proposalId: string): Promise<void> {
    try {
      const proposal = await prisma.dAOProposal.findUnique({
        where: { id: proposalId },
        include: { dao: true }
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // 检查提案是否通过
      const threshold = await VotingWeightService.checkProposalThreshold(proposalId);
      if (!threshold.passed) {
        throw new Error('Proposal has not passed');
      }

      // 创建执行任务
      const executionTask: ExecutionTask = {
        proposalId,
        type: proposal.category,
        scheduledTime: new Date(Date.now() + this.EXECUTION_DELAY_MS),
        status: ExecutionStatus.PENDING,
        retryCount: 0,
        maxRetries: this.MAX_RETRIES
      };

      // 添加到队列
      this.executionQueue.set(proposalId, executionTask);

      // 更新提案状态
      await prisma.dAOProposal.update({
        where: { id: proposalId },
        data: { status: 'PASSED' }
      });

      Logger.info('Proposal queued for execution', {
        proposalId,
        scheduledTime: executionTask.scheduledTime
      });

      // 启动处理器
      this.startProcessor();
    } catch (error) {
      Logger.error('Failed to queue proposal execution', { error, proposalId });
      throw error;
    }
  }

  /**
   * 处理执行队列
   */
  private static async startProcessor(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    const processQueue = async () => {
      const now = new Date();

      for (const [proposalId, task] of this.executionQueue) {
        if (task.status === ExecutionStatus.PENDING && task.scheduledTime <= now) {
          await this.executeProposal(proposalId);
        }
      }

      // 清理已完成的任务
      for (const [proposalId, task] of this.executionQueue) {
        if ([ExecutionStatus.COMPLETED, ExecutionStatus.CANCELLED].includes(task.status)) {
          this.executionQueue.delete(proposalId);
        }
      }

      // 继续处理
      if (this.executionQueue.size > 0) {
        setTimeout(processQueue, 60000); // 每分钟检查一次
      } else {
        this.isProcessing = false;
      }
    };

    processQueue();
  }

  /**
   * 执行提案
   */
  private static async executeProposal(proposalId: string): Promise<void> {
    const task = this.executionQueue.get(proposalId);
    if (!task) return;

    try {
      task.status = ExecutionStatus.EXECUTING;

      const proposal = await prisma.dAOProposal.findUnique({
        where: { id: proposalId },
        include: { dao: true }
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // 根据提案类型执行不同的操作
      switch (proposal.category) {
        case 'TREASURY':
          await this.executeTreasuryProposal(proposal);
          break;
        case 'INVESTMENT':
          await this.executeInvestmentProposal(proposal);
          break;
        case 'GOVERNANCE':
          await this.executeGovernanceProposal(proposal);
          break;
        case 'MEMBERSHIP':
          await this.executeMembershipProposal(proposal);
          break;
        default:
          throw new Error(`Unknown proposal category: ${proposal.category}`);
      }

      // 更新提案状态
      await prisma.dAOProposal.update({
        where: { id: proposalId },
        data: {
          status: 'EXECUTED',
          executionTime: new Date()
        }
      });

      task.status = ExecutionStatus.COMPLETED;

      Logger.info('Proposal executed successfully', { proposalId });
    } catch (error) {
      Logger.error('Failed to execute proposal', { error, proposalId });
      
      task.retryCount++;
      if (task.retryCount < task.maxRetries) {
        task.status = ExecutionStatus.PENDING;
        task.scheduledTime = new Date(Date.now() + 60000); // 1分钟后重试
        task.error = error.message;
      } else {
        task.status = ExecutionStatus.FAILED;
        task.error = error.message;

        // 更新提案状态为失败
        await prisma.dAOProposal.update({
          where: { id: proposalId },
          data: { status: 'FAILED' }
        });
      }
    }
  }

  /**
   * 执行财务提案
   */
  private static async executeTreasuryProposal(proposal: any): Promise<void> {
    if (!proposal.requestedAmount) {
      throw new Error('No requested amount specified');
    }

    // 记录财务交易
    await prisma.dAOTreasury.create({
      data: {
        daoId: proposal.daoId,
        type: 'WITHDRAWAL',
        amount: proposal.requestedAmount,
        token: 'USDC', // 默认使用USDC
        to: proposal.proposer,
        description: `Execution of proposal: ${proposal.title}`,
        proposalId: proposal.id,
        status: 'CONFIRMED',
        timestamp: new Date()
      }
    });

    // TODO: 实际的链上转账逻辑
    // await TreasuryService.transferFunds(proposal.daoId, proposal.proposer, proposal.requestedAmount);
  }

  /**
   * 执行投资提案
   */
  private static async executeInvestmentProposal(proposal: any): Promise<void> {
    // 创建项目并分配资金
    if (proposal.requestedAmount) {
      const project = await prisma.dAOProject.create({
        data: {
          daoId: proposal.daoId,
          title: proposal.title,
          description: proposal.description,
          status: 'ACTIVE',
          category: 'INVESTMENT',
          totalBudget: proposal.requestedAmount,
          allocatedFunds: proposal.requestedAmount,
          createdBy: proposal.proposer
        }
      });

      // 记录资金分配
      await prisma.dAOTreasury.create({
        data: {
          daoId: proposal.daoId,
          type: 'INVESTMENT',
          amount: proposal.requestedAmount,
          token: 'USDC',
          description: `Investment in project: ${project.title}`,
          proposalId: proposal.id,
          projectId: project.id,
          status: 'CONFIRMED'
        }
      });
    }
  }

  /**
   * 执行治理提案
   */
  private static async executeGovernanceProposal(proposal: any): Promise<void> {
    // 解析提案内容，更新DAO参数
    const updates = this.parseGovernanceUpdates(proposal.description);
    
    if (updates) {
      await prisma.dAO.update({
        where: { id: proposal.daoId },
        data: updates
      });
    }
  }

  /**
   * 执行成员管理提案
   */
  private static async executeMembershipProposal(proposal: any): Promise<void> {
    // 解析成员变更
    const membershipChanges = this.parseMembershipChanges(proposal.description);
    
    for (const change of membershipChanges) {
      if (change.action === 'ADD') {
        // 添加新成员
        await prisma.dAOMember.create({
          data: {
            daoId: proposal.daoId,
            userId: change.userId,
            address: change.address,
            role: change.role || 'MEMBER'
          }
        });
      } else if (change.action === 'REMOVE') {
        // 移除成员
        await prisma.dAOMember.deleteMany({
          where: {
            daoId: proposal.daoId,
            userId: change.userId
          }
        });
      } else if (change.action === 'UPDATE_ROLE') {
        // 更新角色
        await prisma.dAOMember.updateMany({
          where: {
            daoId: proposal.daoId,
            userId: change.userId
          },
          data: {
            role: change.role
          }
        });
      }
    }
  }

  /**
   * 解析治理更新内容
   */
  private static parseGovernanceUpdates(description: string): any {
    // 这里简化处理，实际应该有更复杂的解析逻辑
    const updates: any = {};
    
    // 查找形如 "quorumThreshold: 60" 的模式
    const quorumMatch = description.match(/quorumThreshold:\s*(\d+)/);
    if (quorumMatch) {
      updates.quorumThreshold = parseInt(quorumMatch[1]);
    }

    const votingPeriodMatch = description.match(/votingPeriod:\s*(\d+)/);
    if (votingPeriodMatch) {
      updates.votingPeriod = parseInt(votingPeriodMatch[1]);
    }

    return Object.keys(updates).length > 0 ? updates : null;
  }

  /**
   * 解析成员变更内容
   */
  private static parseMembershipChanges(description: string): any[] {
    // 简化的解析逻辑
    const changes = [];
    
    // 示例格式: "ADD_MEMBER: userId=xxx, address=yyy, role=ADMIN"
    const lines = description.split('\n');
    for (const line of lines) {
      if (line.includes('ADD_MEMBER')) {
        const match = line.match(/userId=(\w+),\s*address=(\w+),\s*role=(\w+)/);
        if (match) {
          changes.push({
            action: 'ADD',
            userId: match[1],
            address: match[2],
            role: match[3]
          });
        }
      }
    }

    return changes;
  }

  /**
   * 取消提案执行
   */
  static async cancelExecution(proposalId: string): Promise<void> {
    const task = this.executionQueue.get(proposalId);
    if (task && task.status === ExecutionStatus.PENDING) {
      task.status = ExecutionStatus.CANCELLED;
      
      await prisma.dAOProposal.update({
        where: { id: proposalId },
        data: { status: 'CANCELLED' }
      });

      Logger.info('Proposal execution cancelled', { proposalId });
    }
  }

  /**
   * 获取执行队列状态
   */
  static getQueueStatus(): ExecutionTask[] {
    return Array.from(this.executionQueue.values());
  }
}