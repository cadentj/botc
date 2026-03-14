import { Redis } from "@upstash/redis";
import { env } from "$env/dynamic/private";

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

const redis = new Redis({
    url: env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL ?? "",
    token: env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

const TWO_HOURS_SEC = 2 * 60 * 60;

function lobbyKey(code: string): string {
    return `lobby:${code.toUpperCase()}`;
}

export async function getLobby(code: string): Promise<Lobby | null> {
    return redis.get<Lobby>(lobbyKey(code));
}

export async function setLobby(lobby: Lobby): Promise<void> {
    await redis.set(lobbyKey(lobby.code), lobby, { ex: TWO_HOURS_SEC });
}

export async function deleteLobby(code: string): Promise<void> {
    await redis.del(lobbyKey(code));
}

// Return the character ID if a character is available
// Return null if no characters are available
export function getNextUnassignedCharacter(lobby: Lobby): string | null {
    // Find first unassigned character (where value is empty string or null)
    const unassignedCharacter = Object.entries(lobby.characterToPlayer ?? {})
        .find(([_, player]) => !player);

    if (!unassignedCharacter) return null;

    return unassignedCharacter[0];
}
