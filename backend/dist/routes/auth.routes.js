"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("@/controllers/auth.controller");
const validation_1 = require("@/middleware/validation");
const auth_1 = require("@/middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.authRoutes = router;
// Generate authentication message
router.post('/message', (0, validation_1.validate)(joi_1.default.object({
    walletAddress: joi_1.default.string().required().min(32).max(44)
})), auth_controller_1.AuthController.generateAuthMessage);
// Authenticate with wallet signature
router.post('/authenticate', (0, validation_1.validate)(validation_1.schemas.walletAuth), auth_controller_1.AuthController.authenticate);
// Verify current authentication
router.get('/verify', auth_1.authenticate, auth_controller_1.AuthController.verify);
// Refresh JWT token
router.post('/refresh', auth_1.authenticate, auth_controller_1.AuthController.refreshToken);
// Update user settings
router.put('/settings', auth_1.authenticate, (0, validation_1.validate)(joi_1.default.object({
    settings: joi_1.default.object().required()
})), auth_controller_1.AuthController.updateSettings);
//# sourceMappingURL=auth.routes.js.map