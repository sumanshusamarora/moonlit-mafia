"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  variant?: "default" | "compact";
}

export function CollapsibleSection({
  title,
  badge,
  defaultOpen = true,
  children,
  variant = "default",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("overflow-hidden rounded-lg border", variant === "compact" && "border-border/50")}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", variant === "compact" ? "text-sm" : "text-base")}>
            {title}
          </span>
          {badge !== undefined && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className={cn("animate-in slide-in-from-top-2 duration-200", variant === "compact" ? "p-3" : "p-4")}>
          {children}
        </div>
      )}
    </div>
  );
}
