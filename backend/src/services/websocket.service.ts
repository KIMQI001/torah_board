import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Logger } from '@/utils/logger';
import { JwtUtil } from '@/utils/jwt';

export interface WebSocketMessage {
  type: 'node_update' | 'capacity_update' | 'performance_update' | 'earnings_update' | 'system_status' | 'cex_announcements' | 'announcement_update';
  data: any;
  timestamp: string;
  userId?: string;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  walletAddress?: string;
  isAuthenticated?: boolean;
}

export class WebSocketService {
  private static wss: WebSocketServer | null = null;
  private static clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  /**
   * Initialize WebSocket server
   */
  static initialize(port: number): void {
    try {
      this.wss = new WebSocketServer({ 
        port,
        verifyClient: this.verifyClient.bind(this)
      });

      this.wss.on('connection', this.handleConnection.bind(this));
      
      Logger.info('WebSocket server initialized', { port });

    } catch (error) {
      Logger.error('Failed to initialize WebSocket server', {
        error: error.message,
        port
      });
    }
  }

  /**
   * Verify WebSocket client connection with JWT authentication
   */
  private static verifyClient(info: { req: IncomingMessage }): boolean {
    try {
      const url = new URL(info.req.url || '', 'ws://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        Logger.warn('WebSocket connection rejected: No token provided');
        return false;
      }

      const decoded = JwtUtil.verify(token);
      if (!decoded) {
        Logger.warn('WebSocket connection rejected: Invalid token');
        return false;
      }

      // Store user info in request for later use
      (info.req as any).user = decoded;
      return true;

    } catch (error) {
      Logger.warn('WebSocket connection rejected: Authentication failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private static handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage): void {
    try {
      const user = (req as any).user;
      if (!user) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Set user information on WebSocket
      ws.userId = user.userId;
      ws.walletAddress = user.walletAddress;
      ws.isAuthenticated = true;

      // Add client to user's connections
      if (!this.clients.has(user.userId)) {
        this.clients.set(user.userId, new Set());
      }
      this.clients.get(user.userId)!.add(ws);

      Logger.info('WebSocket client connected', {
        userId: user.userId,
        walletAddress: user.walletAddress,
        totalConnections: this.getTotalConnections()
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'system_status',
        data: {
          message: 'Connected to DePIN Dashboard WebSocket',
          userId: user.userId,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

      // Handle WebSocket messages
      ws.on('message', (data) => {
        this.handleMessage(ws, data);
      });

      // Handle connection close
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        Logger.error('WebSocket error', {
          error: error.message,
          userId: ws.userId
        });
      });

    } catch (error) {
      Logger.error('Error handling WebSocket connection', {
        error: error.message
      });
      ws.close(1011, 'Server error');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private static handleMessage(ws: AuthenticatedWebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      
      Logger.debug('WebSocket message received', {
        userId: ws.userId,
        messageType: message.type
      });

      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, {
            type: 'system_status',
            data: { message: 'pong' },
            timestamp: new Date().toISOString()
          });
          break;

        case 'subscribe_node_updates':
          // Client wants to subscribe to node updates
          this.sendToClient(ws, {
            type: 'system_status',
            data: { message: 'Subscribed to node updates' },
            timestamp: new Date().toISOString()
          });
          break;

        case 'subscribe_announcements':
          // Client wants to subscribe to CEX announcements
          this.sendToClient(ws, {
            type: 'system_status',
            data: { message: 'Subscribed to CEX announcements' },
            timestamp: new Date().toISOString()
          });
          break;

        default:
          Logger.warn('Unknown WebSocket message type', {
            messageType: message.type,
            userId: ws.userId
          });
      }

    } catch (error) {
      Logger.error('Error handling WebSocket message', {
        error: error.message,
        userId: ws.userId
      });
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private static handleDisconnection(ws: AuthenticatedWebSocket): void {
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId)!.delete(ws);
      
      // Remove empty sets
      if (this.clients.get(ws.userId)!.size === 0) {
        this.clients.delete(ws.userId);
      }
    }

    Logger.info('WebSocket client disconnected', {
      userId: ws.userId,
      walletAddress: ws.walletAddress,
      totalConnections: this.getTotalConnections()
    });
  }

  /**
   * Send message to a specific client
   */
  private static sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      Logger.error('Error sending WebSocket message to client', {
        error: error.message,
        userId: ws.userId
      });
    }
  }

  /**
   * Broadcast message to all clients of a specific user
   */
  static broadcastToUser(userId: string, message: WebSocketMessage): void {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    message.userId = userId;
    message.timestamp = new Date().toISOString();

    let sentCount = 0;
    userClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, message);
        sentCount++;
      } else {
        // Remove dead connections
        userClients.delete(ws);
      }
    });

    if (sentCount > 0) {
      Logger.debug('Broadcasted message to user', {
        userId,
        messageType: message.type,
        clientCount: sentCount
      });
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  static broadcastToAll(message: WebSocketMessage): void {
    message.timestamp = new Date().toISOString();
    
    let totalSent = 0;
    this.clients.forEach((userClients, userId) => {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendToClient(ws, message);
          totalSent++;
        }
      });
    });

    if (totalSent > 0) {
      Logger.info('Broadcasted message to all clients', {
        messageType: message.type,
        clientCount: totalSent
      });
    }
  }

  /**
   * Send node update notification
   */
  static notifyNodeUpdate(userId: string, nodeData: any): void {
    this.broadcastToUser(userId, {
      type: 'node_update',
      data: nodeData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send capacity update notification
   */
  static notifyCapacityUpdate(userId: string, nodeId: string, capacity: string): void {
    this.broadcastToUser(userId, {
      type: 'capacity_update',
      data: {
        nodeId,
        capacity,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send performance update notification
   */
  static notifyPerformanceUpdate(userId: string, nodeId: string, performance: any): void {
    this.broadcastToUser(userId, {
      type: 'performance_update',
      data: {
        nodeId,
        performance,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send earnings update notification
   */
  static notifyEarningsUpdate(userId: string, earnings: any): void {
    this.broadcastToUser(userId, {
      type: 'earnings_update',
      data: earnings,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast new CEX announcements to all clients
   */
  static broadcastCEXAnnouncements(announcements: any[]): void {
    if (announcements.length === 0) return;

    this.broadcastToAll({
      type: 'cex_announcements',
      data: {
        announcements,
        count: announcements.length,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast announcement update to all clients
   */
  static broadcastAnnouncementUpdate(message: string, data?: any): void {
    this.broadcastToAll({
      type: 'announcement_update',
      data: {
        message,
        ...data,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get total number of active connections
   */
  static getTotalConnections(): number {
    let total = 0;
    this.clients.forEach(userClients => {
      total += userClients.size;
    });
    return total;
  }

  /**
   * Get connection statistics
   */
  static getConnectionStats(): {
    totalUsers: number;
    totalConnections: number;
    userConnections: Array<{ userId: string; connections: number }>;
  } {
    const stats = {
      totalUsers: this.clients.size,
      totalConnections: this.getTotalConnections(),
      userConnections: Array.from(this.clients.entries()).map(([userId, clients]) => ({
        userId,
        connections: clients.size
      }))
    };

    return stats;
  }

  /**
   * Close all connections and stop the server
   */
  static stop(): void {
    if (this.wss) {
      Logger.info('Stopping WebSocket server...');
      
      // Close all client connections
      this.clients.forEach(userClients => {
        userClients.forEach(ws => {
          ws.close(1001, 'Server shutting down');
        });
      });

      this.clients.clear();
      this.wss.close();
      this.wss = null;
      
      Logger.info('WebSocket server stopped');
    }
  }
}