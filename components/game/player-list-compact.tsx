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
  isTestMode?: boolean;
  isHost?: boolean;
  selectedPlayerUid?: string | null;
  onSelectPlayerUid?: (uid: string | null) => void;
}

export function PlayerListCompact({
  players,
  viewerId,
  viewerIsDead = false,
  revealDeadRoles = false,
  viewerRole = null,
  isTestMode = false,
  isHost = false,
  selectedPlayerUid = null,
  onSelectPlayerUid,
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

          // Test Mode: Admin can click test players to switch context
          const canSelect = Boolean(isTestMode && isHost && !player.isSpectator);
          const isSelected = selectedPlayerUid === player.uid;

          const handleSelect = () => {
            if (!canSelect || !onSelectPlayerUid) {
              return;
            }
            onSelectPlayerUid(isSelected ? null : player.uid);
          };

          const playerCard = (
            <div
              className={cn(
                "relative flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background/70 p-3 transition",
                !player.isAlive && "opacity-60 grayscale",
                player.uid === viewerId && "ring-2 ring-primary ring-offset-1",
                canSelect && "cursor-pointer hover:bg-muted/30 active:scale-95",
                isSelected && "ring-2 ring-primary/50 ring-offset-1"
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
                {player.isTestPlayer && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0" aria-label="Test player">Test</Badge>
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

          return canSelect ? (
            <button
              key={player.uid}
              type="button"
              onClick={handleSelect}
              className="min-h-[44px] text-left"
              data-testid="player-row"
              data-player-name={player.name}
              aria-pressed={isSelected}
              aria-label={`Select test player ${player.name}`}
            >
              {playerCard}
            </button>
          ) : (
            <div key={player.uid} data-testid="player-row" data-player-name={player.name}>
              {playerCard}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
