import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class DAOTasksController {
    /**
     * Get tasks for a project
     */
    static getTasks(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get single task with details
     */
    static getTask(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create new task
     */
    static createTask(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update task
     */
    static updateTask(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Delete task
     */
    static deleteTask(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=dao-tasks.controller.d.ts.map