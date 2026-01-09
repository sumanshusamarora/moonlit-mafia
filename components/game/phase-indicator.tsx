import { Badge } from "@/components/ui/badge";
import { MoonIcon, SunIcon } from "lucide-react";
import type { GamePhase } from "@/types/game";

interface PhaseIndicatorProps {
  phase: GamePhase;
  round: number;
}

const PHASE_CONFIG = {
  lobby: {
    icon: "🎭",
    label: "LOBBY",
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
  },
  night: {
    icon: MoonIcon,
    label: "NIGHT",
    bgColor: "bg-primary/10",
    textColor: "text-primary",
  },
  day: {
    icon: SunIcon,
    label: "DAY",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
    textColor: "text-amber-900 dark:text-amber-400",
  },
  ended: {
    icon: "🏆",
    label: "ENDED",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    textColor: "text-green-900 dark:text-green-400",
  },
} as const;

export function PhaseIndicator({ phase, round }: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];
  const Icon = typeof config.icon === "string" ? null : config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon className={`h-5 w-5 ${config.textColor}`} />
          ) : (
            <span className="text-xl">{config.icon}</span>
          )}
          <span className={`text-lg font-bold uppercase tracking-wide ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        {phase !== "lobby" && phase !== "ended" && (
          <Badge variant="outline" className="text-xs">
            Round {round}
          </Badge>
        )}
      </div>
    </div>
  );
}
