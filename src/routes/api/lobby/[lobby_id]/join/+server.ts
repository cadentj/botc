import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import {
    assignPlayerToCharacter,
    findAssignedCharacter,
    getLobby,
    getNextUnassignedCharacter,
    normalizePlayerName,
    setLobby,
} from "../../../lobbies-store";
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
    const normalizedPlayerName =
        typeof playerName === "string" ? normalizePlayerName(playerName) : "";

    if (!normalizedPlayerName) {
        return error(400, "Missing player name");
    }

    const lobby = await getLobby(lobbyId.toUpperCase());
    if (!lobby) {
        return error(404, "Lobby not found");
    }

    const existingCharacterName = findAssignedCharacter(
        lobby,
        normalizedPlayerName
    );
    if (existingCharacterName) {
        // Player already joined - return their existing character
        const character = findCharacterByName(existingCharacterName);
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

    assignPlayerToCharacter(lobby, characterName, normalizedPlayerName);
    await setLobby(lobby);

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


