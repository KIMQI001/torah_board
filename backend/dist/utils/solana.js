"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaUtil = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const logger_1 = require("./logger");
class SolanaUtil {
    static initialize() {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
        logger_1.Logger.info('Solana connection initialized', { rpcUrl });
    }
    static getConnection() {
        if (!this.connection) {
            this.initialize();
        }
        return this.connection;
    }
    /**
     * Verify wallet signature
     * @param walletAddress - Base58 encoded wallet address
     * @param signature - Base58 encoded signature
     * @param message - Original message that was signed
     * @returns boolean indicating if signature is valid
     */
    static verifyWalletSignature(walletAddress, signature, message) {
        try {
            // Convert base58 strings to Uint8Array
            const publicKeyBytes = bs58_1.default.decode(walletAddress);
            const signatureBytes = bs58_1.default.decode(signature);
            const messageBytes = new TextEncoder().encode(message);
            // Verify signature
            const isValid = tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
            logger_1.Logger.debug('Signature verification', {
                walletAddress,
                message,
                isValid
            });
            return isValid;
        }
        catch (error) {
            logger_1.Logger.error('Error verifying wallet signature', {
                error: error.message,
                walletAddress
            });
            return false;
        }
    }
    /**
     * Validate wallet address format
     */
    static isValidWalletAddress(address) {
        try {
            new web3_js_1.PublicKey(address);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get SOL balance for wallet with timeout
     */
    static async getWalletBalance(walletAddress) {
        try {
            const publicKey = new web3_js_1.PublicKey(walletAddress);
            // 添加5秒超时机制
            const balancePromise = this.getConnection().getBalance(publicKey);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Balance fetch timeout')), 5000);
            });
            const balance = await Promise.race([balancePromise, timeoutPromise]);
            return balance / 1e9; // Convert lamports to SOL
        }
        catch (error) {
            logger_1.Logger.error('Error getting wallet balance', {
                error: error.message,
                walletAddress
            });
            return 0;
        }
    }
    /**
     * Generate a unique message for wallet signing
     */
    static generateAuthMessage(walletAddress) {
        const timestamp = Date.now();
        return `Sign this message to authenticate with DePIN Dashboard.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
    }
    /**
     * Validate that the signed message is recent (within 5 minutes)
     */
    static isMessageRecent(message) {
        try {
            const timestampMatch = message.match(/Timestamp: (\d+)/);
            if (!timestampMatch)
                return false;
            const timestamp = parseInt(timestampMatch[1]);
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
            return (now - timestamp) <= fiveMinutes;
        }
        catch (error) {
            logger_1.Logger.error('Error validating message timestamp', { error: error.message });
            return false;
        }
    }
}
exports.SolanaUtil = SolanaUtil;
//# sourceMappingURL=solana.js.map