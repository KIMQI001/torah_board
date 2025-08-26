"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.database = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
class DatabaseService {
    constructor() {
        this.prisma = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async connect() {
        try {
            await this.prisma.$connect();
            logger_1.Logger.info('Database connected successfully');
        }
        catch (error) {
            logger_1.Logger.error('Database connection failed', { error: error.message });
            throw new Error('Database connection failed');
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            logger_1.Logger.info('Database disconnected');
        }
        catch (error) {
            logger_1.Logger.error('Database disconnection failed', { error: error.message });
        }
    }
    getClient() {
        return this.prisma;
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            logger_1.Logger.error('Database health check failed', { error: error.message });
            return false;
        }
    }
}
exports.database = DatabaseService.getInstance();
exports.prisma = exports.database.getClient();
//# sourceMappingURL=database.js.map