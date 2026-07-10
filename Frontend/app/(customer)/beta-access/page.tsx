import { BetaAccessRequestForm } from "@/features/auth/components/beta-access-request-form";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

export const metadata = {
  title: "Beta Access — JadeNode",
  description: "Ajukan akses beta untuk dapat melakukan checkout di JadeNode Marketplace.",
};

export default function BetaAccessPage() {
  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
        <header className="reveal-rise mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
            JadeNode · Customer
          </p>
          <h1 className="mt-2 text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
            Beta Access
          </h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            Ajukan akses beta untuk dapat melakukan checkout di JadeNode
            Marketplace.
          </p>
        </header>

        <section className="reveal-rise">
          <BetaAccessRequestForm />
        </section>
      </div>
    </RevealOnScroll>
  );
}
