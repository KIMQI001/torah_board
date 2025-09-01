export declare enum ExecutionStatus {
    PENDING = "PENDING",
    EXECUTING = "EXECUTING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
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
export declare class ProposalExecutionService {
    private static executionQueue;
    private static isProcessing;
    private static readonly EXECUTION_DELAY_MS;
    private static readonly MAX_RETRIES;
    /**
     * 添加提案到执行队列
     */
    static queueProposalExecution(proposalId: string): Promise<void>;
    /**
     * 处理执行队列
     */
    private static startProcessor;
    /**
     * 执行提案
     */
    private static executeProposal;
    /**
     * 执行财务提案
     */
    private static executeTreasuryProposal;
    /**
     * 执行投资提案
     */
    private static executeInvestmentProposal;
    /**
     * 执行治理提案
     */
    private static executeGovernanceProposal;
    /**
     * 执行成员管理提案
     */
    private static executeMembershipProposal;
    /**
     * 解析治理更新内容
     */
    private static parseGovernanceUpdates;
    /**
     * 解析成员变更内容
     */
    private static parseMembershipChanges;
    /**
     * 取消提案执行
     */
    static cancelExecution(proposalId: string): Promise<void>;
    /**
     * 获取执行队列状态
     */
    static getQueueStatus(): ExecutionTask[];
}
//# sourceMappingURL=proposal-execution.service.d.ts.map