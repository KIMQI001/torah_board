import WebSocket from 'ws';
import EventEmitter from 'events';

export interface RealTimePriceUpdate {
  symbol: string;
  exchange: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  timestamp: number;
}

export class WebSocketPriceService extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnecting: Map<string, boolean> = new Map();

  constructor() {
    super();
  }

  // Binance WebSocket连接
  connectBinanceStream(symbols: string[]) {
    const streamName = 'binance';
    
    if (this.connections.has(streamName)) {
      this.connections.get(streamName)?.close();
    }

    // 创建stream字符串，例如: btcusdt@ticker/ethusdt@ticker
    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;

    this.connectWebSocket(streamName, wsUrl, (data) => {
      try {
        const ticker = JSON.parse(data.toString());
        
        // 处理单个ticker或多个ticker数组
        const tickers = Array.isArray(ticker) ? ticker : [ticker];
        
        tickers.forEach(t => {
          if (t.s && t.c) { // symbol and close price exist
            const update: RealTimePriceUpdate = {
              symbol: t.s,
              exchange: 'binance',
              price: parseFloat(t.c),
              priceChange: parseFloat(t.p || '0'),
              priceChangePercent: parseFloat(t.P || '0'),
              volume: parseFloat(t.v || '0'),
              timestamp: Date.now()
            };
            
            this.emit('priceUpdate', update);
          }
        });
      } catch (error) {
        console.error('Error parsing Binance WebSocket data:', error);
      }
    });
  }

  // OKX WebSocket连接
  connectOKXStream(symbols: string[]) {
    const streamName = 'okx';
    
    if (this.connections.has(streamName)) {
      this.connections.get(streamName)?.close();
    }

    const wsUrl = 'wss://ws.okx.com:8443/ws/v5/public';
    
    this.connectWebSocket(streamName, wsUrl, (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.data && Array.isArray(message.data)) {
          message.data.forEach((ticker: any) => {
            const update: RealTimePriceUpdate = {
              symbol: ticker.instId?.replace('-', '') || '',
              exchange: 'okx',
              price: parseFloat(ticker.last || '0'),
              priceChange: parseFloat(ticker.change24h || '0'),
              priceChangePercent: parseFloat(ticker.chgUtc24h || '0') * 100,
              volume: parseFloat(ticker.vol24h || '0'),
              timestamp: Date.now()
            };
            
            this.emit('priceUpdate', update);
          });
        }
      } catch (error) {
        console.error('Error parsing OKX WebSocket data:', error);
      }
    }, () => {
      // 订阅ticker数据
      const subscribeMessage = {
        op: 'subscribe',
        args: symbols.map(symbol => ({
          channel: 'tickers',
          instId: symbol
        }))
      };
      
      const ws = this.connections.get(streamName);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(subscribeMessage));
      }
    });
  }

  // Gate.io WebSocket连接
  connectGateStream(symbols: string[]) {
    const streamName = 'gate';
    
    if (this.connections.has(streamName)) {
      this.connections.get(streamName)?.close();
    }

    const wsUrl = 'wss://api.gateio.ws/ws/v4/';
    
    this.connectWebSocket(streamName, wsUrl, (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.method === 'ticker.update' && message.params) {
          const [symbol, ticker] = message.params;
          
          const update: RealTimePriceUpdate = {
            symbol: symbol?.replace('_', '') || '',
            exchange: 'gate',
            price: parseFloat(ticker.last || '0'),
            priceChange: parseFloat(ticker.change_percentage || '0'),
            priceChangePercent: parseFloat(ticker.change_percentage || '0'),
            volume: parseFloat(ticker.base_volume || '0'),
            timestamp: Date.now()
          };
          
          this.emit('priceUpdate', update);
        }
      } catch (error) {
        console.error('Error parsing Gate WebSocket data:', error);
      }
    }, () => {
      // 订阅ticker数据
      const subscribeMessage = {
        id: 1,
        method: 'ticker.subscribe',
        params: symbols.map(symbol => symbol.replace('USDT', '_USDT'))
      };
      
      const ws = this.connections.get(streamName);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(subscribeMessage));
      }
    });
  }

  private connectWebSocket(
    name: string, 
    url: string, 
    onMessage: (data: WebSocket.Data) => void,
    onOpen?: () => void
  ) {
    if (this.isConnecting.get(name)) {
      return;
    }

    this.isConnecting.set(name, true);

    try {
      const ws = new WebSocket(url);
      
      ws.on('open', () => {
        console.log(`✓ ${name} WebSocket连接已建立`);
        this.reconnectAttempts.set(name, 0);
        this.isConnecting.set(name, false);
        
        if (onOpen) {
          onOpen();
        }
        
        this.emit('connected', name);
      });

      ws.on('message', onMessage);

      ws.on('error', (error) => {
        console.error(`${name} WebSocket错误:`, error);
        this.isConnecting.set(name, false);
        this.emit('error', { exchange: name, error });
      });

      ws.on('close', (code, reason) => {
        console.log(`${name} WebSocket连接关闭: ${code} - ${reason}`);
        this.connections.delete(name);
        this.isConnecting.set(name, false);
        
        // 自动重连
        this.scheduleReconnect(name, url, onMessage, onOpen);
        
        this.emit('disconnected', name);
      });

      // 心跳检测
      ws.on('pong', () => {
        console.log(`${name} WebSocket心跳响应`);
      });

      // 定期发送ping
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      this.connections.set(name, ws);

    } catch (error) {
      console.error(`创建${name} WebSocket连接失败:`, error);
      this.isConnecting.set(name, false);
      this.scheduleReconnect(name, url, onMessage, onOpen);
    }
  }

  private scheduleReconnect(
    name: string, 
    url: string, 
    onMessage: (data: WebSocket.Data) => void,
    onOpen?: () => void
  ) {
    const attempts = this.reconnectAttempts.get(name) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectInterval * Math.pow(2, attempts); // 指数退避
      
      console.log(`${name} WebSocket将在${delay}ms后重连 (第${attempts + 1}次尝试)`);
      
      setTimeout(() => {
        this.reconnectAttempts.set(name, attempts + 1);
        this.connectWebSocket(name, url, onMessage, onOpen);
      }, delay);
    } else {
      console.error(`${name} WebSocket重连次数已达上限，停止重连`);
      this.reconnectAttempts.delete(name);
    }
  }

  // 连接所有交易所的实时数据流
  connectAllStreams(symbols: string[]) {
    console.log('开始连接所有交易所WebSocket流...', symbols);
    
    this.connectBinanceStream(symbols);
    
    // 稍微延迟连接其他交易所，避免并发连接问题
    setTimeout(() => {
      this.connectOKXStream(symbols.map(s => s.replace('USDT', '-USDT')));
    }, 1000);
    
    setTimeout(() => {
      this.connectGateStream(symbols);
    }, 2000);
  }

  // 断开所有连接
  disconnectAll() {
    console.log('断开所有WebSocket连接...');
    
    this.connections.forEach((ws, name) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    
    this.connections.clear();
    this.reconnectAttempts.clear();
    this.isConnecting.clear();
  }

  // 获取连接状态
  getConnectionStatus() {
    const status: Record<string, string> = {};
    
    this.connections.forEach((ws, name) => {
      switch (ws.readyState) {
        case WebSocket.CONNECTING:
          status[name] = 'connecting';
          break;
        case WebSocket.OPEN:
          status[name] = 'connected';
          break;
        case WebSocket.CLOSING:
          status[name] = 'closing';
          break;
        case WebSocket.CLOSED:
          status[name] = 'closed';
          break;
        default:
          status[name] = 'unknown';
      }
    });
    
    return status;
  }

  // 重新连接特定交易所
  reconnectExchange(exchange: string, symbols: string[]) {
    switch (exchange.toLowerCase()) {
      case 'binance':
        this.connectBinanceStream(symbols);
        break;
      case 'okx':
        this.connectOKXStream(symbols.map(s => s.replace('USDT', '-USDT')));
        break;
      case 'gate':
        this.connectGateStream(symbols);
        break;
      default:
        console.error(`未知的交易所: ${exchange}`);
    }
  }
}

// 导出单例实例
export const webSocketPriceService = new WebSocketPriceService();