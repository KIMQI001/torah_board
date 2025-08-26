import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
export declare class NodesController {
    /**
     * Get all user nodes with optional filtering and pagination
     */
    static getUserNodes(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get a single node by ID
     */
    static getNode(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Create new nodes (supports batch creation)
     */
    static createNodes(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update a node
     */
    static updateNode(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Delete a node
     */
    static deleteNode(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update node performance data
     */
    static updateNodePerformance(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Get node performance history
     */
    static getNodePerformanceHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Update capacity for a specific node
     */
    static updateNodeCapacity(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * Batch update capacities for all nodes without capacity
     */
    static batchUpdateCapacities(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=nodes.controller.d.ts.map