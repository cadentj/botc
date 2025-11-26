import { useState, useCallback, useMemo } from "react";
import { useGameStore } from "../lib/store";
import { CharacterToken } from "./CharacterToken";
import { SCRIPTS } from "@org/types";

export function Grimoire() {
  const gameState = useGameStore((s) => s.gameState);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Compute initial positions using circle layout
  const initialPositions = useMemo(() => {
    if (!gameState?.tokens) return {};
    const positions: Record<string, { x: number; y: number }> = {};
    const tokens = gameState.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const angle = (2 * Math.PI * i) / tokens.length - Math.PI / 2;
      const radius = 200;
      const x = Math.round(250 + radius * Math.cos(angle));
      const y = Math.round(250 + radius * Math.sin(angle));
      positions[tokens[i].characterId] = { x, y };
    }
    return positions;
  }, [gameState]);

  const handleTokenDragEnd = useCallback(
    (characterId: string, position: { x: number; y: number }) => {
      // Update local state immediately for responsiveness
      setLocalPositions((prev) => ({ ...prev, [characterId]: position }));
    },
    []
  );

  if (!gameState) {
    return (
      <div className="grimoire-loading">
        <p>Loading grimoire...</p>
      </div>
    );
  }

  const script = SCRIPTS[gameState.script];
  if (!script) {
    return (
      <div className="grimoire-error">
        <p>Unknown script: {gameState.script}</p>
      </div>
    );
  }

  // Find player name for each token
  const getPlayerForCharacter = (characterId: string): string | undefined => {
    for (const [playerId, charId] of Object.entries(gameState.characterAssignments)) {
      if (charId === characterId) {
        const player = gameState.players.find((p) => p.id === playerId);
        return player?.name;
      }
    }
    return undefined;
  };

  return (
    <div className="grimoire">
      <div className="grimoire-board">
        {gameState.tokens.map((token) => {
          const character = script.characters.find((c) => c.id === token.characterId);
          if (!character) return null;

          // Use dragged position if user has moved this token, otherwise use initial computed position
          const position = localPositions[token.characterId] ?? initialPositions[token.characterId] ?? { x: 250, y: 250 };

          return (
            <CharacterToken
              key={token.characterId}
              character={character}
              position={position}
              playerName={getPlayerForCharacter(token.characterId)}
              onDragEnd={(pos) => handleTokenDragEnd(token.characterId, pos)}
              draggable={true}
            />
          );
        })}
      </div>
    </div>
  );
}
