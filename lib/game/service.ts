"use client";

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  runTransaction,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { ensureAnonymousAuth, getFirebaseFirestore } from "@/lib/firebase/client";
import { ROLE_DEFINITIONS } from "./roles";
import { generateGameCode } from "./utils";
import { recordGameEvent } from "./events";
import { generateNightCommentary, generateDayCommentary } from "@/lib/ai/commentary";
import type {
  CreateGamePayload,
  DetectiveResult,
  GameMessage,
  GameRole,
  JoinGamePayload,
  MafiaGame,
  NightStage,
  NightState,
  NightVote,
  VoteState,
} from "@/types/game";
import { joinGameSchema, createGameSchema } from "./schemas";

const GAMES_COLLECTION = "games";
const MESSAGES_SUBCOLLECTION = "messages";

// Lazy initialization to avoid SSR issues
let _db: ReturnType<typeof getFirebaseFirestore> | null = null;
const getDb = () => {
  if (!_db) {
    _db = getFirebaseFirestore();
  }
  return _db;
};

const createInitialNightState = (stage: NightStage = "idle"): NightState => {
  const now = Date.now();
  return {
    stage,
    mafiaVotes: [],
    lockedTargetUid: null,
    doctorTargetUid: null,
    detectiveTargetUid: null,
    detectiveResult: null,
    lastTransitionAt: now,
  };
};

const getAliveRoleUids = (game: MafiaGame, role: GameRole) =>
  game.players.filter((player) => player.role === role && player.isAlive && !player.isSpectator).map((player) => player.uid);

const shuffleArray = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const determineConsensusTarget = (aliveMafia: string[], votes: NightVote[]): string | null => {
  if (!aliveMafia.length) {
    return null;
  }

  const firstVote = votes.find((vote) => aliveMafia.includes(vote.voterUid));
  if (!firstVote) {
    return null;
  }

  const target = firstVote.targetUid;
  const everyoneAgrees = aliveMafia.every((uid) => {
    const vote = votes.find((entry) => entry.voterUid === uid);
    return vote?.targetUid === target;
  });

  return everyoneAgrees ? target : null;
};

const determineNextNightStage = (game: MafiaGame, currentStage: NightStage): NightStage => {
  const hasDoctor = getAliveRoleUids(game, "doctor").length > 0;
  const hasDetective = getAliveRoleUids(game, "detective").length > 0;

  if (currentStage === "mafia") {
    if (hasDoctor) {
      return "doctor";
    }
    if (hasDetective) {
      return "detective";
    }
    return "resolution";
  }

  if (currentStage === "doctor") {
    if (hasDetective) {
      return "detective";
    }
    return "resolution";
  }

  if (currentStage === "detective") {
    return "resolution";
  }

  return "idle";
};

export const createGame = async (payload: CreateGamePayload) => {
  const parsed = createGameSchema.parse(payload);
  const auth = await ensureAnonymousAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Unable to authenticate user");
  }

  const code = generateGameCode();
  const gameRef = doc(collection(getDb(), GAMES_COLLECTION));

  const now = Date.now();
  const isTestMode = parsed.isTestMode ?? false;
  const testPlayerCount = parsed.testPlayerCount ?? 0;

  // Create initial players array with host
  const players: MafiaGame["players"] = [
    {
      uid: user.uid,
      name: parsed.hostName,
      role: null,
      isAlive: true,
      isHost: true,
      joinedAt: now,
      ready: true,
      isTestPlayer: false,
    },
  ];

  const playerIds = [user.uid];

  // Add test players if test mode is enabled
  if (isTestMode && testPlayerCount > 0) {
    for (let i = 1; i <= testPlayerCount; i++) {
      const testPlayerUid = `test_player_${i}`;
      players.push({
        uid: testPlayerUid,
        name: `Test Player ${i}`,
        role: null,
        isAlive: true,
        isHost: false,
        joinedAt: now,
        ready: true,
        isTestPlayer: true,
      });
      playerIds.push(testPlayerUid);
    }
  }

  const game: MafiaGame = {
    id: gameRef.id,
    code,
    hostId: user.uid,
    hostName: parsed.hostName,
    createdAt: now,
    round: 0,
    phase: "lobby",
    status: "waiting",
    phaseEndsAt: null,
    config: parsed.config,
    players,
    playerIds,
    hostPeeked: false,
    nightState: createInitialNightState(),
    isTestMode,
  };

  await setDoc(gameRef, game);

  return game;
};

