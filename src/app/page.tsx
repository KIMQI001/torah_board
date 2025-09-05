"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Users, 
  Zap,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
  Coins,
  Globe,
  Settings,
  Wallet,
  Target
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { apiDePINStore } from "@/components/depin/api-depin-store";
import { DailyRewardsService } from "@/services/daily-rewards.service";
import { priceService } from "@/services/price.service";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface DashboardStats {
  portfolioValue: number;
  weeklyRewards: number;
  totalNodes: number;
  activeProjects: number;
  todayRewards: number;
  change24h: number;
}

interface PortfolioItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface EarningsData {
  date: string;
  value: number;
  change: number;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [earningsHistory, setEarningsHistory] = useState<EarningsData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 先加载DePIN数据
      await apiDePINStore.loadProjects();
      await apiDePINStore.loadNodes();
      
      // 获取DePIN数据
      const depinState = apiDePINStore.getState();
      
      // 获取实际用户ID（使用user字段或默认值）
      const userId = depinState.user?.id || depinState.user?.walletAddress || 'default-user';
      
      // 获取每周奖励数据
      const weeklyRewards = await DailyRewardsService.getWeeklyRewards(userId, 7);
      
      // 获取奖励历史
      const history = await DailyRewardsService.getRewardsHistory(userId, 30);
      
      
      // 计算统计数据
      const totalNodes = depinState.nodes?.length || 0;
      const activeProjects = depinState.projects?.length || 0;
      const portfolioValue = weeklyRewards?.totalUSD || 0;
      
      // 获取今日收益 - 从历史记录中找到今天的数据
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
      const todayRecord = history.find(record => record.date === today);
      const todayRewards = todayRecord?.totalRewardsUSD || 0;
      
      setStats({
        portfolioValue,
        weeklyRewards: weeklyRewards.totalUSD,
        totalNodes,
        activeProjects,
        todayRewards,
        change24h: 5.2 // 模拟24小时变化
      });
      
      // 构建投资组合分布数据
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
      const portfolioItems: PortfolioItem[] = Object.entries(weeklyRewards?.breakdown || {})
        .map(([token, data], index) => ({
          name: token,
          value: data.usd,
          percentage: portfolioValue > 0 ? (data.usd / portfolioValue) * 100 : 0,
          color: colors[index % colors.length]
        }))
        .filter(item => item.value > 0);
      
      setPortfolioData(portfolioItems);
      
      // 构建收益历史数据
      const earningsData: EarningsData[] = (history || [])
        .slice(-14) // 最近14天
        .map((record, index, arr) => ({
          date: new Date(record.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          value: record.totalRewardsUSD,
          change: index > 0 ? record.totalRewardsUSD - arr[index - 1].totalRewardsUSD : 0
        }));
      
      setEarningsHistory(earningsData);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "DePIN节点管理",
      description: "查看和管理您的DePIN节点",
      icon: Globe,
      href: "/depin",
      color: "text-blue-500"
    },
    {
      title: "Meme币追踪",
      description: "发现热门Meme币机会",
      icon: Coins,
      href: "/meme",
      color: "text-yellow-500"
    },
    {
      title: "空投机会",
      description: "跟踪最新空投活动",
      icon: Zap,
      href: "/airdrop",
      color: "text-green-500"
    },
    {
      title: "套利扫描",
      description: "发现DEX套利机会",
      icon: Target,
      href: "/arbitrage",
      color: "text-red-500"
    },
    {
      title: "现货交易",
      description: "实时市场数据和分析",
      icon: BarChart3,
      href: "/spot/tradingview",
      color: "text-purple-500"
    },
    {
      title: "交易日志",
      description: "记录和分析交易策略",
      icon: Activity,
      href: "/journal",
      color: "text-indigo-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              投资组合总值
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(stats?.portfolioValue || 0)}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {formatPercentage(stats?.change24h || 0)} 今日
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              周奖励收入
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(stats?.weeklyRewards || 0)}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              过去7天收入
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              节点数量
            </CardTitle>
            <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {stats?.totalNodes || 0}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              {stats?.activeProjects || 0} 个项目
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              今日收益
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {formatCurrency(stats?.todayRewards || 0)}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              DePIN每日奖励
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              收益趋势
            </CardTitle>
            <CardDescription>
              过去14天的每日收益变化
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsHistory}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-blue-600">
                              收益: {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              投资组合分布
            </CardTitle>
            <CardDescription>
              按代币类型分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as PortfolioItem;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm">
                                  价值: {formatCurrency(data.value)}
                                </p>
                                <p className="text-sm">
                                  占比: {data.percentage.toFixed(1)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {portfolioData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无投资组合数据</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            快捷操作
          </CardTitle>
          <CardDescription>
            快速访问常用功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="group flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-all duration-200 hover:scale-[1.02]">
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
