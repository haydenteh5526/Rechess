"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { GameImport } from "@/components/GameImport";
import { ChessBoard } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { MoveList } from "@/components/MoveList";
import { EvalGraph } from "@/components/EvalGraph";
import { ReviewSummary } from "@/components/ReviewSummary";
import { useAuth } from "@/hooks/useAuth";
import { StockfishEngine } from "@/lib/engine";
import { analyzeGame, type AnalysisProgress } from "@/lib/analyzer";
import { playMoveSound, playAnalysisChime } from "@/lib/sounds";
import type { GameReview } from "@rechess/shared";
import { createClient } from "@/lib/supabase/client";
import { Share2, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, RefreshCw } from "lucide-react";

export default function ReviewPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [review, setReview] = useState<GameReview | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [navLastMove, setNavLastMove] = useState<{ from: string; to: string } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const engineRef = useRef<StockfishEngine | null>(null);

  useEffect(() => {
    return () => engineRef.current?.destroy();
  }, []);

  if (authLoading) return null;
  // if (!user) return <AuthGate onSignIn={signIn} />;

  const handleImport = async (pgn: string) => {
    setAnalyzing(true);
    setProgress(null);
    try {
      if (!engineRef.current) {
        engineRef.current = new StockfishEngine();
        await engineRef.current.init();
      }
      const result = await analyzeGame(pgn, engineRef.current, setProgress);
      setReview(result);
      setCurrentIndex(0);
      playAnalysisChime();
    } catch (e) {
      alert("Analysis failed: " + (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!review || !user) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("game_reviews").insert({
      user_id: user.id,
      pgn: review.pgn,
      moves: JSON.stringify(review.moves),
      white_accuracy: review.whiteAccuracy,
      black_accuracy: review.blackAccuracy,
      opening: review.opening,
      eco: review.eco,
    }).select("id").single();

    if (error) { alert("Save failed"); return; }
    const url = `${window.location.origin}/review/${data.id}`;
    await navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const navigate = (dir: -1 | 1) => {
    if (!review) return;
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next >= 0 && next < review.moves.length) {
        playMoveSound();
        if (dir === 1) {
          const move = review.moves[next];
          setNavLastMove({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4) });
        } else {
          const move = review.moves[prev];
          setNavLastMove({ from: move.uci.slice(2, 4), to: move.uci.slice(0, 2) });
        }
        return next;
      }
      return prev;
    });
  };

  const goToStart = () => { if (review) { setNavLastMove(null); setCurrentIndex(0); playMoveSound(); } };
  const goToEnd = () => {
    if (review) {
      const move = review.moves[review.moves.length - 1];
      setNavLastMove({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4) });
      setCurrentIndex(review.moves.length - 1);
      playMoveSound();
    }
  };

  // Keyboard: Left=back, Right=forward, Down=start, Up=end
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!review) return;
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => {
          if (prev > 0) {
            playMoveSound();
            // Animate piece backwards: from "to" back to "from"
            const move = review.moves[prev];
            setNavLastMove({ from: move.uci.slice(2, 4), to: move.uci.slice(0, 2) });
            return prev - 1;
          }
          return prev;
        });
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => {
          if (prev < review.moves.length - 1) {
            playMoveSound();
            const move = review.moves[prev + 1];
            setNavLastMove({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4) });
            return prev + 1;
          }
          return prev;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const move = review.moves[review.moves.length - 1];
        setNavLastMove({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4) });
        setCurrentIndex(review.moves.length - 1);
        playMoveSound();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setNavLastMove(null);
        setCurrentIndex(0);
        playMoveSound();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [review]);

  const currentMove = review && currentIndex >= 0 ? review.moves[currentIndex] : null;

  if (!review) {
    return (
      <>
        <Navigation />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] px-4">
          {analyzing && progress ? (
            <div className="text-center space-y-4">
              <div className="text-xl font-semibold">Analyzing game...</div>
              <div className="text-muted">Move {progress.current} of {progress.total}</div>
              <div className="w-80 h-2 bg-panel rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            </div>
          ) : (
            <GameImport onImport={handleImport} loading={analyzing} />
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-48px)] overflow-hidden">
        {/* Board + Eval bar together */}
        <div className="flex items-center justify-center flex-1 p-3">
          <div className="flex flex-col items-center gap-2 h-full max-h-[calc(100vh-80px)] justify-center">
            <div className="flex gap-1 items-center h-[calc(100%-40px)]">
              {/* Eval Bar flush left of board */}
              <EvalBar eval_={currentMove?.eval ?? null} flipped={flipped} />
              <div className="aspect-square h-full max-w-[calc(100vh-120px)]">
                <ChessBoard
                  fen={currentMove?.fen ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
                  flipped={flipped}
                  highlightSquare={currentMove?.uci.slice(2, 4)}
                  classification={currentMove?.classification}
                  lastMove={navLastMove ?? (currentMove ? { from: currentMove.uci.slice(0, 2), to: currentMove.uci.slice(2, 4) } : undefined)}
                  bestMoveArrow={currentMove?.eval.bestMove ? {
                    from: currentMove.eval.bestMove.slice(0, 2),
                    to: currentMove.eval.bestMove.slice(2, 4),
                  } : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-3 p-3 border-t lg:border-t-0 lg:border-l border-white/5 overflow-y-auto">
          {/* Opening + Share */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{review.opening} <span className="text-muted">({review.eco})</span></span>
            {user && (
              <button onClick={handleShare} className="flex items-center gap-1 text-xs text-accent hover:text-text transition-colors">
                <Share2 size={13} /> Share
              </button>
            )}
          </div>

          {/* Move list */}
          <MoveList
            moves={review.moves}
            currentIndex={currentIndex}
            onSelect={(i) => {
              const move = review.moves[i];
              setNavLastMove(i > currentIndex
                ? { from: move.uci.slice(0, 2), to: move.uci.slice(2, 4) }
                : { from: move.uci.slice(2, 4), to: move.uci.slice(0, 2) });
              setCurrentIndex(i);
              playMoveSound();
            }}
          />

          {/* Move navigation controls */}
          <div className="w-full px-3 py-2 bg-[#20211D] flex items-center justify-center gap-0.5 text-[#C3C3C0] border-t border-white/5">
            <button onClick={goToStart} className="hover:text-white p-1.5 hover:bg-[#32302E] rounded disabled:opacity-30" disabled={currentIndex <= 0} title="First move">
              <ChevronFirst size={18} />
            </button>
            <button onClick={() => navigate(-1)} className="hover:text-white p-1.5 hover:bg-[#32302E] rounded disabled:opacity-30" disabled={currentIndex <= 0} title="Previous">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => navigate(1)} className="hover:text-white p-1.5 hover:bg-[#32302E] rounded disabled:opacity-30" disabled={currentIndex >= review.moves.length - 1} title="Next">
              <ChevronRight size={18} />
            </button>
            <button onClick={goToEnd} className="hover:text-white p-1.5 hover:bg-[#32302E] rounded disabled:opacity-30" disabled={currentIndex >= review.moves.length - 1} title="Last move">
              <ChevronLast size={18} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1.5" />
            <button onClick={() => setFlipped((f) => !f)} className="hover:text-white p-1.5 hover:bg-[#32302E] rounded" title="Flip board">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Eval graph */}
          <EvalGraph moves={review.moves} currentIndex={currentIndex} onSelect={setCurrentIndex} />

          {/* Summary */}
          <ReviewSummary moves={review.moves} whiteAccuracy={review.whiteAccuracy} blackAccuracy={review.blackAccuracy} />
        </div>
      </main>
    </>
  );
}
