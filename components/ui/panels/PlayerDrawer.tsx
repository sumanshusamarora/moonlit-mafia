"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GamePlayer } from "@/types/game";
import { UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleIcon } from "@/lib/game/role-icons";

interface PlayerDrawerProps {
  players: GamePlayer[];
  viewerId: string;
  showRoles?: boolean;
  onPlayerSelect?: (playerId: string) => void;
}

/**
 * PlayerDrawer - Bottom sheet for viewing player list on mobile
 * 
 * Provides a swipeable drawer interface for accessing player information
 * without taking up constant screen space
 */
export function PlayerDrawer({ 
  players, 
  viewerId,
  showRoles = false,
  onPlayerSelect 
}: PlayerDrawerProps) {
  const alivePlayers = players.filter(p => p.isAlive && !p.isSpectator);
  const deadPlayers = players.filter(p => !p.isAlive && !p.isSpectator);
  const spectators = players.filter(p => p.isSpectator);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            <span>Players</span>
          </div>
          <Badge variant="secondary">
            {alivePlayers.length}/{players.filter(p => !p.isSpectator).length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Players</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(80vh-80px)] mt-4">
          <div className="space-y-4">
            {/* Alive Players */}
            {alivePlayers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Alive ({alivePlayers.length})
                </h3>
                <div className="grid gap-2">
                  {alivePlayers.map((player) => (
                    <PlayerCard
                      key={player.uid}
                      player={player}
                      isViewer={player.uid === viewerId}
                      showRole={showRoles}
                      onClick={onPlayerSelect ? () => onPlayerSelect(player.uid) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Dead Players */}
            {deadPlayers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Eliminated ({deadPlayers.length})
                </h3>
                <div className="grid gap-2">
                  {deadPlayers.map((player) => (
                    <PlayerCard
                      key={player.uid}
                      player={player}
                      isViewer={player.uid === viewerId}
                      showRole={showRoles}
                      onClick={onPlayerSelect ? () => onPlayerSelect(player.uid) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Spectators */}
            {spectators.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Spectators ({spectators.length})
                </h3>
                <div className="grid gap-2">
                  {spectators.map((player) => (
                    <PlayerCard
                      key={player.uid}
                      player={player}
                      isViewer={player.uid === viewerId}
                      showRole={false}
                      onClick={onPlayerSelect ? () => onPlayerSelect(player.uid) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface PlayerCardProps {
  player: GamePlayer;
  isViewer: boolean;
  showRole: boolean;
  onClick?: () => void;
}

function PlayerCard({ player, isViewer, showRole, onClick }: PlayerCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "w-full p-3 rounded-lg border bg-card text-left transition-colors",
        onClick && "hover:bg-accent cursor-pointer",
        !onClick && "cursor-default",
        isViewer && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {player.name}
            {isViewer && " (You)"}
          </span>
          {player.isHost && (
            <Badge variant="outline" className="text-xs">Host</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!player.isAlive && (
            <span className="text-lg">💀</span>
          )}
          {showRole && player.role && (
            <Badge 
              variant={player.role === "mafia" ? "destructive" : "outline"}
              className="text-xs"
            >
              {getRoleIcon(player.role)}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
