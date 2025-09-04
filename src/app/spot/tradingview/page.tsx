"use client"

import { CryptoChart } from '@/components/trading/CryptoChart';
import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function TradingViewPage() {
  const { isFullscreen } = useLayout();

  const openTradingView = () => {
    window.open('https://www.tradingview.com/chart/faeBJDEP/', '_blank');
  };

  const openOKXRankings = () => {
    window.open('https://www.okx.com/zh-hans/markets/rankings/spot', '_blank');
  };

  const openBinanceFutures = () => {
    window.open('https://www.binance.com/zh-CN/futures/markets/overview-um', '_blank');
  };

  if (isFullscreen) {
    // 全屏模式：只显示图表，无标题和边距
    return (
      <div className="h-screen w-full">
        <CryptoChart className="h-full" />
      </div>
    );
  }

  // 正常模式：显示完整布局
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">TradingView 图表</h1>
          <p className="text-muted-foreground">
            专业的加密货币图表分析工具，支持多币种和多时间框架
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={openTradingView}>
            <ExternalLink className="h-4 w-4 mr-2" />
            TradingView
          </Button>
          <Button variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={openOKXRankings}>
            <ExternalLink className="h-4 w-4 mr-2" />
            OKX
          </Button>
          <Button variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={openBinanceFutures}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Binance
          </Button>
        </div>
      </div>
      
      <CryptoChart />
    </div>
  )
}