"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GameSurfaceProps {
  children: ReactNode;
  className?: string;
  /**
   * Whether to use mobile-optimized layout
   */
  isMobile?: boolean;
}

/**
 * GameSurface - Top-level wrapper for game content
 * 
 * Provides consistent spacing and layout structure for the entire game view
 */
export function GameSurface({ children, className, isMobile = false }: GameSurfaceProps) {
  return (
    <div
      className={cn(
        "w-full h-full",
        isMobile ? "flex flex-col space-y-4 p-4" : "space-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}
