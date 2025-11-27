import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGameStore } from "../../lib/store";
import { createLobby, useLobbyState } from "../../lib/api";
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
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const gameState = useGameStore((s) => s.gameState);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);
  const setError = useGameStore((s) => s.setError);
  const [isCreating, setIsCreating] = useState(false);
  // Fetch lobby state if we have a code
  useLobbyState(lobbyCode);

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

  const handleCreateLobby = async () => {
    setIsCreating(true);
    clearError();
    try {
      await createLobby(playerCount, script);
      // Navigation will happen via useEffect when gameState is updated
    } catch (err) {
      setError({
        code: "CREATE_ERROR",
        message: err instanceof Error ? err.message : "Failed to create lobby",
      });
      setIsCreating(false);
    }
  };

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
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Lobby"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

