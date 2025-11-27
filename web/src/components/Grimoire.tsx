import { useMemo, useCallback, useEffect } from "react";
import { useGameStore } from "../lib/store";
import { CharacterToken, type CharacterTokenData } from "./CharacterToken";
import { SCRIPTS, HELPER_TOKENS, type Character } from "@org/types";
import { ReactFlow, type Node, useNodesState, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Register custom node type
const nodeTypes = {
  character: CharacterToken,
};

export function Grimoire() {
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);

  // Get available helper tokens based on selected characters
  const availableHelperTokens = useMemo(() => {
    if (!gameState?.selectedCharacters) return [];
    return HELPER_TOKENS.filter((ht) => gameState.selectedCharacters.includes(ht.forCharacter));
  }, [gameState]);

  // Get all Townsfolk for Drunk dropdown
  const availableTownsfolk = useMemo((): Character[] => {
    if (!gameState) return [];
    const script = SCRIPTS[gameState.script];
    if (!script) return [];
    return script.characters.filter((c) => c.type === "townsfolk");
  }, [gameState]);

  // Update token state
  const updateToken = useCallback((characterId: string, updates: Partial<{ isDead: boolean; perceivedCharacterId: string | undefined }>) => {
    if (!gameState) return;
    const updatedTokens = gameState.tokens.map((token) =>
      token.characterId === characterId ? { ...token, ...updates } : token
    );
    setGameState({ ...gameState, tokens: updatedTokens });
  }, [gameState, setGameState]);

  // Compute initial nodes using circle layout
  const initialNodes = useMemo((): Node[] => {
    if (!gameState?.tokens) return [];
    const script = SCRIPTS[gameState.script];
    if (!script) return [];

    const nodes: Node[] = [];
    gameState.tokens.forEach((token, i) => {
      const character = script.characters.find((c) => c.id === token.characterId);
      if (!character) return;

      // Circle layout
      const angle = (2 * Math.PI * i) / gameState.tokens.length - Math.PI / 2;
      const radius = 200;
      const x = 250 + radius * Math.cos(angle);
      const y = 250 + radius * Math.sin(angle);

      nodes.push({
        id: token.characterId,
        type: "character",
        position: { x, y },
        data: {
          character,
          availableHelperTokens,
          isDead: token.isDead ?? false,
          onToggleDead: () => {
            updateToken(token.characterId, { isDead: !token.isDead });
          },
          perceivedCharacterId: token.perceivedCharacterId,
          onPerceivedCharacterChange: (characterId: string | undefined) => {
            updateToken(token.characterId, { perceivedCharacterId: characterId });
          },
          availableTownsfolk,
        } as CharacterTokenData,
      });
    });
    return nodes;
  }, [gameState, availableHelperTokens, availableTownsfolk, updateToken]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Update nodes when gameState tokens change
  useEffect(() => {
    if (!gameState?.tokens) {
      setNodes([]);
      return;
    }
    const script = SCRIPTS[gameState.script];
    if (!script) return;

    // Update nodes, preserving positions
    setNodes((nds) => {
      const nodeMap = new Map(nds.map((n) => [n.id, n]));
      const updatedNodes: Node[] = [];
      
      gameState.tokens.forEach((token, i) => {
        const character = script.characters.find((c) => c.id === token.characterId);
        if (!character) return;

        // Preserve position from existing node if it exists
        const existingNode = nodeMap.get(token.characterId);
        let position = existingNode?.position;
        
        // If no existing position, calculate circle layout
        if (!position) {
          const angle = (2 * Math.PI * i) / gameState.tokens.length - Math.PI / 2;
          const radius = 200;
          position = {
            x: 250 + radius * Math.cos(angle),
            y: 250 + radius * Math.sin(angle),
          };
        }

        updatedNodes.push({
          id: token.characterId,
          type: "character",
          position,
          data: {
            character,
            availableHelperTokens,
            isDead: token.isDead ?? false,
            onToggleDead: () => {
              updateToken(token.characterId, { isDead: !token.isDead });
            },
            perceivedCharacterId: token.perceivedCharacterId,
            onPerceivedCharacterChange: (characterId: string | undefined) => {
              updateToken(token.characterId, { perceivedCharacterId: characterId });
            },
            availableTownsfolk,
          } as CharacterTokenData,
        });
      });

      return updatedNodes;
    });
  }, [gameState?.tokens, gameState?.script, availableHelperTokens, availableTownsfolk, updateToken, setNodes]);

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

  return (
    <ReactFlow
      nodes={nodes}
      edges={[]}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.5 }}
      className="bg-gradient-radial from-[#1a1a2e] to-[#0a0a0a]"
      style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%)' }}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}
