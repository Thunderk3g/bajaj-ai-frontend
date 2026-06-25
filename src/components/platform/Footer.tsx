import { BajajMark } from "@/icons";

const APP_VERSION = "v0.1.0";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <BajajMark width={30} height={30} />
            <div className="leading-tight">
              <p className="text-sm font-bold text-navy">Bajaj Life · AI Platform</p>
              <p className="text-xs text-ink-subtle">Marketing AI, internal use only.</p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 text-sm sm:grid-cols-3">
            <FooterLink href="/compliance">Compliance</FooterLink>
            <FooterLink href="/pgadmin/">pgAdmin</FooterLink>
            <FooterLink href="/health">Health</FooterLink>
            <FooterLink href="/compliance/api/docs">Compliance API</FooterLink>
            <span className="inline-flex min-h-11 items-center text-ink-muted">SEO · soon</span>
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5 text-xs text-ink-subtle">
          <span>© {new Date().getFullYear()} Bajaj Life Insurance · AI / Marketing</span>
          <span className="font-mono">
            {APP_VERSION} · RHEL9 · Podman · nginx
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center rounded text-ink-muted transition-colors hover:text-brand focus-visible:shadow-focus"
    >
      {children}
    </a>
  );
}
