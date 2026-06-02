"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { ChessBoard } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { MoveList } from "@/components/MoveList";
import { EvalGraph } from "@/components/EvalGraph";
import { ReviewSummary } from "@/components/ReviewSummary";
import { createClient } from "@/lib/supabase/client";
import type { AnalyzedMove, GameReview } from "@rechess/shared";

export default function SharedReviewPage() {
  const params = useParams();
  const [review, setReview] = useState<GameReview | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("game_reviews")
        .select("*")
        .eq("id", params.id as string)
        .single();

      if (err || !data) { setError("Review not found"); return; }

      setReview({
        id: data.id,
        pgn: data.pgn,
        moves: JSON.parse(data.moves) as AnalyzedMove[],
        whiteAccuracy: data.white_accuracy,
        blackAccuracy: data.black_accuracy,
        opening: data.opening,
        eco: data.eco,
      });
    };
    load();
  }, [params.id]);

  if (error) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <p className="text-muted">{error}</p>
        </div>
      </>
    );
  }

  if (!review) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <p className="text-muted">Loading review...</p>
        </div>
      </>
    );
  }

  const currentMove = review.moves[currentIndex];

  return (
    <>
      <Navigation />
      <main className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto">
        <div className="flex gap-2 flex-1">
          <EvalBar eval_={currentMove?.eval ?? null} />
          <ChessBoard
            fen={currentMove?.fen ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
            highlightSquare={currentMove?.uci.slice(2, 4)}
            classification={currentMove?.classification}
            bestMoveArrow={currentMove?.eval.bestMove ? {
              from: currentMove.eval.bestMove.slice(0, 2),
              to: currentMove.eval.bestMove.slice(2, 4),
            } : undefined}
            playedMoveArrow={currentMove ? {
              from: currentMove.uci.slice(0, 2),
              to: currentMove.uci.slice(2, 4),
              classification: currentMove.classification,
            } : undefined}
          />
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-80">
          <span className="text-sm text-muted">{review.opening} ({review.eco})</span>
          <MoveList moves={review.moves} currentIndex={currentIndex} onSelect={setCurrentIndex} />
          <EvalGraph moves={review.moves} currentIndex={currentIndex} onSelect={setCurrentIndex} />
          <ReviewSummary moves={review.moves} whiteAccuracy={review.whiteAccuracy} blackAccuracy={review.blackAccuracy} />
        </div>
      </main>
    </>
  );
}