export const joinGameByCode = async (payload: JoinGamePayload) => {
  const parsed = joinGameSchema.parse(payload);
  const auth = await ensureAnonymousAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Unable to authenticate user");
  }

  const gamesRef = collection(getDb(), GAMES_COLLECTION);
  const snapshot = await getDocs(
    query(gamesRef, where("code", "==", parsed.code), limit(1))
  );

  if (snapshot.empty) {
    throw new Error("Game not found");
  }

  const gameDoc = snapshot.docs[0];
  const gameData = gameDoc.data() as MafiaGame;
  const playerIds = gameData.playerIds ?? gameData.players.map((player) => player.uid);

  // Prevent real players from joining test mode games
  if (gameData.isTestMode) {
    throw new Error("This is a test lobby and cannot be joined by other players");
  }

  if (gameData.players.length >= gameData.config.maxPlayers) {
    throw new Error("Game is full");
  }

  if (playerIds.includes(user.uid)) {
    return { ...gameData, playerIds };
  }

  // Check if game has started - if so, join as ghost viewer
  const isGameStarted = gameData.status === "in-progress" || gameData.phase !== "lobby";
  const isGameFinished = gameData.status === "completed" || gameData.phase === "ended";

  const joinPayload = {
    uid: user.uid,
    name: parsed.name,
    role: isGameStarted || isGameFinished ? null : null, // Ghost viewers get no role
    isAlive: isGameStarted || isGameFinished ? false : true, // Ghost viewers marked as not alive
    isHost: false,
    joinedAt: Date.now(),
    ready: false,
    isSpectator: Boolean(isGameStarted || isGameFinished), // Mark as spectator if joining mid-game or after game ends
  };

  await updateDoc(gameDoc.ref, {
    players: arrayUnion(joinPayload),
    playerIds: arrayUnion(user.uid),
  });

  // Post system message if joining as ghost viewer
  if (isGameStarted || isGameFinished) {
    await recordSystemMessage(
      gameDoc.id,
      `${parsed.name} joined as a spectator.`,
      gameData.phase
    );
  }

  return {
    ...gameData,
    players: [...gameData.players, joinPayload],
    playerIds: [...playerIds, user.uid],
  } satisfies MafiaGame;
};

export const listenToGame = (
  gameId: string,
  onChange: (game: MafiaGame | null) => void
): Unsubscribe => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  return onSnapshot(gameRef, (snapshot) => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }
    const data = snapshot.data() as MafiaGame;
    const playerIds = data.playerIds ?? data.players.map((player) => player.uid);
    onChange({ ...data, id: snapshot.id, playerIds });
  });
};

export const listenToMessages = (
  gameId: string,
  onChange: (messages: GameMessage[]) => void
): Unsubscribe => {
  const messagesRef = collection(getDb(), GAMES_COLLECTION, gameId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages: GameMessage[] = snapshot.docs.map((docSnapshot) => {
      return docSnapshot.data() as GameMessage;
    });
    onChange(messages);
  });
};

export const postMessage = async (gameId: string, message: Omit<GameMessage, "id">) => {
  const messagesRef = collection(getDb(), GAMES_COLLECTION, gameId, MESSAGES_SUBCOLLECTION);
  await addDoc(messagesRef, {
    ...message,
    createdAt: Date.now(),
  });
};

export const updatePlayerReadyState = async (
  gameId: string,
  playerUid: string,
  ready: boolean
) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) {
    throw new Error("Game no longer exists");
  }
  const game = snapshot.data() as MafiaGame;
  const players = game.players.map((player) =>
    player.uid === playerUid ? { ...player, ready } : player
  );
  await updateDoc(gameRef, { players });
};

