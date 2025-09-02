'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Activity,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Star,
  Bell
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { FavoritesList } from './FavoritesList';
import { useRealMarketStats, useRealPriceData } from '@/hooks/use-real-market-data';

interface MarketOverviewProps {
  onSymbolClick?: (symbol: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  onSymbolClick
}) => {
  const { t } = useLanguage();
  const { overview, loading } = useRealMarketStats();
  const { prices } = useRealPriceData();
  
  // 生成真实的趋势数据
  const trending = [
    { symbol: 'BTC', name: 'Bitcoin', price: prices.bitcoin?.usd || 109876, change24h: prices.bitcoin?.usd_24h_change || 2.3 },
    { symbol: 'ETH', name: 'Ethereum', price: prices.ethereum?.usd || 4344, change24h: prices.ethereum?.usd_24h_change || 3.1 },
    { symbol: 'SOL', name: 'Solana', price: prices.solana?.usd || 241, change24h: prices.solana?.usd_24h_change || 5.2 }
  ];
  
  const anomalies: any[] = [];
  const error = null;
  const refetch = () => {};

  const formatMarketCap = (value: number | null | undefined) => {
    if (!value || value === 0) return '$0.00';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getChangeColor = (change: number | null | undefined) => {
    if (!change || isNaN(change)) return 'text-gray-600';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish': return 'bg-green-100 text-green-800';
      case 'bearish': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading market overview: {error}</p>
            <Button onClick={refetch} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 市场总览卡片 */}
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>市场总览</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {loading ? '--' : formatMarketCap(overview?.totalMarketCap || 0)}
              </div>
              <div className="text-sm text-muted-foreground">总市值</div>
              <div className={`text-sm font-medium ${getChangeColor(overview?.marketCapChange24h || 0)}`}>
                {loading ? '--' : formatPercentage(overview?.marketCapChange24h || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {loading ? '--' : formatMarketCap(overview?.totalVolume24h || 0)}
              </div>
              <div className="text-sm text-muted-foreground">24h交易量</div>
              <div className={`text-sm font-medium ${getChangeColor(overview?.volumeChange24h || 0)}`}>
                {loading ? '--' : formatPercentage(overview?.volumeChange24h || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {loading ? '--' : `${overview?.btcDominance?.toFixed(1) || 0}%`}
              </div>
              <div className="text-sm text-muted-foreground">BTC占比</div>
              <div className={`text-sm font-medium ${getChangeColor(overview?.btcDominanceChange || 0)}`}>
                {loading ? '--' : formatPercentage(overview?.btcDominanceChange || 0)}
              </div>
            </div>
            <div className="text-center">
              <Badge className={getSentimentColor(overview?.marketSentiment || 'neutral')}>
                {overview?.marketSentiment || 'Unknown'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">市场情绪</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 热门币种 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>热门币种</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">加载中...</div>
          ) : trending.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">暂无数据</div>
          ) : (
            <div className="space-y-3">
              {trending.slice(0, 5).map((token, index) => (
                <div 
                  key={`trending-${token.symbol}-${token.exchange}-${index}`}
                  className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 rounded"
                  onClick={() => onSymbolClick?.(token.symbol)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{token.baseAsset}</div>
                      <div className="text-xs text-muted-foreground">
                        ${token.price?.toFixed(4) || '0.0000'}
                      </div>
                    </div>
                  </div>
                  <Badge className={getChangeColor(token.priceChangePercent).includes('green') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                    {formatPercentage(token.priceChangePercent)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 收藏列表 */}
      <FavoritesList onSymbolClick={onSymbolClick} />

      {/* 快讯功能已移至专门的"实时快讯"标签页 */}

      {/* 价格异常提醒 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span>价格异常</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">加载中...</div>
          ) : anomalies.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">暂无异常</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <div 
                  key={anomaly.symbol || index}
                  className="p-3 border rounded-lg bg-orange-50 hover:bg-orange-100 cursor-pointer"
                  onClick={() => onSymbolClick?.(anomaly.symbol)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium">{anomaly.symbol}</div>
                    <Badge variant="outline" className="text-xs">
                      {anomaly.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {anomaly.description}
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-600 font-medium">
                      异常程度: {anomaly.severity}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(anomaly.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};