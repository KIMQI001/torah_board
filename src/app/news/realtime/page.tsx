"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Activity,
  Zap
} from "lucide-react";
import { NewsCard } from "@/components/spot/NewsCard";

export default function RealTimeNewsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-3">
          <Zap className="h-8 w-8 text-yellow-500" />
          <span>实时快讯</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          最新的区块链和加密货币行业动态，实时更新
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
        {/* 主要快讯卡片 - 占据更大空间 */}
        <div className="lg:col-span-2 col-span-1">
          <NewsCard 
            maxItems={12}
            autoRefresh={true}
            refreshInterval={30000}
            showFilters={true}
            className="h-full"
          />
        </div>
        
        {/* 热点追踪侧边栏 */}
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
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-100">
                  <span className="text-sm font-medium">🐋 巨鲸活动增加</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">+15%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <span className="text-sm font-medium">🔥 DEX交易量激增</span>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">+32%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <span className="text-sm font-medium">📈 NFT交易频繁</span>
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">+8%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <span className="text-sm font-medium">⚡ Layer2扩容</span>
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">+25%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                  <span className="text-sm font-medium">🌐 跨链桥活跃</span>
                  <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">+12%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span>市场情绪</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">恐慌贪婪指数</span>
                  <Badge className="bg-green-100 text-green-700 text-sm">78 - 极度贪婪</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '78%'}}></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">📈 看涨</div>
                    <div className="text-xs text-muted-foreground">72%</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-semibold text-red-600">📉 看跌</div>
                    <div className="text-xs text-muted-foreground">28%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}