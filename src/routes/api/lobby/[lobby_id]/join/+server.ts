import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { lobbies, getNextUnassignedCharacter } from "../../../lobbies-store";
import { CHARACTERS_BY_TYPE } from "$lib/botc-data/trouble-brewing.svelte";
import type { Character } from "$lib/types/characters";

function findCharacterByName(name: string): Character | null {
    for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
        const character = characters.find(c => c.name === name);
        if (character) return character;
    }
    return null;
}

// POST /api/lobby/[lobby_id]/join
// Body: { playerName: string }
export const POST: RequestHandler = async ({ params, request }) => {
    const { lobby_id: lobbyId } = params;
    const { playerName } = await request.json();

    if (!playerName) {
        return error(400, "Missing player name");
    }

    const lobby = lobbies.get(lobbyId.toUpperCase());
    if (!lobby) {
        return error(404, "Lobby not found");
    }

    // Check if player already exists in this lobby
    const existingEntry = Object.entries(lobby.characterToPlayer)
        .find(([_, name]) => name === playerName.trim());

    if (existingEntry) {
        // Player already joined - return their existing character
        const [characterName] = existingEntry;
        const character = findCharacterByName(characterName);
        if (!character) {
            return error(500, "Character not found");
        }
        return json({
            role: {
                name: character.name,
                type: character.type,
                ability: character.ability,
            },
        });
    }

    // Assign new character to player
    const characterName = getNextUnassignedCharacter(lobby);
    if (!characterName) {
        return error(400, "No characters available");
    }

    lobby.characterToPlayer[characterName] = playerName.trim();

    const character = findCharacterByName(characterName);
    if (!character) {
        return error(500, "Character not found");
    }

    return json({
        role: {
            name: character.name,
            type: character.type,
            ability: character.ability,
        },
    });
};

