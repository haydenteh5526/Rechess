"use client";

import { useRef, useEffect } from "react";
import type { AnalyzedMove } from "@rechess/shared";
import { CLASSIFICATIONS } from "@rechess/shared";

interface MoveListProps {
  moves: AnalyzedMove[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function MoveList({ moves, currentIndex, onSelect }: MoveListProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIndex]);

  const pairs: [AnalyzedMove, AnalyzedMove | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="overflow-y-auto flex-1 min-h-0 text-[#C3C3C0] text-sm">
      {pairs.map(([white, black], pairIdx) => {
        const wIdx = pairIdx * 2;
        const bIdx = pairIdx * 2 + 1;
        const isActiveRow = currentIndex === wIdx || currentIndex === bIdx;

        return (
          <div
            key={pairIdx}
            ref={isActiveRow ? activeRef : undefined}
            className={`w-full py-px px-4 font-bold flex items-stretch ${pairIdx % 2 !== 0 ? "bg-[#2B2927]" : ""}`}
          >
            <span className="text-[#C3C3C0] px-2 py-1.5 w-10 shrink-0">{pairIdx + 1}.</span>
            <MoveCell move={white} index={wIdx} isActive={currentIndex === wIdx} onSelect={onSelect} />
            {black ? (
              <MoveCell move={black} index={bIdx} isActive={currentIndex === bIdx} onSelect={onSelect} />
            ) : (
              <div className="flex-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MoveCell({
  move,
  index,
  isActive,
  onSelect,
}: {
  move: AnalyzedMove;
  index: number;
  isActive: boolean;
  onSelect: (i: number) => void;
}) {
  const meta = CLASSIFICATIONS[move.classification];

  return (
    <div
      className={`flex-1 cursor-pointer flex items-center pl-2 py-1 ${
        isActive ? "bg-[#484644] rounded border-b-[#5A5858] border-b-[3px]" : ""
      }`}
      onClick={() => onSelect(index)}
    >
      <span className="text-[#C3C3C0]">{move.san}</span>
      {move.classification !== "book" && (
        <span style={{ color: meta.color }} className="ml-1 text-[11px]">
          {meta.symbol}
        </span>
      )}
    </div>
  );
}
