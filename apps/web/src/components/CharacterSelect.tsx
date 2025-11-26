import { useState, useMemo } from "react";
import { CharacterCard } from "./CharacterToken";
import type { ScriptId, Character } from "@org/types";
import { SCRIPTS, TEAM_COMPOSITION } from "@org/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Utility: Validate character selection against composition rules
function validateCharacterSelection(
  characterIds: string[],
  playerCount: number,
  script: ScriptId
): { valid: boolean; error?: string } {
  const composition = TEAM_COMPOSITION[playerCount];
  if (!composition) {
    return { valid: false, error: `Invalid player count: ${playerCount}` };
  }

  const scriptData = SCRIPTS[script];
  if (!scriptData) {
    return { valid: false, error: `Invalid script: ${script}` };
  }

  const characters = characterIds.map((id) => scriptData.characters.find((c) => c.id === id));
  if (characters.some((c) => !c)) {
    return { valid: false, error: "Unknown character in selection" };
  }

  const hasBaron = characterIds.includes("baron");
  const adjustedComposition = {
    townsfolk: composition.townsfolk - (hasBaron ? 2 : 0),
    outsiders: composition.outsiders + (hasBaron ? 2 : 0),
    minions: composition.minions,
    demons: composition.demons,
  };

  const counts = {
    townsfolk: characters.filter((c) => c?.type === "townsfolk").length,
    outsiders: characters.filter((c) => c?.type === "outsider").length,
    minions: characters.filter((c) => c?.type === "minion").length,
    demons: characters.filter((c) => c?.type === "demon").length,
  };

  if (counts.townsfolk !== adjustedComposition.townsfolk) {
    return { valid: false, error: `Need ${adjustedComposition.townsfolk} townsfolk, got ${counts.townsfolk}` };
  }
  if (counts.outsiders !== adjustedComposition.outsiders) {
    return { valid: false, error: `Need ${adjustedComposition.outsiders} outsiders, got ${counts.outsiders}` };
  }
  if (counts.minions !== adjustedComposition.minions) {
    return { valid: false, error: `Need ${adjustedComposition.minions} minions, got ${counts.minions}` };
  }
  if (counts.demons !== adjustedComposition.demons) {
    return { valid: false, error: `Need ${adjustedComposition.demons} demons, got ${counts.demons}` };
  }

  return { valid: true };
}

interface CharacterSelectProps {
  script: ScriptId;
  playerCount: number;
  onSelect: (characterIds: string[]) => void;
  error?: string;
}

export function CharacterSelect({
  script,
  playerCount,
  onSelect,
  error,
}: CharacterSelectProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const scriptData = SCRIPTS[script];
  const baseComposition = TEAM_COMPOSITION[playerCount];

  // Calculate adjusted composition if Baron is selected
  const adjustedComposition = useMemo(() => {
    const hasBaron = selectedIds.has("baron");
    return {
      townsfolk: baseComposition.townsfolk - (hasBaron ? 2 : 0),
      outsiders: baseComposition.outsiders + (hasBaron ? 2 : 0),
      minions: baseComposition.minions,
      demons: baseComposition.demons,
    };
  }, [baseComposition, selectedIds]);

  const charactersByType = useMemo(() => {
    if (!scriptData) return {};

    const grouped: Record<string, Character[]> = {
      townsfolk: [],
      outsider: [],
      minion: [],
      demon: [],
    };

    for (const char of scriptData.characters) {
      grouped[char.type]?.push(char);
    }

    return grouped;
  }, [scriptData]);

  const currentCounts = useMemo(() => {
    const counts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
    for (const id of selectedIds) {
      const char = scriptData?.characters.find((c) => c.id === id);
      if (char) {
        if (char.type === "townsfolk") counts.townsfolk++;
        else if (char.type === "outsider") counts.outsiders++;
        else if (char.type === "minion") counts.minions++;
        else if (char.type === "demon") counts.demons++;
      }
    }
    return counts;
  }, [selectedIds, scriptData]);

  const validation = useMemo(() => {
    return validateCharacterSelection(Array.from(selectedIds), playerCount, script);
  }, [selectedIds, playerCount, script]);

  const toggleCharacter = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (validation.valid) {
      onSelect(Array.from(selectedIds));
    }
  };

  if (!scriptData || !baseComposition) {
    return <div className="text-destructive">Invalid configuration</div>;
  }

  const isTypeFull = (type: string): boolean => {
    switch (type) {
      case "townsfolk":
        return currentCounts.townsfolk >= adjustedComposition.townsfolk;
      case "outsider":
        return currentCounts.outsiders >= adjustedComposition.outsiders;
      case "minion":
        return currentCounts.minions >= adjustedComposition.minions;
      case "demon":
        return currentCounts.demons >= adjustedComposition.demons;
      default:
        return false;
    }
  };

  const typeColors: Record<string, string> = {
    townsfolk: "border-l-blue-500",
    outsider: "border-l-cyan-500",
    minion: "border-l-orange-500",
    demon: "border-l-red-500",
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-serif mb-2 text-foreground">Select Characters</h1>
        <p className="text-muted-foreground mb-4">
          Choose characters for {playerCount} players
        </p>
        <div className="flex justify-center gap-4 flex-wrap mt-4">
          <Badge variant={currentCounts.townsfolk === adjustedComposition.townsfolk ? "default" : "outline"}>
            Townsfolk: {currentCounts.townsfolk}/{adjustedComposition.townsfolk}
          </Badge>
          <Badge variant={currentCounts.outsiders === adjustedComposition.outsiders ? "default" : "outline"}>
            Outsiders: {currentCounts.outsiders}/{adjustedComposition.outsiders}
          </Badge>
          <Badge variant={currentCounts.minions === adjustedComposition.minions ? "default" : "outline"}>
            Minions: {currentCounts.minions}/{adjustedComposition.minions}
          </Badge>
          <Badge variant={currentCounts.demons === adjustedComposition.demons ? "default" : "outline"}>
            Demons: {currentCounts.demons}/{adjustedComposition.demons}
          </Badge>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {(["townsfolk", "outsider", "minion", "demon"] as const).map((type) => (
          <section key={type} className="flex flex-col gap-4">
            <h2 className={`text-base font-semibold m-0 p-2 rounded-md bg-card ${typeColors[type] || ""} border-l-4`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type === "outsider" ? "s" : type === "townsfolk" ? "" : "s"}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {charactersByType[type]?.map((char) => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  selected={selectedIds.has(char.id)}
                  onClick={() => toggleCharacter(char.id)}
                  disabled={!selectedIds.has(char.id) && isTypeFull(type)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <footer className="sticky bottom-0 p-4 bg-gradient-to-t from-background to-transparent flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={!validation.valid}
          className="min-w-[300px]"
        >
          {validation.valid ? "Confirm Selection" : validation.error ?? "Complete selection"}
        </Button>
      </footer>
    </div>
  );
}

