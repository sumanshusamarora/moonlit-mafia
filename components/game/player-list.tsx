import type { GamePlayer, GameRole } from "@/types/game";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getRoleIcon } from "@/lib/game/role-icons";

interface PlayerListProps {
  players: GamePlayer[];
  viewerId?: string;
  viewerIsDead?: boolean;
  revealDeadRoles?: boolean;
  viewerRole?: GameRole | null;
}

export function PlayerList({
  players,
  viewerId,
  viewerIsDead = false,
  revealDeadRoles = false,
  viewerRole = null,
}: PlayerListProps) {
  if (!players.length) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center text-sm text-muted-foreground">
        Waiting for players to join.
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ul className="grid gap-3">
        {players.map((player) => {
          const status = player.isHost ? "host" : player.isAlive ? "alive" : "dead";
          const mafiaVisible = viewerRole === "mafia" && player.role === "mafia";
          const detectiveRevealed = player.detectiveRevealed ?? false;
          const showRole =
            viewerIsDead ||
            player.uid === viewerId ||
            (!player.isAlive && revealDeadRoles) ||
            mafiaVisible ||
            detectiveRevealed;
          
          const roleIcon = detectiveRevealed ? "🔍" : null;
          return (
            <li
              key={player.uid}
              className={cn(
                "flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-4 transition",
                !player.isAlive && "opacity-80 grayscale"
              )}
              data-testid="player-row"
              data-player-id={player.uid}
              data-player-name={player.name}
              data-player-ready={player.ready ? "ready" : "not-ready"}
              data-player-role={player.role ?? "unknown"}
            >
              <div className="flex items-center gap-3">
                <Avatar name={player.name} size="md" status={status} />
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold">{player.name}</p>
                    {roleIcon && <span className="text-sm">{roleIcon}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {player.isHost && <Badge variant="secondary">Host</Badge>}
                    {!player.isAlive && <Badge variant="destructive">Eliminated</Badge>}
                    {showRole && player.role && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant={mafiaVisible ? "destructive" : "outline"} className="cursor-help">
                            {getRoleIcon(player.role)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{player.role}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {detectiveRevealed && player.isAlive && (
                      <Badge variant="outline" className="text-purple-600 dark:text-purple-400">Revealed</Badge>
                    )}
                    {player.uid === viewerId && <Badge variant="success">You</Badge>}
                  </div>
                </div>
              </div>
              {player.ready ? (
                <Badge variant="success">Ready</Badge>
              ) : (
                <Badge variant="outline">Not ready</Badge>
              )}
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
