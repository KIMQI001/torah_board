import { useEffect, useRef, useState, useCallback } from 'react';
import { config } from '@/config';

export interface WebSocketMessage {
  type: 'node_update' | 'capacity_update' | 'performance_update' | 'earnings_update' | 'system_status' | 'cex_announcements' | 'announcement_update';
  data: any;
  timestamp: string;
  userId?: string;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = (url: string, token?: string, options?: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectCount = useRef(0);

  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnect = true,
    reconnectInterval = 5000
  } = options || {};

  const connect = useCallback(() => {
    // 检查是否启用WebSocket
    if (!config.ws.enabled) {
      console.log('WebSocket is disabled in configuration');
      return;
    }
    
    if (!url || !token) {
      console.log('WebSocket connection skipped: URL or token missing', { url, hasToken: !!token });
      return;
    }

    try {
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      console.log('Attempting WebSocket connection to:', url);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectCount.current = 0;
        onConnect?.();
        
        // Subscribe to announcements
        ws.send(JSON.stringify({
          type: 'subscribe_announcements'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();
        
        if (reconnect && reconnectCount.current < 5) {
          reconnectCount.current++;
          console.log(`WebSocket reconnecting in ${reconnectInterval}ms (attempt ${reconnectCount.current}/5)`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket connection failed (this is normal in development without WS server)');
        setError('WebSocket connection failed');
        onError?.(error);
      };

      wsRef.current = ws;
    } catch (err) {
      setError('Failed to create WebSocket connection');
    }
  }, [url, token, onMessage, onConnect, onDisconnect, onError, reconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage
  };
};