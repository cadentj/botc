import { useState, useMemo } from "react";
import { CharacterCard } from "./CharacterToken";
import type { ScriptId, Character } from "@org/types";
import { SCRIPTS, TEAM_COMPOSITION } from "@org/types";

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

  const counts = {
    townsfolk: characters.filter((c) => c?.type === "townsfolk").length,
    outsiders: characters.filter((c) => c?.type === "outsider").length,
    minions: characters.filter((c) => c?.type === "minion").length,
    demons: characters.filter((c) => c?.type === "demon").length,
  };

  if (counts.townsfolk !== composition.townsfolk) {
    return { valid: false, error: `Need ${composition.townsfolk} townsfolk, got ${counts.townsfolk}` };
  }
  if (counts.outsiders !== composition.outsiders) {
    return { valid: false, error: `Need ${composition.outsiders} outsiders, got ${counts.outsiders}` };
  }
  if (counts.minions !== composition.minions) {
    return { valid: false, error: `Need ${composition.minions} minions, got ${counts.minions}` };
  }
  if (counts.demons !== composition.demons) {
    return { valid: false, error: `Need ${composition.demons} demons, got ${counts.demons}` };
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
  const composition = TEAM_COMPOSITION[playerCount];

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

  if (!scriptData || !composition) {
    return <div className="character-select-error">Invalid configuration</div>;
  }

  const isTypeFull = (type: string): boolean => {
    switch (type) {
      case "townsfolk":
        return currentCounts.townsfolk >= composition.townsfolk;
      case "outsider":
        return currentCounts.outsiders >= composition.outsiders;
      case "minion":
        return currentCounts.minions >= composition.minions;
      case "demon":
        return currentCounts.demons >= composition.demons;
      default:
        return false;
    }
  };

  return (
    <div className="character-select">
      <header className="character-select-header">
        <h1>Select Characters</h1>
        <p className="subtitle">
          Choose characters for {playerCount} players
        </p>
        <div className="composition-summary">
          <span className={currentCounts.townsfolk === composition.townsfolk ? "complete" : ""}>
            Townsfolk: {currentCounts.townsfolk}/{composition.townsfolk}
          </span>
          <span className={currentCounts.outsiders === composition.outsiders ? "complete" : ""}>
            Outsiders: {currentCounts.outsiders}/{composition.outsiders}
          </span>
          <span className={currentCounts.minions === composition.minions ? "complete" : ""}>
            Minions: {currentCounts.minions}/{composition.minions}
          </span>
          <span className={currentCounts.demons === composition.demons ? "complete" : ""}>
            Demons: {currentCounts.demons}/{composition.demons}
          </span>
        </div>
      </header>

      <div className="character-grid-container">
        {(["townsfolk", "outsider", "minion", "demon"] as const).map((type) => (
          <section key={type} className="character-type-section">
            <h2 className={`type-header ${type}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type === "outsider" ? "s" : type === "townsfolk" ? "" : "s"}
            </h2>
            <div className="character-grid">
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

      {error && <div className="error-message">{error}</div>}

      <footer className="character-select-footer">
        <button
          className="confirm-btn"
          onClick={handleConfirm}
          disabled={!validation.valid}
        >
          {validation.valid ? "Confirm Selection" : validation.error ?? "Complete selection"}
        </button>
      </footer>
    </div>
  );
}

