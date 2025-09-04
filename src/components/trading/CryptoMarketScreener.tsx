"use client"

import React from 'react';
import { CryptoCurrencyMarket } from 'react-ts-tradingview-widgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface CryptoMarketScreenerProps {
  className?: string;
}

export function CryptoMarketScreener({ className }: CryptoMarketScreenerProps) {
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>加密货币市场</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <CryptoCurrencyMarket
              colorTheme="light"
              width="100%"
              height="490"
              defaultColumn="overview"
              screener_type="crypto_mkt"
              displayCurrency="USD"
              locale="zh_CN"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}