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

export const ROLE_COLORS: Record<GameRole, string> = {
  mafia: "destructive",
  villager: "secondary",
  detective: "default",
  doctor: "default",
  guardian: "default",
  vigilante: "default",
  jester: "outline",
};

export const getRoleColor = (role: GameRole | null): string => {
  if (!role) return "outline";
  return ROLE_COLORS[role] || "outline";
};
