"use client"

import { CryptoMarketScreener } from '@/components/trading/CryptoMarketScreener';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function CoinGeckoPage() {
  const openCoinMarketCap = () => {
    window.open('https://coinmarketcap.com/', '_blank');
  };

  const openCoinGecko = () => {
    window.open('https://www.coingecko.com/zh', '_blank'); 
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">加密货币市场</h1>
          <p className="text-muted-foreground">
            实时加密货币市场数据、价格排名和市值分析
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={openCoinGecko}>
            <ExternalLink className="h-4 w-4 mr-2" />
            CoinGecko
          </Button>
          <Button variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors" onClick={openCoinMarketCap}>
            <ExternalLink className="h-4 w-4 mr-2" />
            CoinMarketCap
          </Button>
        </div>
      </div>

      <CryptoMarketScreener />
    </div>
  )
}