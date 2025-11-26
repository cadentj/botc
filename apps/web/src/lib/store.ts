import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Character } from "@org/types";

interface GameStore {
  // Lobby info
  lobbyCode: string | null;
  
  // Game state (for storyteller)
  gameState: GameState | null;
  
  // Player character (persisted in localStorage)
  assignedCharacter: Character | null;
  
  // Error state
  error: { code: string; message: string } | null;
  
  // Actions
  setLobbyCode: (code: string | null) => void;
  setGameState: (state: GameState | null) => void;
  setAssignedCharacter: (character: Character | null) => void;
  setError: (error: { code: string; message: string } | null) => void;
  clearError: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void): GameStore => ({
      // Initial state
      lobbyCode: null,
      gameState: null,
      assignedCharacter: null,
      error: null,
      
      // Actions
      setLobbyCode: (code: string | null) => set({ lobbyCode: code }),
      setGameState: (state: GameState | null) => set({ gameState: state }),
      setAssignedCharacter: (character: Character | null) => set({ assignedCharacter: character }),
      setError: (error: { code: string; message: string } | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "botc-store",
      partialize: (state: GameStore) => ({ 
        lobbyCode: state.lobbyCode,
        assignedCharacter: state.assignedCharacter,
      }),
    }
  )
);
