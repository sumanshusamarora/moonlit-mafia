"use client";

import { FormEvent, useMemo, useRef, useState, useCallback, useEffect } from "react";
import type { GameMessage, MafiaGame } from "@/types/game";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmileIcon, SendIcon } from "lucide-react";
import { VoiceRecorder } from "./voice-recorder";
import { VoicePlayer, type VoicePlayerRef } from "./voice-player";
import { AIDefenseNudge } from "./ai-defense-nudge";
import { cn } from "@/lib/utils";
import { useVoiceAutoplay } from "@/hooks/use-voice-autoplay";
import { useAIDefenseDraft } from "@/hooks/use-ai-defense-draft";
import { toast } from "sonner";

const EMOJI_PRESETS = ["😀", "😂", "😎", "🤔", "😱", "🧐", "🔥", "💀", "🌕", "🎭"];

interface ChatPanelProps {
  messages: GameMessage[];
  onSend: (text: string) => Promise<void> | void;
  onSendVoice?: (audioBlob: Blob) => Promise<void> | void;
  phase: string;
  disabled?: boolean;
  autoplayEnabled?: boolean;
  game?: MafiaGame | null;
  viewerId?: string | null;
  variant?: "default" | "minimal";
}

type VoiceSendState = 'idle' | 'recorded' | 'sending';

