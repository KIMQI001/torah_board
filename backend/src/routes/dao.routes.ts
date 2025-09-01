import { Router } from 'express';
import { DAOController } from '@/controllers/dao.controller';
import { DAOProposalsController } from '@/controllers/dao-proposals.controller';
import { DAOProjectsController } from '@/controllers/dao-projects.controller';
import { DAOTasksController } from '@/controllers/dao-tasks.controller';
import { DAOTreasuryController } from '@/controllers/dao-treasury.controller';
import { DAOMembersController } from '@/controllers/dao-members.controller';
import { TreasuryController } from '@/controllers/treasury.controller';
import { VotingWeightController } from '@/controllers/voting-weight.controller';
import { authenticate } from '@/middleware/auth';
import { validate, validateQuery, schemas } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();

// DAO validation schemas
const daoSchemas = {
  createDAO: Joi.object({
    name: Joi.string().required().min(3).max(50),
    description: Joi.string().required().min(10).max(500),
    treasuryAddress: Joi.string().required().min(32).max(44),
    governanceToken: Joi.string().required().min(2).max(10),
    totalSupply: Joi.number().min(1).optional(),
    quorumThreshold: Joi.number().min(1).max(100).optional(),
    votingPeriod: Joi.number().min(1).max(30).optional()
  }),
  
  updateDAO: Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    description: Joi.string().min(10).max(500).optional(),
    quorumThreshold: Joi.number().min(1).max(100).optional(),
    votingPeriod: Joi.number().min(1).max(30).optional(),
    status: Joi.string().valid('ACTIVE', 'PAUSED', 'DISSOLVED').optional()
  }),
  
  createProposal: Joi.object({
    title: Joi.string().required().min(5).max(200),
    description: Joi.string().required().min(20).max(5000),
    category: Joi.string().valid('INVESTMENT', 'GOVERNANCE', 'TREASURY', 'MEMBERSHIP').required(),
    requestedAmount: Joi.number().min(0).optional(),
    votingPeriodDays: Joi.number().min(1).max(30).optional(),
    threshold: Joi.number().min(50).max(100).optional(),
    discussion: Joi.string().uri().optional(),
    attachments: Joi.array().items(Joi.string()).optional()
  }),
  
  vote: Joi.object({
    voteType: Joi.string().valid('FOR', 'AGAINST', 'ABSTAIN', 'for', 'against', 'abstain').required(),
    reason: Joi.string().max(500).allow('').optional()
  }),
  
  createProject: Joi.object({
    title: Joi.string().required().min(5).max(200),
    description: Joi.string().required().min(20).max(5000),
    category: Joi.string().required(),
    totalBudget: Joi.number().min(0).required(),
    roi: Joi.number().optional(),
    riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').required(),
    tokenReward: Joi.number().min(0).optional(),
    teamMembers: Joi.array().items(Joi.string()).optional(),
    startDate: Joi.date().required(),
    expectedEndDate: Joi.date().greater(Joi.ref('startDate')).required(),
    milestones: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        targetDate: Joi.date().required(),
        budget: Joi.number().min(0).required(),
        deliverables: Joi.array().items(Joi.string()).optional(),
        verificationReq: Joi.number().min(1).max(100).optional()
      })
    ).optional()
  }),
  
  updateProject: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(20).max(5000).optional(),
    status: Joi.string().valid('PLANNING', 'ACTIVE', 'MILESTONE_PENDING', 'COMPLETED', 'CANCELLED').optional(),
    totalBudget: Joi.number().min(0).optional(),
    allocatedFunds: Joi.number().min(0).optional(),
    roi: Joi.number().optional(),
    riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
    teamMembers: Joi.array().items(Joi.string()).optional(),
    startDate: Joi.date().optional(),
    expectedEndDate: Joi.date().optional(),
    completedDate: Joi.date().optional()
  }),
  
  addMilestone: Joi.object({
    title: Joi.string().required().min(5).max(200),
    description: Joi.string().required().min(10).max(1000),
    targetDate: Joi.date().required(),
    budget: Joi.number().min(0).required(),
    deliverables: Joi.array().items(Joi.string()).optional(),
    verificationReq: Joi.number().min(1).max(100).optional()
  }),
  
  updateMilestone: Joi.object({
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'PAID').required(),
    completedDate: Joi.date().optional()
  }),
  
  createDeposit: Joi.object({
    amount: Joi.number().min(0).required(),
    token: Joi.string().required().min(1).max(20),
    txHash: Joi.string().required().min(64).max(128),
    description: Joi.string().max(500).optional()
  }),
  
  createWithdrawal: Joi.object({
    amount: Joi.number().min(0).required(),
    token: Joi.string().required().min(1).max(20),
    recipientAddress: Joi.string().required().min(32).max(64),
    description: Joi.string().max(500).optional()
  }),
  
  approveTransaction: Joi.object({
    txHash: Joi.string().min(64).max(128).optional()
  }),
  
  rejectTransaction: Joi.object({
    reason: Joi.string().max(500).optional()
  }),
  
  createInvestment: Joi.object({
    amount: Joi.number().min(0).required(),
    token: Joi.string().required().min(1).max(20),
    projectId: Joi.string().optional(),
    description: Joi.string().required().min(10).max(500)
  }),
  
  updateMemberRole: Joi.object({
    role: Joi.string().valid('CHAIR', 'ADMIN', 'MEMBER').required()
  }),
  
  updateVotingPower: Joi.object({
    votingPower: Joi.number().min(0).required()
  }),
  
  updateContributionScore: Joi.object({
    contributionScore: Joi.number().min(0).required(),
    reason: Joi.string().max(500).optional()
  }),
  
  createTask: Joi.object({
    title: Joi.string().required().min(5).max(200),
    description: Joi.string().required().min(10).max(1000),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
    assigneeId: Joi.string().allow('', null).optional(),
    costEstimate: Joi.number().min(0).default(0),
    tokenReward: Joi.number().min(0).default(0),
    dueDate: Joi.date().optional().allow(null),
    tags: Joi.array().items(Joi.string()).optional().allow(null)
  }),
  
  updateTask: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(1000).optional(),
    status: Joi.string().valid('TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED').optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
    assigneeId: Joi.string().optional(),
    costEstimate: Joi.number().min(0).optional(),
    tokenReward: Joi.number().min(0).optional(),
    dueDate: Joi.date().optional(),
    completedDate: Joi.date().optional(),
    attachments: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),
  
  // Treasury schemas
  createTransferRequest: Joi.object({
    type: Joi.string().valid('DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'REWARD', 'FEE', 'MILESTONE_PAYMENT').required(),
    amount: Joi.number().min(0).required(),
    token: Joi.string().required().min(1).max(20),
    to: Joi.string().min(32).max(64).optional(),
    description: Joi.string().max(500).optional(),
    proposalId: Joi.string().optional(),
    projectId: Joi.string().optional()
  }),
  
  confirmTransaction: Joi.object({
    txHash: Joi.string().required().min(64).max(128)
  }),
  
  milestonePayment: Joi.object({
    amount: Joi.number().min(0).required(),
    recipientAddress: Joi.string().required().min(32).max(64)
  }),
  
  allocateFunding: Joi.object({
    amount: Joi.number().min(0).required()
  })
};


