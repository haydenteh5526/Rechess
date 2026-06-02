import { Chess } from "chess.js";
import type { AnalyzedMove, EngineEval, GameReview } from "@rechess/shared";
import {
  cpLoss,
  classifyMove,
  isBrilliantMove,
  computePlayerAccuracy,
  evalToCp,
} from "@rechess/shared";
import { isBookMove, detectOpening } from "@rechess/shared";
import { StockfishEngine } from "./engine";

export interface AnalysisProgress {
  current: number;
  total: number;
}

export async function analyzeGame(
  pgn: string,
  engine: StockfishEngine,
  onProgress?: (p: AnalysisProgress) => void,
  depth = 18
): Promise<GameReview> {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const history = chess.history({ verbose: true });
  const moves: string[] = history.map((m) => m.san);

  const opening = detectOpening(moves);
  const analyzedMoves: AnalyzedMove[] = [];

  // Reset to start
  const game = new Chess();
  let prevEval: EngineEval = { cp: 15, bestMove: "", pv: [], depth: 0 }; // slight white advantage start

  for (let i = 0; i < history.length; i++) {
    onProgress?.({ current: i + 1, total: history.length });

    const fenBefore = game.fen();
    const move = history[i];
    game.move(move.san);
    const fenAfter = game.fen();
    const color = move.color as "w" | "b";

    // Check if book move
    if (isBookMove(moves, i)) {
      analyzedMoves.push({
        moveNumber: Math.floor(i / 2) + 1,
        color,
        san: move.san,
        uci: move.from + move.to + (move.promotion || ""),
        fen: fenAfter,
        fenBefore,
        eval: prevEval,
        classification: "book",
        cpLoss: 0,
      });
      continue;
    }

    // Analyze position after the move
    const result = await engine.analyze(fenAfter, depth, 2);
    const currentEval = result.lines[0] || { cp: 0, bestMove: "", pv: [], depth };

    // Calculate cpLoss
    const loss = cpLoss(prevEval, currentEval, color);

    // Check for brilliant
    const multiPvGap =
      result.lines.length >= 2
        ? Math.abs(evalToCp(result.lines[0]) - evalToCp(result.lines[1]))
        : 0;
    const uci = move.from + move.to + (move.promotion || "");
    const brilliant = isBrilliantMove(loss, multiPvGap, fenBefore, uci);

    const classification = classifyMove(loss, false, brilliant);

    analyzedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      color,
      san: move.san,
      uci,
      fen: fenAfter,
      fenBefore,
      eval: currentEval,
      classification,
      cpLoss: loss,
    });

    prevEval = currentEval;
  }

  return {
    pgn,
    moves: analyzedMoves,
    whiteAccuracy: computePlayerAccuracy(analyzedMoves, "w"),
    blackAccuracy: computePlayerAccuracy(analyzedMoves, "b"),
    opening: opening?.name || "Unknown",
    eco: opening?.eco || "",
  };
}
