"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Star, Eye } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function MemePage() {
  const { t } = useLanguage();
  
  const memeCoins = [
    {
      name: "PEPE",
      symbol: "PEPE",
      price: "$0.000021",
      change: "+15.7%",
      marketCap: "$8.9B",
      volume: "$1.2B",
      trending: "up",
    },
    {
      name: "Shiba Inu",
      symbol: "SHIB",
      price: "$0.000024",
      change: "-3.2%",
      marketCap: "$14.1B",
      volume: "$890M",
      trending: "down",
    },
    {
      name: "Dogwifhat",
      symbol: "WIF",
      price: "$2.84",
      change: "+8.5%",
      marketCap: "$2.8B",
      volume: "$156M",
      trending: "up",
    },
    {
      name: "Floki",
      symbol: "FLOKI",
      price: "$0.000198",
      change: "+22.4%",
      marketCap: "$1.9B",
      volume: "$89M",
      trending: "up",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('meme.title')}</h1>
          <p className="text-muted-foreground">
            {t('meme.subtitle')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Star className="h-4 w-4 mr-2" />
            {t('meme.watchlist')}
          </Button>
          <Button>
            <Eye className="h-4 w-4 mr-2" />
            {t('meme.discoverNew')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('meme.marketSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('meme.totalMarketCap')}</span>
                <span className="font-medium">$27.7B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('meme.volume24h')}</span>
                <span className="font-medium">$2.3B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('meme.trendingCoins')}</span>
                <span className="font-medium text-green-500">+18.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('meme.watchlist')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2" />
                <p>{t('meme.addToWatchlist')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('meme.alerts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2" />
                <p>{t('meme.setPriceAlerts')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('meme.trendingMemeCoins')}</CardTitle>
          <CardDescription>
            {t('meme.mostPopular')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memeCoins.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold">
                    {coin.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{coin.name}</h3>
                    <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">{coin.price}</p>
                  <p className={`text-sm flex items-center ${
                    coin.trending === "up" ? "text-green-500" : "text-red-500"
                  }`}>
                    {coin.trending === "up" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {coin.change}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('meme.marketCap')}</p>
                  <p className="font-medium">{coin.marketCap}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('meme.volume')}</p>
                  <p className="font-medium">{coin.volume}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}