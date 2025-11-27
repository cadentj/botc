import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { lobbies, type Lobby, type NewLobby } from "../lobbies-store";

// Helper to generate 4-character lobby code
function generateLobbyCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like 0/O, 1/I
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// POST /api/lobby
export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json() as NewLobby;

    const code = generateLobbyCode();
    const lobby: Lobby = {
        code,
        playerCount: body.playerCount,
        characterToPlayer: body.characterToPlayer,
    };

    lobbies.set(lobby.code, lobby);

    return json({ "code": code });
};
