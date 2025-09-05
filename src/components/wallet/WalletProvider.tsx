'use client';

import React, { FC, useMemo, ReactNode, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  MathWalletAdapter,
  Coin98WalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  // 清除可能损坏的 localStorage 数据，但保留有效的钱包连接状态
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const keys = ['walletName', 'walletAdapter'];
        keys.forEach(key => {
          const stored = localStorage.getItem(key);
          if (stored && (stored === 'undefined' || stored === 'null')) {
            localStorage.removeItem(key);
            console.log(`Cleared invalid localStorage key: ${key}`);
          }
        });
      } catch (error) {
        console.warn('Error clearing localStorage:', error);
      }
    }
  }, []);

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }
    return clusterApiUrl(network as any);
  }, [network]);

  const wallets = useMemo(
    () => {
      const walletList = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new TorusWalletAdapter(),
        new MathWalletAdapter(),
        new Coin98WalletAdapter(),
      ];
      console.log('WalletProvider - wallets created:', walletList.map(w => w.name));
      return walletList;
    },
    []
  );

  // 避免 SSR 水合问题 - 但仍然提供 WalletProvider context
  if (!mounted) {
    return (
      <ConnectionProvider endpoint={endpoint}>
        <SolanaWalletProvider wallets={[]} autoConnect={false}>
          {children}
        </SolanaWalletProvider>
      </ConnectionProvider>
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={true}
        localStorageKey="solana-wallet"
      >
        {children}
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};