import { Connection } from '@solana/web3.js';
export declare class SolanaUtil {
    private static connection;
    static initialize(): void;
    static getConnection(): Connection;
    /**
     * Verify wallet signature
     * @param walletAddress - Base58 encoded wallet address
     * @param signature - Base58 encoded signature
     * @param message - Original message that was signed
     * @returns boolean indicating if signature is valid
     */
    static verifyWalletSignature(walletAddress: string, signature: string, message: string): boolean;
    /**
     * Validate wallet address format
     */
    static isValidWalletAddress(address: string): boolean;
    /**
     * Get SOL balance for wallet with timeout
     */
    static getWalletBalance(walletAddress: string): Promise<number>;
    /**
     * Generate a unique message for wallet signing
     */
    static generateAuthMessage(walletAddress: string): string;
    /**
     * Validate that the signed message is recent (within 5 minutes)
     */
    static isMessageRecent(message: string): boolean;
}
//# sourceMappingURL=solana.d.ts.map