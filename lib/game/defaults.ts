import type { GameConfig } from "@/types/game";
import { ROLE_DEFINITIONS } from "./roles";

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxPlayers: 10,
  enableVoice: true,
  enableAnonymousVotes: false,
  revealRolesOnDeath: true,
  dayDurationMinutes: 4,
  nightDurationMinutes: 2,
  roles: ROLE_DEFINITIONS.map((role) => ({
    role: role.id,
    count: role.id === "mafia" ? 2 : role.id === "villager" ? 5 : role.id === "detective" ? 1 : 0,
  })),
};
