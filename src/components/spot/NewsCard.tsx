'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  ExternalLink,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronRight,
  Loader2,
  Globe,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Zap,
  ExternalLinkIcon
} from 'lucide-react';

// 定义新的快讯数据接口
interface NewsFeedItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  source: 'cex' | 'onchain' | 'social' | 'defi';
  sourceUrl?: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  exchange?: string;
  symbols: string[];
  tags: string[];
  metadata?: Record<string, any>;
  isHot: boolean;
  isVerified: boolean;
  publishTime: string;
  createdAt: string;
}

// 旧的接口保持兼容
interface ExchangeAnnouncement {
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

interface NewsCardProps {
  maxItems?: number;
  onAnnouncementClick?: (announcement: ExchangeAnnouncement) => void;
  onViewMore?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showFilters?: boolean;
}

// Hook for fetching news feeds
const useNewsFeeds = (refreshInterval = 30000, autoRefresh = true) => {
  const [feeds, setFeeds] = useState<NewsFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(refreshInterval / 1000);

  const fetchFeeds = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      setNextUpdateIn(refreshInterval / 1000);
      
      // 如果是强制刷新，先调用强制刷新API
      if (forceRefresh) {
        console.log('🔄 触发强制刷新...');
        try {
          const forceResponse = await fetch('/api/odaily-refresh', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (forceResponse.ok) {
            console.log('✅ 强制刷新成功，等待1秒后获取最新数据...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (forceError) {
          console.log('⚠️ 强制刷新失败，继续常规获取:', forceError);
        }
      }
      
      // 并行获取多个数据源
      const [odailyResponse] = await Promise.allSettled([
        // 获取Odaily快讯（真实数据）
        fetch('/api/odaily-news')
      ]);
      
      const allFeeds: NewsFeedItem[] = [];
      
      // 处理Odaily数据
      if (odailyResponse.status === 'fulfilled' && odailyResponse.value?.ok) {
        const odailyData = await odailyResponse.value.json();
        if (odailyData.success && odailyData.items) {
          // 转换Odaily数据格式
          const odailyFeeds = odailyData.items.map((item: any, index: number) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            summary: item.content.substring(0, 100),
            source: 'social' as const,
            sourceUrl: item.link,
            category: 'news',
            importance: item.isImportant ? 'high' : getImportanceFromContent(item.title + item.content),
            symbols: extractSymbolsFromContent(item.content),
            tags: item.tags || [],
            metadata: {
              isAI: item.isAI,
              originalTime: item.time,
              source: 'Odaily',
              isImportant: item.isImportant
            },
            isHot: item.isImportant || index < 3,
            isVerified: true,
            publishTime: item.publishTime || new Date().toISOString(),
            createdAt: new Date().toISOString()
          }));
          allFeeds.push(...odailyFeeds);
        }
      }
      
      // 按时间排序并去重
      const uniqueFeeds = Array.from(
        new Map(allFeeds.map(feed => [feed.id, feed])).values()
      ).sort((a, b) => 
        new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
      );
      
      // 标记前3条为热门
      uniqueFeeds.forEach((feed, index) => {
        feed.isHot = index < 3;
      });
      
      setFeeds(uniqueFeeds);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch news feeds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news feeds');
    } finally {
      setLoading(false);
    }
  }, []);

  // 辅助函数：从内容提取重要性
  const getImportanceFromContent = (content: string): 'high' | 'medium' | 'low' => {
    const highKeywords = ['突破', '暴涨', '暴跌', '黑客', '攻击', '重大', '崩盘', '清算'];
    const mediumKeywords = ['上线', '合作', '更新', '发布', '上涨', '下跌'];
    
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => content.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  };

  // 辅助函数：从内容提取符号
  const extractSymbolsFromContent = (content: string): string[] => {
    const symbols: string[] = [];
    const matches = content.match(/\b[A-Z]{2,6}\b/g);
    if (matches) {
      const commonSymbols = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'WLFI', 'HOLO', 'AIO', 'PUMP'];
      matches.forEach(match => {
        if (commonSymbols.includes(match) && !symbols.includes(match)) {
          symbols.push(match);
        }
      });
    }
    return symbols;
  };

  useEffect(() => {
    setMounted(true);
    fetchFeeds();
    
    if (autoRefresh) {
      // 设置刷新定时器
      const refreshTimer = setInterval(() => {
        fetchFeeds();
        setNextUpdateIn(refreshInterval / 1000);
      }, refreshInterval);
      
      // 设置倒计时定时器
      const countdownTimer = setInterval(() => {
        setNextUpdateIn(prev => {
          if (prev <= 1) {
            return refreshInterval / 1000;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(refreshTimer);
        clearInterval(countdownTimer);
      };
    }
  }, [fetchFeeds, refreshInterval, autoRefresh]);

  return { feeds, loading, error, lastUpdate, mounted, refetch: fetchFeeds, nextUpdateIn };
};

export const NewsCard: React.FC<NewsCardProps> = ({
  maxItems = 5,
  onAnnouncementClick,
  onViewMore,
  autoRefresh = true,
  refreshInterval = 30000, // 30秒实时刷新
  showFilters = false
}) => {
  const { feeds, loading, error, lastUpdate, mounted, refetch, nextUpdateIn } = useNewsFeeds(refreshInterval, autoRefresh);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [announcements, setAnnouncements] = useState<ExchangeAnnouncement[]>([]);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  
  // 新消息提醒效果
  useEffect(() => {
    if (feeds.length > 0 && !loading) {
      setHasNewUpdate(true);
      const timer = setTimeout(() => {
        setHasNewUpdate(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feeds, loading]);

  // 过滤快讯
  const filteredFeeds = React.useMemo(() => {
    let filtered = feeds;

    if (selectedSource !== 'all') {
      filtered = filtered.filter(feed => feed.source === selectedSource);
    }

    return filtered.slice(0, maxItems);
  }, [feeds, selectedSource, maxItems]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'cex': return <Bell className="h-3 w-3" />;
      case 'onchain': return <Activity className="h-3 w-3" />;
      case 'defi': return <Zap className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'cex': return 'bg-blue-100 text-blue-800';
      case 'onchain': return 'bg-green-100 text-green-800';
      case 'defi': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case 'cex': return 'CEX';
      case 'onchain': return '链上';
      case 'defi': return 'DeFi';
      default: return source.toUpperCase();
    }
  };

  const getPriceDirection = (content: string) => {
    if (content.includes('上涨') || content.includes('增长') || content.includes('bull') || content.includes('swapped')) {
      return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    }
    if (content.includes('下跌') || content.includes('减少') || content.includes('bear') || content.includes('transferred')) {
      return <ArrowDownRight className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  // 获取重要性颜色
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取重要性图标
  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <TrendingUp className="h-3 w-3" />;
      case 'low': return <Info className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  // 获取交易所颜色
  const getExchangeColor = (exchange: string) => {
    switch (exchange?.toLowerCase()) {
      case 'binance': return 'bg-yellow-100 text-yellow-800';
      case 'okx': return 'bg-blue-100 text-blue-800';
      case 'gate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 格式化旧版本时间（兼容）
  const formatOldTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  // 截取标题
  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // 处理公告点击
  const handleAnnouncementClick = useCallback((announcement: ExchangeAnnouncement) => {
    onAnnouncementClick?.(announcement);
  }, [onAnnouncementClick]);

  // 处理查看更多
  const handleViewMore = useCallback(() => {
    onViewMore?.(
    );
  }, [onViewMore]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className={`h-5 w-5 ${hasNewUpdate ? 'text-green-500 animate-pulse' : 'text-blue-500'}`} />
            <CardTitle className={hasNewUpdate ? 'text-green-600' : ''}>
              实时快讯
            </CardTitle>
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
            {autoRefresh && !loading && (
              <Badge 
                variant={nextUpdateIn <= 5 ? "destructive" : "secondary"} 
                className={`text-xs ${nextUpdateIn <= 5 ? 'animate-pulse' : ''}`}
              >
                <Clock className="h-3 w-3 mr-1" />
                {nextUpdateIn}s
              </Badge>
            )}
            {hasNewUpdate && (
              <Badge variant="default" className="text-xs bg-green-500 animate-bounce">
                New!
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {mounted && lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🖱️ 用户点击刷新按钮');
                refetch(); // 强制刷新
              }}
              disabled={loading}
              className="h-7 w-7 p-0"
              title="强制刷新最新数据"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewMore}
              className="h-7 px-2"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-3">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="text-xs px-2 py-1 border rounded"
            >
              <option value="all">所有来源</option>
              <option value="cex">CEX公告</option>
              <option value="onchain">链上数据</option>
              <option value="defi">DeFi</option>
            </select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading && feeds.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 text-sm mb-2">加载失败: {error}</div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        ) : filteredFeeds.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-muted-foreground">暂无快讯数据</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {filteredFeeds.map((feed) => (
              <div
                key={feed.id}
                className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  feed.isHot ? 'bg-red-50 border-l-2 border-l-red-500' : ''
                }`}
                onClick={() => feed.sourceUrl && window.open(feed.sourceUrl, '_blank')}
              >
                {/* 快讯头部信息 */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getSourceColor(feed.source)}`}>
                      {getSourceIcon(feed.source)}
                      <span className="ml-1">{getSourceName(feed.source)}</span>
                    </Badge>
                    
                    {feed.metadata?.source === 'Odaily' && (
                      <Badge className="text-xs bg-orange-100 text-orange-800">
                        <Globe className="h-3 w-3 mr-1" />
                        Odaily
                      </Badge>
                    )}
                    
                    <Badge className={`text-xs ${getImportanceColor(feed.importance)}`}>
                      {getImportanceIcon(feed.importance)}
                      <span className="ml-1">
                        {feed.importance === 'high' ? '重要' : 
                         feed.importance === 'medium' ? '一般' : '提示'}
                      </span>
                    </Badge>

                    {feed.isHot && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        热门
                      </Badge>
                    )}
                    
                    {feed.metadata?.isAI && (
                      <Badge variant="outline" className="text-xs">
                        AI
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(feed.publishTime)}</span>
                  </div>
                </div>

                {/* 快讯标题 */}
                <h4 className="font-medium text-sm mb-2 line-clamp-2 text-gray-900 flex items-start">
                  {getPriceDirection(feed.content)}
                  <span className="ml-1">{truncateTitle(feed.title, 50)}</span>
                </h4>

                {/* 快讯内容摘要 */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {feed.summary || truncateTitle(feed.content, 80)}
                </p>

                {/* 标签和符号 */}
                {(feed.symbols.length > 0 || feed.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {feed.symbols.slice(0, 3).map((symbol) => (
                      <Badge key={symbol} variant="outline" className="text-xs">
                        <DollarSign className="h-2 w-2 mr-1" />
                        {symbol}
                      </Badge>
                    ))}
                    {feed.tags.slice(0, 2).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 底部操作区 */}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    {feed.exchange && (
                      <span className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                        {feed.exchange.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {feed.sourceUrl && (
                    <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
            
            {feeds.length > maxItems && (
              <div className="pt-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={handleViewMore}
                >
                  查看更多快讯 ({feeds.length - maxItems}+)
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};