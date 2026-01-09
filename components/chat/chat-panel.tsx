"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import type { GameMessage } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmileIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_PRESETS = ["😀", "😂", "😎", "🤔", "😱", "🧐", "🔥", "💀", "🌕", "🎭"];

interface ChatPanelProps {
  messages: GameMessage[];
  onSend: (text: string) => Promise<void> | void;
  phase: string;
  disabled?: boolean;
}

export function ChatPanel({ messages, onSend, phase, disabled }: ChatPanelProps) {
  const [value, setValue] = useState("");
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)),
    [messages]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    const text = value.trim();
    setValue("");
    await onSend(text);
    queueMicrotask(() => {
      const container = viewportRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    });
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-base capitalize">{phase} chat</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4">
        <div
          ref={viewportRef}
          className="h-64 flex-1 overflow-y-auto rounded-md border border-border/60 bg-background/60"
        >
          <div className="flex flex-col gap-3 p-4">
            {sortedMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1 rounded-md border border-border/40 bg-background/80 p-3 text-sm",
                  message.isSystem && "border-dashed text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{message.authorName}</span>
                  <span>{formatRelative(message.createdAt)}</span>
                </div>
                <p>{message.body}</p>
                {message.emoji && <span className="text-lg">{message.emoji}</span>}
              </div>
            ))}
            {!sortedMessages.length && (
              <p className="text-center text-xs text-muted-foreground">No messages yet.</p>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Share a hunch with the town..."
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={disabled}
            rows={3}
          />
          <div className="flex items-center justify-between gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" disabled={disabled}>
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
            <Button type="submit" disabled={!value.trim() || disabled}>
              <SendIcon className="mr-2 h-4 w-4" aria-hidden />
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
