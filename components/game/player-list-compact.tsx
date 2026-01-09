import type { GamePlayer, GameRole } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getRoleIcon } from "@/lib/game/role-icons";

interface PlayerListCompactProps {
  players: GamePlayer[];
  viewerId?: string;
  viewerIsDead?: boolean;
  revealDeadRoles?: boolean;
  viewerRole?: GameRole | null;
}

export function PlayerListCompact({
  players,
  viewerId,
  viewerIsDead = false,
  revealDeadRoles = false,
  viewerRole = null,
}: PlayerListCompactProps) {
  if (!players.length) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
        Waiting for players...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {players.map((player) => {
          const mafiaVisible = viewerRole === "mafia" && player.role === "mafia";
          const detectiveRevealed = player.detectiveRevealed ?? false;
          const showRole =
            viewerIsDead ||
            player.uid === viewerId ||
            (!player.isAlive && revealDeadRoles) ||
            mafiaVisible ||
            detectiveRevealed;

          return (
            <div
              key={player.uid}
              className={cn(
                "relative flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background/70 p-3 transition",
                !player.isAlive && "opacity-60 grayscale",
                player.uid === viewerId && "ring-2 ring-primary ring-offset-1"
              )}
            >
              {/* Status indicator dot */}
              <div className="absolute right-2 top-2">
                {player.isAlive ? (
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>

              {/* Player name */}
              <div className="pr-4">
                <p className="truncate text-sm font-semibold">{player.name}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1">
                {player.isHost && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">👑</Badge>
                )}
                {showRole && player.role && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={mafiaVisible ? "destructive" : "outline"}
                        className="cursor-help text-[10px] px-1.5 py-0"
                      >
                        {getRoleIcon(player.role)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="capitalize">{player.role}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {detectiveRevealed && player.isAlive && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">🔍</Badge>
                )}
              </div>

              {/* Ready status for lobby */}
              {!player.role && (
                <div className="mt-1">
                  {player.ready ? (
                    <span className="text-[10px] text-green-600 dark:text-green-400">✓ Ready</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Waiting...</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