export const startGame = async (gameId: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }
  const game = snapshot.data() as MafiaGame;

  const readyPlayers = game.players.filter((player) => player.ready);
  if (readyPlayers.length < 4) {
    throw new Error("At least four ready players are required to start.");
  }

  const playerCount = readyPlayers.length;
  
  // Calculate total configured roles
  const configuredTotal = game.config.roles.reduce((sum, entry) => sum + entry.count, 0);
  
  // Use defaults if player count doesn't match configured total
  const useDefaults = configuredTotal !== playerCount;
  
  const configuredMap = new Map<GameRole, number>();
  if (!useDefaults) {
    for (const entry of game.config.roles) {
      configuredMap.set(entry.role, Math.max(0, Math.floor(entry.count)));
    }
  }

  const recommendedMap = new Map<GameRole, number>();
  for (const definition of ROLE_DEFINITIONS) {
    recommendedMap.set(definition.id, Math.max(0, Math.floor(definition.recommendedCount(playerCount))));
  }

  const getDesiredCount = (role: GameRole) => {
    // If using defaults or role not configured, use recommended
    if (useDefaults) {
      return recommendedMap.get(role) ?? 0;
    }
    const configured = configuredMap.get(role);
    if (configured === undefined) {
      return recommendedMap.get(role) ?? 0;
    }
    return configured;
  };

  const minimumVillagers = Math.min(2, Math.max(playerCount - 1, 0));
  let villagerCount = minimumVillagers;
  let remainingSlots = playerCount - villagerCount;

  if (remainingSlots <= 0) {
    throw new Error("Minimum 2 villagers required to start.");
  }

  const assignments = new Map<GameRole, number>();

  const mafiaDesired = Math.max(1, getDesiredCount("mafia"));
  const mafiaCount = Math.max(1, Math.min(mafiaDesired, Math.max(remainingSlots, 1)));
  assignments.set("mafia", mafiaCount);
  remainingSlots -= mafiaCount;

  for (const definition of ROLE_DEFINITIONS) {
    if (definition.id === "mafia" || definition.id === "villager") {
      continue;
    }
    if (remainingSlots <= 0) {
      assignments.set(definition.id, 0);
      continue;
    }
    const desired = getDesiredCount(definition.id);
    const count = Math.min(desired, remainingSlots);
    assignments.set(definition.id, count);
    remainingSlots -= count;
  }

  villagerCount += remainingSlots;

  if (villagerCount < 2) {
    throw new Error("Minimum 2 villagers required to start.");
  }

  assignments.set("villager", villagerCount);

  const rolePool: GameRole[] = [];
  for (const definition of ROLE_DEFINITIONS) {
    const count = assignments.get(definition.id) ?? 0;
    for (let index = 0; index < count; index += 1) {
      rolePool.push(definition.id);
    }
  }

  if (rolePool.length !== playerCount) {
    throw new Error("Failed to allocate roles for the ready players.");
  }

  const shuffledRoles = shuffleArray(rolePool);

  // In test mode, force admin to be Mafia
  const isTestMode = game.isTestMode ?? false;
  const hostId = game.hostId;

  const assignedPlayers = game.players.map((player) => {
    const {
      detectiveChecksRemaining: _detectiveChecksRemaining,
      detectiveRevealed: _detectiveRevealed,
      ...rest
    } = player;
    void _detectiveChecksRemaining;
    void _detectiveRevealed;
    if (!player.ready) {
      return { ...rest, role: null, isAlive: true };
    }
    
    // In test mode, assign Mafia to admin
    if (isTestMode && player.uid === hostId) {
      // Find and remove a Mafia role from the pool
      const mafiaIndex = shuffledRoles.findIndex(r => r === "mafia");
      if (mafiaIndex !== -1) {
        shuffledRoles.splice(mafiaIndex, 1);
      }
      return { ...rest, role: "mafia" as GameRole, isAlive: true };
    }
    
    const role = shuffledRoles.pop() ?? "villager";
    return { ...rest, role, isAlive: true };
  });

  const mafiaAssigned = assignedPlayers.filter((player) => player.role === "mafia" && player.isAlive).length;
  const oncePerRound = game.config.detectiveOncePerRound ?? false;
  let configuredLimit = oncePerRound ? null : game.config.detectiveChecksLimit;
  if (!oncePerRound && (configuredLimit === null || configuredLimit === undefined)) {
    configuredLimit = mafiaAssigned;
  }
  const normalizedLimit = configuredLimit ?? 0;

  const players = assignedPlayers.map((player) => {
    if (player.role === "detective") {
      return {
        ...player,
        detectiveChecksRemaining: oncePerRound ? null : Math.max(0, normalizedLimit),
        detectiveRevealed: false,
      };
    }
    // Only attempt to remove detective fields if player has a role
    if (player.role && "detectiveChecksRemaining" in player) {
      const {
        detectiveChecksRemaining: _detectiveChecksRemaining,
        detectiveRevealed: _detectiveRevealed,
        ...rest
      } = player as typeof player & { detectiveChecksRemaining?: number | null; detectiveRevealed?: boolean };
      void _detectiveChecksRemaining;
      void _detectiveRevealed;
      return rest;
    }
    return player;
  });

  await updateDoc(gameRef, {
    players,
    phase: "night",
    phaseEndsAt: Date.now() + game.config.nightDurationMinutes * 60 * 1000,
    round: 1,
    status: "in-progress",
    lastAction: "Game started",
    nightState: createInitialNightState("mafia"),
  });

  // Record game start event
  const roleDistribution: Record<string, number> = {};
  players.forEach((player) => {
    if (player.role) {
      roleDistribution[player.role] = (roleDistribution[player.role] ?? 0) + 1;
    }
  });

  await recordGameEvent(gameId, "game-started", "night", 1, {
    playerCount: readyPlayers.length,
    roleDistribution,
  }, "Game has started");

  await recordGameEvent(gameId, "phase-changed", "night", 1, {
    previousPhase: "lobby",
    newPhase: "night",
    round: 1,
  });
};

