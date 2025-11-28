import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { lobbies, getNextUnassignedCharacter } from "../../../lobbies-store";
import { CHARACTERS_BY_TYPE } from "$lib/botc-data/trouble-brewing.svelte";
import type { Character } from "$lib/types/characters";

interface JoinRequest {
    playerName: string;
}

function findCharacterByName(name: string): Character | null {
    for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
        const character = characters.find(c => c.name === name);
        if (character) return character;
    }
    return null;
}

// POST /api/lobby/[lobby_id]/join
export const POST: RequestHandler = async ({ params, request }) => {
    const { lobby_id: lobbyId } = params;
    const { playerName } = await request.json() as JoinRequest;

    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
        return error(404, "Lobby not found");
    }

    const characterId = getNextUnassignedCharacter(lobby);
    if (!characterId) return error(400, "No characters available");

    // Assign the character to the player
    lobby.characterToPlayer[characterId] = playerName;

    const character = findCharacterByName(characterId);
    if (!character) {
        return error(500, "Character not found");
    }

    return json({
        name: character.name,
        type: character.type,
        ability: character.ability,
    });
};