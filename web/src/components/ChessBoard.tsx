"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Chess, type Square } from "chess.js";
import type { BoardTheme, MoveClassification } from "@rechess/shared";
import { BOARD_THEMES, CLASSIFICATIONS } from "@rechess/shared";
import { motion } from "framer-motion";
import { PromotionModal } from "./PromotionModal";

const PIECE_SVGS: Record<string, string> = {
  wK: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png",
  wQ: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png",
  wR: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png",
  wB: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png",
  wN: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png",
  wP: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png",
  bK: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png",
  bQ: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png",
  bR: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png",
  bB: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png",
  bN: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png",
  bP: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png",
};

interface ChessBoardProps {
  fen: string;
  flipped?: boolean;
  theme?: BoardTheme;
  onMove?: (from: string, to: string, promotion?: string) => void;
  highlightSquare?: string;
  classification?: MoveClassification;
  bestMoveArrow?: { from: string; to: string };
  playedMoveArrow?: { from: string; to: string; classification?: MoveClassification };
  interactive?: boolean;
  lastMove?: { from: string; to: string };
}

/**
 * Generate a stable piece map: assigns a unique numeric ID to each piece
 * so we can track it across FEN changes and animate only the moved piece.
 */
function buildPieceMap(fen: string): Map<string, { id: number; color: string; type: string; sq: string }> {
  const chess = new Chess(fen);
  const board = chess.board();
  const map = new Map<string, { id: number; color: string; type: string; sq: string }>();
  let id = 0;
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const piece = board[7 - rank]?.[file];
      if (piece) {
        const sq = String.fromCharCode(97 + file) + (rank + 1);
        map.set(sq, { id: id++, color: piece.color, type: piece.type, sq });
      }
    }
  }
  return map;
}

