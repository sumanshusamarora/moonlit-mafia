"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_DEFINITIONS } from "@/lib/game/roles";
import type { GamePlayer, GameRole, MafiaGame } from "@/types/game";

const PHASE_LABEL: Record<MafiaGame["phase"], string> = {
  lobby: "Lobby setup",
  night: "Night actions",
  day: "Day deliberation",
  ended: "Session archived",
};

const ROLE_PHASE_HINTS: Partial<Record<GameRole, Partial<Record<MafiaGame["phase"], string>>>> = {
  mafia: {
    lobby: "Stay inconspicuous. Ready up when your team is set.",
    night: "Coordinate with fellow mafia in the Night Actions panel to select a target.",
    day: "Blend in during discussion and steer the vote away from allies.",
  },
  doctor: {
    lobby: "Review the lobby composition and wait for the game to begin.",
    night: "Use the Night Actions panel to shield one living player from harm.",
    day: "Listen for patterns that reveal the mafia's target preferences.",
  },
  detective: {
    lobby: "Prepare to investigate once night falls.",
    night: "Investigate a player to uncover their alignment. Your results appear here and in chat.",
    day: "Decide how much to share from your intel while avoiding becoming a target.",
  },
  villager: {
    lobby: "Coordinate with friends and ready up when you're prepared.",
    night: "Rest easy—your role has no night duties. Watch the logs for clues.",
    day: "Debate, deduce, and cast your vote in the Voting panel.",
  },
};

const DEFAULT_PHASE_HINT: Record<MafiaGame["phase"], string> = {
  lobby: "Ready up once your settings look good. The host will start when everyone is prepared.",
  night: "Check the Night Actions panel to see if your role has any responsibilities right now.",
  day: "Use the Voting panel to cast or clear your vote. Share intel in chat.",
  ended: "This game is complete. Wrap up discussions or archive the lobby.",
};

const TEAM_LABEL: Record<"mafia" | "village" | "neutral", string> = {
  mafia: "Mafia",
  village: "Village",
  neutral: "Neutral",
};

const TEAM_BADGE_VARIANT: Record<"mafia" | "village" | "neutral", "destructive" | "secondary" | "outline"> = {
  mafia: "destructive",
  village: "secondary",
  neutral: "outline",
};

interface RoleCalloutProps {
  game: MafiaGame;
  viewer: GamePlayer | null;
  mafiaRoster?: GamePlayer[];
}

export function RoleCallout({ game, viewer, mafiaRoster = [] }: RoleCalloutProps) {
  const phase = game.phase;
  const isNight = phase === "night";
  const isDay = phase === "day";

  if (!viewer) {
    return (
      <Card className="border-primary/40 bg-primary/5" data-testid="role-callout">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Join the lobby</CardTitle>
          <p className="text-sm text-muted-foreground">
            You need to join the lobby to receive a role and participate in the game.
          </p>
        </CardHeader>
      </Card>
    );
  }

  const role = viewer.role;
  const isAlive = viewer.isAlive;
  const definition = ROLE_DEFINITIONS.find((entry) => entry.id === role);
  const roleName = definition?.name ?? (role ?? "Unassigned");
  const team = definition?.team ?? "village";
  const phaseDescriptor = PHASE_LABEL[phase];
  const rolePhaseHint = (role && ROLE_PHASE_HINTS[role]?.[phase]) ?? DEFAULT_PHASE_HINT[phase];

  const actionHints: string[] = [];
  if (rolePhaseHint) {
    actionHints.push(rolePhaseHint);
  }

  if (phase === "lobby") {
    actionHints.push(viewer.ready ? "You're marked ready. You can still tweak settings until the host starts." : "Hit Ready up to signal that you're prepared.");
  }

  const otherMafia = role === "mafia" ? mafiaRoster.filter((player) => player.uid !== viewer.uid) : [];

  if (isNight && role === "mafia") {
    if (otherMafia.length) {
      const names = otherMafia.map((player) => player.name).join(", ");
      actionHints.push(`Mafia team: coordinate with ${names}. You can all see each other's votes.`);
    } else {
      actionHints.push("You are the last mafia standing—choose the target yourself and avoid suspicion.");
    }
  }

  if (isDay && !isAlive) {
    actionHints.push("You're eliminated—observe the discussion and plan for future rounds.");
  }

  if (isNight && !isAlive) {
    actionHints.push("As a ghost you can observe all roles. Use this knowledge to help the village when day returns (if allowed).");
  }

  if (phase === "day" && role === "mafia") {
    actionHints.push("Keep suspicion away from mafia allies and nudge the vote toward villagers.");
  }

  return (
    <Card className="border-primary/40 bg-primary/5" data-testid="role-callout">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{phaseDescriptor}</Badge>
            <Badge variant={TEAM_BADGE_VARIANT[team]}>{TEAM_LABEL[team]}</Badge>
            <Badge variant={isAlive ? "success" : "destructive"}>{isAlive ? "Alive" : "Eliminated"}</Badge>
          </div>
          <CardTitle className="text-2xl font-semibold">{roleName}</CardTitle>
          {definition?.description && (
            <p className="text-sm text-muted-foreground">{definition.description}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {actionHints.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key directives</p>
            <ul className="mt-2 space-y-2 text-sm">
              {actionHints.map((hint, index) => (
                <li key={`${hint}-${index}`} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {role === "mafia" && mafiaRoster.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mafia roster</p>
            <ul className="mt-2 space-y-1 text-sm">
              {mafiaRoster.map((player) => (
                <li
                  key={player.uid}
                  className="flex items-center justify-between rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
                >
                  <span className="font-medium">
                    {player.uid === viewer.uid ? `${player.name} (you)` : player.name}
                  </span>
                  {!player.isAlive ? (
                    <Badge variant="outline">Eliminated</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
