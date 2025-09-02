"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  PieChart, 
  BarChart3,
  AlertTriangle,
  Activity,
  Zap,
  Target
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { MarketOverview } from "@/components/spot/MarketOverview";
import { PriceMatrix } from "@/components/spot/PriceMatrixReal";
import { AnnouncementFeed } from "@/components/spot/AnnouncementFeed";
import { PriceAlertManager } from "@/components/spot/PriceAlertManager";
import { NewsCard } from "@/components/spot/NewsCard";
import { usePriceAlerts } from "@/hooks/use-spot-data";
import { useRealMarketStats } from "@/hooks/use-real-market-data";

export default function SpotPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { alerts } = usePriceAlerts();
  const { overview, loading: statsLoading } = useRealMarketStats();
  
  const activeAlerts = alerts.filter(alert => alert.isActive && !alert.isTriggered);
  const triggeredAlerts = alerts.filter(alert => alert.isTriggered);

  const handleSymbolClick = (symbol: string, ticker?: any) => {
    console.log('Symbol clicked:', symbol, ticker);
  };

  const handleAnnouncementClick = (announcement: any) => {
    console.log('Announcement clicked:', announcement);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">现货交易</h1>
          <p className="text-muted-foreground">
            实时市场数据、价格预警和决策支持
          </p>
        </div>
        <div className="flex space-x-2">
          {triggeredAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {triggeredAlerts.length} 个预警已触发
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('alerts')}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            预警管理
            {triggeredAlerts.length > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
            )}
          </Button>
        </div>
      </div>

      {/* 快速统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">市场总值</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '--' : overview?.totalMarketCap ? `$${(overview.totalMarketCap / 1e12).toFixed(2)}T` : '--'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              {statsLoading ? '--' : `${overview?.marketCapChange24h > 0 ? '+' : ''}${overview?.marketCapChange24h?.toFixed(2) || 0}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h交易量</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '--' : overview?.totalVolume24h ? `$${(overview.totalVolume24h / 1e9).toFixed(1)}B` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? '--' : `${overview?.volumeChange24h > 0 ? '+' : ''}${overview?.volumeChange24h?.toFixed(2) || 0}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC占比</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '--' : `${overview?.btcDominance?.toFixed(1) || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              市场主导地位
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃预警</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {triggeredAlerts.length > 0 ? `${triggeredAlerts.length} 个已触发` : '监控中'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 - 使用标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>市场总览</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>价格矩阵</span>
          </TabsTrigger>
          <TabsTrigger value="newsfeeds" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>实时快讯</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>CEX公告</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>预警管理</span>
            {triggeredAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs px-1">
                {triggeredAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MarketOverview onSymbolClick={handleSymbolClick} />
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <PriceMatrix 
            symbols={['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'UNIUSDT']}
            exchanges={['binance', 'okx', 'gate']}
            onSymbolClick={handleSymbolClick}
            autoRefresh={true}
          />
        </TabsContent>

        <TabsContent value="newsfeeds" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <NewsCard 
              maxItems={8}
              autoRefresh={true}
              refreshInterval={30000}
              showFilters={true}
              onViewMore={() => setActiveTab('announcements')}
            />
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>热点追踪</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                      <span className="text-sm font-medium">🐋 巨鲸活动增加</span>
                      <Badge variant="secondary" className="text-xs">+15%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50">
                      <span className="text-sm font-medium">🔥 DEX交易量激增</span>
                      <Badge variant="secondary" className="text-xs">+32%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50">
                      <span className="text-sm font-medium">📈 NFT交易频繁</span>
                      <Badge variant="secondary" className="text-xs">+8%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <AnnouncementFeed 
            maxItems={50}
            showFilters={true}
            autoRefresh={true}
            onAnnouncementClick={handleAnnouncementClick}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <PriceAlertManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}