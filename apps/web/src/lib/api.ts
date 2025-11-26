import { useQuery, useMutation } from "@tanstack/react-query";
import { useGameStore } from "./store";
import type { GameState, PlayerGameState } from "@org/types";

function getApiUrl(): string {
  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }
  // Production: use the server subdomain
  return `https://${window.location.hostname.replace("web", "server")}`;
}

// Fetch initial game state
export function useInitialGameState() {
  const playerId = useGameStore((s) => s.playerId);

  const query = useQuery<GameState | PlayerGameState>({
    queryKey: ["game", playerId],
    queryFn: async () => {
      if (!playerId) {
        throw new Error("No player id");
      }

      const res = await fetch(`${getApiUrl()}/api/game`, {
        headers: { "X-Player-Id": playerId },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Invalid player id, clear it
          useGameStore.getState().setPlayerId(null);
          throw new Error("Player not found");
        }
        throw new Error(`Failed to fetch game state: ${res.statusText}`);
      }

      const data = await res.json();
      
      // Populate Zustand store immediately when data is fetched
      // GameState has 'players' array, PlayerGameState has 'playerId'
      if ("players" in data) {
        useGameStore.getState().setGameState(data as GameState);
      } else {
        useGameStore.getState().setPlayerState(data as PlayerGameState);
      }
      
      return data;
    },
    enabled: !!playerId,
    retry: false,
  });
  
  return query;
}

// Token position mutation
export function useUpdateTokenPosition() {
  const playerId = useGameStore((s) => s.playerId);

  return useMutation({
    mutationFn: async ({
      lobbyId,
      characterId,
      position,
    }: {
      lobbyId: string;
      characterId: string;
      position: { x: number; y: number };
    }) => {
      if (!playerId) {
        throw new Error("No player id");
      }

      const res = await fetch(
        `${getApiUrl()}/api/tokens/${lobbyId}/${characterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Player-Id": playerId,
          },
          body: JSON.stringify(position),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to update token: ${res.statusText}`);
      }

      return res.json();
    },
  });
}

