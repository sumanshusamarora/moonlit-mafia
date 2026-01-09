import { z } from "zod";
import { ROLE_DEFINITIONS } from "./roles";

export const roleIdSchema = z.enum([
  "mafia",
  "villager",
  "detective",
  "doctor",
  "jester",
  "guardian",
  "vigilante",
]);

export const roleConfigSchema = z.object({
  role: roleIdSchema,
  count: z.number().int().min(0).max(10),
});

export const gameConfigSchema = z.object({
  maxPlayers: z.number().int().min(4).max(16),
  enableVoice: z.boolean(),
  enableAnonymousVotes: z.boolean(),
  revealRolesOnDeath: z.boolean(),
  dayDurationMinutes: z.number().int().min(1).max(30),
  nightDurationMinutes: z.number().int().min(1).max(30),
  detectiveOncePerRound: z.boolean(),
  detectiveChecksLimit: z.number().int().min(0).max(16).nullable(),
  roles: z
    .array(roleConfigSchema)
    .nonempty()
    .superRefine((roles, ctx) => {
      const byRole = new Map<string, number>();
      for (const entry of roles) {
        const current = byRole.get(entry.role) ?? 0;
        byRole.set(entry.role, current + entry.count);
      }

      const total = [...byRole.values()].reduce((sum, value) => sum + value, 0);
      if (total === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Assign at least one role",
        });
      }

      const mafiaCount = byRole.get("mafia") ?? 0;
      if (mafiaCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one Mafia member",
        });
      }
    }),
}).superRefine((config, ctx) => {
  if (!config.detectiveOncePerRound) {
    if (config.detectiveChecksLimit === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["detectiveChecksLimit"],
        message: "Provide the number of investigations available to the detective.",
      });
    }
  }
});

export const createGameSchema = z.object({
  hostName: z.string().min(2).max(24),
  config: gameConfigSchema,
});

export const joinGameSchema = z.object({
  code: z.string().min(4).max(8).toUpperCase(),
  name: z.string().min(2).max(24),
});

export const ROLE_SUMMARY = ROLE_DEFINITIONS.map((role) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  team: role.team,
}));
