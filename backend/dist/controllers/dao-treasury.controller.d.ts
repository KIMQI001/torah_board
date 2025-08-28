import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class DAOTreasuryController {
    /**
     * Get treasury transactions for a DAO
     */
    static getTreasuryTransactions(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get treasury balance for a DAO
     */
    static getTreasuryBalance(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create deposit transaction (Admin only)
     */
    static createDeposit(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create withdrawal proposal (Admin only)
     */
    static createWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Approve treasury transaction (Admin only)
     */
    static approveTransaction(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Reject treasury transaction (Admin only)
     */
    static rejectTransaction(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create investment transaction (Admin only)
     */
    static createInvestment(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get treasury analytics
     */
    static getTreasuryAnalytics(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dao-treasury.controller.d.ts.map