"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/shared/code-block";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiResponse {
  code: number;
  description: string;
  example: object;
}

interface ApiEndpointProps {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  description: string;
  headers?: Array<{ name: string; value: string; description: string }>;
  params?: Param[];
  requestBody?: object;
  response: ApiResponse;
  errors?: Array<{ code: number; description: string }>;
}

const METHOD_STYLES = {
  GET: { dot: "#6ce8a6", label: "GET" },
  POST: { dot: "#ff7400", label: "POST" },
  PUT: { dot: "#ffb347", label: "PUT" },
  PATCH: { dot: "#f6549e", label: "PATCH" },
  DELETE: { dot: "#ff7a7a", label: "DELETE" },
};

export function ApiEndpoint({
  method,
  endpoint,
  description,
  headers,
  params,
  requestBody,
  response,
  errors,
}: ApiEndpointProps) {
  const [activeTab, setActiveTab] = useState<"request" | "response">("request");
  const style = METHOD_STYLES[method];

  return (
    <article className="studio-card overflow-hidden rounded-2xl border border-line bg-surface/50">
      {/* Method & Endpoint header (terminal style) */}
      <div className="flex items-center justify-between gap-4 border-b border-line/80 bg-black/40 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: style.dot, boxShadow: `0 0 8px 1px ${style.dot}` }}
            />
          </span>
          <span className="studio-eyebrow text-[10px] uppercase text-fg-muted">
            API Endpoint
          </span>
        </div>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: style.dot }}
        >
          {style.label}
        </span>
      </div>

      {/* Endpoint path */}
      <div className="border-b border-line/60 bg-black/30 px-5 py-4">
        <code className="font-mono text-[13px] text-fg">{endpoint}</code>
      </div>

      {/* Description */}
      <div className="px-6 py-4 border-b border-line/60">
        <p className="text-[14px] leading-relaxed text-fg-muted">{description}</p>
      </div>

      {/* Headers */}
      {headers && headers.length > 0 && (
        <div className="px-6 py-5 border-b border-line/60">
          <h4 className="studio-eyebrow text-[10px] uppercase text-fg-dim mb-3">
            Headers
          </h4>
          <div className="space-y-2">
            {headers.map((header, i) => (
              <div
                key={i}
                className="grid grid-cols-[140px_1fr] gap-3 rounded-lg border border-line/60 bg-black/20 px-3 py-2"
              >
                <span className="font-mono text-[12px] text-accent">{header.name}</span>
                <div className="font-mono text-[12px] text-fg-muted">
                  <span className="text-fg">{header.value}</span>
                  <span className="text-fg-dim"> — {header.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parameters */}
      {params && params.length > 0 && (
        <div className="px-6 py-5 border-b border-line/60">
          <h4 className="studio-eyebrow text-[10px] uppercase text-fg-dim mb-3">
            Parameters
          </h4>
          <div className="space-y-2">
            {params.map((param, i) => (
              <div
                key={i}
                className="grid grid-cols-[140px_80px_60px_1fr] gap-3 rounded-lg border border-line/60 bg-black/20 px-3 py-2"
              >
                <span className="font-mono text-[12px] text-accent">{param.name}</span>
                <span className="font-mono text-[12px] text-fg">{param.type}</span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                    param.required ? "text-accent" : "text-fg-dim"
                  }`}
                >
                  {param.required ? "Required" : "Optional"}
                </span>
                <span className="text-[12px] text-fg-muted">{param.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request/Response Tabs */}
      <div className="border-b border-line/60 bg-black/30">
        <div className="flex">
          {(["request", "response"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-[12px] font-mono uppercase tracking-[0.18em] transition-colors ${
                activeTab === tab
                  ? "text-accent border-b-2 border-accent"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-5">
        {activeTab === "request" && requestBody && (
          <CodeBlock language="json" code={JSON.stringify(requestBody, null, 2)} />
        )}
        {activeTab === "request" && !requestBody && (
          <p className="font-mono text-[12px] text-fg-dim">No request body.</p>
        )}
        {activeTab === "response" && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                style={{
                  color: style.dot,
                  borderColor: style.dot,
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                {response.code} {response.description}
              </span>
            </div>
            <CodeBlock
              language="json"
              code={JSON.stringify(response.example, null, 2)}
            />
          </div>
        )}
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="px-6 py-5 border-t border-line/60">
          <h4 className="studio-eyebrow text-[10px] uppercase text-fg-dim mb-3">
            Error responses
          </h4>
          <div className="space-y-2">
            {errors.map((error, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-line/60 bg-black/20 px-3 py-2"
              >
                <span className="shrink-0 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-red-400">
                  {error.code}
                </span>
                <span className="text-[12px] text-fg-muted">{error.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
