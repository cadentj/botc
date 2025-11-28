import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { lobbies } from "../../lobbies-store";

// GET /api/lobby/[lobby_id]
export const GET: RequestHandler = async ({ params }) => {
    const { lobby_id: lobbyId } = params;
    
    const lobby = lobbies.get(lobbyId);
    if (!lobby) {
        return error(404, "Lobby not found");
    }

    return json({
        playerCount: lobby.playerCount,
        characterToPlayer: lobby.characterToPlayer,
    });
};

