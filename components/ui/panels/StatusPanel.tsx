"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GamePhase } from "@/types/game";
import { MoonIcon, SunIcon, UsersIcon, TrophyIcon } from "lucide-react";

interface StatusPanelProps {
  phase: GamePhase;
  round: number;
  role?: string | null;
  isAlive?: boolean;
  isRevealed?: boolean;
  className?: string;
}

/**
 * StatusPanel - Compact display of player status
 * 
 * Shows current phase, round, and role in a condensed format
 */
export function StatusPanel({ 
  phase, 
  round, 
  role, 
  isAlive = true,
  isRevealed = false,
  className 
}: StatusPanelProps) {
  const getPhaseIcon = () => {
    switch (phase) {
      case "night":
        return <MoonIcon className="h-4 w-4" />;
      case "day":
        return <SunIcon className="h-4 w-4" />;
      case "lobby":
        return <UsersIcon className="h-4 w-4" />;
      case "ended":
        return <TrophyIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "night":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "day":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      case "lobby":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20";
      case "ended":
        return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20";
    }
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Badge variant="outline" className={cn("gap-1.5", getPhaseColor())}>
        {getPhaseIcon()}
        <span className="capitalize">{phase}</span>
        {phase !== "lobby" && phase !== "ended" && (
          <span className="text-xs">• R{round}</span>
        )}
      </Badge>
      
      {role && (
        <Badge 
          variant={isAlive ? "default" : "secondary"}
          className={cn(
            "capitalize",
            !isAlive && "opacity-60",
            isRevealed && "border-primary"
          )}
        >
          {!isAlive && "👻 "}
          {role}
          {isRevealed && " 🔍"}
        </Badge>
      )}
    </div>
  );
}
