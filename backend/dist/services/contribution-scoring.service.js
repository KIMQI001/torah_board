"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContributionScoringService = void 0;
const database_1 = require("@/services/database");
const logger_1 = require("@/utils/logger");
class ContributionScoringService {
    /**
     * 计算成员的贡献分数
     */
    static async calculateContributionScore(memberId, customWeights) {
        try {
            const member = await database_1.prisma.dAOMember.findUnique({
                where: { id: memberId },
                include: {
                    dao: true,
                    user: true,
                    votes: true,
                    fundingReviews: true,
                    verificationReviews: true
                }
            });
            if (!member) {
                throw new Error('Member not found');
            }
            const weights = { ...this.DEFAULT_WEIGHTS, ...customWeights };
            const metrics = await this.getContributionMetrics(member);
            // 计算各项分数
            const proposalScore = metrics.proposalsCreated * weights.proposalCreation +
                metrics.proposalsApproved * weights.proposalApproval;
            const votingScore = metrics.votesParticipated * weights.votingParticipation;
            const projectScore = metrics.projectsContributed * weights.projectContribution;
            const taskScore = metrics.tasksCompleted * weights.taskCompletion;
            const milestoneScore = metrics.milestonesDelivered * weights.milestoneDelivery;
            const reviewScore = (metrics.fundingReviewsProvided + metrics.verificationReviewsProvided) *
                weights.reviewActivity;
            const consistencyScore = this.calculateConsistencyScore(metrics.membershipDuration, metrics.lastActivityDays, weights.consistency);
            // 计算奖励分数
            const bonusScore = this.calculateBonusScore(metrics);
            const totalScore = proposalScore + votingScore + projectScore +
                taskScore + milestoneScore + reviewScore +
                consistencyScore + bonusScore;
            // 更新数据库中的贡献分数
            await database_1.prisma.dAOMember.update({
                where: { id: memberId },
                data: { contributionScore: totalScore }
            });
            logger_1.Logger.info('Contribution score calculated', {
                memberId,
                totalScore,
                breakdown: {
                    proposalScore,
                    votingScore,
                    projectScore,
                    taskScore,
                    milestoneScore,
                    reviewScore,
                    consistencyScore,
                    bonusScore
                }
            });
            return {
                totalScore,
                proposalScore,
                votingScore,
                projectScore,
                taskScore,
                milestoneScore,
                reviewScore,
                consistencyScore,
                bonusScore
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to calculate contribution score', { error, memberId });
            throw error;
        }
    }
    /**
     * 获取贡献指标
     */
    static async getContributionMetrics(member) {
        const now = new Date();
        const membershipStart = new Date(member.joinDate);
        const lastActivity = new Date(member.lastActivity);
        const membershipDuration = Math.floor((now.getTime() - membershipStart.getTime()) / (1000 * 60 * 60 * 24));
        const lastActivityDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        // 获取提案相关指标
        const proposals = await database_1.prisma.dAOProposal.findMany({
            where: { proposer: member.address }
        });
        const approvedProposals = proposals.filter(p => ['EXECUTED', 'PASSED'].includes(p.status)).length;
        // 获取项目贡献指标
        const projectContributions = await this.getProjectContributions(member.id);
        // 获取任务完成指标
        const completedTasks = await database_1.prisma.dAOTask.count({
            where: {
                assigneeId: member.userId,
                status: 'COMPLETED'
            }
        });
        // 获取里程碑交付指标
        const deliveredMilestones = await this.getMilestoneDeliveries(member.id);
        return {
            proposalsCreated: proposals.length,
            proposalsApproved: approvedProposals,
            votesParticipated: member.votes.length,
            projectsContributed: projectContributions,
            tasksCompleted: completedTasks,
            milestonesDelivered: deliveredMilestones,
            fundingReviewsProvided: member.fundingReviews?.length || 0,
            verificationReviewsProvided: member.verificationReviews?.length || 0,
            membershipDuration,
            lastActivityDays
        };
    }
    /**
     * 获取项目贡献数
     */
    static async getProjectContributions(memberId) {
        // 通过创建的项目和参与的项目（通过团队成员）计算
        const member = await database_1.prisma.dAOMember.findUnique({
            where: { id: memberId }
        });
        if (!member)
            return 0;
        const createdProjects = await database_1.prisma.dAOProject.count({
            where: { createdBy: member.userId }
        });
        // 查找作为团队成员参与的项目
        const participatedProjects = await database_1.prisma.dAOProject.count({
            where: {
                daoId: member.daoId,
                teamMembers: { contains: member.userId }
            }
        });
        return createdProjects + participatedProjects;
    }
    /**
     * 获取里程碑交付数
     */
    static async getMilestoneDeliveries(memberId) {
        const verifications = await database_1.prisma.dAOMilestoneVerification.count({
            where: {
                submittedBy: memberId,
                status: { in: ['VERIFIED', 'PAYMENT_PROCESSED'] }
            }
        });
        return verifications;
    }
    /**
     * 计算一致性分数
     */
    static calculateConsistencyScore(membershipDuration, lastActivityDays, maxScore) {
        // 基于成员资格时长和活跃度计算一致性分数
        let score = 0;
        // 成员资格时长奖励（最多50分）
        const durationScore = Math.min((membershipDuration / 365) * 50, 50);
        // 活跃度奖励（最多50分）
        let activityScore = 0;
        if (lastActivityDays <= 7) {
            activityScore = 50; // 一周内活跃
        }
        else if (lastActivityDays <= 30) {
            activityScore = 30; // 一个月内活跃
        }
        else if (lastActivityDays <= 90) {
            activityScore = 10; // 三个月内活跃
        }
        score = Math.min(durationScore + activityScore, maxScore);
        return score;
    }
    /**
     * 计算奖励分数
     */
    static calculateBonusScore(metrics) {
        let bonus = 0;
        // 全能贡献者奖励（各项指标都有贡献）
        const categories = [
            metrics.proposalsCreated,
            metrics.votesParticipated,
            metrics.projectsContributed,
            metrics.tasksCompleted,
            metrics.fundingReviewsProvided + metrics.verificationReviewsProvided
        ];
        const activeCategories = categories.filter(count => count > 0).length;
        if (activeCategories >= 4) {
            bonus += 50; // 全能贡献者奖励
        }
        // 高质量提案奖励
        if (metrics.proposalsCreated > 0 && metrics.proposalsApproved > 0) {
            const approvalRate = metrics.proposalsApproved / metrics.proposalsCreated;
            if (approvalRate >= 0.8) {
                bonus += 25; // 高通过率奖励
            }
        }
        // 活跃参与奖励
        if (metrics.votesParticipated >= 10) {
            bonus += 15; // 积极投票奖励
        }
        // 里程碑交付奖励
        if (metrics.milestonesDelivered >= 3) {
            bonus += 30; // 里程碑专家奖励
        }
        return bonus;
    }
    /**
     * 批量更新DAO所有成员的贡献分数
     */
    static async updateDAOContributionScores(daoId) {
        try {
            const members = await database_1.prisma.dAOMember.findMany({
                where: { daoId, status: 'ACTIVE' }
            });
            for (const member of members) {
                await this.calculateContributionScore(member.id);
                // 添加小延迟以避免数据库过载
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            logger_1.Logger.info('DAO contribution scores updated', {
                daoId,
                memberCount: members.length
            });
        }
        catch (error) {
            logger_1.Logger.error('Failed to update DAO contribution scores', { error, daoId });
            throw error;
        }
    }
    /**
     * 获取贡献分数排行榜
     */
    static async getContributionLeaderboard(daoId, limit = 10) {
        try {
            const members = await database_1.prisma.dAOMember.findMany({
                where: {
                    daoId,
                    status: 'ACTIVE'
                },
                include: {
                    user: {
                        select: {
                            walletAddress: true
                        }
                    }
                },
                orderBy: {
                    contributionScore: 'desc'
                },
                take: limit
            });
            const leaderboard = members.map((member, index) => ({
                memberId: member.id,
                address: member.address,
                walletAddress: member.user.walletAddress,
                contributionScore: member.contributionScore,
                role: member.role,
                rank: index + 1,
                recentActivity: this.formatLastActivity(member.lastActivity)
            }));
            return leaderboard;
        }
        catch (error) {
            logger_1.Logger.error('Failed to get contribution leaderboard', { error });
            throw error;
        }
    }
    /**
     * 格式化最后活动时间
     */
    static formatLastActivity(lastActivity) {
        const now = new Date();
        const diffMs = now.getTime() - lastActivity.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffDays === 0) {
            if (diffHours === 0) {
                return '刚刚活跃';
            }
            else {
                return `${diffHours}小时前活跃`;
            }
        }
        else if (diffDays === 1) {
            return '1天前活跃';
        }
        else if (diffDays <= 7) {
            return `${diffDays}天前活跃`;
        }
        else if (diffDays <= 30) {
            return `${Math.floor(diffDays / 7)}周前活跃`;
        }
        else {
            return `${Math.floor(diffDays / 30)}个月前活跃`;
        }
    }
    /**
     * 基于贡献分数调整声誉值
     */
    static async updateReputationBasedOnContribution(memberId) {
        try {
            const member = await database_1.prisma.dAOMember.findUnique({
                where: { id: memberId }
            });
            if (!member)
                return;
            // 基于贡献分数计算新的声誉值
            // 贡献分数每100分转换为10点声誉，最高100声誉
            let newReputation = Math.min(50 + (member.contributionScore / 100) * 10, 100);
            // 对于新成员，给予基础声誉
            const membershipDays = Math.floor((Date.now() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24));
            if (membershipDays < 30) {
                newReputation = Math.max(newReputation, 30); // 新成员最低30声誉
            }
            await database_1.prisma.dAOMember.update({
                where: { id: memberId },
                data: { reputation: newReputation }
            });
            logger_1.Logger.info('Reputation updated based on contribution', {
                memberId,
                contributionScore: member.contributionScore,
                newReputation
            });
        }
        catch (error) {
            logger_1.Logger.error('Failed to update reputation based on contribution', { error });
        }
    }
    /**
     * 获取成员贡献历史
     */
    static async getMemberContributionHistory(memberId, months = 6) {
        try {
            // 这里是一个简化实现，实际应该存储历史记录
            // 目前返回当前分数
            const currentScore = await this.calculateContributionScore(memberId);
            const history = [];
            for (let i = 0; i < months; i++) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                // 简化处理，实际应该从历史记录中获取
                const monthlyScore = {
                    month: date.toISOString().substring(0, 7), // YYYY-MM format
                    score: currentScore.totalScore * (0.8 + Math.random() * 0.4), // 模拟历史变化
                    breakdown: currentScore
                };
                history.unshift(monthlyScore);
            }
            return history;
        }
        catch (error) {
            logger_1.Logger.error('Failed to get member contribution history', { error });
            throw error;
        }
    }
}
exports.ContributionScoringService = ContributionScoringService;
ContributionScoringService.DEFAULT_WEIGHTS = {
    proposalCreation: 20, // 20 points per approved proposal
    proposalApproval: 5, // 5 points per proposal approved
    votingParticipation: 2, // 2 points per vote cast
    projectContribution: 30, // 30 points per project contribution
    taskCompletion: 15, // 15 points per completed task
    milestoneDelivery: 50, // 50 points per delivered milestone
    reviewActivity: 10, // 10 points per review provided
    consistency: 100 // Up to 100 bonus points for consistency
};
//# sourceMappingURL=contribution-scoring.service.js.map