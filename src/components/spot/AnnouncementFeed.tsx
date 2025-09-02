'use client';

import React, { useState, useCallback } from 'react';
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
  Tag
} from 'lucide-react';
import { useAnnouncements, ExchangeAnnouncement } from '@/hooks/use-spot-data';
import { useLanguage } from '@/hooks/use-language';

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

  const { 
    announcements, 
    loading, 
    error, 
    refetch,
    lastUpdate 
  } = useAnnouncements();

  // 过滤公告
  const filteredAnnouncements = React.useMemo(() => {
    let filtered = announcements;

    // 按交易所过滤
    if (selectedExchange !== 'all') {
      filtered = filtered.filter(ann => ann.exchange === selectedExchange);
    }

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

    return filtered.slice(0, maxItems);
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>CEX公告资讯</span>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              最后更新: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-4 mt-4">
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
        )}
      </CardHeader>
      
      <CardContent>
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? '加载中...' : '暂无公告信息'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const isExpanded = expandedItems.has(announcement.id);
              const maxContentLength = 200;

              return (
                <div 
                  key={announcement.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* 公告头部 */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getImportanceIcon(announcement.importance)}
                      <Badge className={getImportanceColor(announcement.importance)}>
                        {announcement.importance.toUpperCase()}
                      </Badge>
                      <Badge className={getExchangeColor(announcement.exchange)}>
                        {announcement.exchange.toUpperCase()}
                      </Badge>
                      <Badge className={getCategoryColor(announcement.category)}>
                        {announcement.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(announcement.publishTime)}</span>
                    </div>
                  </div>

                  {/* 标题 */}
                  <h3 
                    className="font-semibold text-lg mb-2 cursor-pointer hover:text-blue-600"
                    onClick={() => onAnnouncementClick?.(announcement)}
                  >
                    {announcement.title}
                  </h3>

                  {/* 内容 */}
                  <div className="text-sm text-gray-600 mb-3">
                    {isExpanded ? (
                      <p>{announcement.content}</p>
                    ) : (
                      <p>{truncateText(announcement.content, maxContentLength)}</p>
                    )}
                    
                    {announcement.content.length > maxContentLength && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(announcement.id)}
                        className="mt-1 p-0 h-auto text-blue-600"
                      >
                        {isExpanded ? '收起' : '展开全文'}
                        <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} />
                      </Button>
                    )}
                  </div>

                  {/* 标签 */}
                  {announcement.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {announcement.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAnnouncementClick?.(announcement)}
                      >
                        查看详情
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(announcement.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      原文链接
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};