import { useState } from "react";
import type { Character, HelperToken } from "@org/types";
import { SCRIPTS } from "@org/types";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { NodeProps } from "@xyflow/react";
import {
  Plus, X, Shirt, BookOpen, Search, ChefHat, Heart, Sparkles, Skull, Shield,
  Bird, Flower2, Crosshair, Swords, Crown, Wine, Beer, Ghost, Cross,
  FlaskConical, Eye, Castle, HeartCrack, Flame, HeartPulse, type LucideIcon,
} from "lucide-react";

// Static icon map - only includes icons we actually use
const ICONS: Record<string, LucideIcon> = {
  Shirt, BookOpen, Search, ChefHat, Heart, Sparkles, Skull, Shield, Bird,
  Flower2, Crosshair, Swords, Crown, Wine, Beer, Ghost, Cross, FlaskConical,
  Eye, Castle, HeartCrack, Flame,
};

interface CharacterIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export function CharacterIcon({ iconName, className, size = 16 }: CharacterIconProps) {
  const Icon = ICONS[iconName];
  return Icon ? <Icon className={className} size={size} /> : null;
}

// Data structure for React Flow node
export interface CharacterTokenData extends Record<string, unknown> {
  character: Character;
  availableHelperTokens?: HelperToken[]; // helper tokens available for selection
  isDead?: boolean;
  onToggleDead?: () => void;
  perceivedCharacterId?: string; // For Drunk: which Townsfolk they think they are
  onPerceivedCharacterChange?: (characterId: string | undefined) => void;
  availableTownsfolk?: Character[]; // For Drunk dropdown
}

interface CharacterTokenProps extends NodeProps {
  data: CharacterTokenData;
}

const TYPE_COLORS: Record<string, string> = {
  townsfolk: "#3b82f6",
  outsider: "#06b6d4",
  minion: "#f97316",
  demon: "#ef4444",
};

export function CharacterToken({ data }: CharacterTokenProps) {
  const { 
    character, 
    availableHelperTokens = [],
    isDead = false,
    onToggleDead,
    perceivedCharacterId,
    onPerceivedCharacterChange,
    availableTownsfolk = [],
  } = data;
  const [helperTokens, setHelperTokens] = useState<string[]>([]);

  const typeColor = TYPE_COLORS[character.type] ?? "#6b7280";
  const isDrunk = character.id === "drunk";

  // Get helper token objects for assigned tokens
  const assignedHelperTokens = availableHelperTokens.filter((ht) => helperTokens.includes(ht.id));
  
  // Get available helper tokens that aren't already assigned
  const unassignedHelperTokens = availableHelperTokens.filter((ht) => !helperTokens.includes(ht.id));

  const handleAddHelperToken = (helperTokenId: string) => {
    setHelperTokens((prev) => prev.includes(helperTokenId) ? prev : [...prev, helperTokenId]);
  };

  const handleRemoveHelperToken = (helperTokenId: string) => {
    setHelperTokens((prev) => prev.filter((id) => id !== helperTokenId));
  };

  // Get character name for each helper token
  const getCharacterNameForHelperToken = (helperToken: HelperToken): string => {
    const script = SCRIPTS.trouble_brewing;
    const char = script.characters.find((c) => c.id === helperToken.forCharacter);
    return char?.name ?? helperToken.forCharacter;
  };

  // Get character icon for each helper token
  const getCharacterIconForHelperToken = (helperToken: HelperToken): string => {
    const script = SCRIPTS.trouble_brewing;
    const char = script.characters.find((c) => c.id === helperToken.forCharacter);
    return char?.icon ?? "";
  };

  // Get perceived character for Drunk
  const perceivedCharacter = isDrunk && perceivedCharacterId
    ? availableTownsfolk.find((c) => c.id === perceivedCharacterId)
    : null;

  const handleToggleDead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleDead?.();
  };

  return (
    <div
      className={`flex flex-col size-24 items-center gap-1.5 p-4 bg-card border-2 rounded-lg select-none min-w-[160px] cursor-grab active:cursor-grabbing relative ${
        isDead ? "opacity-60 grayscale" : ""
      }`}
      style={{ borderColor: typeColor }}
    >
      {/* Dead overlay */}
      {isDead && (
        <div className="absolute inset-0 bg-destructive/20 rounded-lg flex items-center justify-center pointer-events-none">
          <Skull className="h-8 w-8 text-destructive" />
        </div>
      )}
      
      {/* Alive/Dead toggle button */}
      {onToggleDead && (
        <button
          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background border border-border hover:bg-muted flex items-center justify-center z-10"
          onClick={handleToggleDead}
          onMouseDown={(e) => e.stopPropagation()}
          title={isDead ? "Mark as alive" : "Mark as dead"}
        >
          {isDead ? (
            <Skull className="h-3 w-3 text-destructive" />
          ) : (
            <HeartPulse className="h-3 w-3 text-green-600" />
          )}
        </button>
      )}

      <div className="flex items-center gap-1.5 justify-center w-full">
        <CharacterIcon iconName={character.icon} className="text-foreground" size={20} />
        {unassignedHelperTokens.length > 0 && (
          <Select
            value=""
            onValueChange={(value) => {
              if (value) {
                handleAddHelperToken(value);
              }
            }}
          >
            <SelectTrigger
              className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-muted shrink-0"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Plus className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              {unassignedHelperTokens.map((ht) => (
                <SelectItem key={ht.id} value={ht.id}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span className="text-xs text-muted-foreground">{getCharacterNameForHelperToken(ht)}</span>
                    <span className="text-xs font-medium">{ht.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Character name - show perceived character for Drunk if assigned */}
      {isDrunk && perceivedCharacter ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">{perceivedCharacter.name}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            <CharacterIcon iconName={character.icon} className="text-foreground" size={10} />
            <span className="ml-1">Drunk</span>
          </Badge>
        </div>
      ) : (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">{character.name}</span>
      )}
      
      {/* Drunk perceived character selector */}
      {isDrunk && onPerceivedCharacterChange && (
        <Select
          value={perceivedCharacterId || ""}
          onValueChange={(value) => {
            onPerceivedCharacterChange(value || undefined);
          }}
        >
          <SelectTrigger
            className="h-6 text-xs px-2 py-1 border border-border hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {perceivedCharacter ? (
              <div className="flex items-center gap-1.5">
                <CharacterIcon iconName={perceivedCharacter.icon} className="text-foreground" size={12} />
                <span>{perceivedCharacter.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select Townsfolk...</span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              <span className="text-muted-foreground">None</span>
            </SelectItem>
            {availableTownsfolk.map((townsfolk) => (
              <SelectItem key={townsfolk.id} value={townsfolk.id}>
                <div className="flex items-center gap-2">
                  <CharacterIcon iconName={townsfolk.icon} className="text-foreground" size={14} />
                  <span>{townsfolk.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {assignedHelperTokens.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-1">
          {assignedHelperTokens.map((ht) => (
            <Badge
              key={ht.id}
              variant="secondary"
              className="text-xs px-1.5 py-0.5 flex items-center gap-1"
            >
              <CharacterIcon iconName={getCharacterIconForHelperToken(ht)} className="text-foreground" size={12} />
              <span>{ht.name}</span>
              <button
                className="h-3 w-3 rounded-full hover:bg-destructive/20 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveHelperToken(ht.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
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
      <CharacterIcon iconName={character.icon} className="text-foreground" size={24} />
      <span className="text-xs text-center text-muted-foreground">{character.name}</span>
    </button>
  );
}

