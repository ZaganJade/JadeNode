"use client";

import { useEffect, useState, useRef } from "react";

interface TypingLine {
  text: string;
  delay: number;
  indent?: number;
  className?: string;
}

const TERMINAL_LINES: TypingLine[] = [
  { text: "$ curl -X POST https://api.jadenode.id/v1/orders \\", delay: 0 },
  { text: '  -H "Authorization: Bearer $JN_TOKEN" \\', delay: 800, indent: 1 },
  { text: '  -H "Idempotency-Key: $(uuidgen)" \\', delay: 1600, indent: 1 },
  { text: "  -D '{\\", delay: 2400, indent: 1 },
  { text: '    "listing_id": "01HVQ2W7H6Y4...JKT",', delay: 3200, indent: 2, className: "text-accent" },
  { text: '    "billing_cycle": "monthly"', delay: 4000, indent: 2, className: "text-accent" },
  { text: "  }'", delay: 4800, indent: 1 },
  { text: "", delay: 5200 }, // Empty line
  { text: "# Response · 201 Created", delay: 5400, indent: 0, className: "text-fg-dim" },
  { text: '{"order_id":"01HZ...ABC","status":"pending_payment"}', delay: 6000, indent: 0, className: "text-success" },
];

export function TypingTerminal() {
  const [lines, setLines] = useState<Array<{ text: string; complete: boolean; className?: string; indent: number }>>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentLineIndex >= TERMINAL_LINES.length) {
      setIsTyping(false);
      return;
    }

    const line = TERMINAL_LINES[currentLineIndex];

    // Delay before starting this line
    const delayTimeout = setTimeout(() => {
      if (line.text === "") {
        // Empty line - just add it and move on
        setLines((prev) => [...prev, { text: "", complete: true, indent: line.indent || 0 }]);
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentText("");
        return;
      }

      let charIndex = 0;
      const typingSpeed = 30; // ms per character

      const typeInterval = setInterval(() => {
        if (charIndex < line.text.length) {
          setCurrentText((prev) => prev + line.text[charIndex]);
          charIndex++;
        } else {
          clearInterval(typeInterval);
          // Line complete - add it to the list
          setLines((prev) => [...prev, {
            text: line.text,
            complete: true,
            className: line.className,
            indent: line.indent || 0
          }]);
          setCurrentLineIndex((prev) => prev + 1);
          setCurrentText("");
        }
      }, typingSpeed);

      return () => clearInterval(typeInterval);
    }, line.delay - (currentLineIndex > 0 ? TERMINAL_LINES[currentLineIndex - 1].delay : 0));

    return () => clearTimeout(delayTimeout);
  }, [currentLineIndex]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, currentText]);

  return (
    <div className="bg-bg p-5 font-mono text-[11px] leading-relaxed">
      <div ref={containerRef} className="text-fg/90 overflow-x-auto max-h-[280px]">
        {lines.map((line, index) => (
          <div key={index} className="flex" style={{ marginLeft: `${line.indent * 16}px` }}>
            {line.text === "" ? (
              <span>&nbsp;</span>
            ) : (
              <span className={line.className || ""}>{line.text}</span>
            )}
          </div>
        ))}
        {isTyping && currentText && (
          <div className="flex" style={{ marginLeft: `${TERMINAL_LINES[currentLineIndex]?.indent || 0 * 16}px` }}>
            <span className={TERMINAL_LINES[currentLineIndex]?.className || ""}>
              {currentText}
            </span>
            <span className="caret">▋</span>
          </div>
        )}
      </div>
    </div>
  );
}
