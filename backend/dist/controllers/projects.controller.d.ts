import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class ProjectsController {
    /**
     * Get all DePIN projects with optional filtering and pagination
     */
    static getProjects(req: Request, res: Response): Promise<void>;
    /**
     * Get a single project by ID
     */
    static getProject(req: Request, res: Response): Promise<void>;
    /**
     * Create a new DePIN project (Admin only)
     */
    static createProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update an existing project (Admin only)
     */
    static updateProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Delete a project (Admin only)
     */
    static deleteProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get projects by category
     */
    static getProjectsByCategory(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=projects.controller.d.ts.map