import Link from "next/link";

const NAV_LINKS = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Lifecycle", href: "/lifecycle" },
  { label: "Pricing", href: "/pricing" },
  { label: "Developers", href: "#developers" },
  { label: "Docs", href: "/docs" },
];

export function SiteNav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-line/80 glass">
      <div className="mx-auto flex h-14 max-w-[var(--container-container-max)] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-fg">
          <span className="relative grid h-7 w-7 place-items-center">
            <span className="absolute inset-0 rounded-md bg-accent" />
            <span className="absolute inset-[2px] rounded-[5px] bg-bg" />
            <span className="relative font-mono text-[10px] font-bold text-accent">
              JN
            </span>
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            JadeNode
          </span>
          <span className="ml-1 hidden rounded-sm border border-line-strong px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.18em] text-fg-muted sm:inline">
            Beta
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="font-sans text-[13px] text-fg-muted transition-colors duration-[180ms] hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden font-sans text-[13px] text-fg-muted transition-colors hover:text-fg sm:inline"
          >
            Masuk
          </Link>
          <a
            href="#beta"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-md bg-accent px-3 py-1.5 font-sans text-[13px] font-semibold text-accent-fg"
          >
            <span className="relative z-10">Ajukan akses</span>
            <span className="material-symbols-outlined relative z-10 text-[14px]">
              arrow_forward
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[640ms] ease-out group-hover:translate-x-full" />
          </a>
        </div>
      </div>
    </nav>
  );
}
