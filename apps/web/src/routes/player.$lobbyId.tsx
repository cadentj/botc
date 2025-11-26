import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGameStore } from "../lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/player/$lobbyId")({
  component: PlayerPage,
});

function PlayerPage() {
  const navigate = useNavigate();
  const assignedCharacter = useGameStore((s) => s.assignedCharacter);
  const lobbyCode = useGameStore((s) => s.lobbyCode);

  // Redirect to join page if no character assigned
  if (!assignedCharacter) {
    navigate({ to: "/" });
    return null;
  }

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
        </header>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex flex-col items-center gap-8">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <Badge className={`${typeColors[assignedCharacter.type] || "bg-gray-500"} text-white uppercase`}>
                  {assignedCharacter.type}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <h2 className="text-2xl font-serif">{assignedCharacter.name}</h2>
                <p className="text-muted-foreground leading-relaxed">{assignedCharacter.ability}</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <p className="text-muted-foreground">Keep your role secret!</p>
              {lobbyCode && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-sm text-muted-foreground">Game Code:</span>
                      <span className="font-mono text-xl font-semibold tracking-wider text-[#c9a227]">
                        {lobbyCode}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
