"use client";

import { motion } from "framer-motion";
import type { EngineEval } from "@rechess/shared";
import { evalToCp } from "@rechess/shared";

interface EvalBarProps {
  eval_: EngineEval | null;
  flipped?: boolean;
}

export function EvalBar({ eval_, flipped }: EvalBarProps) {
  const cp = eval_ ? evalToCp(eval_) : 15;
  const whitePercent = Math.min(95, Math.max(5, 50 + cp / 20));
  const displayPercent = flipped ? 100 - whitePercent : whitePercent;

  const label = eval_?.mate != null
    ? `M${Math.abs(eval_.mate)}`
    : `${Math.abs(cp / 100).toFixed(1)}`;

  return (
    <div className="relative w-7 h-full rounded-[3px] overflow-hidden flex-shrink-0 shadow-md">
      {/* Black section (top) */}
      <motion.div
        className="absolute top-0 left-0 w-full bg-[#403d39]"
        animate={{ height: `${100 - displayPercent}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      />
      {/* White section (bottom) */}
      <motion.div
        className="absolute bottom-0 left-0 w-full bg-[#f0eeec]"
        animate={{ height: `${displayPercent}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      />
      {/* Label */}
      <div className={`absolute inset-x-0 flex items-center justify-center text-[10px] font-bold leading-none ${
        cp >= 0 ? "bottom-1 text-[#403d39]" : "top-1 text-[#f0eeec]"
      }`}>
        {label}
      </div>
    </div>
  );
}
