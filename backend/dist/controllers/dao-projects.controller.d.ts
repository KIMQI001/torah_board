import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class DAOProjectsController {
    /**
     * Get projects for a DAO
     */
    static getProjects(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get single project with details
     */
    static getProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create new project
     */
    static createProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update project
     */
    static updateProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Delete project
     */
    static deleteProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Add milestone to project
     */
    static addMilestone(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update milestone status
     */
    static updateMilestone(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dao-projects.controller.d.ts.map