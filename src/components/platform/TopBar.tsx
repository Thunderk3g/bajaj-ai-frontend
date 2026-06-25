import { Badge } from "@/components/ui/Badge";
import { BajajMark } from "@/icons";
import type { Display } from "@/lib/status";

export function TopBar({ status }: { status: Display }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-sunken/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <a
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-lg"
          aria-label="Bajaj Life AI Platform home"
        >
          <BajajMark />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-navy">Bajaj Life</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-subtle">
              AI Platform
            </span>
          </span>
        </a>

        <div className="flex shrink-0 items-center gap-3">
          <Badge tone={status.tone} dot pulse={status.pulse} className="hidden sm:inline-flex">
            {status.label}
          </Badge>
          <Badge tone="idle" variant="outline" className="font-mono text-[11px]">
            VM · 10.3.5.99
          </Badge>
        </div>
      </div>
    </header>
  );
}
