import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { send } from "../../lib/websocket";
import { useInitialGameState } from "../../lib/api";
import type { ScriptId } from "@org/types";
import { SCRIPTS, TEAM_COMPOSITION } from "@org/types";

export const Route = createFileRoute("/storyteller/")({
  component: SetupPage,
});

function SetupPage() {
  const [playerCount, setPlayerCount] = useState(7);
  const [script, setScript] = useState<ScriptId>("trouble_brewing");
  const navigate = useNavigate();

  // Use individual selectors to ensure proper re-renders
  const status = useGameStore((s) => s.status);
  const gameState = useGameStore((s) => s.gameState);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);
  // Fetch initial game state on page load (for reconnection)
  useInitialGameState();

  // Redirect based on game state
  useEffect(() => {
    if (gameState) {
      if (gameState.phase === "character_select") {
        navigate({ to: "/storyteller/character-select" });
      } else if (gameState.phase === "waiting_for_players" || gameState.phase === "playing") {
        navigate({ to: "/storyteller/grimoire" });
      }
    }
  }, [gameState, navigate]);

  const handleCreateLobby = () => {
    if (status !== "connected") return;
    clearError();
    send({ type: "CREATE_LOBBY", playerCount, script });
  };

  const isConnected = status === "connected";
  const composition = TEAM_COMPOSITION[playerCount];

  return (
    <div className="page grimoire-page">
      <div className="setup-container">
        <header className="setup-header">
          <h1>Create a Game</h1>
          <p className="subtitle">Configure your Blood on the Clocktower game</p>
        </header>

        <div className="setup-form">
          <div className="form-group">
            <label htmlFor="playerCount">Number of Players</label>
            <select
              id="playerCount"
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className="select-input"
            >
              {Object.keys(TEAM_COMPOSITION).map((count) => (
                <option key={count} value={count}>
                  {count} players
                </option>
              ))}
            </select>
            {composition && (
              <p className="composition-info">
                {composition.townsfolk} Townsfolk, {composition.outsiders} Outsiders,{" "}
                {composition.minions} Minions, {composition.demons} Demons
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="script">Script</label>
            <select
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value as ScriptId)}
              className="select-input"
            >
              {Object.entries(SCRIPTS).map(([id, data]) => (
                <option key={id} value={id}>
                  {data.name}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="error-message">{error.message}</div>}

          <button
            onClick={handleCreateLobby}
            className="create-btn"
            disabled={!isConnected}
          >
            Create Lobby
          </button>

          <div className="connection-status">
            <span
              className="status-dot"
              style={{
                backgroundColor:
                  status === "connected"
                    ? "#10b981"
                    : status === "connecting"
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            />
            {status === "connected"
              ? "Connected"
              : status === "connecting"
              ? "Connecting..."
              : "Disconnected"}
          </div>
        </div>
      </div>
    </div>
  );
}

