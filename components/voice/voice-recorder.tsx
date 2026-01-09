"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircleIcon, Loader2Icon, MicIcon, StopCircleIcon } from "lucide-react";

interface VoiceRecorderProps {
  onUpload: (file: File, durationMs: number) => Promise<void>;
  disabled?: boolean;
}

export function VoiceRecorder({ onUpload, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const handleDataAvailable = useCallback(async () => {
    const duration = Date.now() - startTimeRef.current;
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
    setLoading(true);
    try {
      await onUpload(file, duration);
    } catch (uploadError) {
      console.error("Voice memo upload failed", uploadError);
      setError("Failed to upload voice memo. Please try again.");
    } finally {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      setLoading(false);
      setIsRecording(false);
      chunksRef.current = [];
    }
  }, [onUpload]);

  const startRecording = async () => {
    if (disabled || isRecording) return;
    setError(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = handleDataAvailable;

      recorder.start();
      setIsRecording(true);
    } catch (requestError) {
      console.error("Microphone access rejected", requestError);
      setError("Microphone permission is required for voice memos.");
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [stopRecording]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Voice memos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircleIcon className="mt-0.5 h-4 w-4" aria-hidden />
            {error}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            disabled={disabled || loading}
            className="min-w-[160px]"
          >
            {isRecording ? (
              <>
                <StopCircleIcon className="mr-2 h-4 w-4" aria-hidden />
                Stop recording
              </>
            ) : (
              <>
                <MicIcon className="mr-2 h-4 w-4" aria-hidden />
                Start recording
              </>
            )}
          </Button>
          {loading && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
              Uploading memo...
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Voice clips are capped at 60 seconds and saved privately in Firebase Storage.
        </p>
      </CardContent>
    </Card>
  );
}
