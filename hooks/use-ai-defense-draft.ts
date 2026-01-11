import { useState, useCallback, useMemo } from "react";
import type { MafiaGame } from "@/types/game";

interface UseAIDefenseDraftReturn {
  isGenerating: boolean;
  draftText: string | null;
  error: string | null;
  hasUsedThisRound: boolean;
  canShowDefense: boolean;
  generateDefense: () => Promise<void>;
  updateDraftText: (text: string) => void;
  clearDraft: () => void;
  markAsUsed: () => void;
}

interface AIDefenseState {
  usedInRound: number | null;
}

// Track usage per player per round in memory (session-based)
const usageTracker = new Map<string, AIDefenseState>();

export function useAIDefenseDraft(
  game: MafiaGame | null,
  playerUid: string | null
): UseAIDefenseDraftReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftText, setDraftText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine if player is highest voted
  const { isHighestVoted, canShow } = useMemo(() => {
    if (!game || !playerUid || game.phase !== "day") {
      return { isHighestVoted: false, canShow: false };
    }

    const votes = game.votes || [];
    if (votes.length === 0) {
      return { isHighestVoted: false, canShow: false };
    }

    // Calculate vote counts
    const voteCount = new Map<string, number>();
    votes.forEach((v) => {
      voteCount.set(v.targetUid, (voteCount.get(v.targetUid) || 0) + 1);
    });

    // Find highest vote count
    let maxVotes = 0;
    const highestVotedPlayers: string[] = [];
    
    voteCount.forEach((count, uid) => {
      if (count > maxVotes) {
        maxVotes = count;
        highestVotedPlayers.length = 0;
        highestVotedPlayers.push(uid);
      } else if (count === maxVotes) {
        highestVotedPlayers.push(uid);
      }
    });

    const isHighest = highestVotedPlayers.includes(playerUid);
    
    // Check if player is alive and not a spectator
    const player = game.players.find((p) => p.uid === playerUid);
    const isAlivePlayer = !!(player?.isAlive && !player?.isSpectator);

    return { 
      isHighestVoted: isHighest,
      canShow: isHighest && isAlivePlayer && maxVotes > 0
    };
  }, [game, playerUid]);

  // Check if already used this round
  const hasUsedThisRound = useMemo(() => {
    if (!game || !playerUid) return false;
    
    const key = `${playerUid}-${game.id}`;
    const state = usageTracker.get(key);
    
    return state?.usedInRound === game.round;
  }, [game, playerUid]);

  const canShowDefense = canShow && !hasUsedThisRound;

  const generateDefense = useCallback(async () => {
    if (!game || !playerUid || !canShowDefense) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/defense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameState: game,
          playerUid,
        }),
      });

      if (response.status === 404) {
        // Feature not available (no API key)
        setError("AI defense feature is not available");
        return;
      }

      if (!response.ok) {
        let message = "Failed to generate defense";
        try {
          const data = await response.json();
          if (typeof data?.message === "string" && data.message.trim()) {
            message = data.message;
          } else if (typeof data?.error === "string" && data.error.trim()) {
            message = data.error;
          }
        } catch {
          // Ignore parsing errors; fall back to generic message.
        }
        throw new Error(message);
      }

      const data = await response.json();
      setDraftText(data.defense);
    } catch (err) {
      console.error("Error generating defense:", err);
      setError(err instanceof Error ? err.message : "Failed to generate defense. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [game, playerUid, canShowDefense]);

  const updateDraftText = useCallback((text: string) => {
    setDraftText(text);
  }, []);

  const clearDraft = useCallback(() => {
    setDraftText(null);
    setError(null);
  }, []);

  const markAsUsed = useCallback(() => {
    if (!game || !playerUid) return;
    
    const key = `${playerUid}-${game.id}`;
    usageTracker.set(key, { usedInRound: game.round });
  }, [game, playerUid]);

  return {
    isGenerating,
    draftText,
    error,
    hasUsedThisRound,
    canShowDefense,
    generateDefense,
    updateDraftText,
    clearDraft,
    markAsUsed,
  };
}
