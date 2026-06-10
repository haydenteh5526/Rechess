import { Chess } from "chess.js";
import type { AnalyzedMove, EngineEval, MoveClassification } from "./types";

/** Convert engine eval to a normalized centipawn value (capped at ±1500) */
export function evalToCp(ev: EngineEval): number {
  if (ev.mate != null) return ev.mate > 0 ? 15000 : -15000;
  return Math.max(-1500, Math.min(1500, ev.cp ?? 0));
}

/** Calculate centipawn loss for a move (always positive, from the mover's perspective) */
export function cpLoss(evalBefore: EngineEval, evalAfter: EngineEval, color: "w" | "b"): number {
  const sign = color === "w" ? 1 : -1;
  const before = evalToCp(evalBefore) * sign;
  const after = evalToCp(evalAfter) * sign;
  return Math.max(0, before - after);
}

/** Classify a move based on cpLoss and context */
export function classifyMove(
  loss: number,
  isBook: boolean,
  isBrilliant: boolean
): MoveClassification {
  if (isBook) return "book";
  if (isBrilliant) return "brilliant";
  if (loss === 0) return "best";
  if (loss <= 10) return "excellent";
  if (loss <= 25) return "good";
  if (loss <= 50) return "inaccuracy";
  if (loss <= 150) return "mistake";
  return "blunder";
}

/** Detect if a move is a sacrifice (captures less valuable piece or gives material) */
export function isSacrifice(fenBefore: string, uci: string): boolean {
  const chess = new Chess(fenBefore);
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const movingPiece = chess.get(from as any);
  const capturedPiece = chess.get(to as any);

  if (!movingPiece) return false;

  // Moving to a square attacked by opponent without sufficient compensation
  const move = chess.move({ from, to, promotion: uci[4] as any });
  if (!move) return false;

  // A sacrifice: piece moves to attacked square or captures lower-value piece
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  if (capturedPiece && values[movingPiece.type] > values[capturedPiece.type] + 1) return true;

  // Check if the destination is attacked by opponent
  chess.undo();
  // Simple heuristic: if we moved a high-value piece and didn't capture equal/higher
  if (values[movingPiece.type] >= 3 && (!capturedPiece || values[capturedPiece.type] < values[movingPiece.type])) {
    // Check if square is defended by opponent
    const testChess = new Chess(fenBefore);
    testChess.remove(from as any);
    // If opponent can capture on that square, it's likely a sacrifice
    const opponentMoves = chess.moves({ verbose: true });
    return opponentMoves.some((m) => m.to === to);
  }
  return false;
}

/** Detect brilliant move: cpLoss ≤ 10, MultiPV gap ≥ 150, and is a sacrifice */
export function isBrilliantMove(
  loss: number,
  multiPvGap: number,
  fenBefore: string,
  uci: string
): boolean {
  return loss <= 10 && multiPvGap >= 150 && isSacrifice(fenBefore, uci);
}

/** Chess.com accuracy formula */
export function calculateAccuracy(avgCpLoss: number): number {
  return Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * avgCpLoss) - 3.1668));
}

/** Calculate accuracy for a set of moves */
export function computePlayerAccuracy(moves: AnalyzedMove[], color: "w" | "b"): number {
  const playerMoves = moves.filter((m) => m.color === color);
  if (playerMoves.length === 0) return 100;
  const avgLoss = playerMoves.reduce((sum, m) => sum + m.cpLoss, 0) / playerMoves.length;
  return calculateAccuracy(avgLoss);
}
