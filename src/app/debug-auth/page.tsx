'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getAuthToken, clearAuthToken } from '@/lib/api';
import { getWalletState, clearWalletState, getCurrentDeviceId } from '@/lib/wallet-persistence';

export default function DebugAuthPage() {
  const [mounted, setMounted] = useState(false);
  const [debugData, setDebugData] = useState<any>({});
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  const refreshDebugData = () => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      const walletState = getWalletState();
      const deviceId = getCurrentDeviceId();
      
      // 获取所有相关的localStorage数据
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.includes('wallet') || key.includes('auth') || key.includes('mock')
      );
      
      const storageData: any = {};
      storageKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          storageData[key] = value?.length > 100 ? `${value.substring(0, 100)}...` : value;
        } catch (error) {
          storageData[key] = 'Error reading';
        }
      });

      setDebugData({
        deviceId,
        token: token?.substring(0, 20) + '...' || 'null',
        walletState,
        storageData,
        authHookData: {
          user: user ? {
            id: user.id,
            walletAddress: user.walletAddress,
            balance: user.balance
          } : null,
          isAuthenticated,
          isLoading
        }
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    refreshDebugData();
    
    // 定期刷新调试数据
    const interval = setInterval(refreshDebugData, 2000);
    return () => clearInterval(interval);
  }, [user, isAuthenticated, isLoading]);

  const handleClearAuth = () => {
    // 彻底清理所有认证数据
    clearAuthToken();
    clearWalletState();
    
    // 清理所有可能的旧数据
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'auth_token',
        'mock_wallet_connection',
        'wallet_connected_state',
        'wallet_address',
        'last_connected_wallet'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 清理所有设备相关的key
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('auth_token_') || key.includes('wallet_')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    refreshDebugData();
    
    // 延迟刷新页面，让状态变更生效
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSignOut = () => {
    signOut();
    setTimeout(refreshDebugData, 1000);
  };

  if (!mounted) return <div>加载中...</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">认证状态调试</h1>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">当前认证状态</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(debugData.authHookData, null, 2)}
          </pre>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">存储状态</h2>
          <div className="space-y-2">
            <p><strong>设备ID:</strong> {debugData.deviceId}</p>
            <p><strong>Auth Token:</strong> {debugData.token}</p>
          </div>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">钱包状态:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(debugData.walletState, null, 2)}
          </pre>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">所有存储数据</h2>
          <div className="space-y-1 text-sm">
            {Object.entries(debugData.storageData || {}).map(([key, value]) => (
              <div key={key} className="border-b pb-1">
                <strong>{key}:</strong> <code className="text-xs">{value as string}</code>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">操作</h2>
          <div className="flex gap-4">
            <Button onClick={refreshDebugData} variant="outline">
              刷新数据
            </Button>
            <Button onClick={handleClearAuth} variant="destructive">
              清除认证数据
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              执行登出
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}