export const peekAtRoles = async (gameId: string, hostUid: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  let recordedPhase: MafiaGame["phase"] = "lobby";
  let hostName = "Host";
  let updated = false;

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;
    recordedPhase = game.phase;

    if (game.hostId !== hostUid) {
      throw new Error("Only the host can peek at roles.");
    }

    if (game.hostPeeked) {
      throw new Error("Roles have already been revealed to the host.");
    }

    const players = [...game.players];
    const hostIndex = players.findIndex((player) => player.uid === hostUid);
    if (hostIndex === -1) {
      throw new Error("Host is not part of this lobby.");
    }

    const hostPlayer = players[hostIndex];
    hostName = hostPlayer.name;

    if (!hostPlayer.isAlive) {
      throw new Error("Host is already eliminated.");
    }

    players[hostIndex] = { ...hostPlayer, isAlive: false };

    transaction.update(gameRef, {
      players,
      hostPeeked: true,
      lastAction: "Host peeked at hidden roles",
    });

    updated = true;
  });

  if (updated) {
    await recordSystemMessage(
      gameId,
      `${hostName} peeked at the hidden roles and has been removed from play.`,
      recordedPhase
    );
  }
};

export const restartLobby = async (gameId: string, hostUid: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  let hostName = "Host";

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;

    if (game.hostId !== hostUid) {
      throw new Error("Only the host can restart the lobby.");
    }

    const players = game.players.map((player) => {
      if (player.uid === hostUid) {
        hostName = player.name;
      }
      const {
        detectiveChecksRemaining: _detectiveChecksRemaining,
        detectiveRevealed: _detectiveRevealed,
        isSpectator: _isSpectator,
        ...rest
      } = player;
      void _detectiveChecksRemaining;
      void _detectiveRevealed;
      void _isSpectator;
      return {
        ...rest,
        role: null,
        isAlive: true,
        ready: false,
      };
    });

    transaction.update(gameRef, {
      players,
      phase: "lobby",
      status: "waiting",
      round: 0,
      phaseEndsAt: null,
      lastAction: "Lobby restarted",
      nightState: createInitialNightState(),
      votes: [],
      hostPeeked: false,
    });
  });

  // Clear messages and events on restart
  const messagesRef = collection(getDb(), GAMES_COLLECTION, gameId, MESSAGES_SUBCOLLECTION);
  const messagesSnapshot = await getDocs(messagesRef);
  const deleteMessagePromises = messagesSnapshot.docs.map((msgDoc) => deleteDoc(msgDoc.ref));
  await Promise.all(deleteMessagePromises);

  const eventsRef = collection(getDb(), GAMES_COLLECTION, gameId, "events");
  const eventsSnapshot = await getDocs(eventsRef);
  const deleteEventPromises = eventsSnapshot.docs.map((eventDoc) => deleteDoc(eventDoc.ref));
  await Promise.all(deleteEventPromises);

  await recordSystemMessage(
    gameId,
    `${hostName} reset the lobby. Ready up for another round!`,
    "lobby"
  );
};

export const submitMafiaVote = async (gameId: string, voterUid: string, targetUid: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  let shouldResolve = false;

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;
    if (game.phase !== "night") {
      throw new Error("Mafia can only act during the night.");
    }

    const nightState = game.nightState ?? createInitialNightState("mafia");
    if (nightState.stage !== "mafia") {
      throw new Error("Mafia actions are not active right now.");
    }

    const aliveMafia = getAliveRoleUids(game, "mafia");
    if (!aliveMafia.includes(voterUid)) {
      throw new Error("Only alive mafia members can vote.");
    }

    const targetPlayer = game.players.find((player) => player.uid === targetUid && player.isAlive);
    if (!targetPlayer) {
      throw new Error("Invalid target for elimination.");
    }

    const now = Date.now();
    const votes: NightVote[] = nightState.mafiaVotes
      .filter((vote) => aliveMafia.includes(vote.voterUid))
      .filter((vote) => vote.voterUid !== voterUid);

    votes.push({ voterUid, targetUid, submittedAt: now });

    const consensusUid = determineConsensusTarget(aliveMafia, votes);
    const lockedPlayer = consensusUid
      ? game.players.find((player) => player.uid === consensusUid) ?? null
      : null;

    const nextStage = consensusUid ? determineNextNightStage(game, "mafia") : nightState.stage;
    const updatedState: NightState = {
      ...nightState,
      mafiaVotes: votes,
      lockedTargetUid: consensusUid ?? nightState.lockedTargetUid ?? null,
      stage: nextStage,
      lastTransitionAt: nextStage !== nightState.stage ? now : nightState.lastTransitionAt,
    };

    const lastAction = lockedPlayer
      ? `Mafia locked target ${lockedPlayer.name}`
      : `Mafia updated their votes`;

    transaction.update(gameRef, {
      nightState: updatedState,
      lastAction,
    });

    shouldResolve = nextStage === "resolution";
  });

  if (shouldResolve) {
    await resolveNight(gameId);
  }
};

export const submitDoctorSave = async (gameId: string, doctorUid: string, targetUid: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  let shouldResolve = false;

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;
    if (game.phase !== "night") {
      throw new Error("Doctor can only act during the night.");
    }

    const nightState = game.nightState ?? createInitialNightState("mafia");
    if (nightState.stage !== "doctor") {
      throw new Error("Doctor actions are not active right now.");
    }

    const doctor = game.players.find((player) => player.uid === doctorUid);
    if (!doctor || doctor.role !== "doctor" || !doctor.isAlive) {
      throw new Error("Only an alive doctor can protect players.");
    }

    const targetPlayer = game.players.find((player) => player.uid === targetUid);
    if (!targetPlayer || !targetPlayer.isAlive) {
      throw new Error("Doctor must protect a living player.");
    }

    const now = Date.now();
    const nextStage = determineNextNightStage(game, "doctor");
    const updatedState: NightState = {
      ...nightState,
      doctorTargetUid: targetUid,
      stage: nextStage,
      lastTransitionAt: nextStage !== nightState.stage ? now : nightState.lastTransitionAt,
    };

    transaction.update(gameRef, {
      nightState: updatedState,
      lastAction: `Doctor prepared protection for ${targetPlayer.name}`,
    });

    shouldResolve = nextStage === "resolution";
  });

  if (shouldResolve) {
    await resolveNight(gameId);
  }
};

export const submitDetectiveInvestigation = async (
  gameId: string,
  detectiveUid: string,
  targetUid: string
) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  let conversionMessage: string | null = null;
  let conversionPhase: MafiaGame["phase"] = "night";

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;
    if (game.phase !== "night") {
      throw new Error("Detective can only investigate during the night.");
    }

    const nightState = game.nightState ?? createInitialNightState("mafia");
    if (nightState.stage !== "detective") {
      throw new Error("Detective actions are not active right now.");
    }

    const detective = game.players.find((player) => player.uid === detectiveUid);
    if (!detective || detective.role !== "detective" || !detective.isAlive) {
      throw new Error("Only an alive detective can investigate.");
    }

    if (!game.config.detectiveOncePerRound) {
      // Use actual mafia count, not config limit
      const mafiaCount = game.players.filter(p => p.role === "mafia" && p.isAlive).length;
      const remaining = detective.detectiveChecksRemaining ?? mafiaCount;
      if (remaining <= 0) {
        throw new Error("Detective has no investigations remaining.");
      }
    }

    const targetPlayer = game.players.find((player) => player.uid === targetUid);
    if (!targetPlayer) {
      throw new Error("Detective must investigate an existing player.");
    }

    const now = Date.now();
    const result: DetectiveResult = {
      targetUid,
      isMafia: targetPlayer.role === "mafia",
      revealedAt: now,
    };

    const players = [...game.players];
    const detectiveIndex = players.findIndex((player) => player.uid === detectiveUid);
    if (detectiveIndex === -1) {
      throw new Error("Detective not found in lobby.");
    }

    const detector = players[detectiveIndex];
    const oncePerRound = game.config.detectiveOncePerRound ?? false;
    const remainingCharges = detector.detectiveChecksRemaining;

    if (!oncePerRound) {
      // Use actual mafia count as fallback, not config limit
      const mafiaCount = game.players.filter(p => p.role === "mafia" && p.isAlive).length;
      const baseline = remainingCharges ?? mafiaCount;
      const nextRemaining = Math.max(0, baseline - 1);
      if (nextRemaining <= 0) {
        const {
          detectiveChecksRemaining: _detectiveChecksRemaining,
          detectiveRevealed: _detectiveRevealed,
          ...rest
        } = detector;
        void _detectiveChecksRemaining;
        void _detectiveRevealed;
        players[detectiveIndex] = {
          ...rest,
          role: "villager",
        };
        conversionMessage = `${detector.name} has exhausted their investigations and now appears as a villager.`;
        conversionPhase = game.phase;
      } else {
        players[detectiveIndex] = {
          ...detector,
          detectiveChecksRemaining: nextRemaining,
        };
      }
    }

    const updatedState: NightState = {
      ...nightState,
      detectiveTargetUid: targetUid,
      detectiveResult: result,
      stage: "resolution",
      lastTransitionAt: now,
    };

    transaction.update(gameRef, {
      players,
      nightState: updatedState,
      lastAction: `Detective completed an investigation`,
    });

    // Create detective investigation event
    const eventsRef = collection(getDb(), GAMES_COLLECTION, gameId, "events");
    const investigationEvent = {
      gameId,
      type: "detective-investigation" as const,
      phase: game.phase,
      round: game.round,
      timestamp: now,
      data: {
        detectiveUid,
        detectiveName: detective.name,
        targetUid,
        targetName: targetPlayer.name,
        isMafia: result.isMafia,
        investigationsRemaining: players[detectiveIndex].detectiveChecksRemaining ?? null,
      },
    };
    const newEventRef = doc(eventsRef);
    transaction.set(newEventRef, investigationEvent);
  });

  await resolveNight(gameId);

  if (conversionMessage) {
    await recordSystemMessage(gameId, conversionMessage, conversionPhase);
  }
};

export const skipDetectiveInvestigation = async (gameId: string, detectiveUid: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;
    if (game.phase !== "night") {
      throw new Error("Detective can only skip during the night.");
    }

    const nightState = game.nightState ?? createInitialNightState("mafia");
    if (nightState.stage !== "detective") {
      throw new Error("Detective actions are not active right now.");
    }

    const detective = game.players.find((player) => player.uid === detectiveUid);
    if (!detective || detective.role !== "detective" || !detective.isAlive) {
      throw new Error("Only an alive detective can skip investigation.");
    }

    const now = Date.now();
    const updatedState: NightState = {
      ...nightState,
      detectiveTargetUid: null,
      detectiveResult: null,
      stage: "resolution",
      lastTransitionAt: now,
    };

    transaction.update(gameRef, {
      nightState: updatedState,
      lastAction: "Detective skipped investigation",
    });
  });

  await resolveNight(gameId);
};

export const resolveNight = async (gameId: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  let message: string | null = null;
  let eliminatedName: string | null = null;
  let eliminatedUid: string | null = null;
  let savedByDoctor = false;
  let messagePhase: MafiaGame["phase"] = "day";

  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;
    const nightState = game.nightState;

    if (!nightState || nightState.stage !== "resolution") {
      throw new Error("Night actions are not ready to resolve.");
    }

    const now = Date.now();
    const players = [...game.players];
    const targetUid = nightState.lockedTargetUid;
    const savedUid = nightState.doctorTargetUid;
    savedByDoctor = !!(savedUid && targetUid && targetUid === savedUid);
    const dayDurationMs = game.config.dayDurationMinutes * 60 * 1000;

    if (targetUid && targetUid !== savedUid) {
      const playerIndex = players.findIndex((player) => player.uid === targetUid);
      if (playerIndex >= 0) {
        const player = players[playerIndex];
        if (player.isAlive) {
          players[playerIndex] = { ...player, isAlive: false };
          eliminatedName = player.name;
          eliminatedUid = player.uid;
        }
      }
    }

    const nextState: NightState = {
      ...createInitialNightState("idle"),
      detectiveResult: nightState.detectiveResult,
      lastTransitionAt: now,
    };

    const lastAction = eliminatedName
      ? `Night eliminated ${eliminatedName}`
      : savedUid && targetUid === savedUid
      ? "Doctor prevented a night kill"
      : "Night concluded without casualties";

    transaction.update(gameRef, {
      players,
      nightState: nextState,
      phase: "day",
      phaseEndsAt: dayDurationMs ? now + dayDurationMs : null,
      lastAction,
    });

    if (eliminatedName) {
      message = `${eliminatedName} was eliminated during the night.`;
    } else if (savedUid && targetUid === savedUid) {
      const savedPlayer = game.players.find((player) => player.uid === savedUid);
      if (savedPlayer) {
        message = `${savedPlayer.name} survived the night thanks to the doctor.`;
      }
    } else {
      message = "It was a quiet night. No one was eliminated.";
    }

    messagePhase = "day";
  });

  // Generate AI commentary for night events. If commentary is produced,
  // post it as the single system message for the phase; otherwise fall back
  // to the basic outcome message. This prevents duplicate messages (template
  // + AI) appearing consecutively.
  const gameData = (await getDoc(gameRef)).data() as MafiaGame;
  const eliminatedPlayer = eliminatedUid
    ? gameData.players.find((p) => p.uid === eliminatedUid)
    : null;

  const commentary = await generateNightCommentary({
    eliminatedName: eliminatedName || undefined,
    eliminatedRole: (eliminatedPlayer?.role ?? undefined) as GameRole | undefined,
    savedByDoctor,
    round: gameData.round,
  });

  if (commentary) {
    await recordSystemMessage(gameId, commentary, messagePhase);
  } else if (message) {
    await recordSystemMessage(gameId, message, messagePhase);
  }

  // Check win conditions after night elimination
  await checkWinCondition(gameId);
};

