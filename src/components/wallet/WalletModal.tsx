'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-base';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { getLastConnectedWallet } from '@/lib/wallet-persistence';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const walletContext = useWallet();
  const { wallets = [], select, wallet, connect, connecting, connected, disconnect } = walletContext || {};
  const { signIn, isAuthenticated, error, clearError } = useAuth();
  
  const [selectedWallet, setSelectedWallet] = useState<WalletName | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'select' | 'connecting' | 'connected' | 'authenticating'>('select');

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  useEffect(() => {
    if (connected && wallet) {
      setConnectionStep('connected');
    } else if (connecting) {
      setConnectionStep('connecting');
    } else {
      setConnectionStep('select');
    }
  }, [connected, connecting, wallet]);

  // 初始化时检查最后连接的钱包
  useEffect(() => {
    if (open && !selectedWallet && !connected) {
      const lastWallet = getLastConnectedWallet();
      if (lastWallet) {
        console.log('🔄 检测到最后连接的钱包:', lastWallet);
        // 可以选择自动选中最后连接的钱包，但不自动连接
        // setSelectedWallet(lastWallet as WalletName);
      }
    }
  }, [open, selectedWallet, connected]);

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="flex items-center justify-center gap-3 text-xl font-semibold">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            连接钱包
          </DialogTitle>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{
                width: connectionStep === 'select' ? '25%' : 
                       connectionStep === 'connecting' ? '50%' : 
                       connectionStep === 'connected' ? '75%' : '100%'
              }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {connectionStep === 'select' && '选择钱包'}
            {connectionStep === 'connecting' && '连接中...'}
            {connectionStep === 'connected' && '钱包已连接'}
            {connectionStep === 'authenticating' && '正在认证...'}
          </p>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">连接失败</p>
                <p className="text-xs opacity-90 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!connected ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">选择钱包类型</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">我们支持多种主流钱包，请选择您偏好的钱包</p>
              </div>
              
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
                  <button
                    key={`${walletAdapter.name}-${index}`}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleWalletSelect(walletAdapter.name)}
                    disabled={connecting}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                          {walletAdapter.icon ? (
                            <img 
                              src={walletAdapter.icon} 
                              alt={walletAdapter.name} 
                              className="w-8 h-8 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-8 h-8 flex items-center justify-center" style={{ display: walletAdapter.icon ? 'none' : 'flex' }}>
                            <Wallet className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{walletAdapter.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {isInstalled ? '已安装' : isNotDetected ? '点击安装' : '可用'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedWallet === walletAdapter.name && connecting && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        )}
                        {isInstalled && (
                          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {selectedWallet && !connecting && (
                <Button 
                  onClick={handleConnect}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      连接中...
                    </>
                  ) : (
                    <>
                      连接 {selectedWallet}
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">钱包连接成功</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">钱包地址</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {wallet?.adapter.publicKey?.toBase58()}
                  </p>
                </div>
              </div>
                
              <Button 
                onClick={() => {
                  setConnectionStep('authenticating');
                  handleAuthenticate();
                }}
                disabled={isAuthenticating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    认证中...
                  </>
                ) : (
                  '完成认证'
                )}
              </Button>

              <Button 
                variant="outline"
                onClick={handleDisconnect}
                className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 py-3 text-base"
              >
                断开连接
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}