"use client";

import { ReactNode } from "react";
import { ActionSurface } from "../surfaces/ActionSurface";
import { ChatSurface } from "../surfaces/ChatSurface";
import { GameSurface } from "../surfaces/GameSurface";
import { Badge } from "../badge";

// Bottom navigation height constant for consistency
const BOTTOM_NAV_HEIGHT = "5rem"; // 80px (20 * 4px)
const BOTTOM_NAV_CLASS = "pb-20"; // Tailwind class equivalent

interface MobileGameLayoutProps {
  /**
   * Phase indicator and game code in header
   */
  header: ReactNode;
  
  /**
   * Action center content (voting, night actions, status)
   */
  actionContent: ReactNode;
  
  /**
   * Chat interface
   */
  chatContent: ReactNode;
  
  /**
   * Optional bottom drawer for players list
   */
  playerDrawer?: ReactNode;
  
  /**
   * Optional floating action button
   */
  fab?: ReactNode;
  
  /**
   * Test mode indicator
   */
  isTestMode?: boolean;
  
  /**
   * Height mode for action surface
   */
  actionHeightMode?: "auto" | "minimal" | "expanded";
}

/**
 * MobileGameLayout - Mobile-first layout for game screens
 * 
 * Implements the new mobile layout strategy:
 * - Sticky header with phase/code
 * - Action surface (contextual, collapsible)
 * - Chat surface (always visible, fills remaining space)
 * - Player drawer (bottom sheet)
 * - FAB for primary actions
 */
export function MobileGameLayout({
  header,
  actionContent,
  chatContent,
  playerDrawer,
  fab,
  isTestMode = false,
  actionHeightMode = "auto"
}: MobileGameLayoutProps) {
  return (
    <div className="flex flex-col h-screen lg:hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/60 p-4">
        <div className="flex items-center justify-between gap-3">
          {isTestMode && (
            <Badge variant="outline" className="border-yellow-500 bg-yellow-500/10 text-yellow-600 shrink-0">
              🧪 TEST
            </Badge>
          )}
          {header}
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <GameSurface isMobile className={`flex-1 overflow-y-auto ${BOTTOM_NAV_CLASS}`}>
        {/* Action Surface - Contextual height */}
        <ActionSurface heightMode={actionHeightMode}>
          {actionContent}
        </ActionSurface>

        {/* Chat Surface - Fills remaining space */}
        <ChatSurface expanded>
          {chatContent}
        </ChatSurface>
      </GameSurface>

      {/* Bottom Navigation / Player Drawer */}
      {playerDrawer && (
        <div className="sticky bottom-0 z-10 bg-background border-t border-border/60 p-4">
          {playerDrawer}
        </div>
      )}

      {/* Floating Action Button */}
      {fab && (
        <div className="fixed bottom-20 right-4 z-30">
          {fab}
        </div>
      )}
    </div>
  );
}
