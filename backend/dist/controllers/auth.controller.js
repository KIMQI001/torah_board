"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const response_1 = require("@/utils/response");
const solana_1 = require("@/utils/solana");
const jwt_1 = require("@/utils/jwt");
const logger_1 = require("@/utils/logger");
const database_1 = require("@/services/database");
class AuthController {
    /**
     * Generate authentication message for wallet signing
     */
    static async generateAuthMessage(req, res) {
        try {
            const { walletAddress } = req.body;
            if (!walletAddress || !solana_1.SolanaUtil.isValidWalletAddress(walletAddress)) {
                response_1.ResponseUtil.error(res, 'Invalid wallet address');
                return;
            }
            const message = solana_1.SolanaUtil.generateAuthMessage(walletAddress);
            response_1.ResponseUtil.success(res, {
                message,
                walletAddress
            }, 'Authentication message generated');
        }
        catch (error) {
            logger_1.Logger.error('Error generating auth message', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Authenticate user with wallet signature
     */
    static async authenticate(req, res) {
        try {
            const { walletAddress, publicKey, signature, message } = req.body;
            // Validate message timestamp (must be recent)
            if (!solana_1.SolanaUtil.isMessageRecent(message)) {
                response_1.ResponseUtil.error(res, 'Authentication message is too old. Please generate a new one.');
                return;
            }
            // Verify wallet signature (skip in development mode for testing)
            let isValidSignature = true;
            if (process.env.NODE_ENV === 'production') {
                isValidSignature = solana_1.SolanaUtil.verifyWalletSignature(walletAddress, signature, message);
            }
            else {
                logger_1.Logger.info('Skipping signature verification in development mode');
            }
            if (!isValidSignature) {
                response_1.ResponseUtil.unauthorized(res, 'Invalid wallet signature');
                return;
            }
            // Find or create user
            let user = await database_1.prisma.user.findUnique({
                where: { walletAddress }
            });
            if (!user) {
                // Create new user
                user = await database_1.prisma.user.create({
                    data: {
                        walletAddress,
                        publicKey,
                        lastLogin: new Date()
                    }
                });
                logger_1.Logger.info('New user created', {
                    userId: user.id,
                    walletAddress
                });
            }
            else {
                // Update last login
                user = await database_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLogin: new Date(),
                        publicKey // Update public key in case it changed
                    }
                });
                logger_1.Logger.info('User logged in', {
                    userId: user.id,
                    walletAddress
                });
            }
            // Generate JWT token
            const token = jwt_1.JwtUtil.sign({
                userId: user.id,
                walletAddress: user.walletAddress
            });
            // 立即返回认证结果，不等待余额获取
            response_1.ResponseUtil.success(res, {
                token,
                user: {
                    id: user.id,
                    walletAddress: user.walletAddress,
                    publicKey: user.publicKey,
                    balance: 0, // 余额将异步获取
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            }, 'Authentication successful');
            // 异步获取钱包余额，不阻塞认证响应
            solana_1.SolanaUtil.getWalletBalance(walletAddress).then(balance => {
                logger_1.Logger.debug('Wallet balance fetched', { walletAddress, balance });
                // 可以在这里更新用户余额到数据库或通过WebSocket推送
            }).catch(error => {
                logger_1.Logger.warn('Failed to fetch wallet balance', {
                    walletAddress,
                    error: error.message
                });
            });
        }
        catch (error) {
            logger_1.Logger.error('Authentication error', { error: error.message });
            response_1.ResponseUtil.serverError(res, 'Authentication failed');
        }
    }
    /**
     * Verify current authentication status
     */
    static async verify(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    walletAddress: true,
                    publicKey: true,
                    createdAt: true,
                    lastLogin: true,
                    settings: true
                }
            });
            if (!user) {
                response_1.ResponseUtil.unauthorized(res, 'User not found');
                return;
            }
            // Get current wallet balance
            const balance = await solana_1.SolanaUtil.getWalletBalance(user.walletAddress);
            response_1.ResponseUtil.success(res, {
                user: {
                    ...user,
                    balance
                }
            }, 'Token is valid');
        }
        catch (error) {
            logger_1.Logger.error('Token verification error', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Update user settings
     */
    static async updateSettings(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            const { settings } = req.body;
            const updatedUser = await database_1.prisma.user.update({
                where: { id: req.user.id },
                data: { settings },
                select: {
                    id: true,
                    walletAddress: true,
                    settings: true
                }
            });
            logger_1.Logger.info('User settings updated', {
                userId: req.user.id,
                settings
            });
            response_1.ResponseUtil.success(res, updatedUser, 'Settings updated successfully');
        }
        catch (error) {
            logger_1.Logger.error('Error updating user settings', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
    /**
     * Refresh JWT token
     */
    static async refreshToken(req, res) {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // Generate new token
            const token = jwt_1.JwtUtil.sign({
                userId: req.user.id,
                walletAddress: req.user.walletAddress
            });
            response_1.ResponseUtil.success(res, { token }, 'Token refreshed successfully');
        }
        catch (error) {
            logger_1.Logger.error('Token refresh error', { error: error.message });
            response_1.ResponseUtil.serverError(res);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map