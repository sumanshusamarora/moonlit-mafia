"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { ROLE_DEFINITIONS } from "@/lib/game/roles";
import type { RoleConfig } from "@/types/game";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoleConfiguratorProps {
  value: RoleConfig[];
  onChange: (value: RoleConfig[]) => void;
  maxPlayers: number;
}

export function RoleConfigurator({ value, onChange, maxPlayers }: RoleConfiguratorProps) {
  const totals = value.reduce((sum, entry) => sum + entry.count, 0);

  const updateRole = (roleId: RoleConfig["role"], delta: number) => {
    const next = value.map((entry) =>
      entry.role === roleId
        ? { ...entry, count: Math.max(0, entry.count + delta) }
        : entry
    );
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Assigned roles</span>
        <span>
          {totals}/{maxPlayers}
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {ROLE_DEFINITIONS.map((role) => {
          const config = value.find((entry) => entry.role === role.id) ?? {
            role: role.id,
            count: 0,
          };
          const isPrimary = role.team === "mafia";

          return (
            <li
              key={role.id}
              className={cn(
                "flex items-center justify-between rounded-lg border border-border/60 bg-background/80 p-4",
                isPrimary && "border-primary/50"
              )}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold capitalize">{role.name}</p>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => updateRole(role.id, -1)}
                  disabled={config.count === 0}
                  aria-label={`Remove ${role.name}`}
                >
                  <MinusIcon className="h-4 w-4" aria-hidden />
                </Button>
                <span className="w-8 text-center text-base font-semibold">{config.count}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => updateRole(role.id, 1)}
                  disabled={totals >= maxPlayers}
                  aria-label={`Add ${role.name}`}
                >
                  <PlusIcon className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
