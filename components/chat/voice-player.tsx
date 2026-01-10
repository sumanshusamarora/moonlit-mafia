"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, Volume2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoicePlayerProps {
  voiceUrl: string;
  duration: number;
  authorName: string;
}

export interface VoicePlayerRef {
  play: () => Promise<void>;
}

export const VoicePlayer = forwardRef<VoicePlayerRef, VoicePlayerProps>(
  function VoicePlayer({ voiceUrl, duration, authorName }, ref) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(voiceUrl);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener("loadstart", () => {
      setIsLoading(true);
    });

    audio.addEventListener("canplay", () => {
      setIsLoading(false);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [voiceUrl]);

  const play = async () => {
    if (!audioRef.current || isPlaying) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play audio:", error);
      throw error;
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      play().catch((error) => {
        console.error("Failed to play audio:", error);
      });
    }
  };

  // Expose play method via ref for auto-play
  useImperativeHandle(ref, () => ({
    play,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <Button
        size="sm"
        variant="ghost"
        onClick={togglePlayPause}
        disabled={isLoading}
        className="h-8 w-8 shrink-0 rounded-full p-0"
      >
        {isPlaying ? (
          <PauseIcon className="h-4 w-4" />
        ) : (
          <PlayIcon className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Volume2Icon className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">
            Voice from {authorName}
          </p>
        </div>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "absolute left-0 top-0 h-full bg-primary transition-all",
              isLoading && "animate-pulse"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </div>
    </div>
  );
});
