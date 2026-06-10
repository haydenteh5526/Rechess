/** Minimal ECO opening book for detection. Maps FEN (position only) to opening info. */
export interface OpeningInfo {
  eco: string;
  name: string;
}

// Common openings by move sequence (first N half-moves)
const OPENINGS: [string[], OpeningInfo][] = [
  [["e4", "e5", "Nf3", "Nc6", "Bb5"], { eco: "C60", name: "Ruy Lopez" }],
  [["e4", "e5", "Nf3", "Nc6", "Bc4"], { eco: "C50", name: "Italian Game" }],
  [["e4", "e5", "Nf3", "Nf6"], { eco: "C42", name: "Petrov's Defense" }],
  [["e4", "c5"], { eco: "B20", name: "Sicilian Defense" }],
  [["e4", "c5", "Nf3", "d6", "d4"], { eco: "B50", name: "Sicilian Defense" }],
  [["e4", "e6"], { eco: "C00", name: "French Defense" }],
  [["e4", "c6"], { eco: "B10", name: "Caro-Kann Defense" }],
  [["e4", "d5"], { eco: "B01", name: "Scandinavian Defense" }],
  [["d4", "d5", "c4"], { eco: "D06", name: "Queen's Gambit" }],
  [["d4", "d5", "c4", "e6"], { eco: "D30", name: "Queen's Gambit Declined" }],
  [["d4", "d5", "c4", "dxc4"], { eco: "D20", name: "Queen's Gambit Accepted" }],
  [["d4", "Nf6", "c4", "g6"], { eco: "E60", name: "King's Indian Defense" }],
  [["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"], { eco: "E20", name: "Nimzo-Indian Defense" }],
  [["d4", "Nf6", "c4", "e6", "Nf3", "b6"], { eco: "E10", name: "Queen's Indian Defense" }],
  [["e4", "e5", "f4"], { eco: "C30", name: "King's Gambit" }],
  [["d4", "f5"], { eco: "A80", name: "Dutch Defense" }],
  [["Nf3", "d5", "g3"], { eco: "A05", name: "King's Indian Attack" }],
  [["c4"], { eco: "A10", name: "English Opening" }],
  [["e4", "e5", "Nf3", "Nc6", "d4"], { eco: "C44", name: "Scotch Game" }],
  [["e4", "e5", "d4"], { eco: "C21", name: "Center Game" }],
];

/** Find the opening that matches the longest prefix of moves */
export function detectOpening(moves: string[]): OpeningInfo | null {
  let best: OpeningInfo | null = null;
  let bestLen = 0;

  for (const [seq, info] of OPENINGS) {
    if (seq.length > moves.length) continue;
    if (seq.length <= bestLen) continue;
    if (seq.every((m, i) => moves[i] === m)) {
      best = info;
      bestLen = seq.length;
    }
  }
  return best;
}

/** Check if a move index is still in "book" territory (first ~10 moves of known opening) */
export function isBookMove(moves: string[], moveIndex: number): boolean {
  // Consider moves as book if they match a known opening sequence
  const prefix = moves.slice(0, moveIndex + 1);
  for (const [seq] of OPENINGS) {
    if (prefix.length <= seq.length && seq.slice(0, prefix.length).every((m, i) => prefix[i] === m)) {
      return true;
    }
  }
  return false;
}
