import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { send } from "../../lib/websocket";
import { useInitialGameState } from "../../lib/api";
import { Grimoire } from "../../components/Grimoire";
import { NightOrderSheet } from "../../components/NightOrderSheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/storyteller/grimoire")({
  component: GrimoirePage,
});

function GrimoirePage() {
  const [showNightOrder, setShowNightOrder] = useState(false);
  // Use individual selector to ensure proper re-renders
  const gameState = useGameStore((s) => s.gameState);
  const { isLoading } = useInitialGameState();

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

          <div className="flex-1 flex overflow-hidden">
            <Grimoire />

            <aside className="w-[280px] bg-card border-l p-4 overflow-y-auto flex-shrink-0">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                Players ({gameState.players.filter((p) => !p.isStoryteller).length ?? 0}/{gameState.playerCount})
              </h2>
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                {gameState.players
                  .filter((p) => !p.isStoryteller)
                  .map((player) => (
                    <li key={player.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <span className="flex-1 text-sm">{player.name}</span>
                      {gameState.characterAssignments[player.id] && (
                        <span className="text-xs text-muted-foreground">
                          ({gameState.characterAssignments[player.id]})
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => send({ type: "REMOVE_PLAYER", playerId: player.id })}
                        title="Remove player"
                      >
                        ×
                      </Button>
                    </li>
                  ))}
              </ul>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

