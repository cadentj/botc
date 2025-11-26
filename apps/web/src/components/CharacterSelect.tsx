import { useState, useMemo } from "react";
import { CharacterCard } from "./CharacterToken";
import type { ScriptId, Character } from "@org/types";
import { SCRIPTS, TEAM_COMPOSITION, validateCharacterSelection } from "@org/types";

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

