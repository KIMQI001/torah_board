import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt';
import { ResponseUtil } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { prisma } from '@/services/database';
import { Logger } from '@/utils/logger';

export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseUtil.unauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const payload = JwtUtil.verify(token);
    
    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        walletAddress: true,
        publicKey: true,
        lastLogin: true
      }
    });

    if (!user) {
      ResponseUtil.unauthorized(res, 'User not found');
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      publicKey: user.publicKey
    };

    Logger.debug('User authenticated successfully', { 
      userId: user.id, 
      walletAddress: user.walletAddress 
    });

    next();
  } catch (error) {
    Logger.error('Authentication failed', { error: error.message });
    ResponseUtil.unauthorized(res, 'Invalid or expired token');
    return;
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = JwtUtil.verify(token);
      
      const user = await prisma.user.findUnique({
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
    } catch (error) {
      // Token invalid, but continue without authentication
      Logger.debug('Optional auth failed, continuing without auth', { 
        error: error.message 
      });
    }

    next();
  } catch (error) {
    // Continue without authentication on any error
    Logger.debug('Optional auth error, continuing', { error: error.message });
    next();
  }
};