// DAO Management Routes
router.get('/daos', authenticate, DAOController.getDAOs);
router.get('/daos/:id', authenticate, DAOController.getDAO);
router.post('/daos', authenticate, validate(daoSchemas.createDAO), DAOController.createDAO);
router.put('/daos/:id', authenticate, validate(daoSchemas.updateDAO), DAOController.updateDAO);
router.delete('/daos/:id', authenticate, DAOController.deleteDAO);
router.post('/daos/:id/join', authenticate, DAOController.joinDAO);
router.post('/daos/:id/leave', authenticate, DAOController.leaveDAO);
router.get('/daos/:id/stats', authenticate, DAOController.getDAOStats);

// Proposal Routes
router.get('/daos/:daoId/proposals', authenticate, DAOProposalsController.getProposals);
router.get('/proposals/:id', authenticate, DAOProposalsController.getProposal);
router.post('/daos/:daoId/proposals', authenticate, validate(daoSchemas.createProposal), DAOProposalsController.createProposal);
router.post('/proposals/:id/vote', authenticate, validate(daoSchemas.vote), DAOProposalsController.voteOnProposal);
router.post('/proposals/:id/activate', authenticate, DAOProposalsController.activateProposal);
router.post('/proposals/:id/execute', authenticate, DAOProposalsController.executeProposal);
router.post('/proposals/:id/cancel', authenticate, DAOProposalsController.cancelProposal);
router.delete('/proposals/:id', authenticate, DAOProposalsController.deleteProposal);

// Project Routes
router.get('/daos/:daoId/projects', authenticate, DAOProjectsController.getProjects);
router.get('/projects/:id', authenticate, DAOProjectsController.getProject);
router.post('/daos/:daoId/projects', authenticate, validate(daoSchemas.createProject), DAOProjectsController.createProject);
router.put('/projects/:id', authenticate, validate(daoSchemas.updateProject), DAOProjectsController.updateProject);
router.delete('/projects/:id', authenticate, DAOProjectsController.deleteProject);
router.post('/projects/:id/milestones', authenticate, validate(daoSchemas.addMilestone), DAOProjectsController.addMilestone);
router.put('/projects/:projectId/milestones/:milestoneId', authenticate, validate(daoSchemas.updateMilestone), DAOProjectsController.updateMilestone);

