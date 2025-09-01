import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';
import { SolanaUtil } from '@/utils/solana';
import { JwtUtil } from '@/utils/jwt';
import { Logger } from '@/utils/logger';
import { prisma } from '@/services/database';
import { WalletAuthRequest, AuthenticatedRequest } from '@/types';

export class AuthController {
  /**
   * Generate authentication message for wallet signing
   */
  static async generateAuthMessage(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress || !SolanaUtil.isValidWalletAddress(walletAddress)) {
        ResponseUtil.error(res, 'Invalid wallet address');
        return;
      }

      const message = SolanaUtil.generateAuthMessage(walletAddress);

      ResponseUtil.success(res, { 
        message,
        walletAddress 
      }, 'Authentication message generated');

    } catch (error) {
      Logger.error('Error generating auth message', { error: (error as Error).message });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Authenticate user with wallet signature
   */
  static async authenticate(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, publicKey, signature, message } = req.body as WalletAuthRequest;

      // Validate message timestamp (must be recent)
      if (!SolanaUtil.isMessageRecent(message)) {
        ResponseUtil.error(res, 'Authentication message is too old. Please generate a new one.');
        return;
      }

      // Verify wallet signature (skip in development mode for testing)
      let isValidSignature = true;
      
      if (process.env.NODE_ENV === 'production') {
        isValidSignature = SolanaUtil.verifyWalletSignature(
          walletAddress,
          signature,
          message
        );
      } else {
        Logger.info('Skipping signature verification in development mode');
      }

      if (!isValidSignature) {
        ResponseUtil.unauthorized(res, 'Invalid wallet signature');
        return;
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            walletAddress,
            publicKey,
            lastLogin: new Date()
          }
        });

        Logger.info('New user created', { 
          userId: user.id, 
          walletAddress 
        });
      } else {
        // Update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            publicKey // Update public key in case it changed
          }
        });

        Logger.info('User logged in', { 
          userId: user.id, 
          walletAddress 
        });
      }

      // Generate JWT token
      const token = JwtUtil.sign({
        userId: user.id,
        walletAddress: user.walletAddress
      });

      // 立即返回认证结果，不等待余额获取
      ResponseUtil.success(res, {
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
      SolanaUtil.getWalletBalance(walletAddress).then(balance => {
        Logger.debug('Wallet balance fetched', { walletAddress, balance });
        // 可以在这里更新用户余额到数据库或通过WebSocket推送
      }).catch(error => {
        Logger.warn('Failed to fetch wallet balance', { 
          walletAddress, 
          error: error.message 
        });
      });

    } catch (error) {
      Logger.error('Authentication error', { error: (error as Error).message });
      ResponseUtil.serverError(res, 'Authentication failed');
    }
  }

  /**
   * Verify current authentication status
   */
  static async verify(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // 开发模式：如果是模拟用户，直接返回模拟数据，不查询数据库
      if (process.env.NODE_ENV === 'development' && req.user.id === 'cmf0l7h1p0000vldfi9wmxwex') {
        Logger.debug('🔧 Development mode: Returning mock user data for verify');
        const mockUser = {
          id: req.user.id,
          walletAddress: req.user.walletAddress,
          publicKey: req.user.publicKey,
          balance: 1000, // Mock balance
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          settings: null
        };

        ResponseUtil.success(res, {
          user: mockUser
        }, 'Token is valid (development mode)');
        return;
      }

      const user = await prisma.user.findUnique({
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
        // 开发模式：即使数据库中没有用户，也返回模拟数据
        if (process.env.NODE_ENV === 'development') {
          Logger.debug('🔧 Development mode: User not found in DB, returning mock data');
          const mockUser = {
            id: req.user.id,
            walletAddress: req.user.walletAddress,
            publicKey: req.user.publicKey,
            balance: 1000,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            settings: null
          };

          ResponseUtil.success(res, {
            user: mockUser
          }, 'Token is valid (development mode fallback)');
          return;
        }

        ResponseUtil.unauthorized(res, 'User not found');
        return;
      }

      // Get current wallet balance
      const balance = await SolanaUtil.getWalletBalance(user.walletAddress);

      ResponseUtil.success(res, {
        user: {
          ...user,
          balance
        }
      }, 'Token is valid');

    } catch (error) {
      Logger.error('Token verification error', { error: error.message });
      
      // 开发模式：即使出错也返回模拟数据
      if (process.env.NODE_ENV === 'development' && req.user) {
        Logger.debug('🔧 Development mode: Error occurred, returning mock data');
        const mockUser = {
          id: req.user.id,
          walletAddress: req.user.walletAddress,
          publicKey: req.user.publicKey,
          balance: 1000,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          settings: null
        };

        ResponseUtil.success(res, {
          user: mockUser
        }, 'Token is valid (development mode error fallback)');
        return;
      }

      ResponseUtil.serverError(res);
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      const { settings } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { settings },
        select: {
          id: true,
          walletAddress: true,
          settings: true
        }
      });

      Logger.info('User settings updated', { 
        userId: req.user.id, 
        settings 
      });

      ResponseUtil.success(res, updatedUser, 'Settings updated successfully');

    } catch (error) {
      Logger.error('Error updating user settings', { error: error.message });
      ResponseUtil.serverError(res);
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // Generate new token
      const token = JwtUtil.sign({
        userId: req.user.id,
        walletAddress: req.user.walletAddress
      });

      ResponseUtil.success(res, { token }, 'Token refreshed successfully');

    } catch (error) {
      Logger.error('Token refresh error', { error: error.message });
      ResponseUtil.serverError(res);
    }
  }
}