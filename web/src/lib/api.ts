import { useQuery } from "@tanstack/react-query";
import { useGameStore } from "./store";
import type { GameState, ScriptId } from "@org/types";

function getApiUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
}

// Fetch lobby state (for storyteller)
export function useLobbyState(code: string | null) {
  const query = useQuery<GameState>({
    queryKey: ["lobby", code],
    queryFn: async () => {
      if (!code) {
        throw new Error("No lobby code");
      }

      const res = await fetch(`${getApiUrl()}/api/lobby/${code}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch lobby: ${res.statusText}`);
      }

      const data = await res.json();
      useGameStore.getState().setGameState(data);
      
      return data;
    },
    enabled: !!code,
    retry: false,
  });
  
  return query;
}

// Create lobby
export async function createLobby(playerCount: number, script: ScriptId) {
  const res = await fetch(`${getApiUrl()}/api/lobby`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerCount, script }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create lobby");
  }

  const data = await res.json();
  useGameStore.getState().setLobbyCode(data.code);
  
  // Fetch the full game state after creating lobby
  const gameStateRes = await fetch(`${getApiUrl()}/api/lobby/${data.code}`);
  if (gameStateRes.ok) {
    const gameState = await gameStateRes.json();
    useGameStore.getState().setGameState(gameState);
  }
  
  return data;
}

// Join lobby
export async function joinLobby(code: string) {
  const res = await fetch(`${getApiUrl()}/api/lobby/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to join lobby");
  }

  const data = await res.json();
  useGameStore.getState().setLobbyCode(code);
  
  // Store assigned character if we got one
  if (data.character) {
    useGameStore.getState().setAssignedCharacter(data.character);
  }
  
  return data;
}

// Select characters (storyteller only)
export async function selectCharacters(code: string, characterIds: string[]) {
  const res = await fetch(`${getApiUrl()}/api/lobby/${code}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterIds }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to select characters");
  }

  // Fetch updated game state
  const gameStateRes = await fetch(`${getApiUrl()}/api/lobby/${code}`);
  if (gameStateRes.ok) {
    const gameState = await gameStateRes.json();
    useGameStore.getState().setGameState(gameState);
  }

  return await res.json();
}

// Start game (storyteller only)
export async function startGame(code: string) {
  const res = await fetch(`${getApiUrl()}/api/lobby/${code}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to start game");
  }

  // Fetch updated game state
  const gameStateRes = await fetch(`${getApiUrl()}/api/lobby/${code}`);
  if (gameStateRes.ok) {
    const gameState = await gameStateRes.json();
    useGameStore.getState().setGameState(gameState);
  }

  return await res.json();
}
