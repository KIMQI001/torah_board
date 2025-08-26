"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtUtil = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtUtil {
    static sign(payload) {
        return jsonwebtoken_1.default.sign(payload, this.secret, { expiresIn: this.expiresIn });
    }
    static verify(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secret);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    static decode(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            return null;
        }
    }
}
exports.JwtUtil = JwtUtil;
JwtUtil.secret = process.env.JWT_SECRET || 'fallback-secret-key';
JwtUtil.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
//# sourceMappingURL=jwt.js.map