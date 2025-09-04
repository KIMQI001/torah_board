import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { Logger } from '@/utils/logger';
import { AirdropService } from '@/services/airdrop.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
  };
}

export class AirdropController {
  /**
   * 获取活跃空投列表
   */
  static async getActiveAirdrops(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { chain, status, isHot, category, limit = 20, offset = 0 } = req.query;

      const filter = {
        ...(chain && { chain: chain as string }),
        ...(status && { status: status as string }),
        ...(isHot !== undefined && { isHot: isHot === 'true' }),
        ...(category && { category: category as string }),
        limit: Number(limit),
        offset: Number(offset)
      };

      const result = await AirdropService.getActiveAirdrops(filter);

      ResponseUtil.success(res, result, 'Active airdrops retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get active airdrops', { error });
      ResponseUtil.error(res, 'Failed to get active airdrops');
    }
  }

  /**
   * 创建活跃空投项目
   */
  static async createActiveAirdrop(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        project,
        chain,
        deadline,
        requirements,
        estimatedValue,
        category,
        difficulty,
        status,
        officialUrl,
        twitterUrl,
        discordUrl,
        description,
        tags,
        isHot
      } = req.body;

      if (!project || !chain || !requirements || !estimatedValue) {
        return ResponseUtil.error(res, 'Missing required fields: project, chain, requirements, estimatedValue');
      }

      const airdrop = await AirdropService.createActiveAirdrop({
        project,
        chain,
        deadline,
        requirements,
        estimatedValue,
        category,
        difficulty,
        status,
        officialUrl,
        twitterUrl,
        discordUrl,
        description,
        tags,
        isHot
      });

      ResponseUtil.success(res, airdrop, 'Active airdrop created successfully');
    } catch (error) {
      Logger.error('Failed to create active airdrop', { error });
      ResponseUtil.error(res, 'Failed to create active airdrop');
    }
  }

  /**
   * 更新活跃空投项目
   */
  static async updateActiveAirdrop(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const airdrop = await AirdropService.updateActiveAirdrop(id, updateData);

      ResponseUtil.success(res, airdrop, 'Active airdrop updated successfully');
    } catch (error) {
      Logger.error('Failed to update active airdrop', { error, id: req.params.id });
      ResponseUtil.error(res, 'Failed to update active airdrop');
    }
  }

  /**
   * 删除活跃空投项目
   */
  static async deleteActiveAirdrop(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await AirdropService.deleteActiveAirdrop(id);

      ResponseUtil.success(res, true, 'Active airdrop deleted successfully');
    } catch (error) {
      Logger.error('Failed to delete active airdrop', { error, id: req.params.id });
      ResponseUtil.error(res, 'Failed to delete active airdrop');
    }
  }

  /**
   * 获取用户空投项目列表
   */
  static async getUserAirdropProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { walletAddress, status, limit = 20, offset = 0 } = req.query;
      
      // 优先使用查询参数中的钱包地址，否则使用认证用户的钱包地址
      const userWalletAddress = (walletAddress as string) || req.user?.walletAddress;

      if (!userWalletAddress) {
        return ResponseUtil.error(res, 'Wallet address is required');
      }

      const filter = {
        walletAddress: userWalletAddress,
        ...(status && { status: status as string }),
        limit: Number(limit),
        offset: Number(offset)
      };

      const result = await AirdropService.getUserAirdropProjects(filter);

      ResponseUtil.success(res, result, 'User airdrop projects retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get user airdrop projects', { error });
      ResponseUtil.error(res, 'Failed to get user airdrop projects');
    }
  }

  /**
   * 创建用户空投项目
   */
  static async createUserAirdropProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        walletAddress,
        airdropId,
        project,
        chain,
        accountCount,
        ipCount,
        status,
        progressNotes
      } = req.body;

      // 使用请求体中的钱包地址或认证用户的钱包地址
      const userWalletAddress = walletAddress || req.user?.walletAddress;
      const userId = req.user?.id || 'anonymous';

      if (!userWalletAddress || !airdropId || !project || !chain) {
        return ResponseUtil.error(res, 'Missing required fields: walletAddress, airdropId, project, chain');
      }

      const userProject = await AirdropService.createUserAirdropProject({
        userId,
        walletAddress: userWalletAddress,
        airdropId,
        project,
        chain,
        accountCount: Number(accountCount) || 0,
        ipCount: Number(ipCount) || 0,
        status,
        progressNotes
      });

      ResponseUtil.success(res, userProject, 'User airdrop project created successfully');
    } catch (error) {
      Logger.error('Failed to create user airdrop project', { error });
      ResponseUtil.error(res, 'Failed to create user airdrop project');
    }
  }

  /**
   * 更新用户空投项目
   */
  static async updateUserAirdropProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 如果包含数量字段，转换为数字
      if (updateData.accountCount !== undefined) {
        updateData.accountCount = Number(updateData.accountCount);
      }
      if (updateData.ipCount !== undefined) {
        updateData.ipCount = Number(updateData.ipCount);
      }

      const userProject = await AirdropService.updateUserAirdropProject(id, updateData);

      ResponseUtil.success(res, userProject, 'User airdrop project updated successfully');
    } catch (error) {
      Logger.error('Failed to update user airdrop project', { error, id: req.params.id });
      ResponseUtil.error(res, 'Failed to update user airdrop project');
    }
  }

  /**
   * 删除用户空投项目
   */
  static async deleteUserAirdropProject(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await AirdropService.deleteUserAirdropProject(id);

      ResponseUtil.success(res, true, 'User airdrop project deleted successfully');
    } catch (error) {
      Logger.error('Failed to delete user airdrop project', { error, id: req.params.id });
      ResponseUtil.error(res, 'Failed to delete user airdrop project');
    }
  }

  /**
   * 根据钱包地址获取用户项目
   */
  static async getUserProjectsByWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      const result = await AirdropService.getUserProjectsByWallet(walletAddress);

      ResponseUtil.success(res, result, 'User projects retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get user projects by wallet', { error, walletAddress: req.params.walletAddress });
      ResponseUtil.error(res, 'Failed to get user projects by wallet');
    }
  }

  /**
   * 初始化默认活跃空投数据
   */
  static async initializeDefaultAirdrops(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await AirdropService.initializeDefaultAirdrops();

      ResponseUtil.success(res, true, 'Default airdrops initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize default airdrops', { error });
      ResponseUtil.error(res, 'Failed to initialize default airdrops');
    }
  }

  /**
   * 获取空投统计信息
   */
  static async getAirdropStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 获取活跃空投统计
      const activeStats = await Promise.all([
        AirdropService.getActiveAirdrops({ limit: 1000 }), // 获取所有活跃空投
        AirdropService.getActiveAirdrops({ isHot: true, limit: 1000 }) // 获取热门空投
      ]);

      const allActive = activeStats[0].data;
      const hotActive = activeStats[1].data;

      // 按区块链分组统计
      const chainStats = allActive.reduce((acc, airdrop) => {
        acc[airdrop.chain] = (acc[airdrop.chain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 按类别分组统计
      const categoryStats = allActive.reduce((acc, airdrop) => {
        acc[airdrop.category] = (acc[airdrop.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stats = {
        totalActive: allActive.length,
        hotProjects: hotActive.length,
        chainDistribution: chainStats,
        categoryDistribution: categoryStats,
        lastUpdated: new Date().toISOString()
      };

      ResponseUtil.success(res, stats, 'Airdrop statistics retrieved successfully');
    } catch (error) {
      Logger.error('Failed to get airdrop stats', { error });
      ResponseUtil.error(res, 'Failed to get airdrop statistics');
    }
  }
}