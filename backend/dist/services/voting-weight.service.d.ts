export interface VotingPowerFactors {
    tokenBalance: number;
    contributionScore: number;
    membershipDuration: number;
    proposalsCreated: number;
    votesParticipated: number;
    reputation: number;
}
export interface VotingPowerWeights {
    tokenBalance: number;
    contributionScore: number;
    membershipDuration: number;
}
export declare class VotingWeightService {
    private static readonly ROLE_WEIGHTS;
    /**
     * 计算成员的投票权重（基于角色的固定权重分配）
     */
    static calculateVotingPower(memberId: string, customWeights?: any): Promise<number>;
    /**
     * 批量更新DAO所有成员的投票权重
     */
    static updateDAOVotingPowers(daoId: string): Promise<void>;
    /**
     * 获取投票权因素
     */
    private static getVotingPowerFactors;
    /**
     * 标准化代币余额（0-100分）
     */
    private static normalizeTokenBalance;
    /**
     * 标准化贡献分数（0-100分）
     */
    private static normalizeContribution;
    /**
     * 标准化成员时长（0-100分）
     */
    private static normalizeDuration;
    /**
     * 获取声誉乘数
     */
    private static getReputationMultiplier;
    /**
     * 计算提案通过所需的最小投票权
     */
    static calculateQuorumThreshold(daoId: string, quorumPercentage: number): Promise<number>;
    /**
     * 检查提案是否达到通过条件
     */
    static checkProposalThreshold(proposalId: string): Promise<{
        passed: boolean;
        forPercentage: number;
        againstPercentage: number;
        quorumReached: boolean;
    }>;
}
//# sourceMappingURL=voting-weight.service.d.ts.map