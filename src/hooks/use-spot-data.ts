import { useState, useEffect, useCallback, useRef } from 'react';
import { daoApi } from '@/lib/api';

export interface MarketTicker {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
  high: number;
  low: number;
  openPrice: number;
  closePrice: number;
  exchange: string;
  timestamp: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
  exchange: string;
  message?: string;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeAnnouncement {
  id: string;
  exchange: string;
  title: string;
  content: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  publishTime: number;
  tags: string[];
  url: string;
}

export const useSpotData = () => {
  const [marketData, setMarketData] = useState<MarketTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchMarketData = useCallback(async (params?: {
    symbols?: string[];
    exchange?: string;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await daoApi.getMarketData(params);
      setMarketData(data);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSymbolData = useCallback(async (symbol: string, exchange?: string) => {
    try {
      const data = await daoApi.getSymbolData(symbol, exchange);
      return data;
    } catch (err) {
      console.error('Failed to fetch symbol data:', err);
      throw err;
    }
  }, []);

  const getPriceComparison = useCallback(async (symbol: string) => {
    try {
      const data = await daoApi.getPriceComparison(symbol);
      return data;
    } catch (err) {
      console.error('Failed to get price comparison:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    marketData,
    loading,
    error,
    lastUpdate,
    refetch: fetchMarketData,
    fetchSymbolData,
    getPriceComparison
  };
};

export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (activeOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await daoApi.getPriceAlerts(activeOnly);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch price alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch price alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlert = useCallback(async (alertData: {
    symbol: string;
    targetPrice: number;
    condition: 'above' | 'below' | 'crosses_above' | 'crosses_below';
    exchange?: string;
    message?: string;
  }) => {
    try {
      const newAlert = await daoApi.createPriceAlert(alertData);
      setAlerts(prev => [newAlert, ...prev]);
      return newAlert;
    } catch (err) {
      console.error('Failed to create price alert:', err);
      throw err;
    }
  }, []);

  const updateAlert = useCallback(async (id: string, updates: any) => {
    try {
      const updatedAlert = await daoApi.updatePriceAlert(id, updates);
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? updatedAlert : alert
      ));
      return updatedAlert;
    } catch (err) {
      console.error('Failed to update price alert:', err);
      throw err;
    }
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    try {
      await daoApi.deletePriceAlert(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (err) {
      console.error('Failed to delete price alert:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert
  };
};

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<ExchangeAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchAnnouncements = useCallback(async (params?: {
    exchange?: string;
    category?: string;
    importance?: 'high' | 'medium' | 'low';
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await daoApi.getAnnouncements(params);
      setAnnouncements(data);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  const getHighPriorityAnnouncements = useCallback(async () => {
    try {
      const data = await daoApi.getHighPriorityAnnouncements();
      return data;
    } catch (err) {
      console.error('Failed to fetch high priority announcements:', err);
      throw err;
    }
  }, []);

  const getTokenAnnouncements = useCallback(async (symbol: string) => {
    try {
      const data = await daoApi.getTokenAnnouncements(symbol);
      return data;
    } catch (err) {
      console.error('Failed to fetch token announcements:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return {
    announcements,
    loading,
    error,
    lastUpdate,
    refetch: fetchAnnouncements,
    getHighPriorityAnnouncements,
    getTokenAnnouncements
  };
};

export const useMarketStats = () => {
  const [overview, setOverview] = useState<any>(null);
  const [trending, setTrending] = useState<MarketTicker[]>([]);
  const [gainers, setGainers] = useState<MarketTicker[]>([]);
  const [losers, setLosers] = useState<MarketTicker[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, trendingData, gainersData, losersData, anomaliesData] = await Promise.all([
        daoApi.getMarketOverview(),
        daoApi.getTrendingTokens(20),
        daoApi.getTopGainers(20),
        daoApi.getTopLosers(20),
        daoApi.getPriceAnomalies()
      ]);

      setOverview(overviewData);
      setTrending(trendingData);
      setGainers(gainersData);
      setLosers(losersData);
      setAnomalies(anomaliesData);
    } catch (err) {
      console.error('Failed to fetch market stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketStats();
    
    // 设置定期更新
    const interval = setInterval(fetchMarketStats, 30000); // 每30秒更新一次
    
    return () => clearInterval(interval);
  }, [fetchMarketStats]);

  return {
    overview,
    trending,
    gainers,
    losers,
    anomalies,
    loading,
    error,
    refetch: fetchMarketStats
  };
};

export const useRealTimePrice = (symbols: string[], interval = 5000) => {
  const [prices, setPrices] = useState<Map<string, MarketTicker>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const updatePrices = useCallback(async () => {
    try {
      setError(null);
      const data = await daoApi.getMarketData({ symbols });
      
      const priceMap = new Map<string, MarketTicker>();
      data.forEach(ticker => {
        priceMap.set(`${ticker.symbol}_${ticker.exchange}`, ticker);
      });
      
      setPrices(priceMap);
      setLoading(false);
    } catch (err) {
      console.error('Failed to update prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to update prices');
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    if (symbols.length === 0) return;

    // 立即获取一次数据
    updatePrices();

    // 设置定时更新
    intervalRef.current = setInterval(updatePrices, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbols, interval, updatePrices]);

  const getPrice = useCallback((symbol: string, exchange = 'binance') => {
    return prices.get(`${symbol}_${exchange}`);
  }, [prices]);

  const getPriceChange = useCallback((symbol: string, exchange = 'binance') => {
    const ticker = prices.get(`${symbol}_${exchange}`);
    return ticker ? ticker.priceChangePercent : 0;
  }, [prices]);

  return {
    prices: Array.from(prices.values()),
    loading,
    error,
    getPrice,
    getPriceChange,
    refresh: updatePrices
  };
};

// 收藏功能相关的接口
export interface FavoriteSymbol {
  id: string;
  userId: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  addedAt: string;
  marketData?: MarketTicker | null;
}

// 收藏功能的 Hook
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取收藏列表
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await daoApi.getFavoriteSymbols();
      setFavorites(data || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加收藏
  const addFavorite = useCallback(async (symbol: string, baseAsset: string, quoteAsset: string) => {
    try {
      const newFavorite = await daoApi.addFavoriteSymbol(symbol, baseAsset, quoteAsset);
      setFavorites(prev => [newFavorite, ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to add favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to add favorite');
      return false;
    }
  }, []);

  // 移除收藏
  const removeFavorite = useCallback(async (symbol: string) => {
    try {
      await daoApi.removeFavoriteSymbol(symbol);
      setFavorites(prev => prev.filter(fav => fav.symbol !== symbol));
      return true;
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove favorite');
      return false;
    }
  }, []);

  // 检查是否已收藏
  const isFavorite = useCallback((symbol: string) => {
    return favorites.some(fav => fav.symbol === symbol);
  }, [favorites]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
};