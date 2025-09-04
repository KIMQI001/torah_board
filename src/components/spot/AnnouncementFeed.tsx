'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  ExternalLink, 
  Filter,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronRight,
  Search,
  Tag,
  Wifi,
  WifiOff,
  BellRing,
  X
} from 'lucide-react';
import { useAnnouncements, ExchangeAnnouncement } from '@/hooks/use-spot-data';
import { useLanguage } from '@/hooks/use-language';
import { useWebSocket, WebSocketMessage } from '@/hooks/use-websocket';

interface AnnouncementFeedProps {
  maxItems?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
  onAnnouncementClick?: (announcement: ExchangeAnnouncement) => void;
}

export const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({
  maxItems = 50,
  showFilters = true,
  autoRefresh = true,
  onAnnouncementClick
}) => {
  const { t } = useLanguage();
  const [selectedExchange, setSelectedExchange] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [newAnnouncementsCount, setNewAnnouncementsCount] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');

  const { 
    announcements, 
    loading, 
    error, 
    refetch,
    lastUpdate 
  } = useAnnouncements();

  // WebSocket连接
  const { isConnected: wsConnected, error: wsError } = useWebSocket(
    'ws://localhost:5002',
    'dummy-token', // 在实际应用中应该使用真实的JWT token
    {
      onMessage: (message: WebSocketMessage) => {
        if (message.type === 'cex_announcements') {
          // 收到新公告推送，触发刷新
          setNewAnnouncementsCount(message.data.count || 0);
          setNotificationMessage(`收到 ${message.data.count || 0} 条新公告`);
          setShowNotification(true);
          setIsAutoRefreshing(true);
          
          // 自动刷新数据
          setTimeout(() => {
            refetch();
            setIsAutoRefreshing(false);
          }, 1000);
        } else if (message.type === 'announcement_update') {
          // 收到公告更新消息
          setNotificationMessage(message.data.message || '公告已更新');
          setShowNotification(true);
        }
      },
      onConnect: () => {
        console.log('WebSocket connected');
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      }
    }
  );

  // 自动隐藏通知
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
        setNewAnnouncementsCount(0);
      }, 5000); // 5秒后自动隐藏

      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // 手动关闭通知
  const dismissNotification = () => {
    setShowNotification(false);
    setNewAnnouncementsCount(0);
  };

  // 按交易所分组并过滤公告
  const exchangeGroups = React.useMemo(() => {
    let filtered = announcements;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ann => ann.category === selectedCategory);
    }

    // 按重要性过滤
    if (selectedImportance !== 'all') {
      filtered = filtered.filter(ann => ann.importance === selectedImportance);
    }

    // 按搜索关键词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ann => 
        ann.title.toLowerCase().includes(query) ||
        ann.content.toLowerCase().includes(query) ||
        ann.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 按交易所分组
    const grouped = filtered.reduce((acc, announcement) => {
      const exchange = announcement.exchange;
      if (!acc[exchange]) {
        acc[exchange] = [];
      }
      acc[exchange].push(announcement);
      return acc;
    }, {} as Record<string, ExchangeAnnouncement[]>);

    // 按交易所过滤（如果选择了特定交易所）
    if (selectedExchange !== 'all') {
      const singleExchange = grouped[selectedExchange] || [];
      return { [selectedExchange]: singleExchange.slice(0, maxItems) };
    }

    // 限制每个交易所的公告数量
    const itemsPerExchange = Math.floor(maxItems / Object.keys(grouped).length) || 5;
    Object.keys(grouped).forEach(exchange => {
      grouped[exchange] = grouped[exchange].slice(0, itemsPerExchange);
    });

    return grouped;
  }, [announcements, selectedExchange, selectedCategory, selectedImportance, searchQuery, maxItems]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'binance':
        return 'bg-yellow-100 text-yellow-800';
      case 'okx':
        return 'bg-blue-100 text-blue-800';
      case 'gate':
        return 'bg-purple-100 text-purple-800';
      case 'coinbase':
        return 'bg-blue-100 text-blue-800';
      case 'kraken':
        return 'bg-indigo-100 text-indigo-800';
      case 'bybit':
        return 'bg-orange-100 text-orange-800';
      case 'huobi':
        return 'bg-green-100 text-green-800';
      case 'kucoin':
        return 'bg-emerald-100 text-emerald-800';
      case 'bitget':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'listing':
        return 'bg-green-100 text-green-800';
      case 'delisting':
        return 'bg-red-100 text-red-800';
      case 'trading':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'promotion':
        return 'bg-purple-100 text-purple-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 获取所有可用的分类
  const availableCategories = React.useMemo(() => {
    const categories = [...new Set(announcements.map(ann => ann.category))];
    return categories.sort();
  }, [announcements]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading announcements: {error}</p>
            <Button onClick={refetch} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 新公告通知 */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Card className="border-l-4 border-l-blue-500 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <BellRing className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">新公告提醒</p>
                    <p className="text-xs text-muted-foreground">{notificationMessage}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissNotification}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 顶部标题和控制区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Bell className="h-8 w-8" />
            <span>CEX公告资讯</span>
            {/* WebSocket连接状态指示器 */}
            <div className="flex items-center space-x-1">
              {wsConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-xs">实时连接</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-xs">连接断开</span>
                </div>
              )}
            </div>
          </h1>
          <p className="text-muted-foreground flex items-center space-x-2">
            <span>最后更新: {new Date(lastUpdate).toLocaleTimeString()}</span>
            {isAutoRefreshing && (
              <span className="flex items-center text-blue-600 text-sm">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                自动刷新中...
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          {/* 新公告提示 */}
          {newAnnouncementsCount > 0 && !showNotification && (
            <Badge className="bg-red-500 text-white animate-pulse">
              {newAnnouncementsCount} 条新公告
            </Badge>
          )}
          {loading && <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />}
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading || isAutoRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading || isAutoRefreshing ? 'animate-spin' : ''}`} />
            {isAutoRefreshing ? '自动刷新' : '刷新'}
          </Button>
        </div>
      </div>

      {/* 搜索和筛选器 */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索公告..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
              </div>

              {/* 过滤器 */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">所有交易所</option>
                  <option value="binance">Binance</option>
                  <option value="okx">OKX</option>
                  <option value="gate">Gate.io</option>
                  <option value="coinbase">Coinbase</option>
                  <option value="kraken">Kraken</option>
                  <option value="bybit">Bybit</option>
                  <option value="huobi">Huobi</option>
                  <option value="kucoin">KuCoin</option>
                  <option value="bitget">Bitget</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">所有分类</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedImportance}
                  onChange={(e) => setSelectedImportance(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">所有重要性</option>
                  <option value="high">高重要性</option>
                  <option value="medium">中重要性</option>
                  <option value="low">低重要性</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 交易所独立卡片网格 */}
      {Object.keys(exchangeGroups).length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              {loading ? '加载中...' : '暂无公告信息'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(exchangeGroups).map(([exchange, announcements]) => (
            <Card key={exchange} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      exchange === 'binance' ? 'bg-yellow-500' :
                      exchange === 'okx' ? 'bg-blue-500' :
                      exchange === 'gate' ? 'bg-purple-500' :
                      exchange === 'coinbase' ? 'bg-blue-600' :
                      exchange === 'kraken' ? 'bg-indigo-500' :
                      exchange === 'bybit' ? 'bg-orange-500' :
                      exchange === 'huobi' ? 'bg-green-500' :
                      exchange === 'kucoin' ? 'bg-emerald-500' :
                      exchange === 'bitget' ? 'bg-cyan-500' :
                      'bg-gray-500'
                    }`}>
                      {exchange.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {exchange === 'binance' ? 'Binance' :
                         exchange === 'okx' ? 'OKX' :
                         exchange === 'bybit' ? 'Bybit' :
                         exchange === 'kucoin' ? 'KuCoin' :
                         exchange === 'gate' ? 'Gate.io' :
                         exchange === 'coinbase' ? 'Coinbase' :
                         exchange === 'kraken' ? 'Kraken' :
                         exchange === 'huobi' ? 'Huobi' :
                         exchange === 'bitget' ? 'Bitget' :
                         exchange.charAt(0).toUpperCase() + exchange.slice(1)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {announcements.length} 条公告
                      </p>
                    </div>
                  </div>
                  <Badge className={getExchangeColor(exchange)}>
                    {exchange.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {announcements.slice(0, 5).map((announcement) => (
                    <div 
                      key={announcement.id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => onAnnouncementClick?.(announcement)}
                    >
                      {/* 公告头部 */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-1">
                          {getImportanceIcon(announcement.importance)}
                          <Badge className={`${getImportanceColor(announcement.importance)} text-xs`}>
                            {announcement.importance.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(announcement.publishTime)}</span>
                        </div>
                      </div>

                      {/* 标题 */}
                      <h4 className="font-medium text-sm mb-1 line-clamp-2 hover:text-blue-600">
                        {announcement.title}
                      </h4>

                      {/* 内容预览 */}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {truncateText(announcement.content, 80)}
                      </p>

                      {/* 标签 */}
                      {announcement.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {announcement.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {announcement.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{announcement.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {announcements.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm">
                        查看更多 ({announcements.length - 5} 条)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};