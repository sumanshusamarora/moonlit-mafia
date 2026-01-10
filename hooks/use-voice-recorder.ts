import { useState, useRef, useEffect, useCallback } from "react";

export interface UseVoiceRecorderOptions {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  deleteRecording: () => void;
  error: string | null;
}

/**
 * Custom hook for managing voice recording with MediaRecorder API.
 * Handles stream lifecycle, recording state, and cleanup.
 */
export function useVoiceRecorder(
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderReturn {
  const { onRecordingComplete, maxDuration = 300 } = options; // Default max 5 minutes

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);

  // Helper to check if MediaRecorder is active
  const isRecorderActive = (recorder: MediaRecorder | null): boolean => {
    return recorder !== null && 
           (recorder.state === "recording" || recorder.state === "paused");
  };

  // Cleanup function - stops all recording activity and releases resources
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (isRecorderActive(mediaRecorderRef.current)) {
      try {
        mediaRecorderRef.current!.stop();
      } catch (err) {
        console.error("Error stopping MediaRecorder:", err);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    // Don't start if already recording or if we have a pending blob
    if (isRecording || audioBlob) {
      return;
    }

    setError(null);

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
        const duration = recordingTimeRef.current;
        setAudioBlob(blob);
        setIsRecording(false);
        isRecordingRef.current = false;

        // Stop the stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Clear the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Notify callback
        if (onRecordingComplete) {
          onRecordingComplete(blob, duration);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Recording failed");
        cleanup();
        setIsRecording(false);
        isRecordingRef.current = false;
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      // Start timer
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        
        // Auto-stop if max duration reached
        if (recordingTimeRef.current >= maxDuration) {
          const recorder = mediaRecorderRef.current;
          if (recorder && recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Failed to access microphone. Please check your permissions.");
      cleanup();
    }
  }, [isRecording, audioBlob, maxDuration, onRecordingComplete, cleanup]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && (recorder.state === "recording" || recorder.state === "paused")) {
      recorder.stop();
      // Note: cleanup happens in onstop handler
    }
  }, []);

  const deleteRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError(null);
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    deleteRecording,
    error,
  };
}
