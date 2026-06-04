"use client";

import { useState } from "react";

interface CodeBlockProps {
  language: string;
  code: string;
  showCopy?: boolean;
}

export function CodeBlock({ language, code, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group overflow-hidden rounded-xl border border-line/80 bg-black/40">
      {/* Top bar — language tag + copy button */}
      <div className="flex items-center justify-between border-b border-line/60 bg-black/30 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
          {language}
        </span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="rounded-md border border-line/60 bg-black/30 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Copy code"
          >
            {copied ? (
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-success">
                <span className="material-symbols-outlined text-[14px]">check</span>
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-muted">
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy
              </span>
            )}
          </button>
        )}
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed text-fg/90">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
