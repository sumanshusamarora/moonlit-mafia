"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface MobileTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export function MobileTabs({ tabs, activeTab, onTabChange, children }: MobileTabsProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Tab Navigation - Fixed at bottom on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:relative md:border-b md:border-t-0">
        <div className="flex items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex min-w-[72px] flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors md:flex-row md:gap-2 md:py-2",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon && (
                <span className={cn("flex h-6 w-6 items-center justify-center", activeTab === tab.id && "scale-110")}>
                  {tab.icon}
                </span>
              )}
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground md:relative md:right-0 md:top-0">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary md:hidden" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}

interface TabPanelProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ value, activeTab, children }: TabPanelProps) {
  if (value !== activeTab) return null;
  
  return <div className="animate-in fade-in-50 duration-200">{children}</div>;
}
