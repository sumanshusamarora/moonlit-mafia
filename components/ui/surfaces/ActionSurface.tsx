"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ActionSurfaceProps {
  children: ReactNode;
  className?: string;
  /**
   * Controls the height behavior of the action surface
   * - "auto": Fits content
   * - "minimal": Compressed height for waiting states
   * - "expanded": Full height for active interactions
   */
  heightMode?: "auto" | "minimal" | "expanded";
  /**
   * Whether this surface should stick to the top on mobile
   */
  sticky?: boolean;
}

/**
 * ActionSurface - Container for phase-specific action prompts and controls
 * 
 * This component provides a consistent container for game actions that:
 * - Adapts height based on current state (minimal when waiting, expanded when active)
 * - Can be sticky on mobile for constant visibility
 * - Provides clean visual separation from chat
 */
export function ActionSurface({ 
  children, 
  className,
  heightMode = "auto",
  sticky = false
}: ActionSurfaceProps) {
  return (
    <div
      className={cn(
        "w-full transition-all duration-200 ease-in-out",
        sticky && "sticky top-0 z-10",
        className
      )}
    >
      <Card
        className={cn(
          "border-border/60 bg-card shadow-sm",
          heightMode === "minimal" && "min-h-[120px]",
          heightMode === "expanded" && "min-h-[200px] md:min-h-[240px]",
          heightMode === "auto" && "min-h-fit"
        )}
      >
        <CardContent className="p-4 space-y-3">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