export const updateVotes = async (gameId: string, votes: VoteState[]) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, { votes });
};

export const submitVote = async (
  gameId: string,
  vote: VoteState
) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) return;
  const game = snapshot.data() as MafiaGame;
  
  // Validate that the voter is an alive player (not a spectator)
  const voter = game.players.find((p) => p.uid === vote.voterUid);
  if (!voter || !voter.isAlive || voter.isSpectator) {
    throw new Error("Only alive players can vote");
  }
  
  const existingVote = game.votes?.find((entry) => entry.voterUid === vote.voterUid);
  const votes = [...(game.votes ?? [])].filter((entry) => entry.voterUid !== vote.voterUid);
  votes.push(vote);

  // Check if all alive players have voted (excluding spectators)
  const alivePlayers = game.players.filter((p) => p.isAlive && !p.isSpectator);
  const alivePlayerUids = alivePlayers.map((p) => p.uid);
  const voterUids = votes.map((v) => v.voterUid);
  const allVoted = alivePlayerUids.every((uid) => voterUids.includes(uid));

  let dayEliminationState = game.dayEliminationState;

  if (allVoted && game.phase === "day") {
    // Calculate vote counts
    const voteCount = new Map<string, number>();
    votes.forEach((v) => {
      voteCount.set(v.targetUid, (voteCount.get(v.targetUid) || 0) + 1);
    });

    // Find the player with the most votes
    let maxVotes = 0;
    let leadingUid: string | null = null;
    voteCount.forEach((count, uid) => {
      if (count > maxVotes) {
        maxVotes = count;
        leadingUid = uid;
      }
    });

    if (leadingUid) {
      const leadingPlayer = game.players.find((p) => p.uid === leadingUid);
      dayEliminationState = {
        votingComplete: true,
        leadingCandidateUid: leadingUid,
        leadingCandidateName: leadingPlayer?.name || "Unknown",
        leadingVoteCount: maxVotes,
        totalVoters: alivePlayers.length,
        eliminated: false,
      };
    }
  }

  await updateDoc(gameRef, { 
    votes,
    ...(dayEliminationState && { dayEliminationState })
  });

  // Record vote event
  const voterPlayer = game.players.find((p) => p.uid === vote.voterUid);
  const target = game.players.find((p) => p.uid === vote.targetUid);
  
  if (voterPlayer && target) {
    if (existingVote && existingVote.targetUid !== vote.targetUid) {
      // Vote changed
      const previousTarget = game.players.find((p) => p.uid === existingVote.targetUid);
      if (previousTarget) {
        await recordGameEvent(gameId, "vote-changed", game.phase, game.round, {
          voterUid: voterPlayer.uid,
          voterName: voterPlayer.name,
          previousTargetUid: previousTarget.uid,
          previousTargetName: previousTarget.name,
          newTargetUid: target.uid,
          newTargetName: target.name,
        });
      }
    } else if (!existingVote) {
      // New vote cast
      await recordGameEvent(gameId, "vote-cast", game.phase, game.round, {
        voterUid: voterPlayer.uid,
        voterName: voterPlayer.name,
        targetUid: target.uid,
        targetName: target.name,
      });
    }
  }
};

export const clearVote = async (gameId: string, voterUid: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) return;
  const game = snapshot.data() as MafiaGame;
  const votes = (game.votes ?? []).filter((entry) => entry.voterUid !== voterUid);
  await updateVotes(gameId, votes);
};

export const advancePhase = async (gameId: string, nextPhase: MafiaGame["phase"]) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }
  const game = snapshot.data() as MafiaGame;

  // Check if there's a pending elimination decision
  if (game.phase === "day" && game.dayEliminationState?.votingComplete && !game.dayEliminationState.eliminated) {
    throw new Error("Cannot advance phase until elimination decision is made");
  }

  const duration =
    nextPhase === "day"
      ? game.config.dayDurationMinutes
      : nextPhase === "night"
      ? game.config.nightDurationMinutes
      : null;
  const now = Date.now();
  const updates: Partial<MafiaGame> = {
    phase: nextPhase,
    phaseEndsAt: duration ? now + duration * 60 * 1000 : null,
    round: nextPhase === "night" ? game.round + 1 : game.round,
    lastAction: `Advanced to ${nextPhase}`,
    votes: [], // Clear votes when advancing to new phase
  };

  if (nextPhase === "night") {
    updates.nightState = createInitialNightState("mafia");
  } else if (nextPhase === "day") {
    const existingState = game.nightState;
    updates.nightState = {
      ...createInitialNightState("idle"),
      detectiveResult: existingState?.detectiveResult ?? null,
    };
    // Clear day elimination state for new day
    updates.dayEliminationState = null;
  }

  await updateDoc(gameRef, updates);

  // Record phase change event
  await recordGameEvent(gameId, "phase-changed", nextPhase, updates.round ?? game.round, {
    previousPhase: game.phase,
    newPhase: nextPhase,
    round: updates.round ?? game.round,
  });
};

