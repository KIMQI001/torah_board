'use client';

/**
 * 钱包连接状态持久化工具
 */

const STORAGE_KEYS = {
  WALLET_CONNECTED: 'wallet_connected_state',
  WALLET_ADDRESS: 'wallet_address',
  AUTH_TOKEN: 'auth_token',
  LAST_CONNECTED_WALLET: 'last_connected_wallet'
};

export interface WalletPersistenceData {
  isConnected: boolean;
  walletAddress?: string;
  walletName?: string;
  connectedAt: number;
}

/**
 * 保存钱包连接状态
 */
export function saveWalletState(data: WalletPersistenceData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, JSON.stringify({
      ...data,
      connectedAt: Date.now()
    }));
    
    if (data.walletAddress) {
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, data.walletAddress);
    }
    
    if (data.walletName) {
      localStorage.setItem(STORAGE_KEYS.LAST_CONNECTED_WALLET, data.walletName);
    }
    
    console.log('💾 钱包状态已保存:', data);
  } catch (error) {
    console.error('保存钱包状态失败:', error);
  }
}

/**
 * 获取保存的钱包连接状态
 */
export function getWalletState(): WalletPersistenceData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as WalletPersistenceData;
    
    // 检查状态是否过期（24小时）
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    if (now - data.connectedAt > maxAge) {
      console.log('🕒 钱包状态已过期，清除存储');
      clearWalletState();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('读取钱包状态失败:', error);
    return null;
  }
}

/**
 * 清除钱包连接状态
 */
export function clearWalletState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    // 保留最后连接的钱包名称，方便下次连接
    // localStorage.removeItem(STORAGE_KEYS.LAST_CONNECTED_WALLET);
    
    console.log('🗑️ 钱包状态已清除');
  } catch (error) {
    console.error('清除钱包状态失败:', error);
  }
}

/**
 * 获取最后连接的钱包名称
 */
export function getLastConnectedWallet(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_CONNECTED_WALLET);
  } catch (error) {
    console.error('读取最后连接的钱包失败:', error);
    return null;
  }
}

/**
 * 检查是否应该自动连接
 */
export function shouldAutoConnect(): boolean {
  const walletState = getWalletState();
  const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  
  return !!(walletState && walletState.isConnected && authToken);
}