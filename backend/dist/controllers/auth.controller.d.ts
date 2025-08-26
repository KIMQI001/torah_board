import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class AuthController {
    /**
     * Generate authentication message for wallet signing
     */
    static generateAuthMessage(req: Request, res: Response): Promise<void>;
    /**
     * Authenticate user with wallet signature
     */
    static authenticate(req: Request, res: Response): Promise<void>;
    /**
     * Verify current authentication status
     */
    static verify(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update user settings
     */
    static updateSettings(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Refresh JWT token
     */
    static refreshToken(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map