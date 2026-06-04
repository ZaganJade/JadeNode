/**
 * Decorative SVG circuit/wire network used in the hero. Pure SVG with
 * animated dash-flow and travelling data packets. Replaces external imagery.
 */
export function WireNetwork() {
  // Six nodes laid out across the canvas. Wires are explicit polylines so
  // we can attach travelling packets via CSS offset-path.
  const nodes = [
    { x: 120, y: 240, label: "ID-JKT", tone: "primary" },
    { x: 360, y: 140, label: "ID-SUB", tone: "tertiary" },
    { x: 600, y: 240, label: "CORE", tone: "primary" },
    { x: 840, y: 140, label: "ID-DPS", tone: "tertiary" },
    { x: 1080, y: 260, label: "SG-1", tone: "secondary" },
    { x: 600, y: 420, label: "EDGE", tone: "primary" },
  ];

  // Each wire is described once for both <path> render and CSS offset-path.
  const wires = [
    { d: "M 120 240 L 360 140", flow: "wire-flow", stroke: "#7c3aed" },
    { d: "M 360 140 L 600 240", flow: "wire-flow-fast", stroke: "#89ceff" },
    { d: "M 600 240 L 840 140", flow: "wire-flow", stroke: "#7c3aed" },
    { d: "M 840 140 L 1080 260", flow: "wire-flow-reverse", stroke: "#ffb2b7" },
    { d: "M 600 240 L 600 420", flow: "wire-flow-fast", stroke: "#89ceff" },
    { d: "M 120 240 Q 360 360 600 420", flow: "wire-flow", stroke: "#7c3aed" },
    { d: "M 1080 260 Q 840 360 600 420", flow: "wire-flow-reverse", stroke: "#ffb2b7" },
  ];

  const toneFill: Record<string, string> = {
    primary: "#d2bbff",
    secondary: "#ffb2b7",
    tertiary: "#89ceff",
  };
  const toneGlow: Record<string, string> = {
    primary: "rgba(124, 58, 237, 0.55)",
    secondary: "rgba(181, 0, 54, 0.55)",
    tertiary: "rgba(0, 109, 156, 0.55)",
  };

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 1200 540"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <radialGradient id="wn-bg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
            <stop offset="40%" stopColor="#006d9c" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#050505" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="wn-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d2bbff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#89ceff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffb2b7" stopOpacity="0.55" />
          </linearGradient>

          <filter id="wn-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <pattern
            id="wn-grid"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="1200" height="540" fill="url(#wn-bg)" />
        <rect width="1200" height="540" fill="url(#wn-grid)" opacity="0.4" />

        {/* Wires (base + animated dash) */}
        <g className="wire-stroke">
          {wires.map((w, i) => (
            <g key={i}>
              <path
                d={w.d}
                stroke={w.stroke}
                strokeOpacity={0.18}
                strokeWidth={1.25}
                className="wire-pulse"
              />
              <path
                d={w.d}
                stroke="url(#wn-stroke)"
                strokeOpacity={0.85}
                strokeWidth={1.25}
                className={w.flow}
                filter="url(#wn-glow)"
              />
            </g>
          ))}
        </g>

        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.label} transform={`translate(${n.x} ${n.y})`}>
            <circle r={18} fill={toneGlow[n.tone]} opacity={0.4} />
            <circle r={10} fill="#0a0e14" stroke={toneFill[n.tone]} strokeWidth={1.25} />
            <circle r={3.5} fill={toneFill[n.tone]} className="pulse-dot" />
            <text
              x={0}
              y={32}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize={10}
              letterSpacing={2}
              fill="#dfe2eb"
              opacity={0.7}
              style={{ textTransform: "uppercase" }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Travelling data packets — each follows one wire via offset-path */}
      <div className="pointer-events-none absolute inset-0 [container-type:size]">
        <Packet path="M 120 240 L 360 140" delay="0s" />
        <Packet path="M 360 140 L 600 240" delay="1.4s" />
        <Packet path="M 600 240 L 840 140" delay="2.6s" />
        <Packet path="M 840 140 L 1080 260" delay="3.6s" />
        <Packet path="M 600 240 L 600 420" delay="4.4s" />
        <Packet path="M 120 240 Q 360 360 600 420" delay="0.6s" />
        <Packet path="M 1080 260 Q 840 360 600 420" delay="2.2s" />
      </div>
    </div>
  );
}

/**
 * Single travelling data packet positioned by `offset-path`. We size it to
 * the parent's coordinate system using a transform, since offset-path uses
 * raw SVG coordinates by default.
 */
function Packet({ path, delay }: { path: string; delay: string }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        // Map SVG viewBox (1200x540) onto the box. Keep aspect via slice.
        // We render the packet sized by its own .packet class.
      }}
    >
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          // The container is sized to the SVG so we use SVG viewBox units.
          containerType: "size",
        }}
      >
        <span
          className="packet absolute"
          style={{
            // viewBox width = 1200, height = 540 — match by using cqi/cqb
            // to keep the path scale relative to the container.
            // We derive percentage by mapping coordinates: use raw px units
            // because offset-path takes them literally; the SVG slices to
            // fill, so the proportion stays consistent.
            offsetPath: `path('${path}')`,
            offsetRotate: "auto",
            transform: "translate(-50%, -50%)",
            animationDelay: delay,
          }}
        />
      </div>
    </div>
  );
}
