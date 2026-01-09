import type { GamePlayer } from "@/types/game";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: GamePlayer[];
  viewerId?: string;
  revealRoles: boolean;
}

export function PlayerList({ players, viewerId, revealRoles }: PlayerListProps) {
  if (!players.length) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center text-sm text-muted-foreground">
        Waiting for players to join.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {players.map((player) => {
        const status = player.isHost ? "host" : player.isAlive ? "alive" : "dead";
        const showRole = revealRoles || player.uid === viewerId || !player.isAlive;
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
          >
            <div className="flex items-center gap-3">
              <Avatar name={player.name} size="md" status={status} />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{player.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {player.isHost && <Badge variant="secondary">Host</Badge>}
                  {!player.isAlive && <Badge variant="destructive">Eliminated</Badge>}
                  {showRole && player.role && <Badge variant="outline">{player.role}</Badge>}
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
  );
}
