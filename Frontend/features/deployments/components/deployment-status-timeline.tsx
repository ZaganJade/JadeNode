"use client";

import { cn } from "@/lib/utils";

export type DeploymentState =
  | "pending_provisioning"
  | "provisioning"
  | "active"
  | "stopped"
  | "suspended"
  | "failed"
  | "deleted";

interface TimelineStep {
  state: DeploymentState;
  label: string;
  description?: string;
}

const STEPS: TimelineStep[] = [
  { state: "pending_provisioning", label: "Pending", description: "Menunggu provisioning" },
  { state: "provisioning", label: "Provisioning", description: "Sedang disiapkan" },
  { state: "active", label: "Active", description: "Deployment aktif" },
];

function getStateIndex(state: DeploymentState): number {
  const idx = STEPS.findIndex((s) => s.state === state);
  if (idx >= 0) return idx;
  // failed can happen at pending or provisioning
  if (state === "failed") return 1;
  // stopped/suspended are post-active
  if (state === "stopped" || state === "suspended") return 2;
  return 0;
}

function isFailureState(state: DeploymentState): boolean {
  return state === "failed";
}

interface DeploymentStatusTimelineProps {
  currentState: DeploymentState;
  /** ISO timestamps for each state transition */
  timestamps?: Partial<Record<DeploymentState, string | null>>;
  className?: string;
}

function formatTimelineDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function DeploymentStatusTimeline({
  currentState,
  timestamps,
  className,
}: DeploymentStatusTimelineProps) {
  const activeIdx = getStateIndex(currentState);
  const failed = isFailureState(currentState);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]",
        className,
      )}
    >
      <h3 className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
        Status Timeline
      </h3>

      <div className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isPending = idx > activeIdx;
          const ts = timestamps?.[step.state];
          const isFailedStep = failed && isCurrent;

          return (
            <div key={step.state} className="flex flex-1 items-start">
              {/* Dot + content */}
              <div className="flex flex-col items-center flex-1">
                {/* Dot */}
                <div className="relative flex items-center justify-center">
                  {isCompleted && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#4be277] bg-[#4be277]/15">
                      <svg
                        className="h-4 w-4 text-[#4be277]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}

                  {isCurrent && !isFailedStep && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFBF00] bg-[#FFBF00]/20 shadow-[0_0_16px_rgba(255,191,0,0.3)]">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FFBF00]" />
                    </div>
                  )}

                  {isFailedStep && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ffb5ab] bg-[#ffb5ab]/15">
                      <svg
                        className="h-4 w-4 text-[#ffb5ab]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[rgba(255,191,0,0.15)] bg-transparent">
                      <div className="h-2 w-2 rounded-full bg-[rgba(255,191,0,0.15)]" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <p
                  className={cn(
                    "mt-2 text-xs font-medium text-center",
                    isCompleted && "text-[#4be277]",
                    isCurrent && !isFailedStep && "text-[#FFBF00]",
                    isFailedStep && "text-[#ffb5ab]",
                    isPending && "text-[#F5F5F0]/30",
                  )}
                >
                  {step.label}
                </p>

                {/* Description */}
                <p
                  className={cn(
                    "mt-0.5 text-[10px] text-center",
                    isCompleted && "text-[#4be277]/50",
                    isCurrent && !isFailedStep && "text-[#FFBF00]/50",
                    isFailedStep && "text-[#ffb5ab]/50",
                    isPending && "text-[#F5F5F0]/20",
                  )}
                >
                  {isFailedStep ? "Gagal" : step.description}
                </p>

                {/* Timestamp */}
                {ts && (
                  <p className="mt-1 text-[10px] font-mono text-[#F5F5F0]/30 text-center">
                    {formatTimelineDate(ts)}
                  </p>
                )}
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 flex items-center mt-4 -mx-2">
                  <div
                    className={cn(
                      "h-px w-full",
                      idx < activeIdx
                        ? "bg-[#4be277]/40"
                        : "bg-[rgba(255,191,0,0.1)]",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
