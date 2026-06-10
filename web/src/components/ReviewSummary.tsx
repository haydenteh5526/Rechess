"use client";

import type { AnalyzedMove, MoveClassification } from "@rechess/shared";
import { CLASSIFICATIONS } from "@rechess/shared";

interface ReviewSummaryProps {
  moves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
}

export function ReviewSummary({ moves, whiteAccuracy, blackAccuracy }: ReviewSummaryProps) {
  return (
    <div className="bg-panel rounded-lg p-4 space-y-4">
      <div className="flex gap-8 justify-center">
        <AccuracyRing label="White" accuracy={whiteAccuracy} />
        <AccuracyRing label="Black" accuracy={blackAccuracy} />
      </div>
      <div className="space-y-2">
        <ClassificationBreakdown moves={moves} color="w" label="White" />
        <ClassificationBreakdown moves={moves} color="b" label="Black" />
      </div>
    </div>
  );
}

function AccuracyRing({ label, accuracy }: { label: string; accuracy: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#333" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius} fill="none"
          stroke="#81b64c" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="44" textAnchor="middle" fill="#e8e6e3" fontSize="14" fontWeight="bold">
          {accuracy.toFixed(1)}
        </text>
      </svg>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

function ClassificationBreakdown({ moves, color, label }: { moves: AnalyzedMove[]; color: "w" | "b"; label: string }) {
  const playerMoves = moves.filter((m) => m.color === color);
  const total = playerMoves.length || 1;

  const counts: Record<MoveClassification, number> = {
    brilliant: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0,
  };
  playerMoves.forEach((m) => counts[m.classification]++);

  const order: MoveClassification[] = ["brilliant", "best", "excellent", "good", "book", "inaccuracy", "mistake", "blunder"];

  return (
    <div>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="flex h-3 rounded overflow-hidden">
        {order.map((cls) => {
          const pct = (counts[cls] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={cls}
              style={{ width: `${pct}%`, backgroundColor: CLASSIFICATIONS[cls].color }}
              title={`${CLASSIFICATIONS[cls].label}: ${counts[cls]}`}
            />
          );
        })}
      </div>
    </div>
  );
}
