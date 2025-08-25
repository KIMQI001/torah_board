"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import { Wallet, Coins, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';

// Mock Solana wallet connection
// In a real implementation, this would use @solana/wallet-adapter-react
interface SolanaWallet {
  publicKey: string;
  connected: boolean;
  balance: {
    sol: number;
    usdc: number;
    tokens: Array<{
      symbol: string;
      amount: number;
      mint: string;
      logo?: string;
    }>;
  };
}

interface SolanaWalletProps {
  onWalletChange?: (wallet: SolanaWallet | null) => void;
}

export const SolanaWallet: React.FC<SolanaWalletProps> = ({ onWalletChange }) => {
  const { t } = useLanguage();
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock wallet data
  const mockWallet: SolanaWallet = {
    publicKey: 'GjJ7zPQwEMKQEqmDGN5HjYTnJzjz5mLtJFxNXNrBxUzL',
    connected: true,
    balance: {
      sol: 12.45,
      usdc: 1850.32,
      tokens: [
        {
          symbol: 'RAY',
          amount: 125.48,
          mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
          logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png'
        },
        {
          symbol: 'SRM',
          amount: 89.23,
          mint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
        },
        {
          symbol: 'ORCA',
          amount: 45.67,
          mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
        }
      ]
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // In real implementation, this would trigger wallet selector
      setWallet(mockWallet);
      onWalletChange?.(mockWallet);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWallet(null);
    onWalletChange?.(null);
  };

  const copyAddress = async () => {
    if (wallet?.publicKey) {
      await navigator.clipboard.writeText(wallet.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatBalance = (amount: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  };

  if (!wallet) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-6 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Connect Solana Wallet</h3>
          <p className="text-muted-foreground mb-4">
            Connect your Solana wallet to interact with DAO governance
          </p>
          <Button onClick={handleConnect} disabled={connecting}>
            <Wallet className="h-4 w-4 mr-2" />
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>

        {/* Supported Wallets */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Supported Wallets</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Phantom', 'Solflare', 'Backpack', 'Glow'].map((walletName) => (
              <div key={walletName} className="p-2 text-center border rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded mx-auto mb-1"></div>
                <span className="text-xs">{walletName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Info */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium">Connected Wallet</div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{formatAddress(wallet.publicKey)}</span>
                <button onClick={copyAddress} className="hover:text-foreground">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>

        {/* Balances */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
              <span className="font-medium">SOL</span>
            </div>
            <span className="font-mono">{formatBalance(wallet.balance.sol, 4)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <span className="font-medium">USDC</span>
            </div>
            <span className="font-mono">${formatBalance(wallet.balance.usdc)}</span>
          </div>

          {/* SPL Tokens */}
          {wallet.balance.tokens.map((token) => (
            <div key={token.mint} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                </div>
                <span className="font-medium">{token.symbol}</span>
              </div>
              <span className="font-mono">{formatBalance(token.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Governance Info */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center">
          <Coins className="h-4 w-4 mr-2" />
          Governance Power
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Voting Power</span>
            <span className="font-medium">25,000 votes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Governance Tokens</span>
            <span className="font-medium">15,000 GOV</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Staked Amount</span>
            <span className="font-medium">10,000 GOV</span>
          </div>
        </div>
      </div>

      {/* Program Interaction Warning */}
      <div className="border border-orange-200 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-800 dark:text-orange-200">Development Notice</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              This is a simulation. In production, this would connect to Solana programs like Realms or SPL Governance for on-chain voting and treasury management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolanaWallet;