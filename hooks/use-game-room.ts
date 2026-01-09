"use client";

import { useEffect, useMemo, useState } from "react";
import type { MafiaGame, GameMessage, GameVoiceMemo } from "@/types/game";
import { listenToGame, listenToMessages, listenToVoiceMemos } from "@/lib/game/service";

interface GameRoomState {
  gameId: string | null;
  gameReady: boolean;
  game: MafiaGame | null;
  messages: GameMessage[];
  voiceMemos: GameVoiceMemo[];
}

export function useGameRoom(gameId: string | null) {
  const [state, setState] = useState<GameRoomState>({
    gameId: null,
    gameReady: false,
    game: null,
    messages: [],
    voiceMemos: [],
  });

  useEffect(() => {
    if (!gameId) {
      return;
    }

    const normalizeTimestamp = (value: unknown) => {
      if (typeof value === "number") {
        return value;
      }
      if (
        typeof value === "object" &&
        value !== null &&
        "toMillis" in (value as { toMillis?: () => number }) &&
        typeof (value as { toMillis?: () => number }).toMillis === "function"
      ) {
        return (value as { toMillis: () => number }).toMillis();
      }
      return Date.now();
    };

    const normalizeGame = (incoming: MafiaGame | null): MafiaGame | null => {
      if (!incoming) return null;
      return {
        ...incoming,
        createdAt: normalizeTimestamp(incoming.createdAt),
      };
    };

    const normalizeMessage = (message: GameMessage): GameMessage => ({
      ...message,
      createdAt: normalizeTimestamp(message.createdAt),
    });

    const normalizeMemo = (memo: GameVoiceMemo): GameVoiceMemo => ({
      ...memo,
      createdAt: normalizeTimestamp(memo.createdAt),
    });

    let active = true;

    const unsubscribeGame = listenToGame(gameId, (incoming) => {
      if (!active) return;
      setState((prev) => ({
        ...prev,
        gameId,
        gameReady: true,
        game: normalizeGame(incoming),
      }));
    });

    const unsubscribeMessages = listenToMessages(gameId, (incoming) => {
      if (!active) return;
      setState((prev) => ({
        ...prev,
        gameId,
        messages: incoming.map(normalizeMessage),
      }));
    });

    const unsubscribeVoice = listenToVoiceMemos(gameId, (incoming) => {
      if (!active) return;
      setState((prev) => ({
        ...prev,
        gameId,
        voiceMemos: incoming.map(normalizeMemo),
      }));
    });

    return () => {
      active = false;
      unsubscribeGame();
      unsubscribeMessages();
      unsubscribeVoice();
    };
  }, [gameId]);

  const isCurrentGame = gameId !== null && state.gameId === gameId;
  const game = isCurrentGame ? state.game : null;
  const messages = isCurrentGame ? state.messages : [];
  const voiceMemos = isCurrentGame ? state.voiceMemos : [];
  const loading = gameId ? !isCurrentGame || !state.gameReady : false;

  const alivePlayers = useMemo(
    () => game?.players.filter((player) => player.isAlive) ?? [],
    [game]
  );
  const deadPlayers = useMemo(
    () => game?.players.filter((player) => !player.isAlive) ?? [],
    [game]
  );

  return {
    game,
    messages,
    voiceMemos,
    loading,
    alivePlayers,
    deadPlayers,
  };
}
