"use client";

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  details: string[];
  icon: string;
}

export function StepCard({ step, title, description, details, icon }: StepCardProps) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface/40 p-6 hover:border-accent/30 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-accent text-[24px]">
            {icon}
          </span>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-fg mb-1">
            {step}. {title}
          </h3>
          <p className="text-fg-muted text-sm">{description}</p>
        </div>
      </div>

      <ul className="space-y-2 ml-16">
        {details.map((detail, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-fg-muted">
            <span className="material-symbols-outlined text-accent text-[16px]">
              arrow_right
            </span>
            {detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
