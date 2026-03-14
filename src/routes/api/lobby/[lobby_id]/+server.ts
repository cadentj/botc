import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import {
    assignPlayerToCharacter,
    clearCharacterAssignment,
    getLobby,
    setLobby,
} from "../../lobbies-store";

// GET /api/lobby/[lobby_id]
export const GET: RequestHandler = async ({ params }) => {
    const { lobby_id: lobbyId } = params;
    
    const lobby = await getLobby(lobbyId);
    if (!lobby) {
        return error(404, "Lobby not found");
    }

    return json({
        playerCount: lobby.playerCount,
        characterToPlayer: lobby.characterToPlayer,
    });
};

// PATCH /api/lobby/[lobby_id]
// Body: { characterName: string; playerName?: string }
export const PATCH: RequestHandler = async ({ params, request }) => {
    const { lobby_id: lobbyId } = params;
    const { characterName, playerName } = await request.json();

    if (typeof characterName !== "string" || !characterName.trim()) {
        return error(400, "Missing character name");
    }

    const lobby = await getLobby(lobbyId);
    if (!lobby) {
        return error(404, "Lobby not found");
    }

    if (!(characterName in (lobby.characterToPlayer ?? {}))) {
        return error(404, "Character not found");
    }

    if (typeof playerName === "string" && playerName.trim()) {
        assignPlayerToCharacter(lobby, characterName, playerName);
    } else {
        clearCharacterAssignment(lobby, characterName);
    }

    await setLobby(lobby);

    return json({
        characterToPlayer: lobby.characterToPlayer,
    });
};

