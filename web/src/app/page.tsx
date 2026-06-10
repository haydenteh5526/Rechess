"use client";

import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { BarChart3, Puzzle, Zap } from "lucide-react";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="flex flex-col items-center justify-center h-[calc(100vh-48px)] px-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Zap size={24} className="text-accent" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Rechess</h1>
        </div>
        <p className="text-muted text-base mb-10 text-center max-w-sm leading-relaxed">
          Free chess game analysis powered by Stockfish. Get move-by-move classifications and accuracy scores.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
          <Link
            href="/review"
            className="group flex flex-col items-center gap-3 p-6 bg-[#81b64c] rounded-xl hover:bg-[#a3d160] hover:shadow-[0px_0px_34px_0px_rgba(255,255,255,0.2)] transition-all border-b-4 border-[#45743c]"
          >
            <BarChart3 size={28} className="text-white group-hover:scale-110 transition-transform" />
            <span className="font-bold text-white">Game Review</span>
            <span className="text-xs text-white/80 text-center">Import PGN → full analysis</span>
          </Link>
          <Link
            href="/analysis"
            className="group flex flex-col items-center gap-3 p-6 bg-[#454341] rounded-xl hover:bg-[#4d4c49] hover:shadow-[0px_0px_34px_0px_rgba(255,255,255,0.2)] transition-all border-b-4 border-[#302e2b]"
          >
            <Puzzle size={28} className="text-[#bfbbb7] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[#bfbbb7]">Analysis Board</span>
            <span className="text-xs text-[#bfbbb7]/80 text-center">Live engine evaluation</span>
          </Link>
        </div>
        <p className="mt-10 text-[11px] text-muted/60">
          Stockfish 16 WASM · Runs entirely in your browser · No account required
        </p>
      </main>
    </>
  );
}
