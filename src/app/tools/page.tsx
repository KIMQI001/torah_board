"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2,
  Zap, 
  Coins,
  TrendingUp,
  Shield,
  Code,
  Search, 
  Star,
  Clock,
  ArrowRight,
  Filter,
  Activity,
  Users,
  Wallet,
  Bell
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useToolsStore } from "@/components/tools/tools-store";
import { useState, useMemo } from "react";
import Link from "next/link";

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'funding': return Building2;
    case 'efficiency': return Zap;
    case 'solana': return Coins;
    case 'market': return TrendingUp;
    case 'security': return Shield;
    case 'developer': return Code;
    default: return Zap;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-green-500 bg-green-500/10";
    case "beta":
      return "text-blue-500 bg-blue-500/10";
    case "coming-soon":
      return "text-yellow-500 bg-yellow-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const getGasStatusColor = (status: string) => {
  switch (status) {
    case "low":
      return "text-green-500";
    case "normal":
      return "text-yellow-500";
    case "high":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
};

export default function ToolsPage() {
  const { t, language } = useLanguage();
  const { 
    tools, 
    categories, 
    favoriteTools, 
    recentlyUsed,
    incrementToolUsage,
    addToFavorites,
    removeFromFavorites
  } = useToolsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  
  // 模拟实时数据
  const gasTrackers = [
    { chain: "Ethereum", price: "23 gwei", usd: "$2.45", status: "normal" },
    { chain: "Solana", price: "0.00025 SOL", usd: "$0.025", status: "low" },
    { chain: "BSC", price: "3 gwei", usd: "$0.15", status: "low" },
    { chain: "Polygon", price: "45 gwei", usd: "$0.08", status: "normal" },
  ];

  // 筛选工具
  const filteredTools = useMemo(() => {
    let filtered = tools;
    
    if (showFavorites) {
      filtered = filtered.filter(tool => favoriteTools.includes(tool.id));
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.nameZh.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.descriptionZh.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [tools, showFavorites, selectedCategory, searchQuery, favoriteTools]);

  // 统计数据
  const stats = {
    totalTools: tools.length,
    activeTools: tools.filter(t => t.status === 'active').length,
    betaTools: tools.filter(t => t.status === 'beta').length,
    comingSoonTools: tools.filter(t => t.status === 'coming-soon').length,
    totalUsage: tools.reduce((sum, tool) => sum + tool.useCount, 0)
  };

  const handleToolClick = (toolId: string) => {
    incrementToolUsage(toolId);
  };

  const handleFavoriteToggle = (toolId: string) => {
    if (favoriteTools.includes(toolId)) {
      removeFromFavorites(toolId);
    } else {
      addToFavorites(toolId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('tools.title')}</h1>
          <p className="text-muted-foreground">
            {language === 'zh' ? '综合Web3交易工具和实用程序' : 'Comprehensive Web3 trading tools and utilities'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={showFavorites ? "default" : "outline"}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star className={`h-4 w-4 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
            {language === 'zh' ? '收藏' : 'Favorites'}
          </Button>
          <Button variant="outline" onClick={() => setSelectedCategory('all')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {language === 'zh' ? '最常用' : 'Most Used'}
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={language === 'zh' ? '搜索工具...' : 'Search tools...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button 
            variant={selectedCategory === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            <Filter className="h-4 w-4 mr-2" />
            {language === 'zh' ? '全部' : 'All'}
          </Button>
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.id);
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {language === 'zh' ? category.nameZh : category.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'zh' ? '可用工具' : 'Available Tools'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTools}</div>
            <p className="text-xs text-muted-foreground">
              {stats.betaTools} {language === 'zh' ? '测试版' : 'beta'}, {stats.comingSoonTools} {language === 'zh' ? '即将推出' : 'coming soon'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'zh' ? 'SOL 交易费' : 'SOL Transaction'}
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.00025</div>
            <p className="text-xs text-muted-foreground">≈ $0.025 {language === 'zh' ? '每笔' : 'per tx'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'zh' ? '工具使用' : 'Tools Usage'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'zh' ? '本周' : 'This week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'zh' ? '我的收藏' : 'My Favorites'}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favoriteTools.length}</div>
            <p className="text-xs text-muted-foreground">
              {recentlyUsed.length} {language === 'zh' ? '最近使用' : 'recently used'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 工具网格 */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {filteredTools.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTools.map((tool) => {
                const isFavorite = favoriteTools.includes(tool.id);
                return (
                  <Card key={tool.id} className="group hover:shadow-md transition-all duration-200 hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">
                              {language === 'zh' ? tool.nameZh : tool.name}
                            </h3>
                            {tool.featured && (
                              <Badge variant="secondary" className="text-xs px-1">
                                {language === 'zh' ? '推荐' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {language === 'zh' 
                              ? categories.find(c => c.id === tool.category)?.nameZh
                              : categories.find(c => c.id === tool.category)?.name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {language === 'zh' ? tool.descriptionZh : tool.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleFavoriteToggle(tool.id)}
                          >
                            <Star className={`h-3 w-3 ${isFavorite ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Badge className={`text-xs ${getStatusColor(tool.status)}`}>
                            {tool.status === 'active' 
                              ? (language === 'zh' ? '可用' : 'Active')
                              : tool.status === 'beta' 
                              ? (language === 'zh' ? '测试' : 'Beta')
                              : (language === 'zh' ? '即将' : 'Soon')
                            }
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tool.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {tool.useCount > 0 && (
                            <span>{language === 'zh' ? '使用' : 'Used'} {tool.useCount}x</span>
                          )}
                        </div>
{tool.externalUrl ? (
                          <a href={tool.externalUrl} target="_blank" rel="noopener noreferrer">
                            <Button 
                              size="sm" 
                              variant={tool.status === 'active' ? 'default' : 'outline'}
                              disabled={tool.status === 'coming-soon'}
                              onClick={() => handleToolClick(tool.id)}
                              className="text-xs"
                            >
                              {tool.status === 'coming-soon' 
                                ? (language === 'zh' ? '即将推出' : 'Coming Soon')
                                : (
                                  <>
                                    {language === 'zh' ? '访问 RootData' : 'Visit RootData'}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </>
                                )
                              }
                            </Button>
                          </a>
                        ) : (
                          <Link href={`/tools/${tool.category}`}>
                            <Button 
                              size="sm" 
                              variant={tool.status === 'active' ? 'default' : 'outline'}
                              disabled={tool.status === 'coming-soon'}
                              onClick={() => handleToolClick(tool.id)}
                              className="text-xs"
                            >
                              {tool.status === 'coming-soon' 
                                ? (language === 'zh' ? '即将推出' : 'Coming Soon')
                                : (
                                  <>
                                    {language === 'zh' ? '打开' : 'Open'}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </>
                                )
                              }
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? '未找到工具' : 'No tools found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'zh' 
                    ? '尝试调整您的搜索或筛选条件' 
                    : 'Try adjusting your search or filter criteria'}
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowFavorites(false);
                }}>
                  {language === 'zh' ? '清除筛选' : 'Clear filters'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 实时网络数据 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {language === 'zh' ? '网络费用' : 'Network Fees'}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'zh' ? '实时交易费用' : 'Real-time transaction costs'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gasTrackers.map((gas) => (
                  <div key={gas.chain} className="flex justify-between items-center p-2 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{gas.chain}</p>
                      <p className="text-xs text-muted-foreground">{gas.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{gas.usd}</p>
                      <p className={`text-xs font-medium ${getGasStatusColor(gas.status)}`}>
                        {gas.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 分类浏览 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {language === 'zh' ? '分类浏览' : 'Browse Categories'}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === 'zh' ? '按类别查看工具' : 'View tools by category'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = getCategoryIcon(category.id);
                  const toolCount = tools.filter(t => t.category === category.id).length;
                  return (
                    <Link key={category.id} href={`/tools/${category.id}`}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-auto p-3 hover:bg-accent"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <div className="flex items-center w-full">
                          <div className="flex items-center flex-1">
                            <IconComponent className="h-4 w-4 mr-3" />
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {language === 'zh' ? category.nameZh : category.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {toolCount} {language === 'zh' ? '个工具' : 'tools'}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 最近使用 */}
          {recentlyUsed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {language === 'zh' ? '最近使用' : 'Recently Used'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentlyUsed.slice(0, 5).map((toolId) => {
                    const tool = tools.find(t => t.id === toolId);
                    if (!tool) return null;
                    return (
                      <Link key={toolId} href={`/tools/${tool.category}`}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-auto p-2"
                          onClick={() => handleToolClick(toolId)}
                        >
                          <div className="text-left">
                            <p className="font-medium text-xs">
                              {language === 'zh' ? tool.nameZh : tool.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'zh' ? '使用' : 'Used'} {tool.useCount}x
                            </p>
                          </div>
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 快速转换工具 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {language === 'zh' ? '快速工具' : 'Quick Tools'}
          </CardTitle>
          <CardDescription>
            {language === 'zh' ? '常用单位转换和计算' : 'Common unit conversions and calculations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4" />
                {language === 'zh' ? 'Solana 单位' : 'Solana Units'}
              </label>
              <div className="space-y-2 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">1 SOL</span>
                  <span className="text-sm text-muted-foreground">= 10^9 lamports</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">1 lamport</span>
                  <span className="text-sm text-muted-foreground">= 0.000000001 SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current Price</span>
                  <span className="text-sm text-green-500 font-semibold">≈ $110.50</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {language === 'zh' ? '价格计算器' : 'Price Calculator'}
              </label>
              <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <div className="space-y-2">
                  <Input placeholder={language === 'zh' ? '输入 SOL 数量' : 'Enter SOL amount'} type="number" />
                  <div className="text-center text-sm text-muted-foreground">
                    ≈ $0.00 USD
                  </div>
                  <Button size="sm" className="w-full">
                    {language === 'zh' ? '计算' : 'Calculate'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {language === 'zh' ? '价格警报' : 'Price Alerts'}
              </label>
              <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {language === 'zh' ? '当前活跃警报' : 'Active alerts'}: 3
                  </div>
                  <Link href="/tools/market">
                    <Button size="sm" variant="outline" className="w-full">
                      {language === 'zh' ? '管理警报' : 'Manage Alerts'}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}