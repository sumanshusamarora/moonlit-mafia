export type GameEventType =
  | "game-started"
  | "night-outcome"
  | "day-elimination"
  | "vote-cast"
  | "vote-changed"
  | "detective-revealed"
  | "detective-investigation"
  | "phase-changed"
  | "game-ended"
  | "player-joined"
  | "player-left";

export interface GameEvent {
  id: string;
  gameId: string;
  type: GameEventType;
  phase: "lobby" | "night" | "day" | "ended";
  round: number;
  timestamp: number;
  data: Record<string, unknown>;
  message?: string;
}

export interface NightOutcomeEventData {
  eliminatedUid?: string;
  eliminatedName?: string;
  eliminatedRole?: string;
  savedByDoctor?: boolean;
}

export interface DayEliminationEventData {
  eliminatedUid: string;
  eliminatedName: string;
  eliminatedRole?: string;
  voteCount: number;
}

export interface VoteCastEventData {
  voterUid: string;
  voterName: string;
  targetUid: string;
  targetName: string;
}

export interface VoteChangedEventData {
  voterUid: string;
  voterName: string;
  previousTargetUid: string;
  previousTargetName: string;
  newTargetUid: string;
  newTargetName: string;
}

export interface DetectiveRevealedEventData {
  detectiveUid: string;
  detectiveName: string;
  investigationsRemaining: number | null;
}

export interface DetectiveInvestigationEventData {
  detectiveUid: string;
  detectiveName: string;
  targetUid: string;
  targetName: string;
  isMafia: boolean;
  investigationsRemaining: number | null;
}

export interface PhaseChangedEventData {
  previousPhase: "lobby" | "night" | "day" | "ended";
  newPhase: "lobby" | "night" | "day" | "ended";
  round: number;
}

export interface GameStartedEventData {
  playerCount: number;
  roleDistribution: Record<string, number>;
}

export interface GameEndedEventData {
  winner: "mafia" | "village";
  aliveMafiaCount: number;
  aliveVillageCount: number;
  totalRounds: number;
}
