/**
 * Network globe — pure SVG. A great-circle of dots, two animated rings,
 * 7 region nodes, animated wires connecting them, and travelling data
 * packets along each wire via SMIL <animateMotion>.
 *
 * Packets are SVG elements inside the same coordinate system as the wires,
 * so they stay perfectly aligned regardless of container size.
 */
export function NetworkGlobe() {
  // 7 regions positioned around a 600x600 viewBox.
  const nodes = [
    { x: 300, y: 110, label: "ID-JKT" },
    { x: 460, y: 200, label: "ID-SUB" },
    { x: 470, y: 360, label: "ID-DPS" },
    { x: 305, y: 470, label: "SG-1" },
    { x: 130, y: 380, label: "MY-KUL" },
    { x: 110, y: 220, label: "VN-HCM" },
    { x: 300, y: 300, label: "CORE" },
  ];

  // Each wire goes through CORE (the centre node). The id is reused by
  // <animateMotion><mpath> so the packet rides exactly the same curve.
  const wires = [
    { id: "wire-jkt",  d: "M 300 110 Q 320 200 300 300", flow: "wire-flow",         stroke: "#c6f24a", dur: "5.5s", begin: "0s"   },
    { id: "wire-sub",  d: "M 460 200 Q 380 240 300 300", flow: "wire-flow-fast",    stroke: "#c6f24a", dur: "5s",   begin: "0.7s" },
    { id: "wire-dps",  d: "M 470 360 Q 380 340 300 300", flow: "wire-flow-reverse", stroke: "#7a96b1", dur: "6s",   begin: "1.4s" },
    { id: "wire-sg",   d: "M 305 470 Q 300 390 300 300", flow: "wire-flow",         stroke: "#7a96b1", dur: "5.5s", begin: "2.1s" },
    { id: "wire-kul",  d: "M 130 380 Q 220 340 300 300", flow: "wire-flow-fast",    stroke: "#c6f24a", dur: "5s",   begin: "2.8s" },
    { id: "wire-hcm",  d: "M 110 220 Q 220 260 300 300", flow: "wire-flow-reverse", stroke: "#f6549e", dur: "6s",   begin: "3.5s" },
  ];

  // Construct a great-circle dot ring (40 dots).
  const ringDots = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const r = 220;
    return { x: 300 + Math.cos(angle) * r, y: 300 + Math.sin(angle) * r };
  });

  return (
    <div className="relative aspect-square w-full max-w-[640px]">
      <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="globe-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#171c25" stopOpacity="1" />
            <stop offset="60%" stopColor="#0c0f15" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#06080c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="globe-stroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#c6f24a" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#7a96b1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f6549e" stopOpacity="0.6" />
          </linearGradient>

          {/* Glow used by both wires and packets */}
          <filter id="globe-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Stronger glow for the travelling packets */}
          <filter
            id="packet-glow"
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur stdDeviation="3" result="b1" />
            <feGaussianBlur stdDeviation="6" in="SourceGraphic" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Each wire is registered once here so <mpath> can reference it */}
          {wires.map((w) => (
            <path key={w.id} id={w.id} d={w.d} />
          ))}
        </defs>

        {/* Disc */}
        <circle cx="300" cy="300" r="240" fill="url(#globe-bg)" />

        {/* Outer rotating ring (slow) */}
        <g
          className="globe-rotate-slow"
          style={{ transformOrigin: "300px 300px" }}
        >
          <circle
            cx="300"
            cy="300"
            r="260"
            fill="none"
            stroke="#1f2630"
            strokeWidth="1"
            strokeDasharray="2 8"
          />
        </g>

        {/* Inner rotating ring (fast, opposite direction) */}
        <g
          className="globe-rotate-fast"
          style={{
            transformOrigin: "300px 300px",
            animationDirection: "reverse",
          }}
        >
          <circle
            cx="300"
            cy="300"
            r="180"
            fill="none"
            stroke="#1f2630"
            strokeWidth="1"
            strokeDasharray="1 5"
          />
        </g>

        {/* Static dot ring (great circle) */}
        <g>
          {ringDots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="1.4" fill="#2a3340" />
          ))}
        </g>

        {/* Latitude lines */}
        <g stroke="#1f2630" strokeWidth="1" fill="none">
          <ellipse cx="300" cy="300" rx="220" ry="60" />
          <ellipse cx="300" cy="300" rx="220" ry="120" />
          <ellipse cx="300" cy="300" rx="220" ry="180" />
        </g>

        {/* Wires (rendered, not just defined) */}
        <g className="wire-stroke">
          {wires.map((w) => (
            <g key={w.id}>
              {/* Base trace (low opacity, pulses) */}
              <path
                d={w.d}
                stroke={w.stroke}
                strokeOpacity="0.18"
                strokeWidth="1.25"
                fill="none"
                className="wire-pulse"
              />
              {/* Animated dash overlay */}
              <path
                d={w.d}
                stroke="url(#globe-stroke)"
                strokeOpacity="0.85"
                strokeWidth="1.25"
                fill="none"
                className={w.flow}
                filter="url(#globe-glow)"
              />
            </g>
          ))}
        </g>

        {/* Travelling packets — SVG circles riding the same paths */}
        <g filter="url(#packet-glow)">
          {wires.map((w) => (
            <circle
              key={`pk-${w.id}`}
              r="3.5"
              fill="#c6f24a"
              opacity="0"
            >
              {/* Fade in/out around the journey */}
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.9;1"
                dur={w.dur}
                begin={w.begin}
                repeatCount="indefinite"
              />
              <animateMotion
                dur={w.dur}
                begin={w.begin}
                repeatCount="indefinite"
                rotate="auto"
                calcMode="spline"
                keySplines="0.16 1 0.3 1"
                keyTimes="0;1"
              >
                <mpath href={`#${w.id}`} />
              </animateMotion>
            </circle>
          ))}
        </g>

        {/* Nodes (rendered last so they sit above wires + packets) */}
        {nodes.map((n, i) => {
          const isCore = n.label === "CORE";
          return (
            <g key={n.label} transform={`translate(${n.x} ${n.y})`}>
              <circle
                r={isCore ? 22 : 16}
                fill={isCore ? "#c6f24a" : "#7a96b1"}
                opacity="0.18"
              />
              <circle
                r={isCore ? 11 : 7.5}
                fill="#06080c"
                stroke={isCore ? "#c6f24a" : "#dfe2eb"}
                strokeWidth="1.25"
              />
              <circle
                r="3"
                fill={isCore ? "#c6f24a" : "#dfe2eb"}
                className="pulse-dot"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
              {!isCore && (
                <text
                  y="22"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  letterSpacing="2"
                  fill="#9ea0a6"
                >
                  {n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Edge gradient ring overlay for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 60%, rgba(6,8,12,0.7) 90%)",
        }}
      />
    </div>
  );
}
