'use client';

/**
 * 钱包连接状态持久化工具
 */

// 生成设备指纹以隔离不同用户的数据
function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  
  // 使用多个浏览器特征创建指纹
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform
  ].join('|');
  
  // 创建一个简单的hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

const DEVICE_ID = getDeviceFingerprint();

const STORAGE_KEYS = {
  WALLET_CONNECTED: `wallet_connected_state_${DEVICE_ID}`,
  WALLET_ADDRESS: `wallet_address_${DEVICE_ID}`,
  AUTH_TOKEN: `auth_token_${DEVICE_ID}`,
  LAST_CONNECTED_WALLET: `last_connected_wallet_${DEVICE_ID}`
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

/**
 * 获取当前设备指纹（用于调试）
 */
export function getCurrentDeviceId(): string {
  return DEVICE_ID;
}

/**
 * 清理所有设备的钱包数据（管理员功能）
 */
export function clearAllWalletData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    const walletKeys = keys.filter(key => 
      key.startsWith('wallet_') || 
      key.startsWith('auth_token') || // 包括旧的auth_token
      key.includes('mock_wallet_connection') ||
      key.includes('last_connected_wallet')
    );
    
    walletKeys.forEach(key => localStorage.removeItem(key));
    
    // 特别清理一些已知的钱包相关key
    const specificKeys = [
      'auth_token', 
      'mock_wallet_connection',
      'last_connected_wallet',
      'wallet_connected_state',
      'wallet_address'
    ];
    
    specificKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('🗑️ 已清理所有设备的钱包数据，清理了', walletKeys.length + specificKeys.length, '个项目');
    console.log('🔍 当前设备ID:', DEVICE_ID);
    console.log('🧹 清理的key包括:', [...walletKeys, ...specificKeys]);
  } catch (error) {
    console.error('清理所有钱包数据失败:', error);
  }
}