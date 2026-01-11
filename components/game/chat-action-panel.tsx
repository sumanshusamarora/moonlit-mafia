import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface UtilityTab {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface ChatActionPanelProps {
  tabs: UtilityTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  chatPanel: ReactNode;
  utilityPanel: ReactNode | null;
}

export function ChatActionPanel({ tabs, activeTab, onTabChange, chatPanel, utilityPanel }: ChatActionPanelProps) {
  const renderTabBadge = (badge?: number) => {
    if (!badge) return null;
    if (badge <= 0) return null;
    return (
      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-white">
        {badge}
      </span>
    );
  };

  const renderTabTrigger = (tab: UtilityTab) => {
    const isActive = activeTab === tab.value;
    return (
      <button
        key={tab.value}
        type="button"
        onClick={() => onTabChange(tab.value)}
        data-testid={`utility-tab-${tab.value}`}
        className={cn(
          "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition",
          "text-white/70 hover:bg-white/10",
          isActive && "bg-white/20 text-white shadow-sm"
        )}
      >
        {tab.icon && <span className="text-base">{tab.icon}</span>}
        <span>{tab.label}</span>
        {renderTabBadge(tab.badge)}
      </button>
    );
  };

  const isChatActive = activeTab === "chat";

  return (
    <aside className="flex min-h-0 flex-col gap-4 rounded-3xl bg-surface p-5 text-textPrimary shadow-lg ring-1 ring-border/60">
      <div className="-mx-2 overflow-x-auto">
        <div className="inline-flex gap-2 px-2 py-1">
          {tabs.map(renderTabTrigger)}
        </div>
      </div>

      {isChatActive ? (
        <div className="min-h-0 flex-1">{chatPanel}</div>
      ) : (
        <div className="max-h-[45vh] min-h-[220px] overflow-y-auto rounded-2xl bg-muted/20 p-4 ring-1 ring-border/60">
          {utilityPanel}
        </div>
      )}
    </aside>
  );
}
