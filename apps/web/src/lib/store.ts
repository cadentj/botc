import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ServerMessage, GameState, PlayerGameState, PlayerInfo } from "@org/types";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface GameStore {
  // Connection state
  status: ConnectionStatus;
  clientId: string | null;
  sessionToken: string | null;
  
  // Game state (source of truth)
  gameState: GameState | null;
  playerState: PlayerGameState | null;
  lastMessage: ServerMessage | null;
  
  // Error state
  error: { code: string; message: string } | null;
  
  // Actions
  setStatus: (status: ConnectionStatus) => void;
  setClientId: (clientId: string | null) => void;
  setSessionToken: (token: string | null) => void;
  setGameState: (state: GameState | null) => void;
  setPlayerState: (state: PlayerGameState | null) => void;
  setLastMessage: (message: ServerMessage | null) => void;
  setError: (error: { code: string; message: string } | null) => void;
  clearError: () => void;
  
  // Helper to handle server messages
  handleMessage: (message: ServerMessage) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void, get: () => GameStore): GameStore => ({
      // Initial state
      status: "disconnected",
      clientId: null,
      sessionToken: null,
      gameState: null,
      playerState: null,
      lastMessage: null,
      error: null,
      
      // Actions
      setStatus: (status: ConnectionStatus) => set({ status }),
      setClientId: (clientId: string | null) => set({ clientId }),
      setSessionToken: (token: string | null) => {
        set({ sessionToken: token });
        if (token) {
          localStorage.setItem("botc_session_token", token);
        } else {
          localStorage.removeItem("botc_session_token");
        }
      },
      setGameState: (state: GameState | null) => set({ gameState: state }),
      setPlayerState: (state: PlayerGameState | null) => set({ playerState: state }),
      setLastMessage: (message: ServerMessage | null) => set({ lastMessage: message }),
      setError: (error: { code: string; message: string } | null) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Handle server messages
      handleMessage: (message: ServerMessage): void => {
        set({ lastMessage: message });
        
        switch (message.type) {
          case "CONNECTED":
            set({ clientId: message.clientId });
            break;
            
          case "LOBBY_CREATED":
          case "LOBBY_JOINED":
            get().setSessionToken(message.sessionToken);
            break;
            
          case "GAME_STATE":
            set({ gameState: message.state });
            break;
            
          case "PLAYER_GAME_STATE":
            set({ playerState: message.state });
            break;
            
          case "CHARACTER_ASSIGNED": {
            const currentPlayerState = get().playerState;
            if (currentPlayerState) {
              set({
                playerState: {
                  ...currentPlayerState,
                  assignedCharacter: message.character,
                },
              });
            }
            break;
          }
            
          case "PLAYER_JOINED": {
            const currentGameState = get().gameState;
            if (currentGameState) {
              set({
                gameState: {
                  ...currentGameState,
                  players: [...currentGameState.players, message.player],
                },
              });
            }
            break;
          }
            
          case "PLAYER_LEFT": {
            const gameState = get().gameState;
            if (gameState) {
              set({
                gameState: {
                  ...gameState,
                  players: gameState.players.filter((p: PlayerInfo) => p.id !== message.playerId),
                },
              });
            }
            break;
          }
            
          case "PLAYER_DISCONNECTED": {
            const gs = get().gameState;
            if (gs) {
              set({
                gameState: {
                  ...gs,
                  players: gs.players.map((p: PlayerInfo) =>
                    p.id === message.playerId ? { ...p, connected: false } : p
                  ),
                },
              });
            }
            break;
          }
            
          case "PLAYER_RECONNECTED": {
            const gs2 = get().gameState;
            if (gs2) {
              set({
                gameState: {
                  ...gs2,
                  players: gs2.players.map((p: PlayerInfo) =>
                    p.id === message.playerId ? { ...p, connected: true } : p
                  ),
                },
              });
            }
            break;
          }
            
          case "CHARACTERS_SELECTED": {
            const gs3 = get().gameState;
            if (gs3) {
              set({
                gameState: {
                  ...gs3,
                  selectedCharacters: message.characterIds,
                  phase: "waiting_for_players",
                },
              });
            }
            break;
          }
            
          case "GAME_STARTED": {
            const gs4 = get().gameState;
            const ps = get().playerState;
            if (gs4) {
              set({ gameState: { ...gs4, phase: "playing" } });
            }
            if (ps) {
              set({ playerState: { ...ps, phase: "playing" } });
            }
            break;
          }
            
          case "ERROR":
            set({ error: { code: message.code, message: message.message } });
            break;
        }
      },
    }),
    {
      name: "botc-store",
      partialize: (state: GameStore) => ({ sessionToken: state.sessionToken }),
    }
  )
);

