export interface ContributionMetrics {
    proposalsCreated: number;
    proposalsApproved: number;
    votesParticipated: number;
    projectsContributed: number;
    tasksCompleted: number;
    milestonesDelivered: number;
    fundingReviewsProvided: number;
    verificationReviewsProvided: number;
    membershipDuration: number;
    lastActivityDays: number;
}
export interface ContributionScoreBreakdown {
    totalScore: number;
    proposalScore: number;
    votingScore: number;
    projectScore: number;
    taskScore: number;
    milestoneScore: number;
    reviewScore: number;
    consistencyScore: number;
    bonusScore: number;
}
export interface ContributionWeights {
    proposalCreation: number;
    proposalApproval: number;
    votingParticipation: number;
    projectContribution: number;
    taskCompletion: number;
    milestoneDelivery: number;
    reviewActivity: number;
    consistency: number;
}
export declare class ContributionScoringService {
    private static readonly DEFAULT_WEIGHTS;
    /**
     * 计算成员的贡献分数
     */
    static calculateContributionScore(memberId: string, customWeights?: Partial<ContributionWeights>): Promise<ContributionScoreBreakdown>;
    /**
     * 获取贡献指标
     */
    private static getContributionMetrics;
    /**
     * 获取项目贡献数
     */
    private static getProjectContributions;
    /**
     * 获取里程碑交付数
     */
    private static getMilestoneDeliveries;
    /**
     * 计算一致性分数
     */
    private static calculateConsistencyScore;
    /**
     * 计算奖励分数
     */
    private static calculateBonusScore;
    /**
     * 批量更新DAO所有成员的贡献分数
     */
    static updateDAOContributionScores(daoId: string): Promise<void>;
    /**
     * 获取贡献分数排行榜
     */
    static getContributionLeaderboard(daoId: string, limit?: number): Promise<Array<{
        memberId: string;
        address: string;
        walletAddress: string;
        contributionScore: number;
        role: string;
        rank: number;
        recentActivity: string;
    }>>;
    /**
     * 格式化最后活动时间
     */
    private static formatLastActivity;
    /**
     * 基于贡献分数调整声誉值
     */
    static updateReputationBasedOnContribution(memberId: string): Promise<void>;
    /**
     * 获取成员贡献历史
     */
    static getMemberContributionHistory(memberId: string, months?: number): Promise<Array<{
        month: string;
        score: number;
        breakdown: ContributionScoreBreakdown;
    }>>;
}
//# sourceMappingURL=contribution-scoring.service.d.ts.map