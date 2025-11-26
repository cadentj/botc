import { createFileRoute } from "@tanstack/react-router";
import { useGameStore } from "../lib/store";
import { useInitialGameState } from "../lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/player/$lobbyId")({
  component: PlayerPage,
});

function PlayerPage() {
  // Use individual selectors to ensure proper re-renders
  const status = useGameStore((s) => s.status);
  const playerState = useGameStore((s) => s.playerState);
  const error = useGameStore((s) => s.error);
  const { isLoading } = useInitialGameState();

  const phase = playerState?.phase;
  const character = playerState?.assignedCharacter;

  const typeColors: Record<string, string> = {
    townsfolk: "bg-blue-500",
    outsider: "bg-cyan-500",
    minion: "bg-orange-500",
    demon: "bg-red-500",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-[#1a1a2e] via-[#0a0a0a] to-[#0a0a0a]">
      <div className="w-full max-w-md flex flex-col gap-8 text-center">
        <header>
          <h1 className="text-3xl font-serif mb-2 bg-gradient-to-r from-[#c9a227] via-[#f4d03f] to-[#c9a227] bg-clip-text text-transparent">
            Blood on the Clocktower
          </h1>
          {playerState && (
            <p className="text-muted-foreground">Playing as: {playerState.playerName}</p>
          )}
        </header>

        <div className="flex-1 flex flex-col justify-center">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {status !== "connected" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
              <p>Connecting to server...</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
              <p>Loading game state...</p>
            </div>
          )}

          {status === "connected" && !isLoading && !playerState && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
              <p>Waiting for game state...</p>
            </div>
          )}

          {status === "connected" && playerState && (
            <>
              {phase === "waiting_for_players" && !character && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl">⏳</div>
                  <h2 className="text-xl font-semibold">Waiting for the game to start</h2>
                  <p className="text-muted-foreground">
                    The Storyteller is setting up the game. You'll be assigned a
                    character soon.
                  </p>
                  <Card className="mt-4">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Game Code:</span>
                        <span className="font-mono text-xl font-semibold tracking-wider text-[#c9a227]">
                          {playerState.code}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {character && (
                <div className="flex flex-col items-center gap-8">
                  <Card className="w-full max-w-sm">
                    <CardHeader>
                      <Badge className={`${typeColors[character.type] || "bg-gray-500"} text-white uppercase`}>
                        {character.type}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <h2 className="text-2xl font-serif">{character.name}</h2>
                      <p className="text-muted-foreground leading-relaxed">{character.ability}</p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <p className="text-muted-foreground">Keep your role secret!</p>
                    {phase === "waiting_for_players" && (
                      <p className="text-sm text-muted-foreground">
                        Waiting for all players to join...
                      </p>
                    )}
                    {phase === "playing" && (
                      <p className="text-sm text-green-500">
                        The game is now in progress.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {phase === "character_select" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl">📜</div>
                  <h2 className="text-xl font-semibold">Storyteller is selecting characters</h2>
                  <p className="text-muted-foreground">Please wait while the game is being set up.</p>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="pt-4 border-t">
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
              ? "Reconnecting..."
              : "Disconnected"}
          </div>
        </footer>
      </div>
    </div>
  );
}

