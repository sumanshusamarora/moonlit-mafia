"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2Icon, SparklesIcon, XIcon } from "lucide-react";

interface AIDefenseNudgeProps {
  isGenerating: boolean;
  draftText: string | null;
  error: string | null;
  onGenerate: () => void;
  onSend: (text: string) => void;
  onDismiss: () => void;
  onUpdateDraft: (text: string) => void;
}

export function AIDefenseNudge({
  isGenerating,
  draftText,
  error,
  onGenerate,
  onSend,
  onDismiss,
  onUpdateDraft,
}: AIDefenseNudgeProps) {
  const [editedText, setEditedText] = useState("");

  // Update edited text when draft is generated
  const currentText = draftText || editedText;

  const handleTextChange = (value: string) => {
    setEditedText(value);
    onUpdateDraft(value);
  };

  const handleSend = () => {
    if (currentText.trim()) {
      onSend(currentText.trim());
    }
  };

  // If no draft yet, show the nudge card
  if (!draftText && !error) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-primary" aria-hidden />
                <p className="text-sm font-medium text-primary">
                  Need help defending yourself?
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate a short defense based on the game so far.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6 shrink-0"
              aria-label="Dismiss"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 h-4 w-4" aria-hidden />
                Draft defense with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If error occurred
  if (error && !draftText) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                {error}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6 shrink-0"
              aria-label="Dismiss"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If draft is ready, show editable textarea
  if (draftText) {
    return (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-primary" aria-hidden />
              <p className="text-sm font-medium text-primary">
                AI-Generated Defense
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6"
              aria-label="Cancel"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Edit the defense below before sending:
          </p>
          <Textarea
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={4}
            className="resize-none"
            placeholder="Edit your defense..."
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={!currentText.trim()}
              className="flex-1"
            >
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
