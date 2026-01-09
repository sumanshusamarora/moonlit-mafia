import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "alive" | "dead" | "host";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-xl",
};

export function Avatar({ name, size = "md", status = "alive", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const borderColor =
    status === "host"
      ? "ring-2 ring-primary"
      : status === "dead"
      ? "grayscale opacity-70"
      : "ring-1 ring-border";

  return (
    <div
      className={cn(
        "grid place-items-center rounded-full bg-secondary text-secondary-foreground font-semibold",
        sizeMap[size],
        borderColor,
        className
      )}
      aria-label={name}
    >
      {initials || "?"}
    </div>
  );
}
