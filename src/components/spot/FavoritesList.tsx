'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Star, 
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
  Search,
  Heart
} from 'lucide-react';
import { useFavorites, FavoriteSymbol, useSpotData } from '@/hooks/use-spot-data';
import { daoApi } from '@/lib/api';

interface FavoritesListProps {
  onSymbolClick?: (symbol: string) => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  onSymbolClick
}) => {
  const { favorites, loading, error, addFavorite, removeFavorite, refetch } = useFavorites();
  const { marketData, refetch: refetchMarketData } = useSpotData();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState<any[]>([]);
  const [addingFavorite, setAddingFavorite] = useState(false);

  // 格式化价格
  const formatPrice = (price: number | null | undefined) => {
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

  // 格式化百分比
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // 获取变化颜色
  const getChangeColor = (change: number | null | undefined) => {
    if (!change || isNaN(change)) return 'text-gray-600';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // 获取变化图标
  const getChangeIcon = (change: number | null | undefined) => {
    if (!change || isNaN(change)) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  // 处理收藏符号点击
  const handleSymbolClick = useCallback((symbol: string) => {
    onSymbolClick?.(symbol);
  }, [onSymbolClick]);

  // 移除收藏
  const handleRemoveFavorite = useCallback(async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFavorite(symbol);
  }, [removeFavorite]);

  // 处理添加收藏对话框
  const handleOpenAddDialog = useCallback(async () => {
    setShowAddDialog(true);
    // 获取本地数据库的币种信息用于搜索
    try {
      const symbols = await daoApi.getAllExchangeSymbols(100);
      setFilteredSymbols(symbols.slice(0, 20));
    } catch (error) {
      console.error('Failed to fetch exchange symbols:', error);
      // 如果本地数据库没有数据，回退到实时API
      refetchMarketData({ limit: 100 });
    }
  }, [refetchMarketData]);

  // 搜索过滤
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        // 如果没有搜索词，显示默认列表
        try {
          const symbols = await daoApi.getAllExchangeSymbols(20);
          setFilteredSymbols(symbols);
        } catch (error) {
          setFilteredSymbols(marketData.slice(0, 20));
        }
        return;
      }

      // 有搜索词时，优先从本地数据库搜索
      try {
        const symbols = await daoApi.searchExchangeSymbols(searchTerm, 10);
        setFilteredSymbols(symbols);
      } catch (error) {
        // 如果本地数据库搜索失败，回退到内存数据搜索
        const filtered = marketData.filter(ticker => 
          ticker.baseAsset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticker.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
        setFilteredSymbols(filtered);
      }
    };

    const debounceTimeout = setTimeout(performSearch, 300); // 300ms 防抖
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, marketData]);

  // 添加收藏
  const handleAddFavorite = useCallback(async (ticker: any) => {
    if (addingFavorite) return;
    
    setAddingFavorite(true);
    try {
      // 兼容本地数据库格式和市场数据格式
      const symbol = ticker.symbol;
      const baseAsset = ticker.baseAsset;
      const quoteAsset = ticker.quoteAsset;
      
      const success = await addFavorite(symbol, baseAsset, quoteAsset);
      if (success) {
        setShowAddDialog(false);
        setSearchTerm('');
      }
    } finally {
      setAddingFavorite(false);
    }
  }, [addFavorite, addingFavorite]);

  // 检查是否已收藏
  const isAlreadyFavorite = useCallback((symbol: string) => {
    return favorites.some(fav => fav.symbol === symbol);
  }, [favorites]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-red-500" />
            <span>收藏列表</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={handleOpenAddDialog}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 text-sm mb-2">加载失败</div>
            <Button variant="outline" size="sm" onClick={refetch}>
              重试
            </Button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-muted-foreground mb-2">暂无收藏币种</p>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              添加收藏
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.slice(0, 5).map((favorite) => (
              <div
                key={favorite.id}
                className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 rounded group"
                onClick={() => handleSymbolClick(favorite.symbol)}
              >
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="font-medium flex items-center space-x-1">
                      <span>{favorite.baseAsset}</span>
                      {getChangeIcon(favorite.marketData?.priceChangePercent)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(favorite.marketData?.price)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getChangeColor(favorite.marketData?.priceChangePercent)}`}
                  >
                    {formatPercentage(favorite.marketData?.priceChangePercent)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleRemoveFavorite(favorite.symbol, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {favorites.length > 5 && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  查看全部 ({favorites.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* 添加收藏对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加收藏币种</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索币种 (如: BTC, ETH, SOL...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {filteredSymbols.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? '未找到匹配的币种' : '正在加载...'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSymbols.map((ticker) => {
                    const alreadyFavorite = isAlreadyFavorite(ticker.symbol);
                    return (
                      <div
                        key={`${ticker.symbol}-${ticker.exchange}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{ticker.baseAsset}</span>
                            <span className="text-xs text-muted-foreground">/{ticker.quoteAsset}</span>
                            <Badge variant="outline" className="text-xs">
                              {ticker.exchange}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {ticker.price ? `$${ticker.price.toFixed(4)}` : 
                             ticker.lastPrice ? `$${ticker.lastPrice.toFixed(4)}` : 
                             '搜索实时价格...'}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={alreadyFavorite ? "outline" : "default"}
                          disabled={alreadyFavorite || addingFavorite}
                          onClick={() => handleAddFavorite(ticker)}
                        >
                          {alreadyFavorite ? (
                            <><Heart className="h-3 w-3 mr-1 fill-current" />已收藏</>
                          ) : (
                            <><Plus className="h-3 w-3 mr-1" />添加</>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};