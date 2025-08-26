import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validate, schemas } from '@/middleware/validation';
import { authenticate } from '@/middleware/auth';
import Joi from 'joi';

const router = Router();

// Generate authentication message
router.post(
  '/message',
  validate(Joi.object({
    walletAddress: Joi.string().required().min(32).max(44)
  })),
  AuthController.generateAuthMessage
);

// Authenticate with wallet signature
router.post(
  '/authenticate',
  validate(schemas.walletAuth),
  AuthController.authenticate
);

// Verify current authentication
router.get(
  '/verify',
  authenticate,
  AuthController.verify
);

// Refresh JWT token
router.post(
  '/refresh',
  authenticate,
  AuthController.refreshToken
);

// Update user settings
router.put(
  '/settings',
  authenticate,
  validate(Joi.object({
    settings: Joi.object().required()
  })),
  AuthController.updateSettings
);

export { router as authRoutes };