"use client"

import { useState } from 'react';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CoinGlassPage() {
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      )}
      
      {iframeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center space-y-4 p-6">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">无法嵌入 CoinGlass</h1>
            <p className="text-muted-foreground max-w-md">
              CoinGlass 阻止了内嵌显示。这是网站的安全策略。
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={openInNewTab} variant="default">
                <ExternalLink className="h-4 w-4 mr-2" />
                新窗口打开
              </Button>
              <Button onClick={refreshIframe} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试内嵌
              </Button>
            </div>
          </div>
        </div>
      )}

      <iframe 
        id="coinglass-iframe"
        src="https://www.coinglass.com/zh"
        className="w-full h-full border-0"
        title="CoinGlass"
        frameBorder="0"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ display: iframeError ? 'none' : 'block' }}
      />
    </div>
  )
}