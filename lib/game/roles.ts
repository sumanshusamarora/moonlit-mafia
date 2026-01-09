import type { GameRole } from "@/types/game";

export interface RoleDefinition {
  id: GameRole;
  name: string;
  description: string;
  team: "mafia" | "village" | "neutral";
  recommendedCount: (playerCount: number) => number;
  order: number;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "mafia",
    name: "Mafia",
    description: "Eliminate villagers at night while staying hidden.",
    team: "mafia",
    order: 0,
    recommendedCount: (playerCount) => Math.max(1, Math.floor(playerCount / 4)),
  },
  {
    id: "villager",
    name: "Villager",
    description: "Discuss during the day and vote to eliminate suspects.",
    team: "village",
    order: 1,
    recommendedCount: (playerCount) => {
      const mafia = Math.max(1, Math.floor(playerCount / 4));
      const doctor = 1; // Always 1 doctor
      const detective = playerCount >= 5 ? 1 : 0;
      const assigned = mafia + doctor + detective;
      return Math.max(2, playerCount - assigned);
    },
  },
  {
    id: "detective",
    name: "Detective",
    description: "Investigate one player each night to learn their alignment.",
    team: "village",
    order: 2,
    recommendedCount: (playerCount) => (playerCount >= 5 ? 1 : 0),
  },
  {
    id: "doctor",
    name: "Doctor",
    description: "Protect one player per night from elimination.",
    team: "village",
    order: 3,
    recommendedCount: () => 1,
  },
  {
    id: "guardian",
    name: "Guardian",
    description: "Bodyguard who can shield a player during the day vote once per game.",
    team: "village",
    order: 4,
    recommendedCount: () => 0,
  },
  {
    id: "vigilante",
    name: "Vigilante",
    description: "May eliminate one player at night, but risks harming the village.",
    team: "village",
    order: 5,
    recommendedCount: () => 0,
  },
  {
    id: "jester",
    name: "Jester",
    description: "Wins by being voted out during the day.",
    team: "neutral",
    order: 6,
    recommendedCount: () => 0,
  },
];

export const DEFAULT_ROLE_CONFIG = (playerCount: number) =>
  ROLE_DEFINITIONS.map((role) => ({
    role: role.id,
    count: role.recommendedCount(playerCount),
  }));
