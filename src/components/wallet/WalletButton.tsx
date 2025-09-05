'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { SimpleWalletModal } from './SimpleWalletModal';
import { Loader2, Wallet } from 'lucide-react';

interface WalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function WalletButton({ className, variant = 'default' }: WalletButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { signOut, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = () => {
    setShowWalletModal(true);
  };

  const handleDisconnect = async () => {
    try {
      signOut();
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  };

  const getButtonText = () => {
    if (!mounted) return '加载中...';
    
    console.log('WalletButton状态:', { 
      isAuthenticated, 
      user, 
      authLoading,
      walletAddress: user?.walletAddress 
    });
    
    if (authLoading) {
      return '认证中...';
    }
    
    if (isAuthenticated && user) {
      return `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}`;
    }
    
    return '连接钱包';
  };

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={isAuthenticated ? handleDisconnect : handleConnect}
        disabled={authLoading}
      >
        {authLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        {getButtonText()}
      </Button>

      <SimpleWalletModal 
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
}