"use client";

import { useEffect } from "react";
import { useGameEvents } from "@/hooks/use-game-events";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type {
  GameEvent,
  NightOutcomeEventData,
  DayEliminationEventData,
  VoteCastEventData,
  VoteChangedEventData,
  DetectiveRevealedEventData,
  DetectiveInvestigationEventData,
  PhaseChangedEventData,
  GameStartedEventData,
} from "@/types/events";

interface ActivityTimelineProps {
  gameId: string;
}

export function ActivityTimeline({ gameId }: ActivityTimelineProps) {
  const { events, loading } = useGameEvents(gameId);

  useEffect(() => {
    // No auto-scroll needed since latest is at top
  }, [events.length]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading activity...</p>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No activity yet. Game events will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }: { event: GameEvent }) {
  const renderEventContent = () => {
    switch (event.type) {
      case "game-started":
        return <GameStartedEvent event={event} />;
      case "night-outcome":
        return <NightOutcomeEvent event={event} />;
      case "day-elimination":
        return <DayEliminationEvent event={event} />;
      case "vote-cast":
        return <VoteCastEvent event={event} />;
      case "vote-changed":
        return <VoteChangedEvent event={event} />;
      case "detective-revealed":
        return <DetectiveRevealedEvent event={event} />;
      case "detective-investigation":
        return <DetectiveInvestigationEvent event={event} />;
      case "phase-changed":
        return <PhaseChangedEvent event={event} />;
      default:
        return <GenericEvent event={event} />;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">{renderEventContent()}</div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
        </span>
      </div>
    </Card>
  );
}

function GameStartedEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as GameStartedEventData;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎭</span>
        <span className="font-semibold">Game Started</span>
        <Badge variant="outline">Round 1</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {data.playerCount} players ready. Roles have been assigned.
      </p>
    </div>
  );
}

function NightOutcomeEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as NightOutcomeEventData;
  const savedByDoctor = data.savedByDoctor ?? false;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌙</span>
        <span className="font-semibold">Night {event.round} Ended</span>
      </div>
      {savedByDoctor ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✨ Someone was saved! No one was eliminated.
        </p>
      ) : data.eliminatedName ? (
        <div className="space-y-1">
          <p className="text-sm">
            <strong>{data.eliminatedName}</strong> was eliminated
          </p>
          {data.eliminatedRole && (
            <p className="text-xs text-muted-foreground">
              Role revealed: {data.eliminatedRole}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Night passed without incident.</p>
      )}
    </div>
  );
}

function DayEliminationEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as DayEliminationEventData;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">☀️</span>
        <span className="font-semibold">Day {event.round} Ended</span>
      </div>
      <p className="text-sm">
        <strong>{data.eliminatedName}</strong> was voted out
      </p>
      <p className="text-xs text-muted-foreground">
        Final vote count: {data.voteCount}
      </p>
      {data.eliminatedRole && (
        <p className="text-xs text-muted-foreground">
          Role revealed: {data.eliminatedRole}
        </p>
      )}
    </div>
  );
}

function VoteCastEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as VoteCastEventData;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">🗳️</span>
        <span className="font-semibold">Vote Cast</span>
      </div>
      <p className="text-sm">
        <strong>{data.voterName}</strong> voted to eliminate <strong>{data.targetName}</strong>
      </p>
    </div>
  );
}

function VoteChangedEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as VoteChangedEventData;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <span className="font-semibold">Vote Changed</span>
      </div>
      <p className="text-sm">
        <strong>{data.voterName}</strong> changed vote from{" "}
        <strong>{data.previousTargetName}</strong> to <strong>{data.newTargetName}</strong>
      </p>
    </div>
  );
}

function DetectiveRevealedEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as DetectiveRevealedEventData;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔍</span>
        <span className="font-semibold">Detective Revealed</span>
        <Badge variant="secondary">Public</Badge>
      </div>
      <p className="text-sm">
        <strong>{data.detectiveName}</strong> has revealed themselves as the Detective!
      </p>
      {data.investigationsRemaining !== null && (
        <p className="text-xs text-muted-foreground">
          Investigations remaining: {data.investigationsRemaining}
        </p>
      )}
    </div>
  );
}

function DetectiveInvestigationEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as DetectiveInvestigationEventData;
  const toneClass = data.isMafia ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🕵️</span>
        <span className="font-semibold">Detective Investigation</span>
        <Badge variant="outline">Round {event.round}</Badge>
      </div>
      <p className="text-sm">
        <strong>{data.detectiveName}</strong> investigated <strong>{data.targetName}</strong>.
      </p>
      <p className={cn("text-sm font-medium", toneClass)}>
        Result: {data.isMafia ? "Mafia" : "Not Mafia"}
      </p>
      {data.investigationsRemaining !== null && (
        <p className="text-xs text-muted-foreground">
          Checks remaining: {data.investigationsRemaining}
        </p>
      )}
    </div>
  );
}

function PhaseChangedEvent({ event }: { event: GameEvent }) {
  const data = event.data as unknown as PhaseChangedEventData;
  const phaseEmoji = data.newPhase === "night" ? "🌙" : data.newPhase === "day" ? "☀️" : "🎭";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{phaseEmoji}</span>
        <span className="font-semibold">
          {data.newPhase.charAt(0).toUpperCase() + data.newPhase.slice(1)} Phase Started
        </span>
        {data.round > 0 && <Badge variant="outline">Round {data.round}</Badge>}
      </div>
    </div>
  );
}

function GenericEvent({ event }: { event: GameEvent }) {
  return (
    <div className="space-y-1">
      <span className="font-semibold">{event.type}</span>
      {event.message && <p className="text-sm text-muted-foreground">{event.message}</p>}
    </div>
  );
}
