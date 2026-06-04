/**
 * Atmospheric backdrop: soft grid mask, three drifting amber→purple→azure
 * radial glows, and a subtle horizontal scanline. Pure CSS animation.
 */
export function AtmosphericBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-surface"
    >
      <div className="absolute inset-0 grid-backdrop opacity-60" />

      <div className="ambient-glow glow-purple -top-[15%] -left-[10%]" />
      <div className="ambient-glow glow-azure top-[25%] -right-[15%]" />
      <div className="ambient-glow glow-magenta -bottom-[20%] left-[10%]" />

      <div className="scanline top-0" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}
