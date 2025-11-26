import { useState, useEffect } from "react";
import { useGameSocket } from "../lib/websocket";
import { Grimoire } from "../components/Grimoire";
import { CharacterSelect } from "../components/CharacterSelect";
import { NightOrderSheet } from "../components/NightOrderSheet";
import type { ScriptId } from "@org/types";
import { SCRIPTS, TEAM_COMPOSITION } from "@org/types";

type Step = "setup" | "character_select" | "grimoire";

export function GrimoirePage() {
  const [step, setStep] = useState<Step>("setup");
  const [playerCount, setPlayerCount] = useState(7);
  const [script, setScript] = useState<ScriptId>("trouble_brewing");
  const [showNightOrder, setShowNightOrder] = useState(false);

  const { status, connect, send, gameState, lastMessage, error, clearError } =
    useGameSocket();

  // Connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Handle lobby creation
  useEffect(() => {
    if (lastMessage?.type === "LOBBY_CREATED") {
      setStep("character_select");
    }
  }, [lastMessage]);

  // Handle characters selected
  useEffect(() => {
    if (lastMessage?.type === "CHARACTERS_SELECTED" || gameState?.phase === "waiting_for_players") {
      setStep("grimoire");
    }
  }, [lastMessage, gameState?.phase]);

  const handleCreateLobby = () => {
    if (status !== "connected") return;
    clearError();
    send({ type: "CREATE_LOBBY", playerCount, script });
  };

  const handleSelectCharacters = (characterIds: string[]) => {
    send({ type: "SELECT_CHARACTERS", characterIds });
  };

  const isConnected = status === "connected";
  const composition = TEAM_COMPOSITION[playerCount];

  // Setup step
  if (step === "setup") {
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

  // Character select step
  if (step === "character_select") {
    return (
      <div className="page grimoire-page">
        <CharacterSelect
          script={script}
          playerCount={playerCount}
          onSelect={handleSelectCharacters}
          error={error?.message}
        />
      </div>
    );
  }

  // Grimoire step
  return (
    <div className="page grimoire-page grimoire-view">
      {showNightOrder ? (
        <NightOrderSheet
          characterIds={gameState?.selectedCharacters ?? []}
          script={script}
          onClose={() => setShowNightOrder(false)}
        />
      ) : (
        <>
          <header className="grimoire-header">
            <div className="game-code">
              <span className="code-label">Game Code:</span>
              <span className="code-value">{gameState?.code ?? "..."}</span>
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
              <h2>Players ({gameState?.players.filter((p) => !p.isStoryteller).length ?? 0}/{playerCount})</h2>
              <ul className="player-list">
                {gameState?.players
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

