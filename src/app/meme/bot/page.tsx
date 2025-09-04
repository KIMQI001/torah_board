"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Activity,
  AlertTriangle
} from "lucide-react";

interface MemeAlert {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  volume24h: string;
  marketCap: string;
  alertType: 'pump' | 'dump' | 'volume_spike' | 'new_listing';
  timestamp: Date;
  description: string;
  chain: string;
}

export default function MemeBotPage() {
  const [alerts, setAlerts] = useState<MemeAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 模拟 WebSocket 连接和数据
  useEffect(() => {
    // 模拟初始数据
    const mockAlerts: MemeAlert[] = [
      {
        id: '1',
        symbol: 'PEPE',
        name: 'Pepe',
        price: '$0.000024',
        change24h: 28.5,
        volume24h: '$145M',
        marketCap: '$9.8B',
        alertType: 'pump',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        description: '24小时涨幅超过25%，成交量异常放大',
        chain: 'ETH'
      },
      {
        id: '2',
        symbol: 'SHIB',
        name: 'Shiba Inu',
        price: '$0.000019',
        change24h: -15.2,
        volume24h: '$89M',
        marketCap: '$11.2B',
        alertType: 'dump',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        description: '价格快速下跌，注意风险控制',
        chain: 'ETH'
      },
      {
        id: '3',
        symbol: 'WIF',
        name: 'Dogwifhat',
        price: '$3.24',
        change24h: 45.7,
        volume24h: '$234M',
        marketCap: '$3.2B',
        alertType: 'volume_spike',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        description: '成交量暴增300%，市场关注度激增',
        chain: 'SOL'
      },
      {
        id: '4',
        symbol: 'BONK',
        name: 'Bonk',
        price: '$0.000045',
        change24h: 12.3,
        volume24h: '$67M',
        marketCap: '$2.1B',
        alertType: 'new_listing',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        description: '新上线主流交易所，流动性增加',
        chain: 'SOL'
      }
    ];

    setAlerts(mockAlerts);
    setIsConnected(true);
    setLastUpdate(new Date());

    // 模拟实时数据更新
    const interval = setInterval(() => {
      // 随机更新一些数据
      setAlerts(prev => prev.map(alert => ({
        ...alert,
        price: (parseFloat(alert.price.replace('$', '')) * (0.98 + Math.random() * 0.04)).toFixed(6),
        change24h: alert.change24h + (Math.random() - 0.5) * 2,
        volume24h: `$${(parseFloat(alert.volume24h.replace(/[$M]/g, '')) * (0.9 + Math.random() * 0.2)).toFixed(0)}M`
      })));
      setLastUpdate(new Date());
    }, 30000); // 每30秒更新一次

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: MemeAlert['alertType']) => {
    switch (type) {
      case 'pump':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'dump':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'volume_spike':
        return <Volume2 className="h-4 w-4 text-blue-500" />;
      case 'new_listing':
        return <Activity className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getAlertBadgeColor = (type: MemeAlert['alertType']) => {
    switch (type) {
      case 'pump':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'dump':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'volume_spike':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'new_listing':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      default:
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
    }
  };

  const getAlertTypeName = (type: MemeAlert['alertType']) => {
    switch (type) {
      case 'pump':
        return '价格拉升';
      case 'dump':
        return '价格下跌';
      case 'volume_spike':
        return '成交量异常';
      case 'new_listing':
        return '新上线';
      default:
        return '异常';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-500" />
            Meme Bot 推送
          </h1>
          <p className="text-muted-foreground">
            实时监控 Meme 币异动，智能推送交易机会
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? '已连接' : '连接中'}
            </span>
          </div>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              最后更新: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">今日推送</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">拉升信号</p>
                <p className="text-2xl font-bold text-green-500">12</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">成交量异常</p>
                <p className="text-2xl font-bold text-blue-500">8</p>
              </div>
              <Volume2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">新上线</p>
                <p className="text-2xl font-bold text-purple-500">4</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 异动币列表 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">实时异动</h2>
          <Button variant="outline" size="sm" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
        
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center font-bold">
                      {alert.symbol.slice(0, 2)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{alert.name}</h3>
                        <Badge variant="secondary">{alert.symbol}</Badge>
                        <Badge variant="outline">{alert.chain}</Badge>
                        <Badge className={getAlertBadgeColor(alert.alertType)}>
                          {getAlertIcon(alert.alertType)}
                          <span className="ml-1">{getAlertTypeName(alert.alertType)}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {alert.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">价格</span>
                          <p className="font-medium">{alert.price}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">24h涨跌</span>
                          <p className={`font-medium ${alert.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {alert.change24h >= 0 ? '+' : ''}{alert.change24h.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">成交量</span>
                          <p className="font-medium">{alert.volume24h}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">市值</span>
                          <p className="font-medium">{alert.marketCap}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(alert.timestamp)}
                    </div>
                    
                    <Button size="sm" variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}