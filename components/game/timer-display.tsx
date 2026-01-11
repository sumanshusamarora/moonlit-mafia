import { useEffect, useState } from "react";

interface TimerDisplayProps {
  deadline: number | null | undefined;
  variant?: "default" | "minimal";
}

export function TimerDisplay({ deadline, variant = "default" }: TimerDisplayProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = deadline - now;
      setRemaining(Math.max(0, diff));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (remaining === null) {
    return null;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = totalSeconds < 60;
  const isWarning = totalSeconds < 30;

  if (variant === "minimal") {
    const tone = isWarning
      ? "bg-red-500/15 text-red-200"
      : isUrgent
      ? "bg-orange-500/15 text-orange-200"
      : "bg-white/5 text-white";

    return (
      <div className={`flex items-center gap-3 rounded-full px-4 py-2 font-mono text-base ${tone}`}>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
          Time Left
        </span>
        <span className="tabular-nums tracking-tight">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 text-center ${
        isWarning
          ? "border-red-500 bg-red-100 dark:bg-red-900/20"
          : isUrgent
          ? "border-orange-500 bg-orange-100 dark:bg-orange-900/20"
          : "border-muted bg-muted/50"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Time Remaining
        </span>
      </div>
      <div
        className={`mt-1 font-mono text-2xl font-bold ${
          isWarning
            ? "text-red-900 dark:text-red-400"
            : isUrgent
            ? "text-orange-900 dark:text-orange-400"
            : "text-foreground"
        }`}
      >
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
    </div>
  );
}
