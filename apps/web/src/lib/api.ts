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
  const sessionToken = useGameStore((s) => s.sessionToken);

  const query = useQuery<GameState | PlayerGameState>({
    queryKey: ["game", sessionToken],
    queryFn: async () => {
      if (!sessionToken) {
        throw new Error("No session token");
      }

      const res = await fetch(`${getApiUrl()}/api/game`, {
        headers: { "X-Session-Token": sessionToken },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Invalid session token, clear it
          useGameStore.getState().setSessionToken(null);
          throw new Error("Session expired");
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
    enabled: !!sessionToken,
    retry: false,
  });
  
  return query;
}

// Token position mutation
export function useUpdateTokenPosition() {
  const sessionToken = useGameStore((s) => s.sessionToken);

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
      if (!sessionToken) {
        throw new Error("No session token");
      }

      const res = await fetch(
        `${getApiUrl()}/api/tokens/${lobbyId}/${characterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Session-Token": sessionToken,
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

