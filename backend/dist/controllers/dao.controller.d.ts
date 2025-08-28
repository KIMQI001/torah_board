import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class DAOController {
    /**
     * Get all DAOs or user's DAOs
     */
    static getDAOs(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get DAO by ID
     */
    static getDAO(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create new DAO
     */
    static createDAO(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update DAO
     */
    static updateDAO(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Join DAO as member
     */
    static joinDAO(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Leave DAO
     */
    static leaveDAO(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get DAO statistics
     */
    static getDAOStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Delete DAO (Admin only)
     */
    static deleteDAO(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dao.controller.d.ts.map