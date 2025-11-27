import { useMemo } from "react";
import { useGameStore } from "../lib/store";
import { CharacterToken, type CharacterTokenData } from "./CharacterToken";
import { SCRIPTS, HELPER_TOKENS } from "@org/types";
import { ReactFlow, type Node, useNodesState, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Register custom node type
const nodeTypes = {
  character: CharacterToken,
};

export function Grimoire() {
  const gameState = useGameStore((s) => s.gameState);

  // Get available helper tokens based on selected characters
  const availableHelperTokens = useMemo(() => {
    if (!gameState?.selectedCharacters) return [];
    return HELPER_TOKENS.filter((ht) => gameState.selectedCharacters.includes(ht.forCharacter));
  }, [gameState]);

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
        } as CharacterTokenData,
      });
    });
    return nodes;
  }, [gameState, availableHelperTokens]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);

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
