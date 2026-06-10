"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Navigation } from "@/components/Navigation";
import { ChessBoard } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useAuth } from "@/hooks/useAuth";
import { StockfishEngine } from "@/lib/engine";
import { playMoveSound, playCaptureSound } from "@/lib/sounds";
import type { EngineEval, BoardTheme } from "@rechess/shared";
import { BOARD_THEMES, detectOpening } from "@rechess/shared";
import { BookOpen, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export default function AnalysisPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [eval_, setEval] = useState<EngineEval | null>(null);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [theme, setTheme] = useState<BoardTheme>(BOARD_THEMES[0]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [undonePositions, setUndonePositions] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState(20);
  const engineRef = useRef<StockfishEngine | null>(null);
  const chessRef = useRef(new Chess());
  const movesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      engineRef.current = new StockfishEngine();
      try {
        await engineRef.current.init();
        engineRef.current.startAnalysis(fen, (ev) => { setEval(ev); setBestMove(ev.bestMove); }, analysisDepth);
      } catch (e) {
        setEngineError((e as Error).message);
      }
    };
    init();
    return () => engineRef.current?.destroy();
  }, []);

  // Auto-scroll move list to bottom
  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moveHistory]);

  // Re-analyze when depth changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.startAnalysis(chessRef.current.fen(), (ev) => { setEval(ev); setBestMove(ev.bestMove); }, analysisDepth);
    }
  }, [analysisDepth]);

  const updateState = (move?: { from: string; to: string }) => {
    setLastMove(move ?? null);
    setMoveHistory(chessRef.current.history());
    const newFen = chessRef.current.fen();
    setFen(newFen);
    engineRef.current?.startAnalysis(newFen, (ev) => { setEval(ev); setBestMove(ev.bestMove); }, analysisDepth);
  };

  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    try {
      const move = chessRef.current.move({ from, to, promotion: promotion as any });
      if (!move) return;
      move.captured ? playCaptureSound() : playMoveSound();
      setLastMove({ from, to });
      setMoveHistory(chessRef.current.history());
      setUndonePositions([]);
      const newFen = chessRef.current.fen();
      setFen(newFen);
      engineRef.current?.startAnalysis(newFen, (ev) => { setEval(ev); setBestMove(ev.bestMove); }, analysisDepth);
    } catch {}
  }, [analysisDepth]);

  const handleReset = () => {
    setUndonePositions(chessRef.current.history());
    chessRef.current.reset();
    updateState();
  };

  const handleUndo = () => {
    const move = chessRef.current.undo();
    if (move) {
      setUndonePositions((prev) => [move.san, ...prev]);
      playMoveSound();
      updateState({ from: move.to, to: move.from });
    }
  };

  const handleRedo = () => {
    if (undonePositions.length === 0) return;
    const [nextMove, ...rest] = undonePositions;
    try {
      const result = chessRef.current.move(nextMove);
      if (result) {
        setUndonePositions(rest);
        playMoveSound();
        updateState({ from: result.from, to: result.to });
      }
    } catch {}
  };

  const handleGoToLatest = () => {
    let remaining = [...undonePositions];
    let lastResult: { from: string; to: string } | undefined;
    while (remaining.length > 0) {
      const [nextMove, ...rest] = remaining;
      try {
        const result = chessRef.current.move(nextMove);
        if (result) lastResult = { from: result.from, to: result.to };
        remaining = rest;
      } catch { break; }
    }
    setUndonePositions([]);
    playMoveSound();
    updateState(lastResult);
  };

  // Navigate to a specific move index in the allMoves list
  const goToMoveIndex = (targetIdx: number) => {
    chessRef.current.reset();
    const all = [...moveHistory, ...undonePositions];
    for (let i = 0; i <= targetIdx && i < all.length; i++) {
      chessRef.current.move(all[i]);
    }
    const played = all.slice(0, targetIdx + 1);
    const undone = all.slice(targetIdx + 1);
    setMoveHistory(played);
    setUndonePositions(undone);
    playMoveSound();
    const lastPlayed = chessRef.current.history({ verbose: true }).at(-1);
    updateState(lastPlayed ? { from: lastPlayed.from, to: lastPlayed.to } : undefined);
  };

  // Keyboard: Left=undo, Right=redo, Up=go to latest, Down=reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleUndo();
      else if (e.key === "ArrowRight") handleRedo();
      else if (e.key === "ArrowUp") { e.preventDefault(); handleGoToLatest(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); handleReset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (authLoading) {
    return (<><Navigation /><div className="flex items-center justify-center min-h-[calc(100vh-48px)]"><p className="text-muted">Loading...</p></div></>);
  }

  const cpDisplay = eval_?.mate != null
    ? `M${Math.abs(eval_.mate)}`
    : eval_?.cp != null
      ? `${eval_.cp >= 0 ? "+" : ""}${(eval_.cp / 100).toFixed(1)}`
      : "0.0";

  const opening = detectOpening(moveHistory);

  // Current move index in history (accounting for undone moves)
  const currentMoveIdx = moveHistory.length - 1;

  // Build move pairs for display
  const pairs: [string, string | undefined][] = [];
  const allMoves = [...moveHistory, ...undonePositions];
  for (let i = 0; i < allMoves.length; i += 2) {
    pairs.push([allMoves[i], allMoves[i + 1]]);
  }

  return (
    <>
      <Navigation />
      <main className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-48px)] overflow-hidden">
        {/* Board + Eval bar */}
        <div className="flex items-center justify-center flex-1 p-3">
          <div className="flex gap-1 h-full max-h-[calc(100vh-80px)] items-center">
            <EvalBar eval_={eval_} flipped={flipped} />
            <div className="aspect-square h-full max-w-[calc(100vh-80px)]">
              <ChessBoard
                fen={fen}
                interactive
                flipped={flipped}
                theme={theme}
                onMove={handleMove}
                lastMove={lastMove ?? undefined}
                bestMoveArrow={bestMove ? { from: bestMove.slice(0, 2), to: bestMove.slice(2, 4) } : undefined}
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l border-white/5 bg-[rgba(0,0,0,0.1)] lg:h-full">
          {/* Engine eval header */}
          <div className="px-4 py-3 border-b border-white/5 bg-[#1E1F1B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-[#C3C3C0] uppercase tracking-wide font-medium">Stockfish 16</span>
              </div>
              <span className="text-lg font-bold font-mono text-white">{cpDisplay}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-[#C3C3C0]/50">Depth {eval_?.depth ?? 0}/{analysisDepth}</span>
              <div className="flex gap-0.5">
                {[
                  { label: "12", value: 12 },
                  { label: "18", value: 18 },
                  { label: "20", value: 20 },
                  { label: "24", value: 24 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnalysisDepth(opt.value)}
                    className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                      analysisDepth === opt.value
                        ? "bg-[#81b64c] text-[#262421]"
                        : "bg-[#32302E] text-[#C3C3C0] hover:bg-[#3a3835]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {eval_?.pv && eval_.pv.length > 0 && (() => {
              // Convert UCI moves to SAN for display
              const pvChess = new Chess(fen);
              const pvSan: { san: string; uci: string }[] = [];
              for (const uci of eval_.pv.slice(0, 8)) {
                try {
                  const from = uci.slice(0, 2);
                  const to = uci.slice(2, 4);
                  const promo = uci[4];
                  const m = pvChess.move({ from, to, promotion: promo });
                  if (m) pvSan.push({ san: m.san, uci });
                  else break;
                } catch { break; }
              }
              const playPvUpTo = (idx: number) => {
                // Play PV moves on the real board
                for (let i = 0; i <= idx; i++) {
                  const uci = pvSan[i].uci;
                  const result = chessRef.current.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
                  if (!result) break;
                }
                setUndonePositions([]);
                playMoveSound();
                const last = chessRef.current.history({ verbose: true }).at(-1);
                updateState(last ? { from: last.from, to: last.to } : undefined);
              };
              return (
                <div className="flex flex-wrap gap-x-0.5 gap-y-0.5 mt-2">
                  {pvSan.map((m, i) => (
                    <span
                      key={i}
                      onClick={() => playPvUpTo(i)}
                      className="text-[11px] text-[#81b64c] hover:text-white cursor-pointer hover:bg-[#32302E] px-1 py-0.5 rounded font-mono transition-colors"
                    >
                      {m.san}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Opening */}
          {opening && (
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-[#2B2927]">
              <BookOpen size={13} className="text-[#a88b65] shrink-0" />
              <span className="text-sm text-[#C3C3C0] font-medium">{opening.name}</span>
              <span className="text-[10px] text-[#C3C3C0]/40 ml-auto">{opening.eco}</span>
            </div>
          )}

          {/* Move list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {pairs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#C3C3C0]/30 text-sm">
                Play moves to see them here
              </div>
            ) : (
              <div className="text-[13px]">
                {pairs.map(([white, black], idx) => {
                  const wIdx = idx * 2;
                  const bIdx = idx * 2 + 1;
                  const isWhiteCurrent = wIdx === currentMoveIdx;
                  const isBlackCurrent = bIdx === currentMoveIdx;
                  const isWhiteUndone = wIdx > currentMoveIdx;
                  const isBlackUndone = bIdx > currentMoveIdx;

                  return (
                    <div
                      key={idx}
                      className={`w-full flex items-stretch ${idx % 2 !== 0 ? "bg-[#2B2927]" : "bg-[#262421]"}`}
                    >
                      <span className="text-[#C3C3C0]/50 w-9 shrink-0 flex items-center justify-end pr-2 py-1.5 text-xs">
                        {idx + 1}.
                      </span>
                      <div
                        onClick={() => goToMoveIndex(wIdx)}
                        className={`flex-1 flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#3a3835] ${
                          isWhiteCurrent ? "bg-[#484644] rounded-sm border-b-[2px] border-b-[#5A5858]" : ""
                        } ${isWhiteUndone ? "opacity-40" : ""}`}
                      >
                        <span className="text-[#C3C3C0] font-bold">{white}</span>
                      </div>
                      <div
                        onClick={() => black ? goToMoveIndex(bIdx) : undefined}
                        className={`flex-1 flex items-center px-2 py-1.5 cursor-pointer hover:bg-[#3a3835] ${
                          isBlackCurrent ? "bg-[#484644] rounded-sm border-b-[2px] border-b-[#5A5858]" : ""
                        } ${isBlackUndone ? "opacity-40" : ""}`}
                      >
                        {black && <span className="text-[#C3C3C0] font-bold">{black}</span>}
                      </div>
                    </div>
                  );
                })}
                <div ref={movesEndRef} />
              </div>
            )}
          </div>

          {/* Navigation controls bar */}
          <div className="w-full px-3 py-2 bg-[#20211D] flex items-center justify-between border-t border-white/5">
            <div className="flex gap-0.5 text-[#C3C3C0]">
              <button
                onClick={handleReset}
                disabled={moveHistory.length === 0}
                className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded"
                title="Go to start"
              >
                <ChevronFirst size={18} />
              </button>
              <button
                onClick={handleUndo}
                disabled={moveHistory.length === 0}
                className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded"
                title="Back"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleRedo}
                disabled={undonePositions.length === 0}
                className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded"
                title="Forward"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={handleGoToLatest}
                disabled={undonePositions.length === 0}
                className="hover:text-white disabled:opacity-30 p-1.5 hover:bg-[#32302E] rounded"
                title="Go to end"
              >
                <ChevronLast size={18} />
              </button>
              <div className="w-px bg-white/10 mx-1.5" />
              <button
                onClick={() => setFlipped((f) => !f)}
                className="hover:text-white p-1.5 hover:bg-[#32302E] rounded"
                title="Flip board"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <ThemeSelector current={theme} onChange={setTheme} />
          </div>
        </div>
      </main>
    </>
  );
}
