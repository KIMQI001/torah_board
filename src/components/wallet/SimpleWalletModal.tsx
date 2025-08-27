'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
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
        console.log('开始连接钱包:', wallet.name);
        
        // 尝试连接已安装的钱包
        let walletAdapter: any = null;

        switch (wallet.name) {
          case 'Phantom':
            walletAdapter = (window as any)?.solana;
            console.log('Phantom adapter:', !!walletAdapter, walletAdapter?.isPhantom);
            break;
          case 'Solflare':
            walletAdapter = (window as any)?.solflare;
            console.log('Solflare adapter:', !!walletAdapter);
            break;
          case 'Backpack':
            walletAdapter = (window as any)?.backpack;
            console.log('Backpack adapter:', !!walletAdapter);
            break;
          case 'Coinbase':
            walletAdapter = (window as any)?.coinbaseSolana;
            console.log('Coinbase adapter:', !!walletAdapter);
            break;
        }

        if (!walletAdapter) {
          throw new Error(`${wallet.name} 钱包未安装或未检测到`);
        }

        console.log('尝试连接钱包适配器...');
        // 请求连接钱包
        const response = await walletAdapter.connect();
        console.log('钱包连接成功:', response);
        
        const publicKey = response.publicKey || walletAdapter.publicKey;
        console.log('获取到的公钥:', publicKey);
        console.log('公钥类型:', typeof publicKey, 'toString方法:', !!publicKey?.toString);
        
        if (!publicKey) {
          throw new Error('未能获取钱包公钥');
        }

        // 确保公钥是正确的格式（Base58字符串）
        let publicKeyString: string;
        if (typeof publicKey === 'string') {
          publicKeyString = publicKey;
        } else if (publicKey.toString) {
          publicKeyString = publicKey.toString();
        } else if (publicKey.toBase58) {
          publicKeyString = publicKey.toBase58();
        } else {
          throw new Error('无法获取公钥字符串格式');
        }
        
        console.log('公钥字符串:', publicKeyString);

        // 创建简化的钱包对象用于认证
        const mockWallet = {
          adapter: {
            name: wallet.name,
            connected: true, // 重要：标记为已连接
            publicKey: { toString: () => publicKeyString, toBase58: () => publicKeyString },
            signMessage: walletAdapter.signMessage?.bind(walletAdapter) || walletAdapter.sign?.bind(walletAdapter)
          }
        };

        console.log('开始认证流程...');
        // 触发认证流程
        const success = await signIn(mockWallet as any);
        console.log('认证结果:', success);
        
        if (success) {
          console.log('认证成功，关闭弹窗');
          onClose();
        } else {
          throw new Error('认证失败');
        }
      } catch (error) {
        console.error('连接钱包详细错误:', error);
        console.error('错误堆栈:', error.stack);
        alert(`连接钱包失败: ${error.message || '未知错误'}`);
      }
    } else {
      // 打开钱包下载页面
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