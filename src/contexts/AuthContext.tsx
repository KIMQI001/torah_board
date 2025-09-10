'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { authApi, setAuthToken, getAuthToken, clearAuthToken } from '@/lib/api';
import { saveWalletState, getWalletState, clearWalletState } from '@/lib/wallet-persistence';

// 用户信息接口
export interface User {
  id: string;
  walletAddress: string;
  publicKey: string;
  balance: number;
  createdAt: string;
  lastLogin: string;
}

// 认证状态接口
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 认证方法接口
interface AuthMethods {
  signIn: (wallet: any) => Promise<boolean>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// AuthContext 类型
interface AuthContextType extends AuthState, AuthMethods {}

// 创建 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider 组件
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Solana 连接
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  );

  // 设置状态的辅助函数
  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // 清除错误
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, []);

  // 钱包签名认证
  const signIn = async (wallet: any): Promise<boolean> => {
    try {
      console.log('AuthContext: 开始认证流程');
      updateState({ isLoading: true, error: null });

      console.log('AuthContext: 检查钱包连接状态:', {
        connected: wallet.adapter.connected,
        hasPublicKey: !!wallet.adapter.publicKey
      });

      if (!wallet.adapter.connected || !wallet.adapter.publicKey) {
        throw new Error('钱包未连接');
      }

      const walletAddress = wallet.adapter.publicKey.toBase58();
      console.log('AuthContext: 获取钱包地址:', walletAddress);

      // 1. 获取认证消息
      console.log('AuthContext: 请求认证消息...');
      const messageData = await authApi.generateAuthMessage(walletAddress);
      console.log('AuthContext: 认证消息响应:', messageData);
      
      if (!messageData || !messageData.message) {
        throw new Error('获取认证消息失败: 响应数据无效');
      }

      const { message } = messageData;
      console.log('AuthContext: 需要签名的消息:', message);

      // 2. 使用钱包签名
      if (!wallet.adapter.signMessage) {
        throw new Error('钱包不支持消息签名');
      }

      console.log('AuthContext: 开始签名消息...');
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await wallet.adapter.signMessage(encodedMessage);
      console.log('AuthContext: 原始签名结果:', signedMessage, '类型:', typeof signedMessage);
      
      // 处理不同钱包的签名格式
      let signatureBytes: Uint8Array;
      if (signedMessage instanceof Uint8Array) {
        signatureBytes = signedMessage;
      } else if (signedMessage.signature && signedMessage.signature instanceof Uint8Array) {
        signatureBytes = signedMessage.signature;
      } else if (Array.isArray(signedMessage)) {
        signatureBytes = new Uint8Array(signedMessage);
      } else {
        console.error('AuthContext: 未知的签名格式:', signedMessage);
        throw new Error('无法解析钱包签名格式');
      }
      
      const signature = Buffer.from(signatureBytes).toString('base64');
      console.log('AuthContext: 签名完成:', signature.substring(0, 20) + '...');

      // 3. 发送认证请求
      console.log('AuthContext: 发送认证请求...', {
        walletAddress,
        publicKey: walletAddress,
        signature: signature.substring(0, 20) + '...',
        message: message.substring(0, 50) + '...'
      });
      
      const authData = await authApi.authenticate(
        walletAddress,
        walletAddress, // publicKey 和 walletAddress 相同
        signature,
        message
      );
      console.log('AuthContext: 认证响应:', authData);

      if (!authData || !authData.token) {
        throw new Error('认证失败: 响应数据无效');
      }

      // 4. 保存 token 和用户信息
      console.log('AuthContext: 保存认证信息...');
      setAuthToken(authData.token);
      
      // 保存钱包连接状态到本地存储
      saveWalletState({
        isConnected: true,
        walletAddress: walletAddress,
        walletName: wallet.adapter.name,
        connectedAt: Date.now()
      });
      
      updateState({
        user: authData.user,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('AuthContext: 认证成功完成');
      console.log('AuthContext: 更新后的状态:', {
        user: authData.user,
        isAuthenticated: true,
        walletAddress: authData.user?.walletAddress
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '认证失败';
      console.error('AuthContext: 认证失败:', error);
      console.error('AuthContext: 错误详情:', errorMessage);
      updateState({
        error: errorMessage,
        isLoading: false,
        user: null,
        isAuthenticated: false,
      });
      return false;
    }
  };

  // 退出登录
  const signOut = () => {
    clearAuthToken();
    clearWalletState();
    updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false, // 重要：设置加载完成
      error: null,
    });
  };

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        signOut();
        return;
      }

      const userData = await authApi.verify();
      if (userData && userData.user) {
        updateState({
          user: userData.user,
          isAuthenticated: true,
          isLoading: false, // 重要：设置加载完成
        });
      } else {
        signOut();
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // API验证失败，清除认证状态
      console.log('🚫 API验证失败，清除认证状态');
      signOut();
    }
  };

  // 监听钱包状态变化 - 通过localStorage或其他方式
  useEffect(() => {
    // 检查是否有保存的钱包状态
    const checkWalletState = () => {
      const token = getAuthToken();
      const walletState = getWalletState();
      
      if (token && walletState && !state.isAuthenticated) {
        console.log('🔄 发现保存的钱包状态，尝试恢复认证...');
        refreshUser();
      }
    };

    checkWalletState();
  }, []);

  // 初始化时检查现有 token
  useEffect(() => {
    const initializeAuth = async () => {
      // 在生产环境清理开发模式的token，开发环境保留
      const token = getAuthToken();
      if (token && token.startsWith('dev-token-') && process.env.NODE_ENV === 'production') {
        console.log('🧹 清除开发模式token，要求真实钱包连接');
        clearAuthToken();
        // 同时清理其他开发模式相关的localStorage数据
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mock_wallet_connection');
        }
        updateState({ isLoading: false });
        return;
      }
      
      if (token) {
        // 如果存在有效token，尝试验证
        console.log('🔄 发现认证token，开始验证...');
        await refreshUser();
      } else {
        // 没有token时，等待用户主动连接钱包
        console.log('🔌 无认证token，等待用户连接钱包');
        updateState({ isLoading: false });
      }
    };

    // 少量延迟等待钱包提供程序初始化
    const timer = setTimeout(initializeAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signOut,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}