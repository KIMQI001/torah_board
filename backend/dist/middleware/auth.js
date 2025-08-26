"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jwt_1 = require("@/utils/jwt");
const response_1 = require("@/utils/response");
const database_1 = require("@/services/database");
const logger_1 = require("@/utils/logger");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            response_1.ResponseUtil.unauthorized(res, 'No token provided');
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify JWT token
        const payload = jwt_1.JwtUtil.verify(token);
        // Check if user still exists in database
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                walletAddress: true,
                publicKey: true,
                lastLogin: true
            }
        });
        if (!user) {
            response_1.ResponseUtil.unauthorized(res, 'User not found');
            return;
        }
        // Attach user info to request
        req.user = {
            id: user.id,
            walletAddress: user.walletAddress,
            publicKey: user.publicKey
        };
        logger_1.Logger.debug('User authenticated successfully', {
            userId: user.id,
            walletAddress: user.walletAddress
        });
        next();
    }
    catch (error) {
        logger_1.Logger.error('Authentication failed', { error: error.message });
        response_1.ResponseUtil.unauthorized(res, 'Invalid or expired token');
        return;
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without authentication
            next();
            return;
        }
        const token = authHeader.substring(7);
        try {
            const payload = jwt_1.JwtUtil.verify(token);
            const user = await database_1.prisma.user.findUnique({
                where: { id: payload.userId },
                select: {
                    id: true,
                    walletAddress: true,
                    publicKey: true
                }
            });
            if (user) {
                req.user = {
                    id: user.id,
                    walletAddress: user.walletAddress,
                    publicKey: user.publicKey
                };
            }
        }
        catch (error) {
            // Token invalid, but continue without authentication
            logger_1.Logger.debug('Optional auth failed, continuing without auth', {
                error: error.message
            });
        }
        next();
    }
    catch (error) {
        // Continue without authentication on any error
        logger_1.Logger.debug('Optional auth error, continuing', { error: error.message });
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map