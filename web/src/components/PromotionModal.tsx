"use client";

const PIECE_SVGS: Record<string, string> = {
  wQ: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png",
  wR: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png",
  wB: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png",
  wN: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png",
  bQ: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png",
  bR: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png",
  bB: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png",
  bN: "https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png",
};

interface PromotionModalProps {
  color: "w" | "b";
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
  onCancel: () => void;
}

export function PromotionModal({ color, onSelect, onCancel }: PromotionModalProps) {
  const pieces: ("q" | "r" | "b" | "n")[] = ["q", "r", "b", "n"];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="flex bg-[#302e2b] rounded-lg shadow-2xl overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
        {pieces.map((p) => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className="w-16 h-16 flex items-center justify-center hover:bg-[#484644] transition-colors"
          >
            <img
              src={PIECE_SVGS[`${color}${p.toUpperCase()}`]}
              alt={p}
              className="w-12 h-12"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
