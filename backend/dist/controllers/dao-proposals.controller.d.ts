import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class DAOProposalsController {
    /**
     * Helper to attach user vote info to proposals
     */
    private static attachUserVoteInfo;
    /**
     * Get proposals for a DAO
     */
    static getProposals(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get single proposal
     */
    static getProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create new proposal
     */
    static createProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Vote on proposal
     */
    static voteOnProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Activate proposal (move from DRAFT to ACTIVE)
     */
    static activateProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Execute proposal after voting passes
     */
    static executeProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Delete proposal
     */
    static deleteProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Cancel proposal
     */
    static cancelProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dao-proposals.controller.d.ts.map