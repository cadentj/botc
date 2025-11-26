import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useGameStore } from "../lib/store";
import { joinLobby } from "../lib/api";
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
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  
  const assignedCharacter = useGameStore((s) => s.assignedCharacter);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);
  const setError = useGameStore((s) => s.setError);

  // Navigate to player page if we have a character
  useEffect(() => {
    if (assignedCharacter) {
      navigate({ to: "/player/$lobbyId", params: { lobbyId: "current" } });
    }
  }, [assignedCharacter, navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 4) return;

    setIsJoining(true);
    clearError();
    
    try {
      await joinLobby(code.toUpperCase());
      // Navigate will happen via redirect above if character was assigned
      setIsJoining(false);
    } catch (err) {
      setError({
        code: "JOIN_ERROR",
        message: err instanceof Error ? err.message : "Failed to join lobby",
      });
      setIsJoining(false);
    }
  };

  const canJoin = code.trim().length === 4 && !isJoining;

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
            <CardDescription>Enter your game code to join</CardDescription>
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
