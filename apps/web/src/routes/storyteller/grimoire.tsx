import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { useLobbyState } from "../../lib/api";
import { Grimoire } from "../../components/Grimoire";
import { NightOrderSheet } from "../../components/NightOrderSheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/storyteller/grimoire")({
  component: GrimoirePage,
});

function GrimoirePage() {
  const [showNightOrder, setShowNightOrder] = useState(false);
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const gameState = useGameStore((s) => s.gameState);
  const { isLoading } = useLobbyState(lobbyCode);

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

  // If no game state, show loading or redirect message
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
    <div className="h-screen overflow-hidden flex flex-col">
      {showNightOrder ? (
        <NightOrderSheet
          characterIds={gameState.selectedCharacters ?? []}
          script={gameState.script}
          onClose={() => setShowNightOrder(false)}
        />
      ) : (
        <>
          <header className="flex justify-between items-center p-6 bg-card border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Game Code:</span>
              <span className="font-mono text-2xl font-semibold tracking-wider text-[#c9a227]">
                {gameState.code ?? "..."}
              </span>
            </div>
            <Button variant="outline" onClick={() => setShowNightOrder(true)}>
              Night Order
            </Button>
          </header>

          <div className="flex-1 overflow-hidden">
            <Grimoire />
          </div>
        </>
      )}
    </div>
  );
}

