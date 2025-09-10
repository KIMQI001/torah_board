'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NetworkTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test: string, success: boolean, details: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runNetworkTests = async () => {
    setTesting(true);
    setResults([]);

    // 获取当前环境信息
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    addResult('环境检测', true, {
      host,
      protocol,
      userAgent: navigator.userAgent.substring(0, 100)
    });

    // 测试1: 检查前端访问方式
    addResult('访问方式检测', true, {
      isLocalhost: host === 'localhost' || host === '127.0.0.1',
      isIP: host.match(/^\d+\.\d+\.\d+\.\d+$/),
      currentHost: host
    });

    // 测试2: 测试后端健康检查 (localhost)
    try {
      const response = await fetch('http://localhost:3002/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      addResult('Localhost后端连接', response.ok, {
        status: response.status,
        data: data
      });
    } catch (error: any) {
      addResult('Localhost后端连接', false, {
        error: error.message
      });
    }

    // 测试3: 测试后端健康检查 (IP地址)
    try {
      const response = await fetch(`http://${host}:3002/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      addResult('IP后端连接', response.ok, {
        status: response.status,
        data: data,
        url: `http://${host}:3002/health`
      });
    } catch (error: any) {
      addResult('IP后端连接', false, {
        error: error.message,
        url: `http://${host}:3002/health`
      });
    }

    // 测试4: 测试API动态URL生成
    try {
      const { getApiBaseUrl } = await import('@/lib/api');
      
      // 添加详细的调试信息
      const windowInfo = {
        hostname: window.location.hostname,
        href: window.location.href,
        nodeEnv: process.env.NODE_ENV,
        publicApiUrl: process.env.NEXT_PUBLIC_API_URL,
        windowExists: typeof window !== 'undefined'
      };
      
      const apiUrl = getApiBaseUrl();
      addResult('API URL生成', true, {
        generatedUrl: apiUrl,
        debug: windowInfo
      });

      // 测试生成的API URL
      const response = await fetch(`${apiUrl.replace('/api/v1', '')}/health`);
      const data = await response.json();
      addResult('动态API连接', response.ok, {
        status: response.status,
        data: data,
        url: apiUrl
      });
    } catch (error: any) {
      addResult('动态API连接', false, {
        error: error.message
      });
    }

    // 测试5: 测试CORS
    try {
      const response = await fetch(`http://${host}:3002/api/v1/dashboard/stats`);
      addResult('CORS测试', response.ok, {
        status: response.status,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
        }
      });
    } catch (error: any) {
      addResult('CORS测试', false, {
        error: error.message
      });
    }

    setTesting(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">网络连接诊断工具</h1>
      
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            onClick={runNetworkTests} 
            disabled={testing}
            className="w-full"
          >
            {testing ? '测试中...' : '开始网络连接测试'}
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          此工具会测试前后端连接状况，帮助诊断网络访问问题
        </p>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">测试结果</h2>
          {results.map((result, index) => (
            <Card key={index} className={`p-4 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{result.test}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '✅ 成功' : '❌ 失败'}
                  </span>
                  <span className="text-sm text-gray-500">{result.timestamp}</span>
                </div>
              </div>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">故障排除建议</h3>
        <div className="space-y-2 text-sm">
          <p><strong>如果IP后端连接失败：</strong></p>
          <ul className="list-disc ml-6 space-y-1">
            <li>检查macOS防火墙是否阻止了3002端口</li>
            <li>确认后端服务正在运行 (port 3002)</li>
            <li>检查路由器防火墙设置</li>
            <li>尝试其他设备能否ping通 172.18.0.160</li>
          </ul>
          <p><strong>如果CORS测试失败：</strong></p>
          <ul className="list-disc ml-6 space-y-1">
            <li>检查后端CORS配置是否包含当前访问地址</li>
            <li>确认后端允许跨域请求</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}