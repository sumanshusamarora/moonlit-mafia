"use client";

import { ReactNode } from "react";
import { Badge } from "../badge";

interface DesktopGameLayoutProps {
  /**
   * Header content (game code, phase, etc.)
   */
  header: ReactNode;
  
  /**
   * Left column (players, host controls, settings)
   */
  leftColumn: ReactNode;
  
  /**
   * Center column (action center, activity timeline)
   */
  centerColumn: ReactNode;
  
  /**
   * Right column (chat)
   */
  rightColumn: ReactNode;
  
  /**
   * Test mode indicator
   */
  isTestMode?: boolean;
  
  /**
   * Whether to use 3-column layout (default: auto based on screen width)
   */
  threeColumn?: boolean;
}

/**
 * DesktopGameLayout - Desktop layout for game screens
 * 
 * Implements multi-column desktop layout:
 * - 2-column (1024-1280px): Left sidebar + Center (with chat below)
 * - 3-column (1280px+): Left sidebar + Center + Right (chat)
 */
export function DesktopGameLayout({
  header,
  leftColumn,
  centerColumn,
  rightColumn,
  isTestMode = false,
  threeColumn = true
}: DesktopGameLayoutProps) {
  return (
    <div className="hidden lg:flex lg:flex-col lg:h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/60 p-6">
        <div className="flex items-center justify-between gap-4">
          {isTestMode && (
            <Badge variant="outline" className="border-yellow-500 bg-yellow-500/10 text-yellow-600">
              🧪 TEST MODE
            </Badge>
          )}
          {header}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className={
          threeColumn 
            ? "grid grid-cols-[300px,1fr] xl:grid-cols-[300px,1fr,380px] gap-6 p-6 h-full"
            : "grid grid-cols-[300px,1fr] gap-6 p-6 h-full"
        }>
          {/* Left Column - Players, Host Controls, Settings */}
          <aside className="space-y-6 overflow-y-auto">
            {leftColumn}
          </aside>

          {/* Center Column - Action Center, Activity Timeline */}
          <div className="space-y-6 overflow-y-auto">
            {centerColumn}
          </div>

          {/* Right Column - Chat (3-column layout only) */}
          {threeColumn && (
            <aside className="hidden xl:flex xl:flex-col overflow-hidden">
              {rightColumn}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
