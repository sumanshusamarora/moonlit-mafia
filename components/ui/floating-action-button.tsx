"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label?: string;
  variant?: "default" | "destructive" | "primary";
  position?: "bottom-right" | "bottom-center";
}

export function FloatingActionButton({
  icon,
  label,
  variant = "primary",
  position = "bottom-right",
  className,
  children,
  ...props
}: FloatingActionButtonProps) {
  return (
    <button
      className={cn(
        "fixed z-50 flex items-center gap-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
        "min-h-[56px] min-w-[56px] font-semibold",
        variant === "default" && "bg-background text-foreground ring-1 ring-border",
        variant === "destructive" && "bg-destructive text-destructive-foreground",
        variant === "primary" && "bg-primary text-primary-foreground",
        position === "bottom-right" && "bottom-20 right-4 md:bottom-4",
        position === "bottom-center" && "bottom-20 left-1/2 -translate-x-1/2 md:bottom-4",
        label && "px-6",
        !label && "justify-center",
        className
      )}
      {...props}
    >
      {icon && <span className="flex h-6 w-6 items-center justify-center">{icon}</span>}
      {label && <span className="whitespace-nowrap">{label}</span>}
      {children}
    </button>
  );
}