export function ChessBoard({
  fen,
  flipped = false,
  theme = BOARD_THEMES[0],
  onMove,
  highlightSquare,
  classification,
  bestMoveArrow,
  playedMoveArrow,
  interactive = false,
  lastMove,
}: ChessBoardProps) {
  const [from, setFrom] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [dragPiece, setDragPiece] = useState<{ sq: string; x: number; y: number } | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const prevFenRef = useRef<string>(fen);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const board = chess.board();

  // Detect which piece moved and trigger animation
  useEffect(() => {
    if (lastMove && prevFenRef.current !== fen) {
      setAnimatingPiece(lastMove.to);
      const timer = setTimeout(() => setAnimatingPiece(null), 160);
      prevFenRef.current = fen;
      return () => clearTimeout(timer);
    }
    prevFenRef.current = fen;
  }, [fen, lastMove]);

  const getSquareFromCoords = (clientX: number, clientY: number): string | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = rect.width / 8;
    let file = Math.floor(x / size);
    let rank = Math.floor(y / size);
    if (flipped) { file = 7 - file; rank = 7 - rank; }
    else { rank = 7 - rank; }
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return String.fromCharCode(97 + file) + (rank + 1);
  };

  const sqToXY = (sq: string) => {
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq[1]) - 1;
    const x = flipped ? 7 - file : file;
    const y = flipped ? rank : 7 - rank;
    return { x, y };
  };

  const isPromotion = (fromSq: string, toSq: string) => {
    const piece = chess.get(fromSq as Square);
    if (!piece || piece.type !== "p") return false;
    const rank = toSq[1];
    return (piece.color === "w" && rank === "8") || (piece.color === "b" && rank === "1");
  };

  const tryMove = (fromSq: string, toSq: string) => {
    if (isPromotion(fromSq, toSq)) {
      setPendingPromotion({ from: fromSq, to: toSq });
    } else {
      onMove?.(fromSq, toSq);
    }
  };

  const handleClick = (sq: string) => {
    if (!interactive) return;
    if (!from) {
      const piece = chess.get(sq as Square);
      if (piece && piece.color === chess.turn()) {
        setFrom(sq);
        const moves = chess.moves({ square: sq as Square, verbose: true });
        setLegalMoves(moves.map(m => m.to));
      }
    } else {
      if (from !== sq) {
        const piece = chess.get(sq as Square);
        if (piece && piece.color === chess.turn()) {
          setFrom(sq);
          const moves = chess.moves({ square: sq as Square, verbose: true });
          setLegalMoves(moves.map(m => m.to));
          return;
        }
        tryMove(from, sq);
      }
      setFrom(null);
      setLegalMoves([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, sq: string) => {
    if (!interactive) return;
    const piece = chess.get(sq as Square);
    if (piece && piece.color === chess.turn()) {
      setDragPiece({ sq, x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragPiece) {
      const target = getSquareFromCoords(e.clientX, e.clientY);
      if (target && target !== dragPiece.sq) {
        tryMove(dragPiece.sq, target);
        setFrom(null);
        setLegalMoves([]);
      }
      setDragPiece(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragPiece) setDragPiece({ ...dragPiece, x: e.clientX, y: e.clientY });
  };

  const renderArrow = (fromSq: string, toSq: string, color: string, key: string, opacity = 0.7) => {
    const f = sqToXY(fromSq);
    const t = sqToXY(toSq);
    const x1 = (f.x + 0.5) * 12.5;
    const y1 = (f.y + 0.5) * 12.5;
    const x2 = (t.x + 0.5) * 12.5;
    const y2 = (t.y + 0.5) * 12.5;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    const ux = dx / len;
    const uy = dy / len;
    const headLen = 3;
    const ex = x2 - ux * headLen;
    const ey = y2 - uy * headLen;
    const pw = 2.2;

    return (
      <g key={key} opacity={opacity}>
        <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        <polygon points={`${x2},${y2} ${ex - uy * pw},${ey + ux * pw} ${ex + uy * pw},${ey - ux * pw}`} fill={color} />
      </g>
    );
  };

  // Compute origin position for the animating piece (where it came from)
  const animOrigin = useMemo(() => {
    if (!animatingPiece || !lastMove) return null;
    return sqToXY(lastMove.from);
  }, [animatingPiece, lastMove, flipped]);

  return (
    <div
      ref={boardRef}
      className="relative aspect-square w-full select-none rounded-[3px] overflow-hidden shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDragPiece(null)}
    >
      {/* Squares only (no pieces) */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const file = flipped ? 7 - col : col;
          const rank = flipped ? row : 7 - row;
          const sq = String.fromCharCode(97 + file) + (rank + 1);
          const isLight = (file + rank) % 2 !== 0;
          const isSelected = from === sq;
          const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const isLegal = legalMoves.includes(sq);
          const hasPiece = !!board[7 - rank]?.[file];

          let bgColor = isLight ? theme.light : theme.dark;
          if (isSelected) bgColor = isLight ? "#F4F687" : "#BBCB45";
          else if (isLastMove) bgColor = isLight ? "#F4F687" : "#BBCB45";

          return (
            <div
              key={sq}
              className={`relative ${interactive ? "cursor-pointer" : ""}`}
              style={{ backgroundColor: bgColor }}
              onClick={() => handleClick(sq)}
              onMouseDown={(e) => handleMouseDown(e, sq)}
            >
              {isLegal && !hasPiece && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-[26%] h-[26%] rounded-full ${isLight ? "bg-[#C8CAB2]" : "bg-[#628047]"}`} />
                </div>
              )}
              {isLegal && hasPiece && (
                <div className={`absolute inset-[4%] rounded-full border-[5px] ${isLight ? "border-[#C8CAB2]" : "border-[#628047]"}`} />
              )}
              {row === 7 && (
                <span className={`absolute bottom-[2px] right-[3px] text-[9px] font-bold leading-none ${isLight ? "text-[#739552]" : "text-[#ebecd0]"}`}>
                  {String.fromCharCode(97 + file)}
                </span>
              )}
              {col === 0 && (
                <span className={`absolute top-[2px] left-[3px] text-[9px] font-bold leading-none ${isLight ? "text-[#739552]" : "text-[#ebecd0]"}`}>
                  {rank + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Pieces layer - absolute positioned */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const file = flipped ? 7 - col : col;
          const rank = flipped ? row : 7 - row;
          const sq = String.fromCharCode(97 + file) + (rank + 1);
          const piece = board[7 - rank]?.[file];
          if (!piece) return null;
          if (dragPiece?.sq === sq) return null;

          const { x, y } = sqToXY(sq);
          const isAnimating = animatingPiece === sq && animOrigin;

          // If this piece is the one that just moved, start from origin and transition to destination
          const startX = isAnimating ? animOrigin!.x : x;
          const startY = isAnimating ? animOrigin!.y : y;

          return (
            <div
              key={`piece-${sq}`}
              className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center"
              style={{
                left: `${x * 12.5}%`,
                top: `${y * 12.5}%`,
                // CSS custom property trick: start at origin then animate
                ...(isAnimating ? {
                  animation: "piece-slide 0.15s ease-out",
                  // @ts-ignore
                  "--from-x": `${(startX - x) * 100}%`,
                  "--from-y": `${(startY - y) * 100}%`,
                } : {}),
              }}
            >
              <img
                src={PIECE_SVGS[`${piece.color}${piece.type.toUpperCase()}`]}
                alt=""
                className="w-[88%] h-[88%]"
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* SVG overlay: arrows + classification badge */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        {bestMoveArrow && renderArrow(bestMoveArrow.from, bestMoveArrow.to, "#96bc4b", "best", 0.8)}
        {playedMoveArrow && renderArrow(
          playedMoveArrow.from, playedMoveArrow.to,
          playedMoveArrow.classification ? CLASSIFICATIONS[playedMoveArrow.classification].color : "#ffffff",
          "played", 0.7
        )}
        {highlightSquare && classification && (() => {
          const { x, y } = sqToXY(highlightSquare);
          const meta = CLASSIFICATIONS[classification];
          const cx = (x + 1) * 12.5;
          const cy = y * 12.5;
          return (
            <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <circle cx={cx} cy={cy} r={3.2} fill={meta.color} stroke="#1a1816" strokeWidth="0.5" />
              <text x={cx} y={cy + 1.2} textAnchor="middle" fontSize="3" fill="#fff" fontWeight="bold">{meta.symbol}</text>
            </motion.g>
          );
        })()}
      </svg>

      {/* Drag ghost */}
      {dragPiece && boardRef.current && (() => {
        const piece = chess.get(dragPiece.sq as Square);
        if (!piece) return null;
        const rect = boardRef.current.getBoundingClientRect();
        const size = rect.width / 8;
        return (
          <img
            src={PIECE_SVGS[`${piece.color}${piece.type.toUpperCase()}`]}
            alt=""
            className="fixed pointer-events-none z-50 drop-shadow-lg"
            style={{ width: size * 1.1, height: size * 1.1, left: dragPiece.x - size * 0.55, top: dragPiece.y - size * 0.55 }}
            draggable={false}
          />
        );
      })()}

      {/* Promotion modal */}
      {pendingPromotion && (
        <PromotionModal
          color={chess.turn() as "w" | "b"}
          onSelect={(piece) => {
            onMove?.(pendingPromotion.from, pendingPromotion.to, piece);
            setPendingPromotion(null);
          }}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  );
}
