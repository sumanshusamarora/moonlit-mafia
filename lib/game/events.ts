"use client";

import { addDoc, collection } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import type { GameEvent, GameEventType } from "@/types/events";

const EVENTS_SUBCOLLECTION = "events";

export const recordGameEvent = async (
  gameId: string,
  type: GameEventType,
  phase: GameEvent["phase"],
  round: number,
  data: Record<string, unknown>,
  message?: string
) => {
  const db = getFirebaseFirestore();
  const eventsRef = collection(db, "games", gameId, EVENTS_SUBCOLLECTION);

  const event: Omit<GameEvent, "id"> = {
    gameId,
    type,
    phase,
    round,
    timestamp: Date.now(),
    data,
    ...(message && { message }),
  };

  await addDoc(eventsRef, event);
};
