export function PublicFooter() {
  return (
    <footer className="border-t border-surface-glass-border bg-surface-glass backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold gradient-text inline-block">
              JadeNode
            </h3>
            <p className="mt-3 text-sm text-foreground-muted">
              Cloud infrastructure marketplace untuk mempertemukan pelanggan
              dengan penyedia infrastruktur terverifikasi.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Marketplace
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="/marketplace"
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  Product Listing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  VPS
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  Dedicated Server
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Bantuan</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  Kebijakan Privasi
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-surface-glass-border pt-8 text-center">
          <p className="text-xs text-foreground-dim">
            &copy; {new Date().getFullYear()} ZaganJade. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
