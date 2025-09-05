export interface ActiveAirdropFilter {
    chain?: string;
    status?: string;
    isHot?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
}
export interface UserAirdropProjectFilter {
    userId?: string;
    walletAddress?: string;
    status?: string;
    limit?: number;
    offset?: number;
}
export interface CreateActiveAirdropData {
    project: string;
    chain: string;
    deadline?: string;
    requirements: string;
    estimatedValue: string;
    category?: string;
    difficulty?: string;
    status?: string;
    officialUrl?: string;
    twitterUrl?: string;
    discordUrl?: string;
    description?: string;
    tags?: string[];
    isHot?: boolean;
}
export interface CreateUserAirdropProjectData {
    userId: string;
    walletAddress: string;
    airdropId: string;
    project: string;
    chain: string;
    accountCount: number;
    ipCount: number;
    status?: string;
    progressNotes?: string;
}
export declare class AirdropService {
    /**
     * 获取活跃空投列表
     */
    static getActiveAirdrops(filter?: ActiveAirdropFilter): Promise<{
        data: {
            category: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            project: string;
            tags: string;
            isHot: boolean;
            chain: string;
            deadline: string | null;
            requirements: string;
            estimatedValue: string;
            difficulty: string;
            officialUrl: string | null;
            twitterUrl: string | null;
            discordUrl: string | null;
        }[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    }>;
    /**
     * 创建活跃空投项目
     */
    static createActiveAirdrop(data: CreateActiveAirdropData): Promise<{
        category: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        project: string;
        tags: string;
        isHot: boolean;
        chain: string;
        deadline: string | null;
        requirements: string;
        estimatedValue: string;
        difficulty: string;
        officialUrl: string | null;
        twitterUrl: string | null;
        discordUrl: string | null;
    }>;
    /**
     * 更新活跃空投项目
     */
    static updateActiveAirdrop(id: string, data: Partial<CreateActiveAirdropData>): Promise<{
        category: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        project: string;
        tags: string;
        isHot: boolean;
        chain: string;
        deadline: string | null;
        requirements: string;
        estimatedValue: string;
        difficulty: string;
        officialUrl: string | null;
        twitterUrl: string | null;
        discordUrl: string | null;
    }>;
    /**
     * 删除活跃空投项目
     */
    static deleteActiveAirdrop(id: string): Promise<boolean>;
    /**
     * 获取用户空投项目列表
     */
    static getUserAirdropProjects(filter?: UserAirdropProjectFilter): Promise<{
        data: ({
            airdrop: {
                category: string;
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                project: string;
                tags: string;
                isHot: boolean;
                chain: string;
                deadline: string | null;
                requirements: string;
                estimatedValue: string;
                difficulty: string;
                officialUrl: string | null;
                twitterUrl: string | null;
                discordUrl: string | null;
            };
        } & {
            userId: string;
            walletAddress: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            project: string;
            txHash: string | null;
            chain: string;
            estimatedValue: string | null;
            airdropId: string;
            accountCount: number;
            ipCount: number;
            progressNotes: string | null;
            claimedDate: string | null;
            claimedAmount: string | null;
            actualValue: string | null;
        })[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    }>;
    /**
     * 创建用户空投项目
     */
    static createUserAirdropProject(data: CreateUserAirdropProjectData): Promise<{
        airdrop: {
            category: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            project: string;
            tags: string;
            isHot: boolean;
            chain: string;
            deadline: string | null;
            requirements: string;
            estimatedValue: string;
            difficulty: string;
            officialUrl: string | null;
            twitterUrl: string | null;
            discordUrl: string | null;
        };
    } & {
        userId: string;
        walletAddress: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        project: string;
        txHash: string | null;
        chain: string;
        estimatedValue: string | null;
        airdropId: string;
        accountCount: number;
        ipCount: number;
        progressNotes: string | null;
        claimedDate: string | null;
        claimedAmount: string | null;
        actualValue: string | null;
    }>;
    /**
     * 更新用户空投项目
     */
    static updateUserAirdropProject(id: string, data: Partial<CreateUserAirdropProjectData>): Promise<{
        airdrop: {
            category: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            project: string;
            tags: string;
            isHot: boolean;
            chain: string;
            deadline: string | null;
            requirements: string;
            estimatedValue: string;
            difficulty: string;
            officialUrl: string | null;
            twitterUrl: string | null;
            discordUrl: string | null;
        };
    } & {
        userId: string;
        walletAddress: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        project: string;
        txHash: string | null;
        chain: string;
        estimatedValue: string | null;
        airdropId: string;
        accountCount: number;
        ipCount: number;
        progressNotes: string | null;
        claimedDate: string | null;
        claimedAmount: string | null;
        actualValue: string | null;
    }>;
    /**
     * 删除用户空投项目
     */
    static deleteUserAirdropProject(id: string): Promise<boolean>;
    /**
     * 根据钱包地址获取用户项目
     */
    static getUserProjectsByWallet(walletAddress: string): Promise<{
        data: ({
            airdrop: {
                category: string;
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                project: string;
                tags: string;
                isHot: boolean;
                chain: string;
                deadline: string | null;
                requirements: string;
                estimatedValue: string;
                difficulty: string;
                officialUrl: string | null;
                twitterUrl: string | null;
                discordUrl: string | null;
            };
        } & {
            userId: string;
            walletAddress: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            project: string;
            txHash: string | null;
            chain: string;
            estimatedValue: string | null;
            airdropId: string;
            accountCount: number;
            ipCount: number;
            progressNotes: string | null;
            claimedDate: string | null;
            claimedAmount: string | null;
            actualValue: string | null;
        })[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    }>;
    /**
     * 初始化默认活跃空投数据
     */
    static initializeDefaultAirdrops(): Promise<void>;
}
//# sourceMappingURL=airdrop.service.d.ts.map