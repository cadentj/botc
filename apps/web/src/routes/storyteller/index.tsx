import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { send } from "../../lib/websocket";
import { useInitialGameState } from "../../lib/api";
import type { ScriptId } from "@org/types";
import { SCRIPTS, TEAM_COMPOSITION } from "@org/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto flex flex-col gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-serif mb-2 bg-gradient-to-r from-[#c9a227] via-[#f4d03f] to-[#c9a227] bg-clip-text text-transparent">
            Create a Game
          </h1>
          <p className="text-muted-foreground text-sm">Configure your Blood on the Clocktower game</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Game Setup</CardTitle>
            <CardDescription>Choose player count and script</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="playerCount">Number of Players</Label>
              <Select
                value={playerCount.toString()}
                onValueChange={(value) => setPlayerCount(Number(value))}
              >
                <SelectTrigger id="playerCount">
                  <SelectValue placeholder="Select player count" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TEAM_COMPOSITION).map((count) => (
                    <SelectItem key={count} value={count}>
                      {count} players
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {composition && (
                <p className="text-xs text-muted-foreground mt-1">
                  {composition.townsfolk} Townsfolk, {composition.outsiders} Outsiders,{" "}
                  {composition.minions} Minions, {composition.demons} Demons
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="script">Script</Label>
              <Select
                value={script}
                onValueChange={(value) => setScript(value as ScriptId)}
              >
                <SelectTrigger id="script">
                  <SelectValue placeholder="Select script" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCRIPTS).map(([id, data]) => (
                    <SelectItem key={id} value={id}>
                      {data.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleCreateLobby}
              disabled={!isConnected}
              className="w-full"
            >
              Create Lobby
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

