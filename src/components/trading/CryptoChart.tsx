"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 TradingView 组件，仅在客户端渲染以避免 hydration 错误
const AdvancedRealTimeChart = dynamic(
  () => import('react-ts-tradingview-widgets').then(mod => mod.AdvancedRealTimeChart),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
);
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';

interface CryptoPair {
  symbol: string;
  exchange: string;
  displayName: string;
  description: string;
}

const CRYPTO_PAIRS: CryptoPair[] = [
  // 主流币种
  {
    symbol: 'BTCUSDT',
    exchange: 'BINANCE',
    displayName: 'BTC/USDT',
    description: 'Bitcoin vs Tether'
  },
  {
    symbol: 'ETHUSDT', 
    exchange: 'BINANCE',
    displayName: 'ETH/USDT',
    description: 'Ethereum vs Tether'
  },
  {
    symbol: 'BNBUSDT',
    exchange: 'BINANCE', 
    displayName: 'BNB/USDT',
    description: 'Binance Coin vs Tether'
  },
  {
    symbol: 'SOLUSDT',
    exchange: 'BINANCE', 
    displayName: 'SOL/USDT',
    description: 'Solana vs Tether'
  },
  {
    symbol: 'XRPUSDT',
    exchange: 'BINANCE',
    displayName: 'XRP/USDT', 
    description: 'Ripple vs Tether'
  },
  {
    symbol: 'ADAUSDT',
    exchange: 'BINANCE',
    displayName: 'ADA/USDT', 
    description: 'Cardano vs Tether'
  },
  {
    symbol: 'AVAXUSDT',
    exchange: 'BINANCE',
    displayName: 'AVAX/USDT',
    description: 'Avalanche vs Tether'
  },
  {
    symbol: 'DOTUSDT',
    exchange: 'BINANCE',
    displayName: 'DOT/USDT',
    description: 'Polkadot vs Tether'
  },
  // DeFi 代币
  {
    symbol: 'LINKUSDT',
    exchange: 'BINANCE',
    displayName: 'LINK/USDT', 
    description: 'Chainlink vs Tether'
  },
  {
    symbol: 'UNIUSDT',
    exchange: 'BINANCE',
    displayName: 'UNI/USDT',
    description: 'Uniswap vs Tether'
  },
  {
    symbol: 'AAVEUSDT',
    exchange: 'BINANCE',
    displayName: 'AAVE/USDT',
    description: 'Aave vs Tether'
  },
  {
    symbol: 'CRVUSDT',
    exchange: 'BINANCE',
    displayName: 'CRV/USDT',
    description: 'Curve DAO vs Tether'
  },
  // Layer 2 & 扩容
  {
    symbol: 'MATICUSDT',
    exchange: 'BINANCE',
    displayName: 'MATIC/USDT',
    description: 'Polygon vs Tether'
  },
  {
    symbol: 'OPUSDT',
    exchange: 'BINANCE',
    displayName: 'OP/USDT',
    description: 'Optimism vs Tether'
  },
  {
    symbol: 'ARBUSDT',
    exchange: 'BINANCE',
    displayName: 'ARB/USDT',
    description: 'Arbitrum vs Tether'
  },
  // Meme 币
  {
    symbol: 'DOGEUSDT',
    exchange: 'BINANCE',
    displayName: 'DOGE/USDT',
    description: 'Dogecoin vs Tether'
  },
  {
    symbol: 'SHIBUSDT',
    exchange: 'BINANCE',
    displayName: 'SHIB/USDT',
    description: 'Shiba Inu vs Tether'
  },
  {
    symbol: 'PEPEUSDT',
    exchange: 'BINANCE',
    displayName: 'PEPE/USDT',
    description: 'Pepe vs Tether'
  },
  // 新兴项目
  {
    symbol: 'APTUSDT',
    exchange: 'BINANCE',
    displayName: 'APT/USDT',
    description: 'Aptos vs Tether'
  },
  {
    symbol: 'SUIUSDT',
    exchange: 'BINANCE',
    displayName: 'SUI/USDT',
    description: 'Sui vs Tether'
  },
  {
    symbol: 'INJUSDT',
    exchange: 'BINANCE',
    displayName: 'INJ/USDT',
    description: 'Injective Protocol vs Tether'
  },
  {
    symbol: 'THETAUSDT',
    exchange: 'BINANCE',
    displayName: 'THETA/USDT',
    description: 'Theta Network vs Tether'
  },
  // AI & 科技代币
  {
    symbol: 'FETUSDT',
    exchange: 'BINANCE',
    displayName: 'FET/USDT',
    description: 'Artificial Superintelligence Alliance vs Tether'
  },
  {
    symbol: 'RENDERUSDT',
    exchange: 'BINANCE',
    displayName: 'RENDER/USDT',
    description: 'Render Network vs Tether'
  }
];

