import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useGameStore } from "../lib/store";
import { send } from "../lib/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const playerId = useGameStore((s) => s.playerId);
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
    send({ 
      type: "JOIN_LOBBY", 
      code: code.toUpperCase(), 
      name: name.trim(),
      playerId: playerId || undefined
    });
  };

  const isConnected = status === "connected";
  const canJoin = isConnected && code.trim().length === 4 && name.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-[#1a1a2e] via-[#0a0a0a] to-[#0a0a0a]">
      <div className="w-full max-w-md flex flex-col gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-serif mb-2 bg-gradient-to-r from-[#c9a227] via-[#f4d03f] to-[#c9a227] bg-clip-text text-transparent tracking-wide">
            Blood on the Clocktower
          </h1>
          <p className="text-muted-foreground text-sm">Enter the game code to join</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>Enter your game code and name to join</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Game Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="XXXX"
                  className="font-mono text-2xl text-center tracking-widest uppercase"
                  maxLength={4}
                  autoComplete="off"
                  disabled={isJoining}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  autoComplete="off"
                  disabled={isJoining}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!canJoin || isJoining}
                className="w-full"
              >
                {isJoining ? "Joining..." : "Join Game"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full"
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
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/storyteller" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Create a game as Storyteller
          </Link>
        </div>
      </div>
    </div>
  );
}

