"use client";

import { useEffect, useRef } from "react";
import type { GameMessage } from "@/types/game";

/**
 * Hook to track and trigger auto-play for voice messages
 * Ensures each message is only auto-played once
 */
export function useVoiceAutoplay(
  messages: GameMessage[],
  autoplayEnabled: boolean,
  onAutoPlay: (messageId: string, voiceUrl: string) => void
) {
  const playedMessagesRef = useRef(new Set<string>());

  useEffect(() => {
    if (!autoplayEnabled) return;

    // Find the newest unplayed voice message
    const voiceMessages = messages
      .filter((msg) => msg.voiceUrl && msg.id)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    for (const message of voiceMessages) {
      const messageId = message.id;
      
      // Skip if already played
      if (playedMessagesRef.current.has(messageId)) {
        continue;
      }

      // Mark as played immediately to prevent duplicates
      playedMessagesRef.current.add(messageId);

      // Trigger auto-play
      if (message.voiceUrl) {
        onAutoPlay(messageId, message.voiceUrl);
      }

      // Only auto-play the newest message
      break;
    }
  }, [messages, autoplayEnabled, onAutoPlay]);

  return {
    // Expose method to clear played messages if needed (e.g., on game restart)
    clearPlayedMessages: () => {
      playedMessagesRef.current.clear();
    },
  };
}
