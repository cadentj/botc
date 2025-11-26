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
      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 p-3 bg-card border-2 rounded-lg select-none z-[1] transition-shadow ${
        isDragging ? "z-[100] shadow-2xl cursor-grabbing" : ""
      } ${selected ? "shadow-[0_0_0_3px_rgba(201,162,39,0.5)]" : ""}`}
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
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: typeColor }}
      />
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{character.name}</span>
      {playerName && <span className="text-xs text-muted-foreground whitespace-nowrap">{playerName}</span>}
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
      className={`flex flex-col items-center gap-2 p-4 bg-card border-2 rounded-lg cursor-pointer transition-all ${
        selected ? "bg-muted" : ""
      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderColor: selected ? typeColor : "transparent",
      }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-black"
        style={{ backgroundColor: typeColor }}
      >
        {character.type.charAt(0).toUpperCase()}
      </div>
      <span className="text-xs text-center text-muted-foreground">{character.name}</span>
    </button>
  );
}

