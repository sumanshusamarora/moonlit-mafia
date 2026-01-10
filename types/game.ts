export type GamePhase = "lobby" | "night" | "day" | "ended";

export type GameRole =
  | "mafia"
  | "villager"
  | "detective"
  | "doctor"
  | "jester"
  | "guardian"
  | "vigilante";

export type NightStage = "idle" | "mafia" | "doctor" | "detective" | "resolution";

export interface NightVote {
  voterUid: string;
  targetUid: string;
  submittedAt: number;
}

export interface DetectiveResult {
  targetUid: string;
  isMafia: boolean;
  revealedAt: number;
}

export interface NightState {
  stage: NightStage;
  mafiaVotes: NightVote[];
  lockedTargetUid: string | null;
  doctorTargetUid: string | null;
  detectiveTargetUid: string | null;
  detectiveResult: DetectiveResult | null;
  lastTransitionAt: number;
}

export interface DayEliminationState {
  votingComplete: boolean;
  leadingCandidateUid: string | null;
  leadingCandidateName: string | null;
  leadingVoteCount: number;
  totalVoters: number;
  eliminated: boolean;
}

export interface RoleConfig {
  role: GameRole;
  count: number;
}

export interface GameConfig {
  maxPlayers: number;
  enableAnonymousVotes: boolean;
  revealRolesOnDeath: boolean;
  dayDurationMinutes: number;
  nightDurationMinutes: number;
  roles: RoleConfig[];
  detectiveOncePerRound: boolean;
  detectiveChecksLimit: number | null;
}

export interface GamePlayer {
  uid: string;
  name: string;
  role: GameRole | null;
  isAlive: boolean;
  isHost: boolean;
  joinedAt: number;
  ready: boolean;
  muted?: boolean;
  detectiveChecksRemaining?: number | null;
  detectiveRevealed?: boolean;
  isTestPlayer?: boolean;
}

export interface VoteState {
  targetUid: string;
  voterUid: string;
  createdAt: number;
}

export interface GameMessage {
  id: string;
  gameId: string;
  authorUid: string;
  authorName: string;
  body: string;
  emoji?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  createdAt: number;
  phase: GamePhase;
  isSystem?: boolean;
}

export interface MafiaGame {
  id: string;
  code: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  phase: GamePhase;
  round: number;
  config: GameConfig;
  players: GamePlayer[];
  playerIds: string[];
  hostPeeked?: boolean;
  nightState?: NightState;
  dayEliminationState?: DayEliminationState | null;
  votes?: VoteState[];
  phaseEndsAt?: number | null;
  lastAction?: string;
  status: "waiting" | "in-progress" | "completed";
  isTestMode?: boolean;
}

export interface JoinGamePayload {
  code: string;
  name: string;
}

export interface CreateGamePayload {
  hostName: string;
  config: GameConfig;
  isTestMode?: boolean;
  testPlayerCount?: number;
}
