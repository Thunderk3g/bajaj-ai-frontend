import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusDot, type Tone } from "@/components/ui/StatusDot";

type BadgeVariant = "soft" | "outline" | "solid";

const TONE_SOFT: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok-text",
  warn: "bg-warn-soft text-warn-text",
  down: "bg-down-soft text-down-text",
  idle: "bg-idle-soft text-ink-muted",
  brand: "bg-brand-soft text-brand-hover",
};

const TONE_OUTLINE: Record<Tone, string> = {
  ok: "border-ok/30 text-ok-text",
  warn: "border-warn/30 text-warn-text",
  down: "border-down/30 text-down-text",
  idle: "border-line-strong text-ink-muted",
  brand: "border-brand/30 text-brand-hover",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

/** Compact label pill — status indicators and capability tags. */
export function Badge({
  children,
  tone = "idle",
  variant = "soft",
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-semibold leading-none",
        "px-2.5 py-1 tracking-tight",
        variant === "soft" && TONE_SOFT[tone],
        variant === "outline" && cn("border bg-transparent", TONE_OUTLINE[tone]),
        variant === "solid" && "bg-navy text-white",
        className,
      )}
    >
      {dot && <StatusDot tone={tone} pulse={pulse} size={7} />}
      {children}
    </span>
  );
}

/** Neutral capability chip (e.g. "IRDAI", "pgvector"). */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-navy/70",
        className,
      )}
    >
      {children}
    </span>
  );
}
