import type { ClientMessage, ServerMessage } from "@org/types";
import { useGameStore } from "./store";

function getServerUrl(): string {
  if (import.meta.env.DEV) {
    return "ws://localhost:3000/ws";
  }
  // Production: use the server subdomain
  return `wss://${window.location.hostname.replace("web", "server")}/ws`;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Always get fresh state/actions from the store
  private get store() {
    return useGameStore.getState();
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.store.setStatus("connecting");
    this.store.clearError();

    const ws = new WebSocket(getServerUrl());

    ws.onopen = () => {
      this.store.setStatus("connected");
      
      // Try to reconnect with existing session
      const sessionToken = this.store.sessionToken;
      if (sessionToken && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "RECONNECT", sessionToken })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        this.store.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    ws.onclose = () => {
      this.store.setStatus("disconnected");
      this.ws = null;

      // Auto-reconnect after 3 seconds
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 3000);
    };

    ws.onerror = () => {
      this.store.setStatus("error");
      this.store.setError({
        code: "CONNECTION_ERROR",
        message: "Failed to connect to server",
      });
    };

    this.ws = ws;
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    this.store.setStatus("disconnected");
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket not connected");
    }
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

// Export functions for use in components
export function connect(): void {
  wsManager.connect();
}

export function disconnect(): void {
  wsManager.disconnect();
}

export function send(message: ClientMessage): void {
  wsManager.send(message);
}
