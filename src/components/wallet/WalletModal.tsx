'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-base';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const walletContext = useWallet();
  const { wallets = [], select, wallet, connect, connecting, connected, disconnect } = walletContext || {};
  const { signIn, isAuthenticated, error, clearError } = useAuth();
  
  console.log('WalletModal - useWallet hook result:', {
    hasContext: !!walletContext,
    walletsLength: wallets?.length,
    wallet: wallet?.adapter?.name,
    connected,
    connecting
  });
  const [selectedWallet, setSelectedWallet] = useState<WalletName | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  useEffect(() => {
    if (open) {
      clearError();
    }
  }, [open, clearError]);

  const handleWalletSelect = async (walletName: WalletName | string) => {
    try {
      setSelectedWallet(walletName as WalletName);
      
      // 如果是 Solana 钱包适配器可用，使用它
      if (select && typeof walletName === 'object') {
        select(walletName);
      } else {
        // 否则尝试直接打开钱包网站或扩展
        if (typeof walletName === 'string') {
          const walletUrls = {
            'Phantom': 'https://phantom.app/',
            'Solflare': 'https://solflare.com/',
            'Torus': 'https://app.tor.us/',
            'MathWallet': 'https://mathwallet.org/',
            'Coin98': 'https://coin98.com/wallet'
          };
          
          const url = walletUrls[walletName as keyof typeof walletUrls];
          if (url) {
            window.open(url, '_blank');
          }
        }
      }
    } catch (error) {
      console.error('选择钱包失败:', error);
    }
  };

  const handleConnect = async () => {
    try {
      if (!connected && wallet) {
        await connect();
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  const handleAuthenticate = async () => {
    if (!wallet || !connected) return;

    try {
      setIsAuthenticating(true);
      const success = await signIn(wallet);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('认证失败:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSelectedWallet(null);
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  };

  // 显示所有可用的钱包，不仅仅是已安装的
  const availableWallets = wallets;
  
  // 调试信息
  console.log('Available wallets:', wallets.map(w => ({ name: w.name, readyState: w.readyState })));
  
  // 后备钱包列表，如果 useWallet 没有提供钱包
  const fallbackWallets = [
    { name: 'Phantom', icon: 'https://www.phantom.app/img/meta/favicon.ico' },
    { name: 'Solflare', icon: 'https://solflare.com/favicon.ico' },
    { name: 'Torus', icon: null },
    { name: 'MathWallet', icon: null },
    { name: 'Coin98', icon: null }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            连接钱包
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-0">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!connected ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">选择一个钱包来连接：</p>
              
{(availableWallets.length > 0 ? availableWallets : 
                // 使用后备钱包列表
                fallbackWallets.map((fw, i) => ({
                  name: fw.name as any,
                  icon: fw.icon,
                  readyState: 'NotDetected' as any
                }))
              ).map((walletAdapter, index) => {
                const isInstalled = walletAdapter.readyState === 'Installed';
                const isLoadable = walletAdapter.readyState === 'Loadable';
                const isNotDetected = walletAdapter.readyState === 'NotDetected' || (!isInstalled && !isLoadable);
                
                return (
                  <Button
                    key={`${walletAdapter.name}-${index}`}
                    variant="outline"
                    className="w-full flex items-center justify-between p-4 h-auto"
                    onClick={() => handleWalletSelect(walletAdapter.name)}
                    disabled={connecting}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                        {walletAdapter.icon ? (
                          <img 
                            src={walletAdapter.icon} 
                            alt={walletAdapter.name} 
                            className="w-8 h-8"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <Wallet className="h-4 w-4 text-gray-400" style={{ display: walletAdapter.icon ? 'none' : 'block' }} />
                      </div>
                      <div>
                        <span className="block">{walletAdapter.name}</span>
                        {isNotDetected && (
                          <span className="text-xs text-gray-500">点击安装</span>
                        )}
                      </div>
                    </div>
                    {selectedWallet === walletAdapter.name && connecting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isInstalled && (
                      <span className="text-xs text-green-600">已安装</span>
                    )}
                  </Button>
                );
              })}

              {selectedWallet && !connecting && (
                <Button 
                  onClick={handleConnect}
                  className="w-full"
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      连接中...
                    </>
                  ) : (
                    '连接钱包'
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">钱包已连接</span>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  钱包地址: {wallet?.adapter.publicKey?.toBase58().slice(0, 8)}...
                </p>
                
                <Button 
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating}
                  className="w-full"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      认证中...
                    </>
                  ) : (
                    '开始认证'
                  )}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleDisconnect}
                  className="w-full"
                >
                  断开连接
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}