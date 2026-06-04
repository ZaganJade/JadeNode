"use client";

const STEPS = [
  { id: 1, name: "Order", icon: "shopping_cart" },
  { id: 2, name: "Payment", icon: "payments" },
  { id: 3, name: "Provisioning", icon: "settings_suggest" },
  { id: 4, name: "Deployment", icon: "rocket_launch" },
  { id: 5, name: "Management", icon: "dashboard" },
];

export function FlowVisualizer() {
  return (
    <div className="relative py-12">
      {/* Connecting line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/20 via-accent/50 to-accent/20" />

      {/* Step cards */}
      <div className="relative flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className="group relative flex flex-col items-center"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Circle with icon */}
            <div className="relative z-10 mb-3">
              <div className="relative w-16 h-16 rounded-full bg-surface border-2 border-accent/50 flex items-center justify-center transition-all duration-300 group-hover:border-accent group-hover:shadow-lg group-hover:shadow-accent/30">
                <span className="material-symbols-outlined text-accent text-[24px]">
                  {step.icon}
                </span>
                {/* Animated pulse ring */}
                <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-20" />
              </div>
              {/* Step number */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-fg">
                {step.id}
              </div>
            </div>

            {/* Step name */}
            <span className="font-mono text-sm font-semibold text-fg">
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
