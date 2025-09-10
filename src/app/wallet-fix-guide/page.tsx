'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Shield, Globe, Terminal } from 'lucide-react';

export default function WalletFixGuidePage() {
  const [currentSecureContext, setCurrentSecureContext] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSecureContext(window.isSecureContext);
    }
  }, []);

  const testPhantomConnection = async () => {
    if (!(window as any).solana) {
      alert('Phantom钱包未安装');
      return;
    }

    try {
      const result = await (window as any).solana.connect();
      alert('连接成功! 公钥: ' + result.publicKey.toString().substring(0, 20) + '...');
    } catch (error: any) {
      alert('连接失败: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔗 钱包连接解决方案</h1>

      {/* 问题说明 */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          问题诊断
        </h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-800">安全上下文要求</span>
          </div>
          <p className="text-sm text-yellow-700">
            Phantom钱包出于安全考虑，只在<strong>安全上下文</strong>中弹出连接窗口
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">安全环境</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• localhost (HTTP也可以)</li>
              <li>• HTTPS协议的任何地址</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium">非安全环境</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• IP地址 + HTTP协议</li>
              <li>• 普通域名 + HTTP协议</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">当前环境状态</div>
              <div className="text-sm text-gray-600">{typeof window !== 'undefined' ? window.location.href : '加载中...'}</div>
            </div>
            <div className="flex items-center gap-2">
              {currentSecureContext === null ? (
                <div className="text-gray-500">检测中...</div>
              ) : currentSecureContext ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  安全
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  需要HTTPS
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 解决方案 */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          HTTPS解决方案
        </h2>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-800 mb-2">🚀 一键启动HTTPS服务</h3>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm mb-2">
            ./scripts/start-https.sh
          </div>
          <p className="text-sm text-green-700">
            自动启动前端和后端的HTTPS服务，解决钱包连接问题
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">手动启动后端:</h4>
            <div className="bg-black text-green-400 p-2 rounded font-mono text-xs">
              cd backend && npm run dev:https
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">手动启动前端:</h4>
            <div className="bg-black text-green-400 p-2 rounded font-mono text-xs">
              npm run dev:https
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">访问地址:</h4>
          <div className="space-y-1">
            <div className="font-mono text-sm">✅ https://localhost:3000</div>
            <div className="font-mono text-sm">✅ https://172.18.0.160:3000</div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            首次访问会有证书警告，选择"高级" → "继续访问"
          </p>
        </div>
      </Card>

      {/* 测试区域 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">测试连接</h2>
        
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={testPhantomConnection} size="lg">
            🔗 测试Phantom连接
          </Button>
          
          {!currentSecureContext && (
            <div className="text-orange-600 text-sm">
              当前环境需要HTTPS才能连接钱包
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>• 连接成功 = 环境配置正确 ✅</p>
          <p>• 连接失败 = 需要使用HTTPS访问 ⚠️</p>
        </div>
      </Card>
    </div>
  );
}

declare global {
  interface Window {
    solana: any;
  }
}