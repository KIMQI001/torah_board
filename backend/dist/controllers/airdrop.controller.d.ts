import { Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        walletAddress: string;
    };
}
export declare class AirdropController {
    /**
     * 获取活跃空投列表
     */
    static getActiveAirdrops(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 创建活跃空投项目
     */
    static createActiveAirdrop(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 更新活跃空投项目
     */
    static updateActiveAirdrop(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 删除活跃空投项目
     */
    static deleteActiveAirdrop(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取用户空投项目列表
     */
    static getUserAirdropProjects(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 创建用户空投项目
     */
    static createUserAirdropProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 更新用户空投项目
     */
    static updateUserAirdropProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 删除用户空投项目
     */
    static deleteUserAirdropProject(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 根据钱包地址获取用户项目
     */
    static getUserProjectsByWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 初始化默认活跃空投数据
     */
    static initializeDefaultAirdrops(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * 获取空投统计信息
     */
    static getAirdropStats(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=airdrop.controller.d.ts.map