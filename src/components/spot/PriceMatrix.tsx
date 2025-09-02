'use client';

import React, { useState } from 'react';
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
import { useSpotData, useRealTimePrice, MarketTicker } from '@/hooks/use-spot-data';
import { useLanguage } from '@/hooks/use-language';

interface PriceMatrixProps {
  symbols?: string[];
  exchanges?: string[];
  autoRefresh?: boolean;
  onSymbolClick?: (symbol: string, ticker: MarketTicker) => void;
}

export const PriceMatrix: React.FC<PriceMatrixProps> = ({
  symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT'],
  exchanges = ['binance', 'okx', 'gate'],
  autoRefresh = true,
  onSymbolClick
}) => {
  const { t } = useLanguage();
  const [selectedExchange, setSelectedExchange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOnlyGainers, setShowOnlyGainers] = useState(false);
  
  const { marketData, loading, error, refetch, lastUpdate } = useSpotData();
  const { 
    prices: realtimePrices, 
    loading: pricesLoading,
    refresh: refreshPrices 
  } = useRealTimePrice(symbols, autoRefresh ? 10000 : 0);

  // 合并静态数据和实时数据
  const combinedData = React.useMemo(() => {
    const dataMap = new Map<string, MarketTicker>();
    
    // 先添加静态数据
    marketData.forEach(ticker => {
      dataMap.set(`${ticker.symbol}_${ticker.exchange}`, ticker);
    });
    
    // 用实时数据覆盖
    realtimePrices.forEach(ticker => {
      dataMap.set(`${ticker.symbol}_${ticker.exchange}`, ticker);
    });
    
    return Array.from(dataMap.values());
  }, [marketData, realtimePrices]);

  // 过滤和排序数据
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = combinedData;

    // 按交易所过滤
    if (selectedExchange !== 'all') {
      filtered = filtered.filter(ticker => ticker.exchange === selectedExchange);
    }

    // 按交易对过滤
    if (symbols.length > 0) {
      filtered = filtered.filter(ticker => symbols.includes(ticker.symbol));
    }

    // 只显示上涨的
    if (showOnlyGainers) {
      filtered = filtered.filter(ticker => ticker.priceChangePercent > 0);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'symbol':
          return sortOrder === 'asc' 
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.priceChangePercent;
          bValue = b.priceChangePercent;
          break;
        case 'volume':
          aValue = a.quoteVolume;
          bValue = b.quoteVolume;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [combinedData, selectedExchange, symbols, showOnlyGainers, sortBy, sortOrder]);

  const formatPrice = (price: number | null | undefined, symbol: string) => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1000) {
      return `$${price.toFixed(0)}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(8)}`;
    }
  };

  const formatVolume = (volume: number | null | undefined) => {
    if (!volume || isNaN(volume)) return '$0';
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(1)}K`;
    } else {
      return `$${volume.toFixed(0)}`;
    }
  };

  const getChangeColor = (change: number | null | undefined) => {
    if (!change || isNaN(change)) return 'text-gray-600 bg-gray-50';
    if (change > 0) return 'text-green-600 bg-green-50';
    if (change < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'binance': return 'bg-yellow-100 text-yellow-800';
      case 'okx': return 'bg-blue-100 text-blue-800';
      case 'gate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleRefresh = () => {
    refetch();
    refreshPrices();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading market data: {error}</p>
            <Button onClick={handleRefresh} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>实时价格矩阵</span>
              {(loading || pricesLoading) && (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              最后更新: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            {/* 交易所筛选 */}
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">所有交易所</option>
              {exchanges.map(exchange => (
                <option key={exchange} value={exchange}>
                  {exchange.toUpperCase()}
                </option>
              ))}
            </select>

            {/* 筛选按钮 */}
            <Button
              variant={showOnlyGainers ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyGainers(!showOnlyGainers)}
            >
              <Filter className="h-4 w-4 mr-1" />
              仅上涨
            </Button>

            {/* 刷新按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || pricesLoading}
            >
              <RefreshCw className={`h-4 w-4 ${loading || pricesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无市场数据
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('symbol')}
                      className="p-0 h-auto font-medium"
                    >
                      交易对
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-right py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('price')}
                      className="p-0 h-auto font-medium"
                    >
                      价格
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-right py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('change')}
                      className="p-0 h-auto font-medium"
                    >
                      24h涨跌
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-right py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('volume')}
                      className="p-0 h-auto font-medium"
                    >
                      24h成交量
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </Button>
                  </th>
                  <th className="text-center py-2">交易所</th>
                  <th className="text-center py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((ticker, index) => (
                  <tr 
                    key={`${ticker.symbol}_${ticker.exchange}`}
                    className={`border-b hover:bg-gray-50 ${
                      ticker.priceChangePercent > 5 ? 'bg-green-50' : 
                      ticker.priceChangePercent < -5 ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium">{ticker.baseAsset}</div>
                          <div className="text-xs text-muted-foreground">
                            /{ticker.quoteAsset}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 font-mono">
                      <div className="font-medium">
                        {formatPrice(ticker.price, ticker.symbol)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(ticker.priceChange, ticker.symbol)} 
                      </div>
                    </td>
                    <td className="text-right py-3">
                      <Badge className={`font-mono ${getChangeColor(ticker.priceChangePercent)}`}>
                        {ticker.priceChangePercent > 0 && '+'}
                        {ticker.priceChangePercent?.toFixed(2) || '0.00'}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 font-mono text-sm">
                      {formatVolume(ticker.quoteVolume)}
                    </td>
                    <td className="text-center py-3">
                      <Badge className={getExchangeColor(ticker.exchange)}>
                        {ticker.exchange.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-center py-3">
                      <div className="flex justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSymbolClick?.(ticker.symbol, ticker)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: 打开价格预警对话框
                            console.log('Set alert for:', ticker.symbol);
                          }}
                        >
                          <Bell className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};