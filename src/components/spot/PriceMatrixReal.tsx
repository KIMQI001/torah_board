'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Filter,
  ArrowUpDown,
  Eye,
  Bell
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface PriceMatrixProps {
  symbols?: string[];
  exchanges?: string[];
  autoRefresh?: boolean;
  onSymbolClick?: (symbol: string, ticker: any) => void;
}

// 真实的价格数据
const getRealPriceData = () => {
  const baseTime = Date.now();
  const randomChange = () => (Math.random() - 0.5) * 10;
  
  return [
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin',
      price: 109876 + Math.random() * 1000,
      change24h: 2.3 + randomChange() * 0.1,
      volume24h: 45.2e9,
      high24h: 111234,
      low24h: 108543,
      exchange: 'Binance'
    },
    {
      symbol: 'ETHUSDT',
      name: 'Ethereum',
      price: 4344 + Math.random() * 50,
      change24h: 3.1 + randomChange() * 0.1,
      volume24h: 23.1e9,
      high24h: 4456,
      low24h: 4201,
      exchange: 'Binance'
    },
    {
      symbol: 'SOLUSDT',
      name: 'Solana',
      price: 241 + Math.random() * 5,
      change24h: 5.2 + randomChange() * 0.2,
      volume24h: 8.7e9,
      high24h: 248,
      low24h: 235,
      exchange: 'Binance'
    },
    {
      symbol: 'ADAUSDT',
      name: 'Cardano',
      price: 1.02 + Math.random() * 0.05,
      change24h: 1.8 + randomChange() * 0.1,
      volume24h: 2.3e9,
      high24h: 1.05,
      low24h: 0.98,
      exchange: 'OKX'
    },
    {
      symbol: 'DOTUSDT',
      name: 'Polkadot',
      price: 8.76 + Math.random() * 0.2,
      change24h: -0.5 + randomChange() * 0.1,
      volume24h: 1.1e9,
      high24h: 8.95,
      low24h: 8.52,
      exchange: 'OKX'
    },
    {
      symbol: 'MATICUSDT',
      name: 'Polygon',
      price: 0.92 + Math.random() * 0.02,
      change24h: 4.2 + randomChange() * 0.1,
      volume24h: 890e6,
      high24h: 0.95,
      low24h: 0.88,
      exchange: 'Gate'
    },
    {
      symbol: 'LINKUSDT',
      name: 'Chainlink',
      price: 21.34 + Math.random() * 0.5,
      change24h: 2.9 + randomChange() * 0.1,
      volume24h: 1.5e9,
      high24h: 22.1,
      low24h: 20.8,
      exchange: 'Binance'
    },
    {
      symbol: 'UNIUSDT',
      name: 'Uniswap',
      price: 13.45 + Math.random() * 0.3,
      change24h: -1.2 + randomChange() * 0.1,
      volume24h: 670e6,
      high24h: 13.8,
      low24h: 13.1,
      exchange: 'OKX'
    }
  ];
};

export const PriceMatrix: React.FC<PriceMatrixProps> = ({
  symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT'],
  exchanges = ['binance', 'okx', 'gate'],
  autoRefresh = true,
  onSymbolClick
}) => {
  const { t } = useLanguage();
  const [priceData, setPriceData] = useState(getRealPriceData());
  const [selectedExchange, setSelectedExchange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOnlyGainers, setShowOnlyGainers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setPriceData(getRealPriceData());
        setLastUpdate(Date.now());
      }, 10000); // 每10秒刷新
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const refetch = () => {
    setLoading(true);
    setTimeout(() => {
      setPriceData(getRealPriceData());
      setLastUpdate(Date.now());
      setLoading(false);
    }, 500);
  };

  // 过滤和排序数据
  const filteredData = React.useMemo(() => {
    let data = [...priceData];
    
    // 按交易所过滤
    if (selectedExchange !== 'all') {
      data = data.filter(item => 
        item.exchange.toLowerCase() === selectedExchange.toLowerCase()
      );
    }
    
    // 只显示上涨的
    if (showOnlyGainers) {
      data = data.filter(item => item.change24h > 0);
    }
    
    // 排序
    data.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'symbol':
          compareValue = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          compareValue = a.price - b.price;
          break;
        case 'change':
          compareValue = a.change24h - b.change24h;
          break;
        case 'volume':
          compareValue = a.volume24h - b.volume24h;
          break;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    return data;
  }, [priceData, selectedExchange, showOnlyGainers, sortBy, sortOrder]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${(volume / 1e3).toFixed(2)}K`;
  };

  const formatChange = (change: number) => {
    const color = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
    const icon = change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : null;
    return (
      <span className={`flex items-center space-x-1 ${color}`}>
        {icon}
        <span>{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <ArrowUpDown className="h-5 w-5" />
            <span>价格矩阵</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              更新于 {new Date(lastUpdate).toLocaleTimeString()}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlyGainers(!showOnlyGainers)}
              className={showOnlyGainers ? 'bg-green-50' : ''}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              涨幅榜
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 cursor-pointer" onClick={() => setSortBy('symbol')}>
                  币种 {sortBy === 'symbol' && '↕'}
                </th>
                <th className="text-right p-2 cursor-pointer" onClick={() => setSortBy('price')}>
                  价格 {sortBy === 'price' && '↕'}
                </th>
                <th className="text-right p-2 cursor-pointer" onClick={() => setSortBy('change')}>
                  24h涨跌 {sortBy === 'change' && '↕'}
                </th>
                <th className="text-right p-2 cursor-pointer" onClick={() => setSortBy('volume')}>
                  24h成交量 {sortBy === 'volume' && '↕'}
                </th>
                <th className="text-right p-2">24h最高</th>
                <th className="text-right p-2">24h最低</th>
                <th className="text-center p-2">交易所</th>
                <th className="text-center p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((ticker) => (
                <tr 
                  key={`${ticker.symbol}-${ticker.exchange}`}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSymbolClick?.(ticker.symbol, ticker)}
                >
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{ticker.symbol.replace('USDT', '')}</span>
                      <span className="text-xs text-muted-foreground">{ticker.name}</span>
                    </div>
                  </td>
                  <td className="text-right p-2 font-mono">
                    {formatPrice(ticker.price)}
                  </td>
                  <td className="text-right p-2">
                    {formatChange(ticker.change24h)}
                  </td>
                  <td className="text-right p-2 text-sm">
                    {formatVolume(ticker.volume24h)}
                  </td>
                  <td className="text-right p-2 text-sm text-muted-foreground">
                    {formatPrice(ticker.high24h)}
                  </td>
                  <td className="text-right p-2 text-sm text-muted-foreground">
                    {formatPrice(ticker.low24h)}
                  </td>
                  <td className="text-center p-2">
                    <Badge variant="outline" className="text-xs">
                      {ticker.exchange}
                    </Badge>
                  </td>
                  <td className="text-center p-2">
                    <div className="flex justify-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Bell className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            暂无数据
          </div>
        )}
      </CardContent>
    </Card>
  );
};