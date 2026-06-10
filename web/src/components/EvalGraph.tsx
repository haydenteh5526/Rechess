"use client";

import type { AnalyzedMove } from "@rechess/shared";
import { evalToCp, CLASSIFICATIONS } from "@rechess/shared";

interface EvalGraphProps {
  moves: AnalyzedMove[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function EvalGraph({ moves, currentIndex, onSelect }: EvalGraphProps) {
  if (moves.length === 0) return null;

  const width = 400;
  const height = 80;
  const padding = 4;

  const evals = moves.map((m) => {
    const cp = evalToCp(m.eval);
    return Math.max(-400, Math.min(400, cp));
  });

  const xStep = (width - padding * 2) / Math.max(1, evals.length - 1);

  const toY = (cp: number) => {
    const normalized = (cp + 400) / 800; // 0 to 1
    return height - padding - normalized * (height - padding * 2);
  };

  const points = evals.map((cp, i) => `${padding + i * xStep},${toY(cp)}`).join(" ");
  const midY = toY(0);

  return (
    <div className="bg-panel rounded-lg p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-20 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const idx = Math.round((x / rect.width) * (moves.length - 1));
          onSelect(Math.max(0, Math.min(moves.length - 1, idx)));
        }}
      >
        {/* Center line */}
        <line x1={padding} y1={midY} x2={width - padding} y2={midY} stroke="#8b8784" strokeWidth="0.5" strokeDasharray="2" />

        {/* Fill areas */}
        <polygon
          points={`${padding},${midY} ${points} ${padding + (evals.length - 1) * xStep},${midY}`}
          fill="url(#evalGradient)" opacity="0.3"
        />

        {/* Line */}
        <polyline points={points} fill="none" stroke="#e8e6e3" strokeWidth="1.5" />

        {/* Current position marker */}
        {currentIndex >= 0 && currentIndex < evals.length && (
          <circle
            cx={padding + currentIndex * xStep}
            cy={toY(evals[currentIndex])}
            r="3" fill={CLASSIFICATIONS[moves[currentIndex].classification].color}
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