const TIMEFRAMES = [
  { value: '1', label: '1分钟' },
  { value: '5', label: '5分钟' },
  { value: '15', label: '15分钟' },
  { value: '60', label: '1小时' },
  { value: '240', label: '4小时' },
  { value: '1D', label: '1天' },
  { value: '1W', label: '1周' }
];

interface CryptoChartProps {
  className?: string;
}

export function CryptoChart({ className }: CryptoChartProps) {
  const [selectedPair, setSelectedPair] = useState<CryptoPair>(CRYPTO_PAIRS[0]);
  const [timeframe, setTimeframe] = useState('1D');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [customPairs, setCustomPairs] = useState<CryptoPair[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPairForm, setNewPairForm] = useState({
    symbol: '',
    exchange: 'BINANCE',
    displayName: '',
    description: ''
  });

  const allPairs = [...CRYPTO_PAIRS, ...customPairs];
  const fullSymbol = `${selectedPair.exchange}:${selectedPair.symbol}`;

  const handleAddCustomPair = () => {
    if (!newPairForm.symbol || !newPairForm.displayName) {
      return;
    }

    const newPair: CryptoPair = {
      symbol: newPairForm.symbol.toUpperCase(),
      exchange: newPairForm.exchange,
      displayName: newPairForm.displayName,
      description: newPairForm.description || `${newPairForm.displayName} Trading Pair`
    };

    setCustomPairs(prev => [...prev, newPair]);
    setSelectedPair(newPair);
    setNewPairForm({ symbol: '', exchange: 'BINANCE', displayName: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleRemoveCustomPair = (symbolToRemove: string) => {
    setCustomPairs(prev => prev.filter(pair => pair.symbol !== symbolToRemove));
    // 如果删除的是当前选中的币种，切换到BTC
    if (selectedPair.symbol === symbolToRemove) {
      setSelectedPair(CRYPTO_PAIRS[0]);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>加密货币图表</span>
                <Badge variant="secondary">{selectedPair.displayName}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedPair.description}
              </p>
            </div>
            
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
              <div className="flex items-center space-x-2">
                <Select value={selectedPair.symbol} onValueChange={(value) => {
                  const pair = allPairs.find(p => p.symbol === value);
                  if (pair) setSelectedPair(pair);
                }}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="选择币种" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {/* 预设币种 */}
                    {CRYPTO_PAIRS.map((pair) => (
                      <SelectItem key={pair.symbol} value={pair.symbol}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{pair.displayName}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {pair.description.split(' vs ')[0]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* 自定义币种分隔线 */}
                    {customPairs.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                          自定义币种
                        </div>
                        {customPairs.map((pair) => (
                          <SelectItem key={`custom-${pair.symbol}`} value={pair.symbol}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{pair.displayName}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">
                                  {pair.exchange}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCustomPair(pair.symbol);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Plus className="h-4 w-4" />
                      <span className="hidden md:inline">添加</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>添加自定义币种</DialogTitle>
                      <DialogDescription>
                        添加一个新的交易对到图表中。请确保交易对在所选交易所中存在。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">交易所</label>
                        <Select
                          value={newPairForm.exchange}
                          onValueChange={(value) => setNewPairForm(prev => ({ ...prev, exchange: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BINANCE">Binance</SelectItem>
                            <SelectItem value="COINBASE">Coinbase</SelectItem>
                            <SelectItem value="KRAKEN">Kraken</SelectItem>
                            <SelectItem value="BYBIT">Bybit</SelectItem>
                            <SelectItem value="OKX">OKX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">交易对符号</label>
                        <Input
                          placeholder="例如: BTCUSDT"
                          value={newPairForm.symbol}
                          onChange={(e) => setNewPairForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">显示名称</label>
                        <Input
                          placeholder="例如: BTC/USDT"
                          value={newPairForm.displayName}
                          onChange={(e) => setNewPairForm(prev => ({ ...prev, displayName: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">描述（可选）</label>
                        <Input
                          placeholder="例如: Bitcoin vs Tether"
                          value={newPairForm.description}
                          onChange={(e) => setNewPairForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        取消
                      </Button>
                      <Button
                        onClick={handleAddCustomPair}
                        disabled={!newPairForm.symbol || !newPairForm.displayName}
                      >
                        添加
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="时间框架" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="md:w-auto"
              >
                {theme === 'light' ? '深色' : '浅色'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="w-full" style={{ height: '600px' }}>
            <AdvancedRealTimeChart
              symbol={fullSymbol}
              theme={theme}
              interval={timeframe}
              locale="zh_CN"
              timezone="Asia/Shanghai"
              style="1"
              hide_side_toolbar={false}
              allow_symbol_change={true}
              save_image={false}
              calendar={false}
              hide_volume={false}
              support_host="https://www.tradingview.com"
              width="100%"
              height="600"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}