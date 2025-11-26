import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from "react";
import type { ClientMessage, ServerMessage, GameState, PlayerGameState } from "@org/types";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface GameSocketState {
  status: ConnectionStatus;
  clientId: string | null;
  sessionToken: string | null;
  gameState: GameState | null;
  playerState: PlayerGameState | null;
  lastMessage: ServerMessage | null;
  error: { code: string; message: string } | null;
}

interface GameSocketContextValue extends GameSocketState {
  connect: () => void;
  disconnect: () => void;
  send: (message: ClientMessage) => void;
  clearError: () => void;
}

const GameSocketContext = createContext<GameSocketContextValue | null>(null);

const SESSION_TOKEN_KEY = "botc_session_token";

function getServerUrl(): string {
  if (import.meta.env.DEV) {
    return "ws://localhost:3000/ws";
  }
  // Production: use the server subdomain
  return `wss://${window.location.hostname.replace("web", "server")}/ws`;
}

export function GameSocketProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameSocketState>({
    status: "disconnected",
    clientId: null,
    sessionToken: localStorage.getItem(SESSION_TOKEN_KEY),
    gameState: null,
    playerState: null,
    lastMessage: null,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = useCallback((message: ServerMessage) => {
    setState((prev) => {
      const updates: Partial<GameSocketState> = { lastMessage: message };

      switch (message.type) {
        case "CONNECTED":
          updates.clientId = message.clientId;
          // Try to reconnect with existing session
          if (prev.sessionToken && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: "RECONNECT", sessionToken: prev.sessionToken })
            );
          }
          break;

        case "LOBBY_CREATED":
        case "LOBBY_JOINED":
          updates.sessionToken = message.sessionToken;
          localStorage.setItem(SESSION_TOKEN_KEY, message.sessionToken);
          break;

        case "GAME_STATE":
          updates.gameState = message.state;
          break;

        case "PLAYER_GAME_STATE":
          updates.playerState = message.state;
          break;

        case "CHARACTER_ASSIGNED":
          if (prev.playerState) {
            updates.playerState = {
              ...prev.playerState,
              assignedCharacter: message.character,
            };
          }
          break;

        case "PLAYER_JOINED":
          if (prev.gameState) {
            updates.gameState = {
              ...prev.gameState,
              players: [...prev.gameState.players, message.player],
            };
          }
          break;

        case "PLAYER_LEFT":
          if (prev.gameState) {
            updates.gameState = {
              ...prev.gameState,
              players: prev.gameState.players.filter((p) => p.id !== message.playerId),
            };
          }
          break;

        case "PLAYER_DISCONNECTED":
          if (prev.gameState) {
            updates.gameState = {
              ...prev.gameState,
              players: prev.gameState.players.map((p) =>
                p.id === message.playerId ? { ...p, connected: false } : p
              ),
            };
          }
          break;

        case "PLAYER_RECONNECTED":
          if (prev.gameState) {
            updates.gameState = {
              ...prev.gameState,
              players: prev.gameState.players.map((p) =>
                p.id === message.playerId ? { ...p, connected: true } : p
              ),
            };
          }
          break;

        case "CHARACTERS_SELECTED":
          if (prev.gameState) {
            updates.gameState = {
              ...prev.gameState,
              selectedCharacters: message.characterIds,
              phase: "waiting_for_players",
            };
          }
          break;

        case "GAME_STARTED":
          if (prev.gameState) {
            updates.gameState = { ...prev.gameState, phase: "playing" };
          }
          if (prev.playerState) {
            updates.playerState = { ...prev.playerState, phase: "playing" };
          }
          break;

        case "ERROR":
          updates.error = { code: message.code, message: message.message };
          break;
      }

      return { ...prev, ...updates };
    });
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({ ...prev, status: "connecting", error: null }));

    const ws = new WebSocket(getServerUrl());

    ws.onopen = () => {
      setState((prev) => ({ ...prev, status: "connected" }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        handleMessage(message);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, status: "disconnected" }));
      wsRef.current = null;

      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: { code: "CONNECTION_ERROR", message: "Failed to connect to server" },
      }));
    };

    wsRef.current = ws;
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setState((prev) => ({ ...prev, status: "disconnected" }));
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket not connected");
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  const value: GameSocketContextValue = {
    ...state,
    connect,
    disconnect,
    send,
    clearError,
  };

  return (
    <GameSocketContext.Provider value={value}>{children}</GameSocketContext.Provider>
  );
}

export function useGameSocket(): GameSocketContextValue {
  const context = useContext(GameSocketContext);
  if (!context) {
    throw new Error("useGameSocket must be used within a GameSocketProvider");
  }
  return context;
}