export const eliminateDayCandidate = async (gameId: string, targetUid: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  
  await runTransaction(getDb(), async (transaction) => {
    const snapshot = await transaction.get(gameRef);
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const game = snapshot.data() as MafiaGame;
    if (game.phase !== "day") {
      throw new Error("Can only eliminate during day phase");
    }

    const players = [...game.players];
    const targetIndex = players.findIndex((p) => p.uid === targetUid);
    if (targetIndex === -1) {
      throw new Error("Target player not found");
    }

    const target = players[targetIndex];
    if (!target.isAlive) {
      throw new Error("Target is already eliminated");
    }

    players[targetIndex] = { ...target, isAlive: false };

    transaction.update(gameRef, {
      players,
      dayEliminationState: {
        ...game.dayEliminationState,
        eliminated: true,
      },
      votes: [],
      lastAction: `${target.name} was eliminated by vote`,
    });
  });

  // Record elimination event
  const game = (await getDoc(gameRef)).data() as MafiaGame;
  const eliminated = game.players.find((p) => p.uid === targetUid);
  if (eliminated) {
    await recordGameEvent(gameId, "day-elimination", "day", game.round, {
      eliminatedUid: eliminated.uid,
      eliminatedName: eliminated.name,
      eliminatedRole: eliminated.role,
      voteCount: game.dayEliminationState?.leadingVoteCount ?? 0,
    });

    // Generate AI commentary for day elimination
    const commentary = await generateDayCommentary({
      eliminatedName: eliminated.name,
      eliminatedRole: eliminated.role!,
      voteCount: game.dayEliminationState?.leadingVoteCount ?? 0,
      round: game.round,
    });

    if (commentary) {
      await recordSystemMessage(gameId, commentary, "day");
    }
  }

  // Check win conditions
  await checkWinCondition(gameId);
  
  // Auto-advance to night phase if game is still in progress
  const updatedGame = (await getDoc(gameRef)).data() as MafiaGame;
  if (updatedGame.status === "in-progress" && updatedGame.phase === "day") {
    await advancePhase(gameId, "night");
  }
};

export const checkWinCondition = async (gameId: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) return;

  const game = snapshot.data() as MafiaGame;
  // Only count players with assigned roles (excludes players who weren't ready at game start and spectators)
  const alivePlayers = game.players.filter((p) => p.isAlive && p.role !== null && !p.isSpectator);
  const aliveMafia = alivePlayers.filter((p) => p.role === "mafia");
  // All non-mafia roles count as village (doctor, detective, villager)
  const aliveVillage = alivePlayers.filter((p) => p.role !== "mafia");

  let winner: "mafia" | "village" | null = null;
  let winMessage = "";

  // Mafia wins if they equal or outnumber non-mafia (village team)
  if (aliveMafia.length >= aliveVillage.length && aliveMafia.length > 0) {
    winner = "mafia";
    winMessage = "🎭 Mafia wins! They have achieved numerical superiority.";
  }
  // Village wins if all mafia are eliminated
  else if (aliveMafia.length === 0 && aliveVillage.length > 0) {
    winner = "village";
    winMessage = "🏆 Village wins! All mafia members have been eliminated.";
  }

  if (winner) {
    await updateDoc(gameRef, {
      phase: "ended",
      status: "completed",
      phaseEndsAt: null,
      lastAction: winMessage,
    });

    await recordGameEvent(gameId, "game-ended", "ended", game.round, {
      winner,
      aliveMafiaCount: aliveMafia.length,
      aliveVillageCount: aliveVillage.length,
      totalRounds: game.round,
    });

    await recordSystemMessage(gameId, winMessage, "ended");
  }
};

export const archiveGame = async (gameId: string) => {
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
    status: "completed",
    phase: "ended",
    phaseEndsAt: null,
  });
};

export const syncPhaseDeadline = async (gameId: string, targetTimestamp: number, note?: string) => {
  if (!Number.isFinite(targetTimestamp)) {
    throw new Error("Invalid timer value");
  }
  const gameRef = doc(getDb(), GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
    phaseEndsAt: targetTimestamp,
    lastAction: note ?? "Phase timer updated",
  });
};

export const recordSystemMessage = async (
  gameId: string,
  text: string,
  phase: MafiaGame["phase"]
) => {
  await postMessage(gameId, {
    authorUid: "system",
    authorName: "God",
    body: text,
    createdAt: Date.now(),
    gameId,
    phase,
    isSystem: true,
  });
};
