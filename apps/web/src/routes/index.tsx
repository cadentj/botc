import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useGameStore } from "../lib/store";
import { send } from "../lib/websocket";

export const Route = createFileRoute("/")({
  component: JoinPage,
});

function JoinPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  
  // Use individual selectors to ensure proper re-renders
  const status = useGameStore((s) => s.status);
  const playerState = useGameStore((s) => s.playerState);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);

  // Navigate to player page when playerState is set (means we successfully joined)
  useEffect(() => {
    if (isJoining && playerState) {
      navigate({ to: "/player/$lobbyId", params: { lobbyId: playerState.lobbyId } });
    }
  }, [isJoining, playerState, navigate]);

  // Handle error
  useEffect(() => {
    if (error) {
      setIsJoining(false);
    }
  }, [error]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || status !== "connected") return;

    setIsJoining(true);
    clearError();
    send({ type: "JOIN_LOBBY", code: code.toUpperCase(), name: name.trim() });
  };

  const isConnected = status === "connected";
  const canJoin = isConnected && code.trim().length === 4 && name.trim().length > 0;

  return (
    <div className="page join-page">
      <div className="join-container">
        <header className="join-header">
          <h1>Blood on the Clocktower</h1>
          <p className="subtitle">Enter the game code to join</p>
        </header>

        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label htmlFor="code">Game Code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="XXXX"
              className="code-input"
              maxLength={4}
              autoComplete="off"
              disabled={isJoining}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="name-input"
              maxLength={20}
              autoComplete="off"
              disabled={isJoining}
            />
          </div>

          {error && (
            <div className="error-message">
              {error.message}
            </div>
          )}

          <button
            type="submit"
            className="join-btn"
            disabled={!canJoin || isJoining}
          >
            {isJoining ? "Joining..." : "Join Game"}
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
        </form>

        <div className="storyteller-link">
          <Link to="/storyteller">Create a game as Storyteller</Link>
        </div>
      </div>
    </div>
  );
}

