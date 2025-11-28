import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { lobbies, getNextUnassignedCharacter } from "../../../lobbies-store";

interface JoinRequest {
    playerName: string;
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

    return json({ characterId });
};