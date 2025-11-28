import { error } from "@sveltejs/kit";

export interface Lobby {
    code: string;
    playerCount: number;
    characterToPlayer: Record<string, string>;
}

export interface NewLobby { 
    playerCount: number;
    characterToPlayer: Record<string, string>;
}

export const lobbies = new Map<string, Lobby>();

// Return the character ID if a character is available
// Return null if no characters are available
export function getNextUnassignedCharacter(lobby: Lobby): string | null {
    // Find first unassigned character (where value is empty string or null)
    const unassignedCharacter = Object.entries(lobby.characterToPlayer ?? {})
        .find(([_, player]) => !player);

    if (!unassignedCharacter) return null;

    return unassignedCharacter[0];
}