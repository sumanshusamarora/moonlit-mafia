import { Badge } from "@/components/ui/badge";
import type { GameRole } from "@/types/game";
import { getRoleIcon } from "@/lib/game/role-icons";

interface RoleReminderProps {
  role: GameRole | null;
  isAlive: boolean;
  isRevealed?: boolean;
}

const ROLE_CONFIG = {
  mafia: {
    label: "Mafia",
    color: "bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  villager: {
    label: "Villager",
    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  detective: {
    label: "Detective",
    color: "bg-purple-100 dark:bg-purple-900/20 text-purple-900 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  doctor: {
    label: "Doctor",
    color: "bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  guardian: {
    label: "Guardian",
    color: "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  },
  vigilante: {
    label: "Vigilante",
    color: "bg-orange-100 dark:bg-orange-900/20 text-orange-900 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  jester: {
    label: "Jester",
    color: "bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
} as const;

export function RoleReminder({ role, isAlive, isRevealed }: RoleReminderProps) {
  if (!role) {
    return (
      <div className="rounded-lg border bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">No role assigned</span>
        </div>
      </div>
    );
  }

  const config = ROLE_CONFIG[role];

  return (
    <div className={`rounded-lg border p-3 ${config.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getRoleIcon(role)}</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wide">
              Your Role: {config.label}
            </span>
            {isRevealed && (
              <span className="text-xs opacity-80">
                (Publicly Revealed)
              </span>
            )}
          </div>
        </div>
        <Badge variant={isAlive ? "default" : "secondary"} className="text-xs">
          {isAlive ? "Alive" : "Eliminated"}
        </Badge>
      </div>
    </div>
  );
}
