"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotingWeightService = void 0;
const database_1 = require("@/services/database");
const logger_1 = require("@/utils/logger");
class VotingWeightService {
    /**
     * 计算成员的投票权重（基于角色的固定权重分配）
     */
    static async calculateVotingPower(memberId, customWeights // 保持接口兼容性，但不使用
    ) {
        try {
            const member = await database_1.prisma.dAOMember.findUnique({
                where: { id: memberId },
                include: { dao: true }
            });
            if (!member) {
                throw new Error('Member not found');
            }
            let votingPower = 0;
            // 根据角色分配权重
            if (member.role === 'CHAIR') {
                votingPower = this.ROLE_WEIGHTS.CHAIR;
            }
            else if (member.role === 'ADMIN') {
                votingPower = this.ROLE_WEIGHTS.ADMIN;
            }
            else if (member.role === 'MEMBER') {
                // 获取该DAO中所有普通成员数量
                const memberCount = await database_1.prisma.dAOMember.count({
                    where: {
                        daoId: member.daoId,
                        role: 'MEMBER',
                        status: 'ACTIVE'
                    }
                });
                // 如果有普通成员，平分30%的权重
                votingPower = memberCount > 0 ? this.ROLE_WEIGHTS.MEMBER_TOTAL / memberCount : 0;
            }
            // 更新数据库中的投票权
            await database_1.prisma.dAOMember.update({
                where: { id: memberId },
                data: { votingPower: votingPower }
            });
            logger_1.Logger.info('Voting power calculated (role-based)', {
                memberId,
                role: member.role,
                votingPower: votingPower
            });
            return votingPower;
        }
        catch (error) {
            logger_1.Logger.error('Failed to calculate voting power', { error, memberId });
            throw error;
        }
    }
    /**
     * 批量更新DAO所有成员的投票权重
     */
    static async updateDAOVotingPowers(daoId) {
        try {
            const members = await database_1.prisma.dAOMember.findMany({
                where: { daoId, status: 'ACTIVE' }
            });
            for (const member of members) {
                await this.calculateVotingPower(member.id);
            }
            logger_1.Logger.info('DAO voting powers updated', {
                daoId,
                memberCount: members.length
            });
        }
        catch (error) {
            logger_1.Logger.error('Failed to update DAO voting powers', { error, daoId });
            throw error;
        }
    }
    /**
     * 获取投票权因素
     */
    static async getVotingPowerFactors(member) {
        const now = new Date();
        const joinDate = new Date(member.joinDate);
        const membershipDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        // 获取代币余额（这里简化处理，实际应该从链上获取）
        const tokenBalance = member.votingPower || 100; // 默认100代币
        return {
            tokenBalance,
            contributionScore: member.contributionScore,
            membershipDuration: membershipDays,
            proposalsCreated: member.proposalsCreated,
            votesParticipated: member.votesParticipated,
            reputation: member.reputation
        };
    }
    /**
     * 标准化代币余额（0-100分）
     */
    static normalizeTokenBalance(balance, totalSupply) {
        if (totalSupply === 0)
            return 0;
        const percentage = (balance / totalSupply) * 100;
        return Math.min(percentage * 10, 100); // 最多100分
    }
    /**
     * 标准化贡献分数（0-100分）
     */
    static normalizeContribution(score) {
        // 假设最高贡献分数为1000
        return Math.min((score / 1000) * 100, 100);
    }
    /**
     * 标准化成员时长（0-100分）
     */
    static normalizeDuration(days) {
        // 365天获得满分
        return Math.min((days / 365) * 100, 100);
    }
    /**
     * 获取声誉乘数
     */
    static getReputationMultiplier(reputation) {
        // 声誉值范围 0-100，转换为 0.5-1.5 的乘数
        return 0.5 + (reputation / 100);
    }
    /**
     * 计算提案通过所需的最小投票权
     */
    static async calculateQuorumThreshold(daoId, quorumPercentage) {
        const totalVotingPower = await database_1.prisma.dAOMember.aggregate({
            where: { daoId, status: 'ACTIVE' },
            _sum: { votingPower: true }
        });
        const total = totalVotingPower._sum.votingPower || 0;
        return (total * quorumPercentage) / 100;
    }
    /**
     * 检查提案是否达到通过条件
     */
    static async checkProposalThreshold(proposalId) {
        const proposal = await database_1.prisma.dAOProposal.findUnique({
            where: { id: proposalId },
            include: { dao: true }
        });
        if (!proposal) {
            throw new Error('Proposal not found');
        }
        const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
        const quorumThreshold = await this.calculateQuorumThreshold(proposal.daoId, proposal.dao.quorumThreshold);
        const quorumReached = totalVotes >= quorumThreshold;
        const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
        const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
        // 使用新的31%通过阈值
        const passed = quorumReached && forPercentage >= 31;
        return {
            passed,
            forPercentage,
            againstPercentage,
            quorumReached
        };
    }
}
exports.VotingWeightService = VotingWeightService;
// 角色固定权重配置
VotingWeightService.ROLE_WEIGHTS = {
    CHAIR: 51, // 主席 51%
    ADMIN: 19, // 管理员 19%
    MEMBER_TOTAL: 30 // 普通成员总共 30%
};
//# sourceMappingURL=voting-weight.service.js.map