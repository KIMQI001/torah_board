"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeftRight, 
  TrendingUp, 
  AlertTriangle, 
  PlayCircle, 
  PauseCircle,
  Building2,
  Network,
  Zap,
  Globe,
  ExternalLink,
  Github
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function ArbitragePage() {
  const { t } = useLanguage();

  const openPriceArbitrage = () => {
    window.open('https://github.com/', '_blank');
  };

  const openFundingRateArbitrage = () => {
    window.open('https://github.com/', '_blank');
  };

  const openJupArbitrage = () => {
    window.open('https://github.com/', '_blank');
  };

  const openOnchainArbitrage = () => {
    window.open('https://github.com/', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">套利概览</h1>
          <p className="text-muted-foreground">
            中心化交易所和去中心化交易所套利机会监控
          </p>
        </div>
      </div>

      {/* 主要类别 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CEX 套利 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <span>CEX 套利</span>
            </CardTitle>
            <CardDescription>
              中心化交易所之间的价格差异套利
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300">活跃机会</h4>
                  <p className="text-2xl font-bold text-blue-600">8</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold text-green-700 dark:text-green-300">今日收益</h4>
                  <p className="text-2xl font-bold text-green-600">+$234</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">支持交易所</h4>
                <div className="text-sm text-muted-foreground">
                  <p>• Binance ↔ OKX</p>
                  <p>• Coinbase ↔ Kraken</p>
                  <p>• Bybit ↔ Gate.io</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={openPriceArbitrage}
                >
                  <Github className="h-3 w-3 mr-1" />
                  价格套利
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={openFundingRateArbitrage}
                >
                  <Github className="h-3 w-3 mr-1" />
                  资金费率套利
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DEX 套利 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-purple-500" />
              <span>DEX 套利</span>
            </CardTitle>
            <CardDescription>
              去中心化交易所套利策略
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-300">活跃机会</h4>
                  <p className="text-2xl font-bold text-purple-600">12</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold text-green-700 dark:text-green-300">今日收益</h4>
                  <p className="text-2xl font-bold text-green-600">+$156</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={openJupArbitrage}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  JUP 套利
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={openOnchainArbitrage}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  On-chain 套利
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细功能介绍 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">JUP 套利</CardTitle>
            <CardDescription>
              基于 Jupiter 聚合器的跨 DEX 套利
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">特点</h4>
                <ul className="text-sm space-y-1">
                  <li>• 自动路径优化</li>
                  <li>• 低滑点交易</li>
                  <li>• 支持多种代币</li>
                  <li>• MEV 保护机制</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                利用 Jupiter 的智能路由找到最优套利路径
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">On-chain 套利</CardTitle>
            <CardDescription>
              链上 DEX 之间的直接套利
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">支持 DEX</h4>
                <ul className="text-sm space-y-1">
                  <li>• Raydium ↔ Orca</li>
                  <li>• Serum ↔ Meteora</li>
                  <li>• Phoenix ↔ Lifinity</li>
                  <li>• Aldrin ↔ Saber</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                监控链上流动性池的价格差异
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">策略配置</CardTitle>
            <CardDescription>
              自定义套利参数和风险控制
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-2 border rounded text-center">
                  <p className="text-xs text-muted-foreground">最小利润率</p>
                  <p className="font-bold">0.5%</p>
                </div>
                <div className="p-2 border rounded text-center">
                  <p className="text-xs text-muted-foreground">最大交易额</p>
                  <p className="font-bold">$1,000</p>
                </div>
                <div className="p-2 border rounded text-center">
                  <p className="text-xs text-muted-foreground">风险等级</p>
                  <p className="font-bold text-yellow-500">中等</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}