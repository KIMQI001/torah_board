import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types';

export class JwtUtil {
  private static readonly secret = process.env.JWT_SECRET || 'fallback-secret-key';
  private static readonly expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  static sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  static verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}