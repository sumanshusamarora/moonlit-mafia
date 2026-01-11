import { Avatar } from "@/components/ui/avatar";
import type { MafiaGame, GamePlayer, GameRole } from "@/types/game";
import { getRoleIcon } from "@/lib/game/role-icons";
import { cn } from "@/lib/utils";

interface PlayersPanelProps {
  game: MafiaGame;
  viewerId?: string | null;
  viewerRole?: GameRole | null;
  viewerIsDead?: boolean;
  revealDeadRoles?: boolean;
  isHost?: boolean;
  selectedPlayerUid?: string | null;
  onSelectPlayerUid?: (uid: string | null) => void;
}

const groupLabelStyles = "text-xs font-semibold uppercase tracking-[0.35em] text-textSecondary";

export function PlayersPanel({
  game,
  viewerId,
  viewerRole,
  viewerIsDead = false,
  revealDeadRoles = false,
  isHost = false,
  selectedPlayerUid = null,
  onSelectPlayerUid,
}: PlayersPanelProps) {
  const players = game.players;
  const alivePlayers = players.filter((player) => player.isAlive && !player.isSpectator);
  const fallenPlayers = players.filter((player) => !player.isAlive && !player.isSpectator);
  const observers = players.filter((player) => player.isSpectator);

  const renderPlayerRow = (player: GamePlayer) => {
    const statusTone = player.isAlive ? "bg-success" : "bg-danger";
    const statusLabel = player.isAlive ? (player.ready ? "Ready" : "Not ready") : "Eliminated";
    const mafiaVisible = viewerRole === "mafia" && player.role === "mafia";
    const detectiveRevealed = player.detectiveRevealed ?? false;
    const showRole =
      viewerIsDead ||
      player.uid === viewerId ||
      (!player.isAlive && revealDeadRoles) ||
      mafiaVisible ||
      detectiveRevealed;

    const canSelect = Boolean(game.isTestMode && isHost && !player.isSpectator);
    const isSelected = selectedPlayerUid === player.uid;
    const rowClassName = cn(
      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1 transition",
      "bg-muted/20 text-textPrimary ring-border/60",
      canSelect && "hover:bg-muted/30",
      isSelected && "ring-primary/50"
    );

    const handleSelect = () => {
      if (!canSelect) {
        return;
      }
      onSelectPlayerUid?.(isSelected ? null : player.uid);
    };

    return (
      <li key={player.uid}>
        {canSelect ? (
          <button
            type="button"
            className={rowClassName}
            onClick={handleSelect}
            aria-pressed={isSelected}
            data-testid="player-row"
            data-player-name={player.name}
          >
            <Avatar
              name={player.name}
              size="sm"
              status={player.isHost ? "host" : player.isAlive ? "alive" : "dead"}
              className="bg-muted/40 text-textPrimary"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold leading-none">{player.name}</span>
                {player.uid === viewerId && (
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-textSecondary">
                    You
                  </span>
                )}
                {player.isHost && (
                  <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-textSecondary">
                    Host
                  </span>
                )}
                {player.isTestPlayer && (
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-textSecondary">
                    Test
                  </span>
                )}
                {detectiveRevealed && (
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-textSecondary">
                    Revealed
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-textSecondary">
                <span className="flex items-center gap-1">
                  <span className={cn("h-2.5 w-2.5 rounded-full", statusTone)} />
                  {statusLabel}
                </span>
                {showRole && player.role && (
                  <span className="flex items-center gap-1 capitalize">
                    <span>{getRoleIcon(player.role)}</span>
                    {player.role}
                  </span>
                )}
                {player.isSpectator && <span className="uppercase tracking-wide">Observer</span>}
              </div>
            </div>
          </button>
        ) : (
          <div className={rowClassName} data-testid="player-row" data-player-name={player.name}>
            <Avatar
              name={player.name}
              size="sm"
              status={player.isHost ? "host" : player.isAlive ? "alive" : "dead"}
              className="bg-muted/40 text-textPrimary"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold leading-none">{player.name}</span>
                {player.uid === viewerId && (
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-textSecondary">
                    You
                  </span>
                )}
                {player.isHost && (
                  <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-textSecondary">
                    Host
                  </span>
                )}
                {player.isTestPlayer && (
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-textSecondary">
                    Test
                  </span>
                )}
                {detectiveRevealed && (
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-textSecondary">
                    Revealed
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-textSecondary">
                <span className="flex items-center gap-1">
                  <span className={cn("h-2.5 w-2.5 rounded-full", statusTone)} />
                  {statusLabel}
                </span>
                {showRole && player.role && (
                  <span className="flex items-center gap-1 capitalize">
                    <span>{getRoleIcon(player.role)}</span>
                    {player.role}
                  </span>
                )}
                {player.isSpectator && <span className="uppercase tracking-wide">Observer</span>}
              </div>
            </div>
          </div>
        )}
      </li>
    );
  };

  const renderGroup = (label: string, group: GamePlayer[]) => {
    if (!group.length) return null;
    return (
      <section className="space-y-3">
        <p className={groupLabelStyles}>{label}</p>
        <ul className="space-y-2">
          {group.map(renderPlayerRow)}
        </ul>
      </section>
    );
  };

  return (
    <aside className="flex h-full flex-col gap-6 rounded-3xl bg-surface p-6 text-textPrimary shadow-lg ring-1 ring-border/60">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-textSecondary">Players</p>
        <p className="mt-2 text-sm text-textSecondary">
          {alivePlayers.length} alive · {players.length} total
        </p>
      </header>
      <div className="space-y-6">
        {renderGroup("Alive", alivePlayers)}
        {renderGroup("Eliminated", fallenPlayers)}
        {renderGroup("Observers", observers)}
      </div>
    </aside>
  );
}
