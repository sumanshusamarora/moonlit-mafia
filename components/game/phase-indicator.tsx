import { Badge } from "@/components/ui/badge";
import { MoonIcon, SunIcon } from "lucide-react";
import type { GamePhase } from "@/types/game";

interface PhaseIndicatorProps {
  phase: GamePhase;
  round: number;
  variant?: "default" | "minimal";
}

const PHASE_CONFIG: Record<GamePhase, {
  icon: string | typeof MoonIcon;
  label: string;
  bgColor: string;
  textColor: string;
}> = {
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
};

export function PhaseIndicator({ phase, round, variant = "default" }: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];
  const iconValue = config.icon;
  const isStringIcon = typeof iconValue === "string";

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-3 rounded-full bg-white/5 px-5 py-3 text-white">
        <div className="flex items-center justify-center rounded-full bg-white/10 p-2">
          {isStringIcon ? (
            <span className="text-lg leading-none">{iconValue}</span>
          ) : (
            (() => {
              const IconComponent = iconValue;
              return <IconComponent className="h-5 w-5" aria-hidden />;
            })()
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">
            Phase
          </span>
          <span className="text-lg font-semibold tracking-tight">
            {config.label.toLowerCase() === "lobby" ? "Lobby Setup" : config.label}
            {phase !== "lobby" && phase !== "ended" ? ` · Round ${round}` : ""}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStringIcon ? (
            <span className="text-xl">{iconValue}</span>
          ) : (
            (() => {
              const IconComponent = iconValue;
              return <IconComponent className={`h-5 w-5 ${config.textColor}`} />;
            })()
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
