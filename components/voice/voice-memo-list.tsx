import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GameVoiceMemo } from "@/types/game";
import { Trash2Icon } from "lucide-react";

interface VoiceMemoListProps {
  memos: GameVoiceMemo[];
  canModerate: boolean;
  onDelete: (memoId: string, storagePath: string) => void;
}

export function VoiceMemoList({ memos, canModerate, onDelete }: VoiceMemoListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shared voice notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!memos.length && <p className="text-sm text-muted-foreground">No voice notes yet.</p>}
        <ul className="space-y-3">
          {memos.map((memo) => (
            <li key={memo.id} className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-background/70 p-3">
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-foreground">{memo.ownerName}</span>
                <span className="text-xs text-muted-foreground">{Math.round(memo.durationMs / 1000)}s clip</span>
                <audio controls className="mt-2 w-full" src={memo.url ?? ""} preload="metadata">
                  Your browser does not support audio playback.
                </audio>
              </div>
              {canModerate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(memo.id, memo.storagePath)}
                >
                  <Trash2Icon className="mr-2 h-4 w-4" aria-hidden />
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