// Members Routes
router.get('/daos/:daoId/members', authenticate, DAOMembersController.getMembers);
router.get('/daos/:daoId/members/:memberId', authenticate, DAOMembersController.getMember);
router.get('/daos/:daoId/members/:memberId/activity', authenticate, DAOMembersController.getMemberActivity);
router.put('/daos/:daoId/members/:memberId/role', authenticate, validate(daoSchemas.updateMemberRole), DAOMembersController.updateMemberRole);
router.put('/daos/:daoId/members/:memberId/voting-power', authenticate, validate(daoSchemas.updateVotingPower), DAOMembersController.updateVotingPower);
router.put('/daos/:daoId/members/:memberId/contribution-score', authenticate, validate(daoSchemas.updateContributionScore), DAOMembersController.updateContributionScore);
router.delete('/daos/:daoId/members/:memberId', authenticate, DAOMembersController.removeMember);

// Task Routes  
router.get('/projects/:projectId/tasks', authenticate, DAOTasksController.getTasks);
router.get('/tasks/:id', authenticate, DAOTasksController.getTask);
router.post('/projects/:projectId/tasks', authenticate, validate(daoSchemas.createTask), DAOTasksController.createTask);
router.put('/tasks/:id', authenticate, validate(daoSchemas.updateTask), DAOTasksController.updateTask);
router.delete('/tasks/:id', authenticate, DAOTasksController.deleteTask);


// Treasury Routes
router.get('/daos/:daoId/treasury/transactions', authenticate, DAOTreasuryController.getTreasuryTransactions);
router.get('/daos/:daoId/treasury/balance', authenticate, DAOTreasuryController.getTreasuryBalance);
router.get('/daos/:daoId/treasury/analytics', authenticate, DAOTreasuryController.getTreasuryAnalytics);
router.post('/daos/:daoId/treasury/deposit', authenticate, validate(daoSchemas.createDeposit), DAOTreasuryController.createDeposit);
router.post('/daos/:daoId/treasury/withdrawal', authenticate, validate(daoSchemas.createWithdrawal), DAOTreasuryController.createWithdrawal);
router.post('/daos/:daoId/treasury/investment', authenticate, validate(daoSchemas.createInvestment), DAOTreasuryController.createInvestment);
router.post('/treasury/transactions/:transactionId/approve', authenticate, validate(daoSchemas.approveTransaction), DAOTreasuryController.approveTransaction);
router.post('/treasury/transactions/:transactionId/reject', authenticate, validate(daoSchemas.rejectTransaction), DAOTreasuryController.rejectTransaction);

// Enhanced Treasury Routes (New Treasury Service)
router.get('/daos/:daoId/treasury/balance-v2', authenticate, TreasuryController.getDAOBalance);
router.get('/daos/:daoId/treasury/metrics', authenticate, TreasuryController.getTreasuryMetrics);
router.get('/daos/:daoId/treasury/history', authenticate, TreasuryController.getTransactionHistory);
router.post('/daos/:daoId/treasury/transfer', authenticate, validate(daoSchemas.createTransferRequest), TreasuryController.createTransferRequest);
router.post('/treasury/transactions/:transactionId/confirm', authenticate, validate(daoSchemas.confirmTransaction), TreasuryController.confirmTransaction);
router.post('/daos/:daoId/projects/:projectId/milestones/:milestoneId/payment', authenticate, validate(daoSchemas.milestonePayment), TreasuryController.processMilestonePayment);
router.post('/daos/:daoId/projects/:projectId/allocate-funding', authenticate, validate(daoSchemas.allocateFunding), TreasuryController.allocateProjectFunding);

// Voting Weight Routes
router.get('/daos/:daoId/members/:memberId/voting-power', authenticate, VotingWeightController.getMemberVotingPower);
router.post('/daos/:daoId/members/update-voting-powers', authenticate, VotingWeightController.updateDAOVotingPowers);
router.get('/proposals/:proposalId/threshold-check', authenticate, VotingWeightController.checkProposalThreshold);
router.get('/daos/:daoId/quorum-threshold', authenticate, VotingWeightController.getQuorumThreshold);
router.get('/daos/:daoId/execution-queue', authenticate, VotingWeightController.getExecutionQueueStatus);
router.post('/proposals/:proposalId/cancel-execution', authenticate, VotingWeightController.cancelProposalExecution);
router.get('/daos/:daoId/voting-power-ranking', authenticate, VotingWeightController.getVotingPowerRanking);

export default router;