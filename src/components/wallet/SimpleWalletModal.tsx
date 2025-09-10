'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Wallet, ExternalLink, CheckCircle, Loader2, User } from 'lucide-react';

interface SimpleWalletModalProps {
  open: boolean;
  onClose: () => void;
}

interface WalletInfo {
  name: string;
  icon: string;
  downloadUrl: string;
  isInstalled: boolean;
}

export function SimpleWalletModal({ open, onClose }: SimpleWalletModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const { signIn } = useAuth();

  // 检测已安装的钱包
  const checkWalletInstalled = (walletName: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    switch (walletName) {
      case 'Phantom':
        return !!(window as any)?.solana?.isPhantom;
      case 'Solflare':
        return !!(window as any)?.solflare;
      case 'Backpack':
        return !!(window as any)?.backpack;
      case 'Coinbase':
        return !!(window as any)?.coinbaseSolana;
      default:
        return false;
    }
  };

  const wallets: WalletInfo[] = [
    {
      name: 'Phantom',
      icon: '/icons/phantom.svg',
      downloadUrl: 'https://phantom.app/',
      isInstalled: checkWalletInstalled('Phantom')
    },
    {
      name: 'Solflare',
      icon: '/icons/solflare.svg',
      downloadUrl: 'https://solflare.com/',
      isInstalled: checkWalletInstalled('Solflare')
    },
    {
      name: 'Backpack',
      icon: '/icons/backpack.svg',
      downloadUrl: 'https://backpack.app/',
      isInstalled: checkWalletInstalled('Backpack')
    },
    {
      name: 'Coinbase',
      icon: '/icons/coinbase.svg',
      downloadUrl: 'https://wallet.coinbase.com/',
      isInstalled: checkWalletInstalled('Coinbase')
    }
  ];

  const handleWalletClick = async (wallet: WalletInfo) => {
    setSelectedWallet(wallet.name);

    if (wallet.isInstalled) {
      try {
        console.log('🔗 开始连接钱包:', wallet.name);
        
        // 获取钱包适配器
        let walletAdapter: any = null;

        switch (wallet.name) {
          case 'Phantom':
            walletAdapter = (window as any)?.solana;
            console.log('📱 Phantom检测:', {
              存在: !!walletAdapter,
              isPhantom: walletAdapter?.isPhantom,
              已连接: walletAdapter?.isConnected,
              公钥: walletAdapter?.publicKey?.toString()
            });
            break;
          case 'Solflare':
            walletAdapter = (window as any)?.solflare;
            console.log('📱 Solflare检测:', !!walletAdapter);
            break;
          case 'Backpack':
            walletAdapter = (window as any)?.backpack;
            console.log('📱 Backpack检测:', !!walletAdapter);
            break;
          case 'Coinbase':
            walletAdapter = (window as any)?.coinbaseSolana;
            console.log('📱 Coinbase检测:', !!walletAdapter);
            break;
        }

        if (!walletAdapter) {
          throw new Error(`${wallet.name} 钱包未安装或未检测到`);
        }

        let publicKey;
        
        // 检查是否已经连接
        if (walletAdapter.isConnected && walletAdapter.publicKey) {
          console.log('✅ 钱包已连接，直接使用现有连接');
          publicKey = walletAdapter.publicKey;
        } else {
          console.log('🔌 钱包未连接，请求用户连接...');
          
          try {
            // 对于Phantom，直接调用connect()应该弹出授权窗口
            console.log('🚀 调用钱包connect()方法...');
            const connectResult = await walletAdapter.connect();
            console.log('✅ 连接结果:', connectResult);
            
            // 获取公钥
            publicKey = connectResult?.publicKey || walletAdapter.publicKey;
            
            if (!publicKey) {
              console.error('❌ 连接成功但未获取到公钥');
              throw new Error('连接成功但未获取到公钥');
            }
            
            console.log('🔑 成功获取公钥:', publicKey.toString());
            
          } catch (connectError: any) {
            console.error('❌ 钱包连接错误:', connectError);
            
            // 处理常见错误
            if (connectError.code === 4001) {
              throw new Error('用户拒绝了钱包连接请求');
            } else if (connectError.code === -32603) {
              throw new Error('钱包内部错误，请重试');
            } else if (connectError.message?.includes('User rejected')) {
              throw new Error('用户取消了连接请求');
            } else {
              throw new Error(`钱包连接失败: ${connectError.message || '未知错误'}`);
            }
          }
        }
        
        if (!publicKey) {
          throw new Error('未能获取钱包公钥');
        }

        // 转换公钥为字符串格式
        let publicKeyString: string;
        try {
          if (typeof publicKey === 'string') {
            publicKeyString = publicKey;
          } else if (publicKey.toString) {
            publicKeyString = publicKey.toString();
          } else if (publicKey.toBase58) {
            publicKeyString = publicKey.toBase58();
          } else {
            throw new Error('无法转换公钥格式');
          }
          console.log('🔑 公钥字符串:', publicKeyString);
        } catch (keyError) {
          console.error('❌ 公钥转换失败:', keyError);
          throw new Error('公钥格式转换失败');
        }

        // 构建钱包对象供认证使用
        const authWallet = {
          adapter: {
            name: wallet.name,
            connected: true,
            publicKey: {
              toString: () => publicKeyString,
              toBase58: () => publicKeyString,
              toBytes: () => new Uint8Array(32)
            },
            signMessage: walletAdapter.signMessage?.bind(walletAdapter),
            disconnect: walletAdapter.disconnect?.bind(walletAdapter),
            signTransaction: walletAdapter.signTransaction?.bind(walletAdapter),
            signAllTransactions: walletAdapter.signAllTransactions?.bind(walletAdapter)
          }
        };

        console.log('🔐 开始用户认证流程...');
        const authSuccess = await signIn(authWallet as any);
        
        if (authSuccess) {
          console.log('✅ 认证成功，关闭弹窗');
          onClose();
        } else {
          throw new Error('用户认证失败');
        }
        
      } catch (error: any) {
        console.error('❌ 钱包连接流程失败:', error);
        alert(`连接钱包失败: ${error.message || '未知错误'}`);
      }
    } else {
      // 钱包未安装，打开下载页面
      console.log('🔗 钱包未安装，打开下载页面:', wallet.downloadUrl);
      window.open(wallet.downloadUrl, '_blank');
    }

    setSelectedWallet(null);
  };

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
          <p className="text-sm text-gray-600 mb-4">选择一个钱包来连接：</p>
          
          {wallets.map((wallet, index) => (
            <Button
              key={wallet.name}
              variant="outline"
              className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50"
              onClick={() => handleWalletClick(wallet)}
              disabled={selectedWallet === wallet.name}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                  {wallet.name === 'Phantom' && <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">P</span></div>}
                  {wallet.name === 'Solflare' && <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">S</span></div>}
                  {wallet.name === 'Backpack' && <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">B</span></div>}
                  {wallet.name === 'Coinbase' && <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">C</span></div>}
                </div>
                <div className="text-left">
                  <div className="font-medium">{wallet.name}</div>
                  {wallet.isInstalled ? (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      已安装
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">点击安装</div>
                  )}
                </div>
              </div>
              
              {!wallet.isInstalled && (
                <ExternalLink className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          ))}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              连接钱包即表示您同意我们的服务条款
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}