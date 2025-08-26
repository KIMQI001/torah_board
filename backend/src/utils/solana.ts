import { PublicKey, Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { Logger } from './logger';

export class SolanaUtil {
  private static connection: Connection;

  static initialize(): void {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    Logger.info('Solana connection initialized', { rpcUrl });
  }

  static getConnection(): Connection {
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
  static verifyWalletSignature(
    walletAddress: string, 
    signature: string, 
    message: string
  ): boolean {
    try {
      // Convert base58 strings to Uint8Array
      const publicKeyBytes = bs58.decode(walletAddress);
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(message);

      // Verify signature
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      Logger.debug('Signature verification', { 
        walletAddress, 
        message, 
        isValid 
      });

      return isValid;
    } catch (error) {
      Logger.error('Error verifying wallet signature', { 
        error: error.message, 
        walletAddress 
      });
      return false;
    }
  }

  /**
   * Validate wallet address format
   */
  static isValidWalletAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get SOL balance for wallet
   */
  static async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.getConnection().getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      Logger.error('Error getting wallet balance', { 
        error: error.message, 
        walletAddress 
      });
      return 0;
    }
  }

  /**
   * Generate a unique message for wallet signing
   */
  static generateAuthMessage(walletAddress: string): string {
    const timestamp = Date.now();
    return `Sign this message to authenticate with DePIN Dashboard.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
  }

  /**
   * Validate that the signed message is recent (within 5 minutes)
   */
  static isMessageRecent(message: string): boolean {
    try {
      const timestampMatch = message.match(/Timestamp: (\d+)/);
      if (!timestampMatch) return false;

      const timestamp = parseInt(timestampMatch[1]);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      return (now - timestamp) <= fiveMinutes;
    } catch (error) {
      Logger.error('Error validating message timestamp', { error: error.message });
      return false;
    }
  }
}