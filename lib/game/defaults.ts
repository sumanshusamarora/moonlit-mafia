import type { GameConfig } from "@/types/game";
import { DEFAULT_ROLE_CONFIG } from "./roles";

const DEFAULT_PLAYER_CAP = 10;

const defaultRoleConfig = DEFAULT_ROLE_CONFIG(DEFAULT_PLAYER_CAP);
const defaultMafiaCount = defaultRoleConfig.find((role) => role.role === "mafia")?.count ?? 1;

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxPlayers: DEFAULT_PLAYER_CAP,
  enableVoice: true,
  enableAnonymousVotes: false,
  revealRolesOnDeath: true,
  dayDurationMinutes: 4,
  nightDurationMinutes: 2,
  detectiveOncePerRound: false,
  detectiveChecksLimit: defaultMafiaCount,
  roles: defaultRoleConfig,
};
