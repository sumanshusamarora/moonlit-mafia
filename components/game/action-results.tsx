"use client";

import { cn } from "@/lib/utils";

export type ActionResultTone = "info" | "success" | "danger" | "warning" | "neutral";

export interface ActionResultItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
  tone?: ActionResultTone;
  meta?: string;
  timestamp?: number;
}

interface ActionResultsProps {
  items: ActionResultItem[];
  variant?: "desktop" | "mobile";
}

type ToneStyle = {
  container: string;
  accent: string;
  metaBadge: string;
  icon: string;
};

const toneStyles: Record<ActionResultTone, ToneStyle> = {
  info: {
    container: "bg-muted/20 ring-border/60",
    accent: "from-primary/70 via-primary/20 to-transparent",
    metaBadge: "border-border/60 bg-background/30 text-textSecondary",
    icon: "text-textPrimary",
  },
  success: {
    container: "bg-success/10 ring-success/30",
    accent: "from-success via-success/30 to-transparent",
    metaBadge: "border-border/60 bg-background/30 text-textSecondary",
    icon: "text-textPrimary",
  },
  danger: {
    container: "bg-danger/10 ring-danger/30",
    accent: "from-danger via-danger/30 to-transparent",
    metaBadge: "border-border/60 bg-background/30 text-textSecondary",
    icon: "text-textPrimary",
  },
  warning: {
    container: "bg-warning/10 ring-warning/30",
    accent: "from-warning via-warning/30 to-transparent",
    metaBadge: "border-border/60 bg-background/30 text-textSecondary",
    icon: "text-textPrimary",
  },
  neutral: {
    container: "bg-muted/30 ring-border/60",
    accent: "from-border via-border/30 to-transparent",
    metaBadge: "border-border/60 bg-background/30 text-textSecondary",
    icon: "text-textPrimary",
  },
};

const timeFormatter = typeof Intl !== "undefined"
  ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
  : null;

function formatTime(timestamp?: number) {
  if (!timestamp || !timeFormatter) {
    return null;
  }

  try {
    return timeFormatter.format(timestamp);
  } catch (error) {
    console.error("Unable to format timestamp", error);
    return null;
  }
}

export function ActionResults({ items, variant = "desktop" }: ActionResultsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section
      className={cn("flex flex-col", variant === "desktop" ? "gap-4" : "gap-3")}
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((item) => {
        const tone = item.tone ?? "info";
        const styles = toneStyles[tone];
        const timeLabel = formatTime(item.timestamp);

        return (
          <article
            key={item.id}
            className={cn(
              "relative overflow-hidden transition",
              variant === "desktop" ? "rounded-3xl p-5" : "rounded-2xl p-4",
              "ring-1 shadow-lg",
              styles.container
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b",
                styles.accent
              )}
              aria-hidden
            />

            <div className="flex items-start gap-4">
              {item.icon && (
                <span className={cn("text-2xl", styles.icon)} aria-hidden>
                  {item.icon}
                </span>
              )}

              <div className="flex flex-1 flex-col gap-2">
                {(item.meta || timeLabel) && (
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em]">
                    {item.meta && (
                      <span className={cn("rounded-full px-2 py-0.5", styles.metaBadge)}>
                        {item.meta}
                      </span>
                    )}
                    {timeLabel && item.timestamp && (
                      <time
                        dateTime={new Date(item.timestamp).toISOString()}
                        className="text-textSecondary"
                      >
                        {timeLabel}
                      </time>
                    )}
                  </div>
                )}

                <p className="text-sm font-semibold leading-snug text-textPrimary">
                  {item.title}
                </p>
                <p className="text-sm leading-relaxed text-textSecondary">
                  {item.description}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
