import { createFileRoute } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { useLobbyState } from "../../lib/api";
import { Grimoire } from "../../components/Grimoire";
import { NightOrderSheet } from "../../components/NightOrderSheet";

export const Route = createFileRoute("/storyteller/grimoire")({
  component: GrimoirePage,
});

function GrimoirePage() {
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
      <header className="flex justify-between items-center px-6 py-3 bg-card border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Game Code:</span>
          <span className="font-mono text-2xl font-semibold tracking-wider text-[#c9a227]">
            {gameState.code ?? "..."}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Left 2/3: Grimoire */}
        <div className="w-2/3 h-full overflow-hidden flex flex-col">
          <Grimoire />
        </div>

        {/* Right 1/3: Night Order */}
        <div className="w-1/3 h-full overflow-y-auto border-l bg-background">
          <NightOrderSheet
            characterIds={gameState.selectedCharacters ?? []}
            script={gameState.script}
          />
        </div>
      </div>
    </div>
  );
}

