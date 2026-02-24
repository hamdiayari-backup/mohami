export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private conversationId: string | null = null;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      // Auto-detect URL based on environment
      const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      const protocol = isProduction ? 'wss:' : 'ws:';
      const host = isProduction ? window.location.host : 'localhost:8082';
      this.url = `${protocol}//${host}${isProduction ? '/ws' : ''}`;
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket closed');
          this.ws = null;
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect().catch(() => {
          // Reconnection will be attempted again
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    if (data.type && this.listeners.has(data.type)) {
      this.listeners.get(data.type)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  joinConversation(conversationId: string, userId?: string, userName?: string, isAdmin: boolean = false) {
    this.conversationId = conversationId;
    this.send({
      type: 'join',
      conversationId,
      userId,
      userName,
      isAdmin
    });
  }

  sendMessage(text: string, senderName: string, attachments?: any[]) {
    if (!this.conversationId) {
      throw new Error('Not joined to a conversation');
    }
    this.send({
      type: 'message',
      text,
      senderName,
      attachments: attachments || []
    });
  }

  sendTyping(isTyping: boolean, senderName: string) {
    if (!this.conversationId) return;
    this.send({
      type: 'typing',
      isTyping,
      senderName
    });
  }

  markAsRead() {
    if (!this.conversationId) return;
    this.send({
      type: 'read'
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.conversationId = null;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
