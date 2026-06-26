import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { BajajMark, ActivityIcon } from "@/icons";

interface MonitoringShellProps {
  /** Breadcrumb / sub-title shown next to the section name. */
  crumb?: ReactNode;
  /** Right-aligned status chip(s). */
  actions?: ReactNode;
  children: ReactNode;
}

/** Shared chrome for the monitoring pages — header bar + page container. */
export function MonitoringShell({ crumb, actions, children }: MonitoringShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface-sunken/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg"
              aria-label="Bajaj Life AI Platform home"
            >
              <BajajMark />
            </Link>
            <span className="flex min-w-0 items-center gap-2">
              <Link
                to="/monitoring"
                className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-navy hover:text-brand"
              >
                <ActivityIcon width={18} height={18} className="text-brand" />
                Monitoring
              </Link>
              {crumb && (
                <>
                  <span className="text-ink-subtle">/</span>
                  <span className="truncate text-[15px] font-semibold text-ink-muted">
                    {crumb}
                  </span>
                </>
              )}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Badge tone="idle" variant="outline" className="hidden font-mono text-[11px] sm:inline-flex">
              VM · 10.3.5.99
            </Badge>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

/** Inline "Monitoring offline" notice (reuses Badge tone `down`, per §5). */
export function OfflineNotice({ detail }: { detail?: string }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-down/30 bg-down-soft px-6 py-8 text-center">
      <Badge tone="down" dot>
        Monitoring offline
      </Badge>
      <p className="mt-3 text-sm text-ink-muted">
        {detail ?? "Can't reach the monitoring backend. It may be down, or you may not be authorised."}
      </p>
    </div>
  );
}
