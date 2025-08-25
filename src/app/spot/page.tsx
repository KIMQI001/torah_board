"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Bell, PieChart } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function SpotPage() {
  const { t } = useLanguage();
  
  const portfolio = [
    {
      symbol: "SOL",
      name: "Solana",
      amount: "45.6",
      value: "$4,487.20",
      price: "$98.45",
      change: "+2.3%",
      allocation: "32%",
      trending: "up",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      amount: "2.8",
      value: "$6,720.00",
      price: "$2,400.00",
      change: "-1.2%",
      allocation: "48%",
      trending: "down",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      amount: "0.125",
      value: "$5,375.00",
      price: "$43,000.00",
      change: "+0.8%",
      allocation: "20%",
      trending: "up",
    },
  ];

  const marketData = [
    {
      pair: "SOL/USDC",
      price: "$98.45",
      change: "+2.3%",
      volume: "$1.2B",
      high: "$99.12",
      low: "$96.88",
      trending: "up",
    },
    {
      pair: "ETH/USDC",
      price: "$2,400.00",
      change: "-1.2%",
      volume: "$2.8B",
      high: "$2,445.00",
      low: "$2,380.00",
      trending: "down",
    },
    {
      pair: "BTC/USDC",
      price: "$43,000.00",
      change: "+0.8%",
      volume: "$5.1B",
      high: "$43,250.00",
      low: "$42,750.00",
      trending: "up",
    },
  ];

  const totalValue = portfolio.reduce((sum, asset) => sum + parseFloat(asset.value.replace(/[$,]/g, '')), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('spot.title')}</h1>
          <p className="text-muted-foreground">
            {t('spot.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            {t('tools.priceAlerts')}
          </Button>
          <Button>
            <PieChart className="h-4 w-4 mr-2" />
            Rebalance
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total {t('spot.portfolio')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +5.2% this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+$248.90</div>
            <p className="text-xs text-muted-foreground">+1.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SOL</div>
            <p className="text-xs text-muted-foreground text-green-500">+2.3%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Price triggers set</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('spot.portfolio')} Holdings</CardTitle>
            <CardDescription>
              Your current spot positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold">
                      {asset.symbol}
                    </div>
                    <div>
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">{asset.amount} {asset.symbol}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{asset.value}</p>
                    <p className={`text-sm flex items-center justify-end ${
                      asset.trending === "up" ? "text-green-500" : "text-red-500"
                    }`}>
                      {asset.trending === "up" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {asset.change}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Allocation</p>
                    <p className="font-medium">{asset.allocation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>
              Real-time spot market data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketData.map((market) => (
                <div key={market.pair} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{market.pair}</h3>
                      <p className="text-sm text-muted-foreground">{t('meme.volume')}: {market.volume}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{market.price}</p>
                      <p className={`text-sm flex items-center ${
                        market.trending === "up" ? "text-green-500" : "text-red-500"
                      }`}>
                        {market.trending === "up" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {market.change}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">24h High</p>
                      <p className="font-medium">{market.high}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">24h Low</p>
                      <p className="font-medium">{market.low}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('tools.priceAlerts')}</CardTitle>
          <CardDescription>
            Manage your price notification triggers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">SOL/USDC</h3>
                  <p className="text-sm text-muted-foreground">Above $100.00</p>
                </div>
                <div className="text-sm text-green-500 font-medium">ACTIVE</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: $98.45 • Target: $100.00
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">ETH/USDC</h3>
                  <p className="text-sm text-muted-foreground">Below $2,300.00</p>
                </div>
                <div className="text-sm text-yellow-500 font-medium">ACTIVE</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: $2,400.00 • Target: $2,300.00
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">BTC/USDC</h3>
                  <p className="text-sm text-muted-foreground">Above $45,000.00</p>
                </div>
                <div className="text-sm text-green-500 font-medium">ACTIVE</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: $43,000.00 • Target: $45,000.00
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Add New Alert
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}