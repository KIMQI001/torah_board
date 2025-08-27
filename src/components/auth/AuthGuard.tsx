'use client';

import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletModal } from '@/components/wallet/WalletModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Shield, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = true 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showWalletModal, setShowWalletModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="w-full max-w-md p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">需要钱包认证</h2>
              <p className="text-gray-600">
                请连接并认证您的钱包以访问此功能
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowWalletModal(true)}
                className="w-full"
              >
                <Wallet className="mr-2 h-4 w-4" />
                连接钱包
              </Button>
              
              <p className="text-xs text-gray-500">
                我们使用钱包签名来安全地验证您的身份
              </p>
            </div>
          </Card>
        </div>

        <WalletModal 
          open={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

interface OptionalAuthProps {
  children: ReactNode;
}

export function OptionalAuth({ children }: OptionalAuthProps) {
  return (
    <AuthGuard requireAuth={false}>
      {children}
    </AuthGuard>
  );
}