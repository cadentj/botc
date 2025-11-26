import type { ServerMessage } from "@org/types";

export interface ClientInfo {
  ws: {
    send: (data: string) => void;
    close: () => void;
  };
  playerId?: string;
  lobbyId?: string;
}

export class ConnectionManager {
  private clients = new Map<string, ClientInfo>();

  register(clientId: string, ws: ClientInfo["ws"]): void {
    this.clients.set(clientId, { ws });
  }

  get(clientId: string): ClientInfo | undefined {
    return this.clients.get(clientId);
  }

  update(clientId: string, updates: Partial<ClientInfo>): void {
    const client = this.clients.get(clientId);
    if (client) {
      Object.assign(client, updates);
    }
  }

  getByPlayerId(playerId: string): ClientInfo | undefined {
    for (const client of this.clients.values()) {
      if (client.playerId === playerId) {
        return client;
      }
    }
    return undefined;
  }

  getByLobbyId(lobbyId: string): ClientInfo[] {
    const result: ClientInfo[] = [];
    for (const client of this.clients.values()) {
      if (client.lobbyId === lobbyId) {
        result.push(client);
      }
    }
    return result;
  }

  sendToClient(clientId: string, message: ServerMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcastToLobby(lobbyId: string, message: ServerMessage, excludeClientId?: string): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.lobbyId === lobbyId && clientId !== excludeClientId) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  remove(clientId: string): void {
    this.clients.delete(clientId);
  }

  disconnectPlayer(playerId: string, message: ServerMessage): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.playerId === playerId) {
        client.ws.send(JSON.stringify(message));
        client.ws.close();
        this.clients.delete(clientId);
        break;
      }
    }
  }

  getAll(): Map<string, ClientInfo> {
    return this.clients;
  }
}

export const connectionManager = new ConnectionManager();