export function ChatPanel({ messages, onSend, onSendVoice, phase, disabled, autoplayEnabled = false, game, viewerId, variant = "default" }: ChatPanelProps) {
  const [value, setValue] = useState("");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceSendState, setVoiceSendState] = useState<VoiceSendState>('idle');
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const voicePlayerRefs = useRef<Map<string, React.RefObject<VoicePlayerRef> | null>>(new Map());
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // AI Defense feature
  const aiDefense = useAIDefenseDraft(game || null, viewerId || null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [messages]
  );

  // Handle auto-play for voice messages
  const handleAutoPlay = useCallback(async (messageId: string, voiceUrl: string): Promise<boolean> => {
    const playerRef = voicePlayerRefs.current.get(messageId);
    
    if (!playerRef?.current) {
      // Player not yet rendered, retry on next render
      return false;
    }

    try {
      await playerRef.current.play();
      setAutoplayBlocked(false);
      return true; // Successfully started playback
    } catch (error) {
      // Browser blocked auto-play, show soft hint
      console.warn("Auto-play was blocked by browser:", error);
      setAutoplayBlocked(true);
      
      // Auto-dismiss the hint after a few seconds
      setTimeout(() => setAutoplayBlocked(false), 5000);
      return false; // Playback failed
    }
  }, []);

  useVoiceAutoplay(sortedMessages, autoplayEnabled, handleAutoPlay);

  // Clear autoplay hint when user interacts with chat
  useEffect(() => {
    const handleInteraction = () => setAutoplayBlocked(false);
    window.addEventListener('click', handleInteraction, { once: true });
    return () => window.removeEventListener('click', handleInteraction);
  }, [autoplayBlocked]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    // Send voice message if recorded
    if (voiceBlob && onSendVoice) {
      // Guard against double execution
      if (voiceSendState === 'sending') return;
      
      // Capture the blob before clearing state
      const audioToSend = voiceBlob;
      
      // Immediately clear UI and set to sending state
      setVoiceSendState('sending');
      setVoiceBlob(null);
      
      try {
        await onSendVoice(audioToSend);
      } catch (error) {
        // Don't resurrect the blob on error - show toast instead
        toast.error("Voice message failed to send");
        console.error("Voice message send error:", error);
      } finally {
        // Reset to idle state
        setVoiceSendState('idle');
      }
      return;
    }

    // Send text message if present
    if (!value.trim()) return;
    const text = value.trim();
    setValue("");
    await onSend(text);
  };

  const handleRecordingReady = (audioBlob: Blob | null) => {
    setVoiceBlob(audioBlob);
    // Update state when recording is ready
    if (audioBlob) {
      setVoiceSendState('recorded');
    } else {
      setVoiceSendState('idle');
    }
  };

  const handleAIDefenseSend = async (text: string) => {
    await onSend(text);
    aiDefense.markAsUsed();
    aiDefense.clearDraft();
  };

  const handleAIDismiss = () => {
    aiDefense.clearDraft();
  };

  const containerClasses = variant === "minimal"
    ? "flex h-full flex-col rounded-3xl bg-surface p-5 text-textPrimary shadow-lg ring-1 ring-border/60"
    : "flex h-full flex-col rounded-xl border border-border/60 bg-background/80 px-4 pb-4 pt-3";

  const headerTextClasses = variant === "minimal"
    ? "text-sm font-semibold uppercase tracking-[0.35em] text-textSecondary"
    : "text-base font-semibold capitalize";

  const transcriptClasses = variant === "minimal"
    ? "h-64 flex-1 overflow-y-auto rounded-2xl bg-muted/20 p-0.5 ring-1 ring-border/60"
    : "h-64 flex-1 overflow-y-auto rounded-md border border-border/60 bg-background/60";

  const messageClasses = variant === "minimal"
    ? "flex flex-col gap-1 rounded-2xl bg-background/40 p-4 text-sm text-textSecondary"
    : "flex flex-col gap-1 rounded-md border border-border/40 bg-background/80 p-3 text-sm";

  return (
    <div className={containerClasses}>
      <div className="mb-2 flex items-center justify-between">
        <p className={headerTextClasses}>
          {variant === "minimal" ? `${phase} chat`.toUpperCase() : `${disabled ? "👻 " : ""}${phase} chat${disabled ? " (Observer)" : ""}`}
        </p>
        {variant === "minimal" && disabled && <span className="text-xs text-white/50">Observer</span>}
      </div>
      <div className="flex h-full flex-col gap-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {autoplayBlocked && (
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              💡 Tap anywhere to enable audio playback
            </div>
          )}
          {/* AI Defense Nudge - Only show if conditions are met */}
          {aiDefense.canShowDefense && !disabled && (
            <AIDefenseNudge
              isGenerating={aiDefense.isGenerating}
              draftText={aiDefense.draftText}
              error={aiDefense.error}
              onGenerate={aiDefense.generateDefense}
              onSend={handleAIDefenseSend}
              onDismiss={handleAIDismiss}
              onUpdateDraft={aiDefense.updateDraftText}
            />
          )}
          <Textarea
            placeholder={disabled ? "You cannot participate in chat as an observer" : "Share a hunch with the town..."}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={disabled || !!voiceBlob}
            rows={3}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" disabled={disabled || !!voiceBlob}>
                    <SmileIcon className="mr-2 h-4 w-4" aria-hidden />
                    Emoji
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit">
                  <div className="grid grid-cols-5 gap-2">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-md text-xl hover:bg-muted"
                        onClick={() => setValue((prev) => `${prev} ${emoji}`.trim())}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {onSendVoice && (
                <VoiceRecorder
                  onRecordingReady={handleRecordingReady}
                  disabled={disabled || !!value.trim()}
                  isSending={voiceSendState === 'sending'}
                />
              )}
            </div>
            <Button type="submit" disabled={(!value.trim() && !voiceBlob) || disabled || voiceSendState === 'sending'}>
              <SendIcon className="mr-2 h-4 w-4" aria-hidden />
              Send
            </Button>
          </div>
        </form>
        <div ref={viewportRef} className={transcriptClasses}>
          <div className="flex flex-col gap-3 p-4">
            {sortedMessages.map((message, index) => {
              const displayAuthorName =
                message.authorUid === "system" && message.authorName === "Narrator"
                  ? "God"
                  : message.authorName;
              return (
                <div
                  key={message.id || `${message.createdAt}-${message.authorUid}-${index}`}
                  className={cn(
                    messageClasses,
                    message.isSystem && (variant === "minimal" ? "border border-white/20 bg-transparent text-white/60" : "border-dashed text-muted-foreground")
                  )}
                >
                  <div className="flex items-center justify-between text-xs text-textSecondary">
                    <span className="font-semibold text-textPrimary">{displayAuthorName}</span>
                    <span>{formatRelative(message.createdAt)}</span>
                  </div>
                  {message.voiceUrl ? (
                    <VoicePlayer
                      ref={(ref) => {
                        if (message.id && ref) {
                          voicePlayerRefs.current.set(message.id, { current: ref });
                        }
                      }}
                      voiceUrl={message.voiceUrl}
                      duration={message.voiceDuration || 0}
                      authorName={displayAuthorName}
                    />
                  ) : (
                    <>
                      <p className="leading-relaxed">{message.body}</p>
                      {message.emoji && <span className="text-lg">{message.emoji}</span>}
                    </>
                  )}
                </div>
              );
            })}
            {!sortedMessages.length && (
              <p className="text-center text-xs text-muted-foreground">No messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelative(timestamp?: number) {
  if (!timestamp) return "just now";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) {
    const minutes = Math.floor(diff / 60_000);
    return `${minutes}m ago`;
  }
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
