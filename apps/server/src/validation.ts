import { playerService } from "./services/player.js";
import type { Player } from "./db/schema.js";

export class GameError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "GameError";
  }
}

export async function requireInLobby(playerId: string | undefined): Promise<Player> {
  if (!playerId) {
    throw new GameError("NOT_IN_LOBBY", "You are not in a lobby");
  }

  const player = await playerService.findById(playerId);
  if (!player) {
    throw new GameError("NOT_IN_LOBBY", "Player not found");
  }

  return player;
}

