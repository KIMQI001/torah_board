"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryController = void 0;
const response_1 = require("@/utils/response");
const logger_1 = require("@/utils/logger");
const treasury_service_1 = require("@/services/treasury.service");
const database_1 = require("@/services/database");
class TreasuryController {
    /**
     * 获取DAO财务余额
     */
    static async getDAOBalance(req, res) {
        try {
            const { daoId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO成员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to view treasury');
                return;
            }
            const balances = await treasury_service_1.TreasuryService.getDAOBalance(daoId);
            response_1.ResponseUtil.success(res, balances);
        }
        catch (error) {
            logger_1.Logger.error('Error getting DAO balance', { error });
            response_1.ResponseUtil.error(res, 'Failed to get DAO balance');
        }
    }
    /**
     * 获取DAO财务指标
     */
    static async getTreasuryMetrics(req, res) {
        try {
            const { daoId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO成员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to view treasury metrics');
                return;
            }
            const metrics = await treasury_service_1.TreasuryService.getTreasuryMetrics(daoId);
            response_1.ResponseUtil.success(res, metrics);
        }
        catch (error) {
            logger_1.Logger.error('Error getting treasury metrics', { error });
            response_1.ResponseUtil.error(res, 'Failed to get treasury metrics');
        }
    }
    /**
     * 获取交易历史
     */
    static async getTransactionHistory(req, res) {
        try {
            const { daoId } = req.params;
            const { page = '1', limit = '20' } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO成员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'You must be a DAO member to view transaction history');
                return;
            }
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const transactions = await treasury_service_1.TreasuryService.getTransactionHistory(daoId, limitNum, offset);
            response_1.ResponseUtil.success(res, transactions);
        }
        catch (error) {
            logger_1.Logger.error('Error getting transaction history', { error });
            response_1.ResponseUtil.error(res, 'Failed to get transaction history');
        }
    }
    /**
     * 创建资金转账请求（仅管理员）
     */
    static async createTransferRequest(req, res) {
        try {
            const { daoId } = req.params;
            const { type, amount, token, to, description, proposalId, projectId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO管理员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId, role: 'ADMIN' }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can create transfer requests');
                return;
            }
            const transactionId = await treasury_service_1.TreasuryService.createTransferRequest(daoId, type, amount, token || 'USDC', to, description, proposalId, projectId);
            response_1.ResponseUtil.success(res, { transactionId }, 'Transfer request created successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error creating transfer request', { error });
            response_1.ResponseUtil.error(res, error.message || 'Failed to create transfer request');
        }
    }
    /**
     * 确认交易（仅管理员）
     */
    static async confirmTransaction(req, res) {
        try {
            const { transactionId } = req.params;
            const { txHash } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 获取交易信息
            const transaction = await database_1.prisma.dAOTreasury.findUnique({
                where: { id: transactionId }
            });
            if (!transaction) {
                response_1.ResponseUtil.notFound(res, 'Transaction not found');
                return;
            }
            // 验证用户是否为DAO管理员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: {
                    daoId: transaction.daoId,
                    userId,
                    role: 'ADMIN'
                }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can confirm transactions');
                return;
            }
            await treasury_service_1.TreasuryService.confirmTransaction(transactionId, txHash);
            response_1.ResponseUtil.success(res, null, 'Transaction confirmed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error confirming transaction', { error });
            response_1.ResponseUtil.error(res, 'Failed to confirm transaction');
        }
    }
    /**
     * 处理里程碑付款（仅管理员）
     */
    static async processMilestonePayment(req, res) {
        try {
            const { daoId, projectId, milestoneId } = req.params;
            const { amount, recipientAddress } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO管理员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId, role: 'ADMIN' }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can process milestone payments');
                return;
            }
            const transactionId = await treasury_service_1.TreasuryService.processMilestonePayment(daoId, projectId, milestoneId, amount, recipientAddress);
            response_1.ResponseUtil.success(res, { transactionId }, 'Milestone payment processed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error processing milestone payment', { error });
            response_1.ResponseUtil.error(res, error.message || 'Failed to process milestone payment');
        }
    }
    /**
     * 分配项目资金（仅管理员）
     */
    static async allocateProjectFunding(req, res) {
        try {
            const { daoId, projectId } = req.params;
            const { amount } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // 验证用户是否为DAO管理员
            const member = await database_1.prisma.dAOMember.findFirst({
                where: { daoId, userId, role: 'ADMIN' }
            });
            if (!member) {
                response_1.ResponseUtil.forbidden(res, 'Only DAO admins can allocate project funding');
                return;
            }
            await treasury_service_1.TreasuryService.allocateProjectFunding(daoId, projectId, amount);
            response_1.ResponseUtil.success(res, null, 'Project funding allocated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error allocating project funding', { error });
            response_1.ResponseUtil.error(res, error.message || 'Failed to allocate project funding');
        }
    }
}
exports.TreasuryController = TreasuryController;
//# sourceMappingURL=treasury.controller.js.map