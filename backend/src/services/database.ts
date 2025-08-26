import { PrismaClient } from '@prisma/client';
import { Logger } from '@/utils/logger';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      Logger.info('Database connected successfully');
    } catch (error) {
      Logger.error('Database connection failed', { error: error.message });
      throw new Error('Database connection failed');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      Logger.info('Database disconnected');
    } catch (error) {
      Logger.error('Database disconnection failed', { error: error.message });
    }
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      Logger.error('Database health check failed', { error: error.message });
      return false;
    }
  }
}

export const database = DatabaseService.getInstance();
export const prisma = database.getClient();