export type GamePhase = "lobby" | "night" | "day" | "ended";

export type GameRole =
  | "mafia"
  | "villager"
  | "detective"
  | "doctor"
  | "jester"
  | "guardian"
  | "vigilante";

export interface RoleConfig {
  role: GameRole;
  count: number;
}

export interface GameConfig {
  maxPlayers: number;
  enableVoice: boolean;
  enableAnonymousVotes: boolean;
  revealRolesOnDeath: boolean;
  dayDurationMinutes: number;
  nightDurationMinutes: number;
  roles: RoleConfig[];
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
}

export interface VoteState {
  targetUid: string;
  voterUid: string;
  createdAt: number;
}

export interface GameVoiceMemo {
  id: string;
  gameId: string;
  storagePath: string;
  url?: string;
  ownerUid: string;
  ownerName: string;
  createdAt: number;
  durationMs: number;
  deleted?: boolean;
}

export interface GameMessage {
  id: string;
  gameId: string;
  authorUid: string;
  authorName: string;
  body: string;
  emoji?: string;
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
  votes?: VoteState[];
  phaseEndsAt?: number | null;
  lastAction?: string;
  status: "waiting" | "in-progress" | "completed";
}

export interface JoinGamePayload {
  code: string;
  name: string;
}

export interface CreateGamePayload {
  hostName: string;
  config: GameConfig;
}
