import { cn } from "@/lib/utils";

export type Tone = "ok" | "warn" | "down" | "idle" | "brand";

const TONE_BG: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  down: "bg-down",
  idle: "bg-idle",
  brand: "bg-brand",
};

const TONE_RING: Record<Tone, string> = {
  ok: "bg-ok/30",
  warn: "bg-warn/30",
  down: "bg-down/30",
  idle: "bg-idle/30",
  brand: "bg-brand/30",
};

interface StatusDotProps {
  tone?: Tone;
  pulse?: boolean;
  size?: number;
  className?: string;
}

/** A small status dot with an optional soft pulsing halo. */
export function StatusDot({ tone = "idle", pulse = false, size = 9, className }: StatusDotProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-pulseDot",
            TONE_RING[tone],
          )}
        />
      )}
      <span
        className={cn("relative inline-block rounded-full", TONE_BG[tone])}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
