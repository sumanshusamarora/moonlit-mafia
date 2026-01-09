"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon, Trash2Icon } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingReady: (audioBlob: Blob | null) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecordingReady, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPressingRef = useRef<boolean>(false);

  useEffect(() => {
    // Global mouseup listener to catch mouseup anywhere on the page
    const handleGlobalMouseUp = () => {
      isPressingRef.current = false;
      if (isRecording) {
        stopRecording();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      cleanup();
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isRecording]);

  // Notify parent when audio blob changes
  useEffect(() => {
    onRecordingReady(audioBlob);
  }, [audioBlob, onRecordingReady]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (disabled || audioBlob) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isPressingRef.current = true;
    
    // Small delay to ensure this is a hold, not a click
    setTimeout(() => {
      if (isPressingRef.current && !audioBlob && !isRecording) {
        startRecording();
      }
    }, 150);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    isPressingRef.current = false;
    if (isRecording) {
      stopRecording();
    }
  };

  const handleMouseLeave = () => {
    // Stop recording if mouse leaves button while recording
    isPressingRef.current = false;
    if (isRecording) {
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isPressingRef.current = true;
    if (!audioBlob && !isRecording) {
      startRecording();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    isPressingRef.current = false;
    if (isRecording) {
      stopRecording();
    }
  };

  // Prevent click event from firing after mousedown/mouseup
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      className="h-9 w-9 p-0"
      title="Hold to record voice message"
    >
      <MicIcon className="h-4 w-4" />
    </Button>
  );
}
