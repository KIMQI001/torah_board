/**
 * Price Service for fetching real-time cryptocurrency prices
 */

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

interface TokenPrice {
  symbol: string;
  price: number;
  change24h?: number;
  lastUpdated: number;
}

class PriceService {
  private static instance: PriceService;
  private cache: Map<string, TokenPrice> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE = 'https://api.coingecko.com/api/v3';

  // Token symbol to CoinGecko ID mapping
  private readonly tokenMap: Record<string, string> = {
    'FIL': 'filecoin',
    'HNT': 'helium',
    'RNDR': 'render-token',
    'AR': 'arweave',
    'STORJ': 'storj',
    'SC': 'siacoin',
    'THETA': 'theta-token',
    'TFUEL': 'theta-fuel',
    'IOTX': 'iotex',
    'DBC': 'deepbrain-chain',
    'GPU': 'gpu-coin',
    'AKASH': 'akash-network',
    'AKT': 'akash-network',
    'FLUX': 'zelcash',
    'TAO': 'bittensor',
    'DIMO': 'dimo',
    'MOBILE': 'helium-mobile',
    'IOT': 'helium-iot'
  };

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  private getCoinGeckoId(symbol: string): string {
    return this.tokenMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private isCacheValid(tokenPrice: TokenPrice): boolean {
    return Date.now() - tokenPrice.lastUpdated < this.CACHE_DURATION;
  }

  /**
   * Get price for a single token
   */
  async getTokenPrice(symbol: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol.toUpperCase());
      if (cached && this.isCacheValid(cached)) {
        return cached.price;
      }

      const coinId = this.getCoinGeckoId(symbol);
      const response = await fetch(
        `${this.API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
        {
          headers: {
            'Accept': 'application/json',
          },
          // Add timeout and error handling
          signal: AbortSignal.timeout(5000)
        }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch price for ${symbol}: ${response.status}`);
        return 0;
      }

      const data: CoinGeckoPriceResponse = await response.json();
      const priceData = data[coinId];
      
      if (!priceData || typeof priceData.usd !== 'number') {
        console.warn(`No price data found for ${symbol} (${coinId})`);
        return 0;
      }

      const tokenPrice: TokenPrice = {
        symbol: symbol.toUpperCase(),
        price: priceData.usd,
        change24h: priceData.usd_24h_change,
        lastUpdated: Date.now()
      };

      // Update cache
      this.cache.set(symbol.toUpperCase(), tokenPrice);
      
      return tokenPrice.price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      // Return cached price if available, even if expired
      const cached = this.cache.get(symbol.toUpperCase());
      return cached?.price || 0;
    }
  }

  /**
   * Get prices for multiple tokens at once
   */
  async getTokenPrices(symbols: string[]): Promise<Record<string, number>> {
    try {
      const uniqueSymbols = Array.from(new Set(symbols.map(s => s.toUpperCase())));
      const prices: Record<string, number> = {};

      // Check cache first and separate cached vs uncached
      const uncachedSymbols: string[] = [];
      
      for (const symbol of uniqueSymbols) {
        const cached = this.cache.get(symbol);
        if (cached && this.isCacheValid(cached)) {
          prices[symbol] = cached.price;
        } else {
          uncachedSymbols.push(symbol);
        }
      }

      // Fetch uncached prices
      if (uncachedSymbols.length > 0) {
        const coinIds = uncachedSymbols.map(symbol => this.getCoinGeckoId(symbol));
        const idsParam = coinIds.join(',');
        
        const response = await fetch(
          `${this.API_BASE}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(8000)
          }
        );

        if (response.ok) {
          const data: CoinGeckoPriceResponse = await response.json();
          
          uncachedSymbols.forEach((symbol, index) => {
            const coinId = coinIds[index];
            const priceData = data[coinId];
            
            if (priceData && typeof priceData.usd === 'number') {
              const tokenPrice: TokenPrice = {
                symbol,
                price: priceData.usd,
                change24h: priceData.usd_24h_change,
                lastUpdated: Date.now()
              };
              
              this.cache.set(symbol, tokenPrice);
              prices[symbol] = tokenPrice.price;
            } else {
              console.warn(`No price data found for ${symbol} (${coinId})`);
              prices[symbol] = 0;
            }
          });
        } else {
          console.warn(`Batch price fetch failed: ${response.status}`);
          // Set uncached symbols to 0
          uncachedSymbols.forEach(symbol => {
            prices[symbol] = 0;
          });
        }
      }

      return prices;
    } catch (error) {
      console.error('Error fetching batch prices:', error);
      // Return whatever we have, fill missing with 0
      const result: Record<string, number> = {};
      symbols.forEach(symbol => {
        const cached = this.cache.get(symbol.toUpperCase());
        result[symbol.toUpperCase()] = cached?.price || 0;
      });
      return result;
    }
  }

  /**
   * Get cached price without making API call
   */
  getCachedPrice(symbol: string): number {
    const cached = this.cache.get(symbol.toUpperCase());
    return cached?.price || 0;
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): { size: number; symbols: string[] } {
    return {
      size: this.cache.size,
      symbols: Array.from(this.cache.keys())
    };
  }
}

export const priceService = PriceService.getInstance();
export type { TokenPrice };