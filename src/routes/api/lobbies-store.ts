import { error } from "@sveltejs/kit";

export interface Lobby {
    code: string;
    playerCount: number;
    characterToPlayer: Record<string, string>;
    createdAt: number;
}

export interface NewLobby { 
    playerCount: number;
    characterToPlayer: Record<string, string>;
}

export const lobbies = new Map<string, Lobby>();

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function cleanupStaleLobbies() {
    const now = Date.now();
    for (const [code, lobby] of lobbies) {
        if (now - lobby.createdAt > TWO_HOURS_MS) {
            lobbies.delete(code);
        }
    }
}

// Run cleanup every hour
setInterval(cleanupStaleLobbies, 60 * 60 * 1000);

// Return the character ID if a character is available
// Return null if no characters are available
export function getNextUnassignedCharacter(lobby: Lobby): string | null {
    // Find first unassigned character (where value is empty string or null)
    const unassignedCharacter = Object.entries(lobby.characterToPlayer ?? {})
        .find(([_, player]) => !player);

    if (!unassignedCharacter) return null;

    return unassignedCharacter[0];
}