import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class TreasuryController {
    /**
     * 获取DAO财务余额
     */
    static getDAOBalance(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取DAO财务指标
     */
    static getTreasuryMetrics(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取交易历史
     */
    static getTransactionHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 创建资金转账请求（仅管理员）
     */
    static createTransferRequest(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 确认交易（仅管理员）
     */
    static confirmTransaction(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 处理里程碑付款（仅管理员）
     */
    static processMilestonePayment(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 分配项目资金（仅管理员）
     */
    static allocateProjectFunding(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=treasury.controller.d.ts.map