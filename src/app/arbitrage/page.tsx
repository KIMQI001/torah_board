"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, TrendingUp, AlertTriangle, PlayCircle, PauseCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function ArbitragePage() {
  const { t } = useLanguage();
  
  const opportunities = [
    {
      tokenPair: "SOL/USDC",
      dexA: "Raydium",
      dexB: "Jupiter",
      priceA: "$98.45",
      priceB: "$99.12",
      profit: "$0.67",
      profitPercent: "0.68%",
      volume: "$1.2M",
      risk: "low",
    },
    {
      tokenPair: "BONK/SOL",
      dexA: "Orca",
      dexB: "Raydium",
      priceA: "0.000021",
      priceB: "0.000022",
      profit: "$0.04",
      profitPercent: "4.76%",
      volume: "$890K",
      risk: "medium",
    },
    {
      tokenPair: "JUP/USDC",
      dexA: "Phoenix",
      dexB: "Meteora",
      priceA: "$0.89",
      priceB: "$0.91",
      profit: "$0.02",
      profitPercent: "2.25%",
      volume: "$650K",
      risk: "high",
    },
  ];

  const recentTrades = [
    {
      pair: "SOL/USDC",
      profit: "+$12.45",
      timestamp: "2 mins ago",
      status: "completed",
    },
    {
      pair: "BONK/SOL",
      profit: "+$8.90",
      timestamp: "5 mins ago",
      status: "completed",
    },
    {
      pair: "JUP/USDC",
      profit: "-$2.10",
      timestamp: "12 mins ago",
      status: "failed",
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('arbitrage.title')}</h1>
          <p className="text-muted-foreground">
            {t('arbitrage.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <PauseCircle className="h-4 w-4 mr-2" />
            Pause {t('arbitrage.scanner')}
          </Button>
          <Button>
            <PlayCircle className="h-4 w-4 mr-2" />
            Auto Trade
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('arbitrage.activeOpportunities')}</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">Updated 30s ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total {t('arbitrage.profit')} (24h)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+$147.32</div>
            <p className="text-xs text-muted-foreground">15 successful trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">Last 30 trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Opportunity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">4.76%</div>
            <p className="text-xs text-muted-foreground">BONK/SOL spread</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live {t('arbitrage.opportunities')}</CardTitle>
            <CardDescription>
              Real-time price differences across DEXs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.map((opp, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{opp.tokenPair}</h3>
                      <p className="text-sm text-muted-foreground">
                        {opp.dexA} → {opp.dexB}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">{opp.profitPercent}</p>
                      <p className="text-sm text-muted-foreground">{opp.profit}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{opp.dexA}</p>
                      <p className="font-medium">{opp.priceA}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{opp.dexB}</p>
                      <p className="font-medium">{opp.priceB}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{t('arbitrage.risk')}:</span>
                      <span className={`text-sm font-medium ${getRiskColor(opp.risk)}`}>
                        {opp.risk.toUpperCase()}
                      </span>
                    </div>
                    <Button size="sm">
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      {t('arbitrage.execute')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>
              Your latest arbitrage transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrades.map((trade, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{trade.pair}</p>
                    <p className="text-sm text-muted-foreground">{trade.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      trade.status === "completed" ? "text-green-500" : "text-red-500"
                    }`}>
                      {trade.profit}
                    </p>
                    <p className="text-xs text-muted-foreground">{trade.status}</p>
                  </div>
                </div>
              ))}
              
              <div className="text-center">
                <Button variant="outline" size="sm">
                  View All Trades
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategy {t('arbitrage.settings')}</CardTitle>
          <CardDescription>
            Configure your arbitrage trading parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Profit %</label>
              <div className="p-3 border rounded text-center">
                <span className="text-lg font-bold">0.5%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Trade Amount</label>
              <div className="p-3 border rounded text-center">
                <span className="text-lg font-bold">$1,000</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Level</label>
              <div className="p-3 border rounded text-center">
                <span className="text-lg font-bold text-yellow-500">MEDIUM</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}