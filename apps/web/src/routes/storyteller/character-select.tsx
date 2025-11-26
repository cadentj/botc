import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { selectCharacters, useLobbyState } from "../../lib/api";
import { CharacterSelect } from "../../components/CharacterSelect";

export const Route = createFileRoute("/storyteller/character-select")({
  component: CharacterSelectPage,
});

function CharacterSelectPage() {
  const navigate = useNavigate();
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const gameState = useGameStore((s) => s.gameState);
  const error = useGameStore((s) => s.error);
  const setError = useGameStore((s) => s.setError);
  const { isLoading, refetch } = useLobbyState(lobbyCode);

  // Navigate to grimoire when characters are selected
  useEffect(() => {
    if (gameState?.phase === "waiting_for_players") {
      navigate({ to: "/storyteller/grimoire" });
    }
  }, [gameState?.phase, navigate]);

  const handleSelectCharacters = async (characterIds: string[]) => {
    if (!lobbyCode) return;
    try {
      await selectCharacters(lobbyCode, characterIds);
      // Refetch game state to get updated phase
      await refetch();
    } catch (err) {
      setError({
        code: "SELECT_ERROR",
        message: err instanceof Error ? err.message : "Failed to select characters",
      });
    }
  };

  // Show loading state while fetching initial game state
  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-md mx-auto">
          <p>Loading game state...</p>
        </div>
      </div>
    );
  }

  // If no game state, redirect to setup
  if (!gameState) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-md mx-auto">
          <p>No active game. Please create a lobby first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <CharacterSelect
        script={gameState.script}
        playerCount={gameState.playerCount}
        onSelect={handleSelectCharacters}
        error={error?.message}
      />
    </div>
  );
}

