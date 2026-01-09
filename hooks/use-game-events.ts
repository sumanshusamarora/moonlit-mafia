"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import type { GameEvent } from "@/types/events";

const EVENTS_SUBCOLLECTION = "events";

export function useGameEvents(gameId: string | null) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const db = getFirebaseFirestore();
    const eventsRef = collection(db, "games", gameId, EVENTS_SUBCOLLECTION);
    const q = query(eventsRef, orderBy("timestamp", "desc"));

    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: GameEvent[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<GameEvent, "id">),
      }));
      setEvents(fetchedEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  return { events, loading };
}
