import { useState, useCallback, useMemo, useRef } from "react";
import { useGameStore } from "../lib/store";
import { CharacterToken } from "./CharacterToken";
import { SCRIPTS, HELPER_TOKENS } from "@org/types";
import { DndContext, type DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";

export function Grimoire() {
  const gameState = useGameStore((s) => s.gameState);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [helperTokenAssignments, setHelperTokenAssignments] = useState<Record<string, string[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Configure pointer sensor with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start drag
      },
    })
  );

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    const characterId = active.id as string;
    
    setLocalPositions((prev) => {
      const currentPos = prev[characterId] ?? initialPositions[characterId] ?? { x: 250, y: 250 };
      return {
        ...prev,
        [characterId]: {
          x: currentPos.x + delta.x,
          y: currentPos.y + delta.y,
        },
      };
    });
  }, [initialPositions]);

  // Get available helper tokens based on selected characters
  const availableHelperTokens = useMemo(() => {
    if (!gameState?.selectedCharacters) return [];
    return HELPER_TOKENS.filter((ht) => gameState.selectedCharacters.includes(ht.forCharacter));
  }, [gameState]);

  // Handle adding a helper token to a character token
  const handleAddHelperToken = useCallback((characterId: string, helperTokenId: string) => {
    setHelperTokenAssignments((prev) => {
      const current = prev[characterId] || [];
      if (current.includes(helperTokenId)) return prev;
      return {
        ...prev,
        [characterId]: [...current, helperTokenId],
      };
    });
  }, []);

  // Handle removing a helper token from a character token
  const handleRemoveHelperToken = useCallback((characterId: string, helperTokenId: string) => {
    setHelperTokenAssignments((prev) => {
      const current = prev[characterId] || [];
      return {
        ...prev,
        [characterId]: current.filter((id) => id !== helperTokenId),
      };
    });
  }, []);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Loading grimoire...</p>
      </div>
    );
  }

  const script = SCRIPTS[gameState.script];
  if (!script) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
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
    <DndContext
      sensors={sensors}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%)' }}
      >
        <div className="w-full h-full relative">
          {gameState.tokens.map((token) => {
            const character = script.characters.find((c) => c.id === token.characterId);
            if (!character) return null;

            // Use dragged position if user has moved this token, otherwise use initial computed position
            const position = localPositions[token.characterId] ?? initialPositions[token.characterId] ?? { x: 250, y: 250 };

            return (
              <CharacterToken
                key={token.characterId}
                id={token.characterId}
                character={character}
                position={position}
                playerName={getPlayerForCharacter(token.characterId)}
                helperTokens={helperTokenAssignments[token.characterId] || []}
                availableHelperTokens={availableHelperTokens}
                onAddHelperToken={(helperTokenId) => handleAddHelperToken(token.characterId, helperTokenId)}
                onRemoveHelperToken={(helperTokenId) => handleRemoveHelperToken(token.characterId, helperTokenId)}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
