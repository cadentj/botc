import { useState, useCallback, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useGameStore } from "../lib/store";
import { useUpdateTokenPosition } from "../lib/api";
import { CharacterToken } from "./CharacterToken";
import { SCRIPTS } from "@org/types";

export function Grimoire() {
  const gameState = useGameStore((s) => s.gameState);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const pendingUpdates = useRef<Set<string>>(new Set());
  const updateTokenPosition = useUpdateTokenPosition();

  const savePosition = useDebouncedCallback(
    async (characterId: string, position: { x: number; y: number }) => {
      if (!gameState) return;

      try {
        await updateTokenPosition.mutateAsync({
          lobbyId: gameState.lobbyId,
          characterId,
          position,
        });
      } catch (error) {
        console.error("Failed to save token position:", error);
      } finally {
        pendingUpdates.current.delete(characterId);
      }
    },
    2000
  );

  const handleTokenDragEnd = useCallback(
    (characterId: string, position: { x: number; y: number }) => {
      // Update local state immediately for responsiveness
      setLocalPositions((prev) => ({ ...prev, [characterId]: position }));
      pendingUpdates.current.add(characterId);
      // Debounce the actual save
      savePosition(characterId, position);
    },
    [savePosition]
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

          // Use local position if we have a pending update, otherwise use server state
          const position = localPositions[token.characterId] ?? token.position;

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
