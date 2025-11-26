import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { send } from "../../lib/websocket";
import { useInitialGameState } from "../../lib/api";
import { Grimoire } from "../../components/Grimoire";
import { NightOrderSheet } from "../../components/NightOrderSheet";

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
      <div className="page grimoire-page">
        <div className="setup-container">
          <p>Loading game state...</p>
        </div>
      </div>
    );
  }

  // If no game state, show loading or redirect message
  if (!gameState) {
    return (
      <div className="page grimoire-page">
        <div className="setup-container">
          <p>No active game. Please create a lobby first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page grimoire-page grimoire-view">
      {showNightOrder ? (
        <NightOrderSheet
          characterIds={gameState.selectedCharacters ?? []}
          script={gameState.script}
          onClose={() => setShowNightOrder(false)}
        />
      ) : (
        <>
          <header className="grimoire-header">
            <div className="game-code">
              <span className="code-label">Game Code:</span>
              <span className="code-value">{gameState.code ?? "..."}</span>
            </div>
            <button
              className="night-order-btn"
              onClick={() => setShowNightOrder(true)}
            >
              Night Order
            </button>
          </header>

          <div className="grimoire-content">
            <Grimoire />

            <aside className="players-panel">
              <h2>Players ({gameState.players.filter((p) => !p.isStoryteller).length ?? 0}/{gameState.playerCount})</h2>
              <ul className="player-list">
                {gameState.players
                  .filter((p) => !p.isStoryteller)
                  .map((player) => (
                    <li key={player.id} className="player-item">
                      <span
                        className="player-status"
                        style={{
                          backgroundColor: player.connected ? "#10b981" : "#6b7280",
                        }}
                      />
                      <span className="player-name">{player.name}</span>
                      {gameState.characterAssignments[player.id] && (
                        <span className="player-character">
                          ({gameState.characterAssignments[player.id]})
                        </span>
                      )}
                      <button
                        className="remove-player-btn"
                        onClick={() => send({ type: "REMOVE_PLAYER", playerId: player.id })}
                        title="Remove player"
                      >
                        ×
                      </button>
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

