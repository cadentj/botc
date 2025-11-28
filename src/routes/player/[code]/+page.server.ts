import type { Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { lobbies, getNextUnassignedCharacter } from "../../api/lobbies-store";
import { CHARACTERS_BY_TYPE } from "$lib/botc-data/trouble-brewing.svelte";
import type { Character } from "$lib/types/characters";

function findCharacterByName(name: string): Character | null {
    for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
        const character = characters.find(c => c.name === name);
        if (character) return character;
    }
    return null;
}

export const actions: Actions = {
    default: async ({ params, request }) => {
        const { code } = params;
        const formData = await request.formData();
        const playerName = formData.get("playerName") as string;

        if (!code || !playerName) {
            return fail(400, { error: "Missing lobby code or player name" });
        }

        const lobby = lobbies.get(code.toUpperCase());
        if (!lobby) {
            return fail(404, { error: "Lobby not found" });
        }

        const characterId = getNextUnassignedCharacter(lobby);
        if (!characterId) {
            return fail(400, { error: "No characters available" });
        }

        // Assign the character to the player
        lobby.characterToPlayer[characterId] = playerName.trim();

        const character = findCharacterByName(characterId);
        if (!character) {
            return fail(500, { error: "Character not found" });
        }

        return {
            role: {
                name: character.name,
                type: character.type,
                ability: character.ability,
            },
        };
    },
};

