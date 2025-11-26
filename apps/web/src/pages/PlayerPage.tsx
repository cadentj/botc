import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGameSocket } from "../lib/websocket";

export function PlayerPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const { status, connect, playerState, error } = useGameSocket();

  // Connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  const phase = playerState?.phase;
  const character = playerState?.assignedCharacter;

  return (
    <div className="page player-page">
      <div className="player-container">
        <header className="player-header">
          <h1>Blood on the Clocktower</h1>
          {playerState && (
            <p className="player-name">Playing as: {playerState.playerName}</p>
          )}
        </header>

        <div className="player-content">
          {error && (
            <div className="error-message">{error.message}</div>
          )}

          {status !== "connected" && (
            <div className="connecting-message">
              <div className="spinner" />
              <p>Connecting to server...</p>
            </div>
          )}

          {status === "connected" && !playerState && (
            <div className="loading-message">
              <div className="spinner" />
              <p>Loading game state...</p>
            </div>
          )}

          {status === "connected" && playerState && (
            <>
              {phase === "waiting_for_players" && !character && (
                <div className="waiting-state">
                  <div className="waiting-icon">⏳</div>
                  <h2>Waiting for the game to start</h2>
                  <p>
                    The Storyteller is setting up the game. You'll be assigned a
                    character soon.
                  </p>
                  <div className="game-code-display">
                    <span className="code-label">Game Code:</span>
                    <span className="code-value">{playerState.code}</span>
                  </div>
                </div>
              )}

              {character && (
                <div className="character-reveal">
                  <div className="character-card">
                    <div
                      className={`character-type-badge ${character.type}`}
                    >
                      {character.type}
                    </div>
                    <h2 className="character-name">{character.name}</h2>
                    <p className="character-ability">{character.ability}</p>
                  </div>

                  <div className="character-instructions">
                    <p>Keep your role secret!</p>
                    {phase === "waiting_for_players" && (
                      <p className="waiting-notice">
                        Waiting for all players to join...
                      </p>
                    )}
                    {phase === "playing" && (
                      <p className="game-active-notice">
                        The game is now in progress.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {phase === "character_select" && (
                <div className="waiting-state">
                  <div className="waiting-icon">📜</div>
                  <h2>Storyteller is selecting characters</h2>
                  <p>Please wait while the game is being set up.</p>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="player-footer">
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
              ? "Reconnecting..."
              : "Disconnected"}
          </div>
        </footer>
      </div>
    </div>
  );
}

