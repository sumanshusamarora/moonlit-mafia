import type { GameRole } from "@/types/game";

export const ROLE_ICONS: Record<GameRole, string> = {
  mafia: "🔪",
  villager: "👨‍🌾",
  detective: "🔍",
  doctor: "⚕️",
  guardian: "🛡️",
  vigilante: "🔫",
  jester: "🤡",
};

export const getRoleIcon = (role: GameRole | null): string => {
  if (!role) return "❓";
  return ROLE_ICONS[role] || "❓";
};
