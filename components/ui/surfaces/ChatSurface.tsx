"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ChatSurfaceProps {
  children: ReactNode;
  className?: string;
  /**
   * Whether to expand to fill available space
   */
  expanded?: boolean;
}

/**
 * ChatSurface - Container for chat interface
 * 
 * This component provides a consistent container for chat that:
 * - Always remains visible (no hiding in tabs)
 * - Expands to fill available vertical space
 * - Provides clean visual separation from actions
 */
export function ChatSurface({ children, className, expanded = true }: ChatSurfaceProps) {
  return (
    <div
      className={cn(
        "w-full transition-all duration-200 ease-in-out",
        expanded ? "flex-1" : "h-auto",
        className
      )}
    >
      <Card className="h-full flex flex-col border-border/60 bg-card shadow-sm">
        {children}
      </Card>
    </div>
  );
}
