"use client";

import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon, Trash2Icon, AlertCircleIcon } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";

interface VoiceRecorderProps {
  onRecordingReady: (audioBlob: Blob | null) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingReady, disabled }: VoiceRecorderProps) {
  const isPressingRef = useRef<boolean>(false);
  
  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    deleteRecording,
    error,
  } = useVoiceRecorder();

  // Notify parent when audio blob changes
  useEffect(() => {
    onRecordingReady(audioBlob);
  }, [audioBlob, onRecordingReady]);

  // Global release handlers - catch mouseup/touchend anywhere on the page
  const handleGlobalRelease = useCallback(() => {
    isPressingRef.current = false;
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
    };
  }, [handleGlobalRelease]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    
    // Don't start if disabled or already have a recording
    if (disabled || audioBlob || isRecording) return;
    
    isPressingRef.current = true;
    startRecording();
  }, [disabled, audioBlob, isRecording, startRecording]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isPressingRef.current = false;
    
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Prevent accidental click events
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show error if recording failed
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
          <AlertCircleIcon className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-destructive">Recording failed</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Show recording preview if audio exists
  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
          <MicIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium">Voice ready</p>
          <p className="text-xs text-muted-foreground">{formatTime(recordingTime)}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={deleteRecording}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Delete recording"
        >
          <Trash2Icon className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  // Show recording indicator if currently recording
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500 bg-red-50 p-2 dark:bg-red-950/20">
        <div className="flex h-8 w-8 items-center justify-center">
          <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-red-700 dark:text-red-400">Recording...</p>
          <p className="text-xs text-red-600 dark:text-red-500">{formatTime(recordingTime)}</p>
        </div>
        <p className="text-xs text-muted-foreground">Release to stop</p>
      </div>
    );
  }

  // Show microphone button (hold to record)
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      disabled={disabled}
      className="h-9 w-9 p-0 touch-none"
      title="Hold to record voice message"
    >
      <MicIcon className="h-4 w-4" />
    </Button>
  );
}
