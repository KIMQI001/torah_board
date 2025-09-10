'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';

// 新闻项接口
interface NewsFeedItem {
  id: string;
  title: string;
  content: string;
  time: string;
  tags?: string[];
  publishTime: string; // ISO 时间格式，如 "2025-09-02T09:49:05.000Z"
  isImportant?: boolean;
  link?: string;
  source?: string;
}

// 组件属性接口
interface NewsFloatingWidgetProps {
  refreshInterval?: number; // 数据刷新间隔，默认30秒
  maxItems?: number; // 最多显示的新闻数量，默认3条
  onNewsClick?: (news: NewsFeedItem) => void; // 新闻点击回调
  className?: string; // 自定义样式类
}

export const NewsFloatingWidget: React.FC<NewsFloatingWidgetProps> = ({
  refreshInterval = 30000,
  maxItems = 3,
  onNewsClick,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [news, setNews] = useState<NewsFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewNews, setHasNewNews] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const [autoExpandTimeout, setAutoExpandTimeout] = useState<NodeJS.Timeout | null>(null);

  // 获取新闻数据
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      
      let data;
      try {
        const response = await fetch('/api/odaily-news', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10秒超时
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        data = await response.json();
      } catch (fetchError) {
        console.warn('API fetch failed, using fallback data:', fetchError);
        // 使用备用数据
        data = {
          success: true,
          items: getFallbackNewsData()
        };
      }
      
      if (data.success && data.items) {
        const latestNews = data.items.slice(0, maxItems);
        const currentTime = Date.now();
        
        // 检查是否有新消息（发布时间在上次检查时间之后的消息）
        const hasNew = latestNews.some((item: NewsFeedItem) => {
          if (!item.publishTime) return false;
          
          // 解析发布时间（ISO 格式）
          const publishTimestamp = new Date(item.publishTime).getTime();
          
          // 判断是否为新消息（发布时间晚于上次检查时间）
          return publishTimestamp > lastCheckTime;
        });
        
        if (hasNew) {
          setHasNewNews(true);
          // 有新消息时自动展开15秒
          setIsExpanded(true);
          
          // 清除之前的定时器
          if (autoExpandTimeout) {
            clearTimeout(autoExpandTimeout);
          }
          
          // 15秒后自动收起
          const timeout = setTimeout(() => {
            setIsExpanded(false);
            setHasNewNews(false);
          }, 15000);
          
          setAutoExpandTimeout(timeout);
        }
        
        setNews(latestNews);
        setLastCheckTime(currentTime);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
      // 设置备用数据
      setNews(getFallbackNewsData().slice(0, maxItems));
    } finally {
      setLoading(false);
    }
  }, [maxItems, autoExpandTimeout]);

  // 备用新闻数据
  const getFallbackNewsData = (): NewsFeedItem[] => {
    const currentTime = new Date();
    return [
      {
        id: 'fallback-1',
        title: 'Solana 8月链上DEX交易量超1440亿美元',
        content: 'Solana 8月链上DEX月度交易量超1440亿美元，回到2024年5月水平。前三大DEX：Raydium Protocol超410亿美元，Orca超230亿美元，HumidFi超220亿美元',
        time: '刚刚',
        tags: ['Solana', 'DEX', '交易量'],
        publishTime: currentTime.toISOString(),
        isImportant: true,
        source: 'Odaily'
      },
      {
        id: 'fallback-2',
        title: '某巨鲸将6690万美元WBTC换仓为ETH',
        content: '链上分析师监测到某巨鲸将602.8枚WBTC（价值6690万美元）卖出并转换为15083枚ETH',
        time: '5分钟前',
        tags: ['WBTC', 'ETH', '巨鲸'],
        publishTime: new Date(currentTime.getTime() - 5 * 60000).toISOString(),
        isImportant: true,
        source: 'Odaily'
      },
      {
        id: 'fallback-3',
        title: 'Linea网络DeFi TVL创历史新高',
        content: '据 DefiLlama 数据，Linea 网络 DeFi TVL 创历史新高，现报 8.9339 亿美元，过去一周增幅达 60.30%。',
        time: '10分钟前',
        tags: ['Linea', 'DeFi', 'TVL'],
        publishTime: new Date(currentTime.getTime() - 10 * 60000).toISOString(),
        isImportant: false,
        source: 'Odaily'
      }
    ];
  };

  // 定时刷新
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, refreshInterval);
    return () => {
      clearInterval(interval);
      if (autoExpandTimeout) {
        clearTimeout(autoExpandTimeout);
      }
    };
  }, [fetchNews, refreshInterval]);

  // 手动切换展开状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setHasNewNews(false);
    
    // 如果手动操作，清除自动收起定时器
    if (autoExpandTimeout) {
      clearTimeout(autoExpandTimeout);
      setAutoExpandTimeout(null);
    }
  };

  // 关闭组件
  const handleClose = () => {
    setIsVisible(false);
  };

  // 处理新闻点击
  const handleNewsClick = (newsItem: NewsFeedItem) => {
    if (onNewsClick) {
      onNewsClick(newsItem);
    } else if (newsItem.link) {
      window.open(newsItem.link, '_blank');
    }
  };

  // 如果不可见则不渲染
  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 w-96 transition-all duration-500 ease-out ${className}`}
      style={{ transform: isExpanded ? 'translateY(0)' : 'translateY(calc(100% - 70px))' }}
    >
      <Card className={`shadow-2xl ${hasNewNews ? 'border-2 border-orange-400 shadow-orange-400/30' : 'border border-border/50'} bg-background/95 backdrop-blur-sm`}>
        {/* 头部 - 始终可见 */}
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/20 transition-all duration-300 rounded-t-lg"
          onClick={toggleExpanded}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Zap className={`h-5 w-5 ${hasNewNews ? 'text-orange-500' : 'text-blue-500'}`} />
                {hasNewNews && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  实时快讯
                </CardTitle>
                {hasNewNews && (
                  <Badge variant="destructive" className="mt-1 text-xs bg-orange-500 border-0 shadow-sm">
                    <span>●</span> 新消息
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {loading && (
                <div className="relative">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-4 h-4 border border-blue-500/20 rounded-full animate-pulse"></div>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted/50 rounded-full transition-all duration-200 hover:scale-110"
                onClick={toggleExpanded}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all duration-200 hover:scale-110"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* 内容 - 展开时可见 */}
        {isExpanded && (
          <CardContent className="pt-0 space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {news.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 flex flex-col items-center space-y-2">
                <Bell className="h-8 w-8 opacity-50" />
                <span>暂无快讯</span>
              </div>
            ) : (
              news.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative p-4 rounded-xl border border-border/30 hover:border-primary/30 bg-gradient-to-r from-card/50 to-card/30 hover:from-card/80 hover:to-card/60 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${index === 0 && hasNewNews ? 'border-orange-400 shadow-orange-400/10' : ''}`}
                  onClick={() => handleNewsClick(item)}
                >
                  {/* 新消息标记 */}
                  {index === 0 && hasNewNews && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                        NEW
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        {item.isImportant && (
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 drop-shadow-sm" />
                        )}
                        <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-relaxed">
                          {item.title}
                        </h4>
                      </div>
                      
                      {item.content && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground/80 font-medium">
                            {item.time}
                          </span>
                          {item.source && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="text-xs text-muted-foreground/60">
                                {item.source}
                              </span>
                            </>
                          )}
                        </div>
                        
                        {item.link && (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <ExternalLink className="h-3 w-3 text-primary/70" />
                            <span className="text-xs text-primary/70">查看</span>
                          </div>
                        )}
                      </div>
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="text-xs px-2 py-0.5 bg-muted/50 hover:bg-muted/80 transition-colors border-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* 查看更多按钮 */}
            <div className="pt-3 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs font-medium bg-gradient-to-r from-muted/30 to-muted/20 hover:from-muted/50 hover:to-muted/40 rounded-lg transition-all duration-300 hover:shadow-md"
                onClick={() => {
                  window.location.href = '/spot?tab=newsfeeds';
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    查看更多快讯
                  </span>
                  <ExternalLink className="h-3 w-3 text-primary/70" />
                </div>
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};