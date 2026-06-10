export type MoveClassification =
  | "brilliant"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface ClassificationMeta {
  label: string;
  symbol: string;
  color: string;
}

export const CLASSIFICATIONS: Record<MoveClassification, ClassificationMeta> = {
  brilliant: { label: "Brilliant", symbol: "!!", color: "#1abc9c" },
  best: { label: "Best", symbol: "★", color: "#96bc4b" },
  excellent: { label: "Excellent", symbol: "!", color: "#5c8bb0" },
  good: { label: "Good", symbol: "✓", color: "#96bc4b" },
  book: { label: "Book", symbol: "≡", color: "#a88b65" },
  inaccuracy: { label: "Inaccuracy", symbol: "?!", color: "#f7c735" },
  mistake: { label: "Mistake", symbol: "?", color: "#e79827" },
  blunder: { label: "Blunder", symbol: "??", color: "#ca3431" },
};

export interface EngineEval {
  cp?: number; // centipawns from white's perspective
  mate?: number; // mate in N (positive = white mates)
  bestMove: string;
  pv: string[]; // principal variation
  depth: number;
}

export interface MultiPVResult {
  lines: EngineEval[];
}

export interface AnalyzedMove {
  moveNumber: number;
  color: "w" | "b";
  san: string;
  uci: string;
  fen: string; // position AFTER the move
  fenBefore: string;
  eval: EngineEval;
  classification: MoveClassification;
  cpLoss: number;
}

export interface GameReview {
  id?: string;
  pgn: string;
  moves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  opening: string;
  eco: string;
  createdAt?: string;
  userId?: string;
}

export interface BoardTheme {
  name: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { name: "Green", light: "#ebecd0", dark: "#739552" },
  { name: "Brown", light: "#f0d9b5", dark: "#b58863" },
  { name: "Blue", light: "#dee3e6", dark: "#8ca2ad" },
];
