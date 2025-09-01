import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class VotingWeightController {
    /**
     * 获取成员的投票权重
     */
    static getMemberVotingPower(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 更新DAO所有成员的投票权重（仅管理员）
     */
    static updateDAOVotingPowers(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取提案的投票阈值检查结果
     */
    static checkProposalThreshold(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取DAO的法定人数阈值
     */
    static getQuorumThreshold(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取执行队列状态（仅管理员）
     */
    static getExecutionQueueStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 取消提案执行（仅管理员）
     */
    static cancelProposalExecution(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取DAO成员投票权重排行榜
     */
    static getVotingPowerRanking(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=voting-weight.controller.d.ts.map