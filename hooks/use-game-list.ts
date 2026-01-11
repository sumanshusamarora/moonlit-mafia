"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import type { MafiaGame } from "@/types/game";
import { useAuth } from "@/components/providers/auth-provider";

const EMPTY_GAMES: MafiaGame[] = [];

interface GameListState {
  ownerId: string | null;
  games: MafiaGame[];
  loading: boolean;
}

export function useGameList() {
  const { user } = useAuth();
  const viewerId = user?.uid ?? null;
  const [state, setState] = useState<GameListState>({
    ownerId: null,
    games: [],
    loading: true,
  });

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    const db = getFirebaseFirestore();
    const gamesRef = collection(db, "games");

    const hostQuery = query(
      gamesRef,
      where("hostId", "==", viewerId),
      orderBy("createdAt", "desc")
    );

    const playerQuery = query(
      gamesRef,
      where("playerIds", "array-contains", viewerId),
      orderBy("createdAt", "desc")
    );

    const normalize = (game: MafiaGame): MafiaGame => {
      const gameAsRecord = game as unknown as Record<string, unknown>;
      const createdAt =
        typeof gameAsRecord.createdAt === "object" &&
        game.createdAt !== null &&
        typeof gameAsRecord.createdAt === "object" &&
        gameAsRecord.createdAt !== null &&
        "toMillis" in gameAsRecord.createdAt
          ? ((game as unknown as { createdAt: { toMillis: () => number } }).createdAt.toMillis() as number)
          : game.createdAt;
      return { ...game, createdAt };
    };

    let hostGames: MafiaGame[] = [];
    let playerGames: MafiaGame[] = [];
    let active = true;

    const commit = () => {
      if (!active) return;

      const merged = [...hostGames, ...playerGames].reduce<Map<string, MafiaGame>>((map, game) => {
        map.set(game.id, game);
        return map;
      }, new Map());

      setState({
        ownerId: viewerId,
        games: [...merged.values()].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
        loading: false,
      });
    };

    const unsubHost = onSnapshot(hostQuery, (snapshot) => {
      hostGames = snapshot.docs
        .map((doc) => (doc.data() as unknown as MafiaGame))
        .map(normalize);
      commit();
    });
    const unsubPlayer = onSnapshot(playerQuery, (snapshot) => {
      playerGames = snapshot.docs
        .map((doc) => (doc.data() as unknown as MafiaGame))
        .map(normalize);
      commit();
    });

    return () => {
      active = false;
      hostGames = [];
      playerGames = [];
      unsubHost();
      unsubPlayer();
    };
  }, [viewerId]);
  const isCurrentUser = viewerId !== null && state.ownerId === viewerId;
  const resolvedGames = isCurrentUser ? state.games : EMPTY_GAMES;
  const loading = viewerId ? !isCurrentUser || state.loading : false;

  const upcoming = useMemo(
    () => resolvedGames.filter((game) => game.status !== "completed"),
    [resolvedGames]
  );
  const archived = useMemo(
    () => resolvedGames.filter((game) => game.status === "completed"),
    [resolvedGames]
  );

  return { games: resolvedGames, upcoming, archived, loading };
}
