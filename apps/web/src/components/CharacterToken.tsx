import { useState, useRef, useEffect } from "react";
import type { Character } from "@org/types";

interface CharacterTokenProps {
  character: Character;
  position: { x: number; y: number };
  playerName?: string;
  onDragEnd?: (position: { x: number; y: number }) => void;
  selected?: boolean;
  onClick?: () => void;
  draggable?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  townsfolk: "#3b82f6",
  outsider: "#06b6d4",
  minion: "#f97316",
  demon: "#ef4444",
};

export function CharacterToken({
  character,
  position,
  playerName,
  onDragEnd,
  selected,
  onClick,
  draggable = true,
}: CharacterTokenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState(position);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const tokenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPos(position);
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || !onDragEnd) {
      onClick?.();
      return;
    }

    e.preventDefault();
    const rect = tokenRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const parent = tokenRef.current?.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const x = e.clientX - parentRect.left - dragOffset.x;
      const y = e.clientY - parentRect.top - dragOffset.y;

      setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.(currentPos);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, currentPos, onDragEnd]);

  const typeColor = TYPE_COLORS[character.type] ?? "#6b7280";

  return (
    <div
      ref={tokenRef}
      className={`character-token ${isDragging ? "dragging" : ""} ${selected ? "selected" : ""}`}
      style={{
        left: currentPos.x,
        top: currentPos.y,
        borderColor: typeColor,
        cursor: draggable && onDragEnd ? "grab" : onClick ? "pointer" : "default",
      }}
      onMouseDown={handleMouseDown}
      onClick={!draggable || !onDragEnd ? onClick : undefined}
    >
      <div
        className="token-type-indicator"
        style={{ backgroundColor: typeColor }}
      />
      <span className="token-name">{character.name}</span>
      {playerName && <span className="token-player">{playerName}</span>}
    </div>
  );
}

// Simpler version for selection grid
interface CharacterCardProps {
  character: Character;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function CharacterCard({
  character,
  selected,
  onClick,
  disabled,
}: CharacterCardProps) {
  const typeColor = TYPE_COLORS[character.type] ?? "#6b7280";

  return (
    <button
      className={`character-card ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderColor: selected ? typeColor : "transparent",
      }}
    >
      <div
        className="card-type-badge"
        style={{ backgroundColor: typeColor }}
      >
        {character.type.charAt(0).toUpperCase()}
      </div>
      <span className="card-name">{character.name}</span>
    </button>
  );
}

