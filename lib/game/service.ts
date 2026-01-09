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
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type UploadResult,
} from "firebase/storage";
import { ensureAnonymousAuth, getFirebaseFirestore, getFirebaseStorage } from "@/lib/firebase/client";
import { generateGameCode, recommendedRoles } from "./utils";
import type {
  CreateGamePayload,
  GameMessage,
  GameVoiceMemo,
  JoinGamePayload,
  MafiaGame,
  VoteState,
} from "@/types/game";
import { joinGameSchema, createGameSchema } from "./schemas";
import { nanoid } from "nanoid";

const GAMES_COLLECTION = "games";
const MESSAGES_SUBCOLLECTION = "messages";
const VOICE_SUBCOLLECTION = "voiceMemos";

const db = getFirebaseFirestore();
const storage = getFirebaseStorage();

export const createGame = async (payload: CreateGamePayload) => {
  const parsed = createGameSchema.parse(payload);
  const auth = await ensureAnonymousAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Unable to authenticate user");
  }

  const code = generateGameCode();
  const gameRef = doc(collection(db, GAMES_COLLECTION));

  const now = Date.now();
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
    players: [
      {
        uid: user.uid,
        name: parsed.hostName,
        role: null,
        isAlive: true,
        isHost: true,
        joinedAt: now,
        ready: true,
      },
    ],
    playerIds: [user.uid],
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

  const gamesRef = collection(db, GAMES_COLLECTION);
  const snapshot = await getDocs(
    query(gamesRef, where("code", "==", parsed.code), limit(1))
  );

  if (snapshot.empty) {
    throw new Error("Game not found");
  }

  const gameDoc = snapshot.docs[0];
  const gameData = gameDoc.data() as MafiaGame;
  const playerIds = gameData.playerIds ?? gameData.players.map((player) => player.uid);

  if (gameData.players.length >= gameData.config.maxPlayers) {
    throw new Error("Game is full");
  }

  if (playerIds.includes(user.uid)) {
    return { ...gameData, playerIds };
  }

  const joinPayload = {
    uid: user.uid,
    name: parsed.name,
    role: null,
    isAlive: true,
    isHost: false,
    joinedAt: Date.now(),
    ready: false,
  };

  await updateDoc(gameDoc.ref, {
    players: arrayUnion(joinPayload),
    playerIds: arrayUnion(user.uid),
  });

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
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
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
  const messagesRef = collection(db, GAMES_COLLECTION, gameId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages: GameMessage[] = snapshot.docs.map((docSnapshot) => {
      return { id: docSnapshot.id, ...(docSnapshot.data() as GameMessage) };
    });
    onChange(messages);
  });
};

export const listenToVoiceMemos = (
  gameId: string,
  onChange: (memos: GameVoiceMemo[]) => void
): Unsubscribe => {
  const voiceRef = collection(db, GAMES_COLLECTION, gameId, VOICE_SUBCOLLECTION);
  const q = query(voiceRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const memos: GameVoiceMemo[] = snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as GameVoiceMemo & { deleted?: boolean }) }))
      .filter((memo) => !memo.deleted);
    onChange(memos);
  });
};

export const postMessage = async (gameId: string, message: Omit<GameMessage, "id">) => {
  const messagesRef = collection(db, GAMES_COLLECTION, gameId, MESSAGES_SUBCOLLECTION);
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
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
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
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
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
  const configuredRoles = game.config.roles.map((role) => ({ ...role }));
  const assignedTotal = configuredRoles.reduce((sum, role) => sum + role.count, 0);
  if (assignedTotal < playerCount) {
    const villager = configuredRoles.find((role) => role.role === "villager");
    if (villager) {
      villager.count += playerCount - assignedTotal;
    } else {
      configuredRoles.push({ role: "villager", count: playerCount - assignedTotal });
    }
  }

  const rolePool = configuredRoles.flatMap((role) =>
    Array.from({ length: role.count }).map(() => role.role)
  );

  if (rolePool.length < playerCount) {
    const fallback = recommendedRoles(playerCount);
    rolePool.push(
      ...fallback.flatMap((role) => Array.from({ length: role.count }).map(() => role.role))
    );
  }

  const shuffled = [...rolePool].sort(() => Math.random() - 0.5);

  const players = game.players.map((player) => {
    if (!player.ready) {
      return player;
    }
    const role = shuffled.pop() ?? "villager";
    return { ...player, role, isAlive: true };
  });

  await updateDoc(gameRef, {
    players,
    phase: "night",
    phaseEndsAt: Date.now() + game.config.nightDurationMinutes * 60 * 1000,
    round: 1,
    status: "in-progress",
    lastAction: "Game started",
  });
};

