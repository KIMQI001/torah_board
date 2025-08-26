// Simple wallet connection simulator for development
// In production, this would integrate with actual wallet adapters

export interface WalletConnection {
  connected: boolean;
  publicKey: string | null;
  walletAddress: string | null;
}

// Mock wallet for development
const MOCK_WALLET = {
  publicKey: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
};

let walletConnection: WalletConnection = {
  connected: false,
  publicKey: null,
  walletAddress: null
};

const listeners: Array<(connection: WalletConnection) => void> = [];

export const walletUtils = {
  // Connect to wallet (mock implementation)
  async connect(): Promise<WalletConnection> {
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    walletConnection = {
      connected: true,
      publicKey: MOCK_WALLET.publicKey,
      walletAddress: MOCK_WALLET.walletAddress
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('mock_wallet_connection', JSON.stringify(walletConnection));
    
    // Notify listeners
    this.notifyListeners();
    
    return walletConnection;
  },

  // Disconnect wallet
  async disconnect(): Promise<void> {
    walletConnection = {
      connected: false,
      publicKey: null,
      walletAddress: null
    };
    
    localStorage.removeItem('mock_wallet_connection');
    
    // Notify listeners
    this.notifyListeners();
  },

  // Get current connection status
  getConnection(): WalletConnection {
    // Try to restore from localStorage on first access
    if (!walletConnection.connected && typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_wallet_connection');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.connected) {
            walletConnection = parsed;
          }
        } catch (error) {
          console.warn('Failed to restore wallet connection from localStorage');
        }
      }
    }
    
    return walletConnection;
  },

  // Sign message (mock implementation)
  async signMessage(message: string): Promise<string> {
    if (!walletConnection.connected) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate signing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a mock signature for development
    return "mock-signature-for-development-" + Math.random().toString(36).substring(2);
  },

  // Add connection change listener
  onConnectionChange(listener: (connection: WalletConnection) => void) {
    listeners.push(listener);
    
    // Return cleanup function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },

  // Notify all listeners of connection change
  notifyListeners() {
    listeners.forEach(listener => {
      try {
        listener(walletConnection);
      } catch (error) {
        console.error('Error in wallet connection listener:', error);
      }
    });
  }
};