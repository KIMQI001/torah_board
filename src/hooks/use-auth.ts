'use client';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function useAuth() {
  const authContext = useAuthContext();
  const { wallet, connect, disconnect, connected, connecting } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectAndAuthenticate = useCallback(async () => {
    if (!wallet) {
      throw new Error('未选择钱包');
    }

    try {
      setIsConnecting(true);

      if (!connected && !connecting) {
        await connect();
      }

      if (wallet && connected && !authContext.isAuthenticated) {
        const success = await authContext.signIn(wallet);
        if (!success) {
          throw new Error('认证失败');
        }
      }

      return true;
    } catch (error) {
      console.error('连接或认证失败:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [wallet, connected, connecting, connect, authContext]);

  const disconnectAndSignOut = useCallback(async () => {
    try {
      authContext.signOut();
      if (connected) {
        await disconnect();
      }
    } catch (error) {
      console.error('断开连接失败:', error);
      throw error;
    }
  }, [authContext, connected, disconnect]);

  return {
    ...authContext,
    isConnecting: isConnecting || connecting,
    connectAndAuthenticate,
    disconnectAndSignOut,
    wallet,
    connected,
  };
}