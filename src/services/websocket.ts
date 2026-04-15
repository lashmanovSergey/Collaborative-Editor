import { io, Socket } from 'socket.io-client';
import { config } from '../config';

export interface WebSocketMessage {
  type: 'content_change' | 'cursor_change' | 'user_joined' | 'user_left';
  data: any;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: Map<string, ((data: any) => void)[]> = new Map();
  private roomGuid: string = '';

  constructor() {
    this.socket = null;
  }

  connect(roomGuid: string): void {
    this.roomGuid = roomGuid;
    const token = localStorage.getItem('token');
    
    this.socket = io(`${config.wsUrl}/ws/${roomGuid}`, {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendContentChange(content: string): void {
    this.sendMessage('content_change', { content });
  }

  sendCursorChange(position: { line: number; column: number }): void {
    this.sendMessage('cursor_change', { position });
  }

  private sendMessage(type: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message', { type, data });
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.callbacks.get(message.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message.data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const webSocketService = new WebSocketService();