export const updateVotes = async (gameId: string, votes: VoteState[]) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, { votes });
};

export const submitVote = async (
  gameId: string,
  vote: VoteState
) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) return;
  const game = snapshot.data() as MafiaGame;
  const votes = [...(game.votes ?? [])].filter((entry) => entry.voterUid !== vote.voterUid);
  votes.push(vote);
  await updateVotes(gameId, votes);
};

export const clearVote = async (gameId: string, voterUid: string) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) return;
  const game = snapshot.data() as MafiaGame;
  const votes = (game.votes ?? []).filter((entry) => entry.voterUid !== voterUid);
  await updateVotes(gameId, votes);
};

export const advancePhase = async (gameId: string, nextPhase: MafiaGame["phase"]) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  const snapshot = await getDoc(gameRef);
  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }
  const game = snapshot.data() as MafiaGame;
  const duration =
    nextPhase === "day"
      ? game.config.dayDurationMinutes
      : game.config.nightDurationMinutes;
  await updateDoc(gameRef, {
    phase: nextPhase,
    phaseEndsAt: Date.now() + duration * 60 * 1000,
    round: nextPhase === "night" ? game.round + 1 : game.round,
    lastAction: `Advanced to ${nextPhase}`,
  });
};

export const archiveGame = async (gameId: string) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
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
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(gameRef, {
    phaseEndsAt: targetTimestamp,
    lastAction: note ?? "Phase timer updated",
  });
};

export const uploadVoiceMemo = async (
  gameId: string,
  file: File,
  ownerUid: string,
  ownerName: string,
  durationMs: number
) => {
  const id = nanoid();
  const storagePath = `games/${gameId}/voice/${id}.webm`;
  const storageRef = ref(storage, storagePath);
  let upload: UploadResult;
  try {
    upload = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
  } catch (error) {
    console.error("Failed to upload voice memo", error);
    throw error;
  }

  const url = await getDownloadURL(upload.ref);

  const memo: Omit<GameVoiceMemo, "id"> = {
    gameId,
    storagePath,
    ownerUid,
    ownerName,
    createdAt: Date.now(),
    durationMs,
    url,
  };

  const voiceCollection = collection(db, GAMES_COLLECTION, gameId, VOICE_SUBCOLLECTION);
  await addDoc(voiceCollection, memo);
  return memo;
};

export const deleteVoiceMemo = async (gameId: string, memoId: string, storagePath: string) => {
  const voiceCollection = collection(db, GAMES_COLLECTION, gameId, VOICE_SUBCOLLECTION);
  const memoRef = doc(voiceCollection, memoId);
  await deleteObject(ref(storage, storagePath)).catch(() => undefined);
  await deleteDoc(memoRef);
};

export const gameByCode = async (code: string): Promise<MafiaGame | null> => {
  const snapshot = await getDocs(
    query(collection(db, GAMES_COLLECTION), where("code", "==", code), limit(1))
  );
  if (snapshot.empty) {
    return null;
  }
  const docSnapshot = snapshot.docs[0];
  return { id: docSnapshot.id, ...(docSnapshot.data() as MafiaGame) };
};

export const recordSystemMessage = async (
  gameId: string,
  text: string,
  phase: MafiaGame["phase"]
) => {
  await postMessage(gameId, {
    authorUid: "system",
    authorName: "Narrator",
    body: text,
    createdAt: Date.now(),
    gameId,
    phase,
    isSystem: true,
  });
};
