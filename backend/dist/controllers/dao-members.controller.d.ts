import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class DAOMembersController {
    /**
     * Get members for a DAO
     */
    static getMembers(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get member details
     */
    static getMember(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update member role (Admin only)
     */
    static updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update member voting power (Admin only)
     */
    static updateVotingPower(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Remove member from DAO (Admin only)
     */
    static removeMember(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get member activity (voting history, proposals created)
     */
    static getMemberActivity(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update member contribution score
     */
    static updateContributionScore(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dao-members.controller.d.ts.map