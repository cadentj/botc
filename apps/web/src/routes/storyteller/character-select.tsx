import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { send } from "../../lib/websocket";
import { useInitialGameState } from "../../lib/api";
import { CharacterSelect } from "../../components/CharacterSelect";

export const Route = createFileRoute("/storyteller/character-select")({
  component: CharacterSelectPage,
});

function CharacterSelectPage() {
  const navigate = useNavigate();
  // Use individual selectors to ensure proper re-renders
  const gameState = useGameStore((s) => s.gameState);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const error = useGameStore((s) => s.error);
  const { isLoading } = useInitialGameState();

  // Navigate to grimoire when characters are selected
  useEffect(() => {
    if (lastMessage?.type === "CHARACTERS_SELECTED" || gameState?.phase === "waiting_for_players") {
      navigate({ to: "/storyteller/grimoire" });
    }
  }, [lastMessage, gameState?.phase, navigate]);

  const handleSelectCharacters = (characterIds: string[]) => {
    send({ type: "SELECT_CHARACTERS", characterIds });
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

