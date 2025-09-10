"use client"

import { useState } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CoinGlassChartsPage() {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
  };

  const openInNewTab = () => {
    window.open('https://www.coinglass.com/zh', '_blank');
  };

  const refreshIframe = () => {
    setIframeError(false);
    setIsLoading(true);
    // 强制刷新 iframe
    const iframe = document.getElementById('coinglass-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="h-screen w-full relative">
      {/* 页面标题栏 */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">CoinGlass 图表</h1>
            <span className="text-sm text-muted-foreground">• 综合数据分析</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshIframe} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新
            </Button>
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              新窗口
            </Button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">正在加载CoinGlass数据...</p>
          </div>
        </div>
      )}
      
      {iframeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center space-y-4 p-6">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">无法嵌入 CoinGlass</h2>
            <p className="text-muted-foreground max-w-md">
              CoinGlass 网站阻止了内嵌显示。这是网站的安全策略。
            </p>
            <div className="bg-muted/30 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium mb-2">建议操作:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• 点击"新窗口打开"在新标签页查看</li>
                <li>• 查看其他图表工具</li>
                <li>• 尝试刷新重新加载</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={openInNewTab} variant="default">
                <ExternalLink className="h-4 w-4 mr-2" />
                新窗口打开
              </Button>
              <Button onClick={refreshIframe} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试加载
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="h-[calc(100vh-4rem)] w-full">
        <iframe 
          id="coinglass-iframe"
          src="https://www.coinglass.com/zh"
          className="w-full h-full border-0 rounded-lg"
          title="CoinGlass 数据分析"
          frameBorder="0"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ display: iframeError ? 'none' : 'block' }}
        />
      </div>
    </div>
  )
}