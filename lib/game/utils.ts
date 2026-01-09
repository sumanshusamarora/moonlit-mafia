import { ROLE_DEFINITIONS } from "./roles";
import type {
  GameConfig,
  GamePlayer,
  GameRole,
  MafiaGame,
  RoleConfig,
} from "@/types/game";

export const generateGameCode = (): string => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += charset[Math.floor(Math.random() * charset.length)];
  }
  return code;
};

export const ensureRoleTotals = (config: GameConfig) => {
  const total = config.roles.reduce((sum, role) => sum + role.count, 0);
  if (total < config.maxPlayers) {
    const villagers = config.roles.find((role) => role.role === "villager");
    if (villagers) {
      villagers.count += config.maxPlayers - total;
    }
  }
};

export const recommendedRoles = (playerCount: number): RoleConfig[] => {
  const roles = ROLE_DEFINITIONS.map((role) => ({
    role: role.id,
    count: role.recommendedCount(playerCount),
  }));
  const total = roles.reduce((sum, role) => sum + role.count, 0);
  if (total < playerCount) {
    const villagers = roles.find((role) => role.role === "villager");
    if (villagers) {
      villagers.count += playerCount - total;
    }
  }
  return roles;
};

export const sortPlayers = (players: GamePlayer[]): GamePlayer[] => {
  return [...players].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    if (a.isAlive && !b.isAlive) return -1;
    if (!a.isAlive && b.isAlive) return 1;
    return a.joinedAt - b.joinedAt;
  });
};

export const visibleRole = (player: GamePlayer, viewerId: string): GameRole | null => {
  if (player.uid === viewerId) {
    return player.role;
  }
  return player.isAlive ? null : player.role;
};

export const findPlayer = (game: MafiaGame | null | undefined, uid: string) => {
  return game?.players.find((player) => player.uid === uid) ?? null;
};
