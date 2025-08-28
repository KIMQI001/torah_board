"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dao_controller_1 = require("@/controllers/dao.controller");
const dao_proposals_controller_1 = require("@/controllers/dao-proposals.controller");
const dao_projects_controller_1 = require("@/controllers/dao-projects.controller");
const dao_treasury_controller_1 = require("@/controllers/dao-treasury.controller");
const dao_members_controller_1 = require("@/controllers/dao-members.controller");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// DAO validation schemas
const daoSchemas = {
    createDAO: joi_1.default.object({
        name: joi_1.default.string().required().min(3).max(50),
        description: joi_1.default.string().required().min(10).max(500),
        treasuryAddress: joi_1.default.string().required().min(32).max(44),
        governanceToken: joi_1.default.string().required().min(2).max(10),
        totalSupply: joi_1.default.number().min(1).optional(),
        quorumThreshold: joi_1.default.number().min(1).max(100).optional(),
        votingPeriod: joi_1.default.number().min(1).max(30).optional()
    }),
    updateDAO: joi_1.default.object({
        name: joi_1.default.string().min(3).max(50).optional(),
        description: joi_1.default.string().min(10).max(500).optional(),
        quorumThreshold: joi_1.default.number().min(1).max(100).optional(),
        votingPeriod: joi_1.default.number().min(1).max(30).optional(),
        status: joi_1.default.string().valid('ACTIVE', 'PAUSED', 'DISSOLVED').optional()
    }),
    createProposal: joi_1.default.object({
        title: joi_1.default.string().required().min(5).max(200),
        description: joi_1.default.string().required().min(20).max(5000),
        category: joi_1.default.string().valid('INVESTMENT', 'GOVERNANCE', 'TREASURY', 'MEMBERSHIP').required(),
        requestedAmount: joi_1.default.number().min(0).optional(),
        votingPeriodDays: joi_1.default.number().min(1).max(30).optional(),
        threshold: joi_1.default.number().min(50).max(100).optional(),
        discussion: joi_1.default.string().uri().optional(),
        attachments: joi_1.default.array().items(joi_1.default.string()).optional()
    }),
    vote: joi_1.default.object({
        voteType: joi_1.default.string().valid('FOR', 'AGAINST', 'ABSTAIN').required(),
        reason: joi_1.default.string().max(500).optional()
    }),
    createProject: joi_1.default.object({
        title: joi_1.default.string().required().min(5).max(200),
        description: joi_1.default.string().required().min(20).max(5000),
        category: joi_1.default.string().required(),
        totalBudget: joi_1.default.number().min(0).required(),
        roi: joi_1.default.number().optional(),
        riskLevel: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH').required(),
        tokenReward: joi_1.default.number().min(0).optional(),
        teamMembers: joi_1.default.array().items(joi_1.default.string()).optional(),
        startDate: joi_1.default.date().required(),
        expectedEndDate: joi_1.default.date().greater(joi_1.default.ref('startDate')).required(),
        milestones: joi_1.default.array().items(joi_1.default.object({
            title: joi_1.default.string().required(),
            description: joi_1.default.string().required(),
            targetDate: joi_1.default.date().required(),
            budget: joi_1.default.number().min(0).required(),
            deliverables: joi_1.default.array().items(joi_1.default.string()).optional(),
            verificationReq: joi_1.default.number().min(1).max(100).optional()
        })).optional()
    }),
    updateProject: joi_1.default.object({
        title: joi_1.default.string().min(5).max(200).optional(),
        description: joi_1.default.string().min(20).max(5000).optional(),
        status: joi_1.default.string().valid('PLANNING', 'ACTIVE', 'MILESTONE_PENDING', 'COMPLETED', 'CANCELLED').optional(),
        totalBudget: joi_1.default.number().min(0).optional(),
        allocatedFunds: joi_1.default.number().min(0).optional(),
        roi: joi_1.default.number().optional(),
        riskLevel: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
        teamMembers: joi_1.default.array().items(joi_1.default.string()).optional(),
        startDate: joi_1.default.date().optional(),
        expectedEndDate: joi_1.default.date().optional(),
        completedDate: joi_1.default.date().optional()
    }),
    addMilestone: joi_1.default.object({
        title: joi_1.default.string().required().min(5).max(200),
        description: joi_1.default.string().required().min(10).max(1000),
        targetDate: joi_1.default.date().required(),
        budget: joi_1.default.number().min(0).required(),
        deliverables: joi_1.default.array().items(joi_1.default.string()).optional(),
        verificationReq: joi_1.default.number().min(1).max(100).optional()
    }),
    updateMilestone: joi_1.default.object({
        status: joi_1.default.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'PAID').required(),
        completedDate: joi_1.default.date().optional()
    }),
    createDeposit: joi_1.default.object({
        amount: joi_1.default.number().min(0).required(),
        token: joi_1.default.string().required().min(1).max(20),
        txHash: joi_1.default.string().required().min(64).max(128),
        description: joi_1.default.string().max(500).optional()
    }),
    createWithdrawal: joi_1.default.object({
        amount: joi_1.default.number().min(0).required(),
        token: joi_1.default.string().required().min(1).max(20),
        recipientAddress: joi_1.default.string().required().min(32).max(64),
        description: joi_1.default.string().max(500).optional()
    }),
    approveTransaction: joi_1.default.object({
        txHash: joi_1.default.string().min(64).max(128).optional()
    }),
    rejectTransaction: joi_1.default.object({
        reason: joi_1.default.string().max(500).optional()
    }),
    createInvestment: joi_1.default.object({
        amount: joi_1.default.number().min(0).required(),
        token: joi_1.default.string().required().min(1).max(20),
        projectId: joi_1.default.string().optional(),
        description: joi_1.default.string().required().min(10).max(500)
    }),
    updateMemberRole: joi_1.default.object({
        role: joi_1.default.string().valid('ADMIN', 'MEMBER').required()
    }),
    updateVotingPower: joi_1.default.object({
        votingPower: joi_1.default.number().min(0).required()
    }),
    updateContributionScore: joi_1.default.object({
        contributionScore: joi_1.default.number().min(0).required(),
        reason: joi_1.default.string().max(500).optional()
    })
};
// DAO Management Routes
router.get('/daos', auth_1.authenticate, dao_controller_1.DAOController.getDAOs);
router.get('/daos/:id', auth_1.authenticate, dao_controller_1.DAOController.getDAO);
router.post('/daos', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.createDAO), dao_controller_1.DAOController.createDAO);
router.put('/daos/:id', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.updateDAO), dao_controller_1.DAOController.updateDAO);
router.delete('/daos/:id', auth_1.authenticate, dao_controller_1.DAOController.deleteDAO);
router.post('/daos/:id/join', auth_1.authenticate, dao_controller_1.DAOController.joinDAO);
router.post('/daos/:id/leave', auth_1.authenticate, dao_controller_1.DAOController.leaveDAO);
router.get('/daos/:id/stats', auth_1.authenticate, dao_controller_1.DAOController.getDAOStats);
// Proposal Routes
router.get('/daos/:daoId/proposals', auth_1.authenticate, dao_proposals_controller_1.DAOProposalsController.getProposals);
router.get('/proposals/:id', auth_1.authenticate, dao_proposals_controller_1.DAOProposalsController.getProposal);
router.post('/daos/:daoId/proposals', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.createProposal), dao_proposals_controller_1.DAOProposalsController.createProposal);
router.post('/proposals/:id/vote', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.vote), dao_proposals_controller_1.DAOProposalsController.voteOnProposal);
router.post('/proposals/:id/activate', auth_1.authenticate, dao_proposals_controller_1.DAOProposalsController.activateProposal);
router.post('/proposals/:id/execute', auth_1.authenticate, dao_proposals_controller_1.DAOProposalsController.executeProposal);
router.post('/proposals/:id/cancel', auth_1.authenticate, dao_proposals_controller_1.DAOProposalsController.cancelProposal);
// Project Routes
router.get('/daos/:daoId/projects', auth_1.authenticate, dao_projects_controller_1.DAOProjectsController.getProjects);
router.get('/projects/:id', auth_1.authenticate, dao_projects_controller_1.DAOProjectsController.getProject);
router.post('/daos/:daoId/projects', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.createProject), dao_projects_controller_1.DAOProjectsController.createProject);
router.put('/projects/:id', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.updateProject), dao_projects_controller_1.DAOProjectsController.updateProject);
router.delete('/projects/:id', auth_1.authenticate, dao_projects_controller_1.DAOProjectsController.deleteProject);
router.post('/projects/:id/milestones', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.addMilestone), dao_projects_controller_1.DAOProjectsController.addMilestone);
router.put('/projects/:projectId/milestones/:milestoneId', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.updateMilestone), dao_projects_controller_1.DAOProjectsController.updateMilestone);
// Members Routes
router.get('/daos/:daoId/members', auth_1.authenticate, dao_members_controller_1.DAOMembersController.getMembers);
router.get('/daos/:daoId/members/:memberId', auth_1.authenticate, dao_members_controller_1.DAOMembersController.getMember);
router.get('/daos/:daoId/members/:memberId/activity', auth_1.authenticate, dao_members_controller_1.DAOMembersController.getMemberActivity);
router.put('/daos/:daoId/members/:memberId/role', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.updateMemberRole), dao_members_controller_1.DAOMembersController.updateMemberRole);
router.put('/daos/:daoId/members/:memberId/voting-power', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.updateVotingPower), dao_members_controller_1.DAOMembersController.updateVotingPower);
router.put('/daos/:daoId/members/:memberId/contribution-score', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.updateContributionScore), dao_members_controller_1.DAOMembersController.updateContributionScore);
router.delete('/daos/:daoId/members/:memberId', auth_1.authenticate, dao_members_controller_1.DAOMembersController.removeMember);
// Treasury Routes
router.get('/daos/:daoId/treasury/transactions', auth_1.authenticate, dao_treasury_controller_1.DAOTreasuryController.getTreasuryTransactions);
router.get('/daos/:daoId/treasury/balance', auth_1.authenticate, dao_treasury_controller_1.DAOTreasuryController.getTreasuryBalance);
router.get('/daos/:daoId/treasury/analytics', auth_1.authenticate, dao_treasury_controller_1.DAOTreasuryController.getTreasuryAnalytics);
router.post('/daos/:daoId/treasury/deposit', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.createDeposit), dao_treasury_controller_1.DAOTreasuryController.createDeposit);
router.post('/daos/:daoId/treasury/withdrawal', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.createWithdrawal), dao_treasury_controller_1.DAOTreasuryController.createWithdrawal);
router.post('/daos/:daoId/treasury/investment', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.createInvestment), dao_treasury_controller_1.DAOTreasuryController.createInvestment);
router.post('/treasury/transactions/:transactionId/approve', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.approveTransaction), dao_treasury_controller_1.DAOTreasuryController.approveTransaction);
router.post('/treasury/transactions/:transactionId/reject', auth_1.authenticate, (0, validation_1.validate)(daoSchemas.rejectTransaction), dao_treasury_controller_1.DAOTreasuryController.rejectTransaction);
exports.default = router;
//# sourceMappingURL=dao.routes.js.map