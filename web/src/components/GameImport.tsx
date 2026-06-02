"use client";

import { useState } from "react";
import { Upload, Link, FileText } from "lucide-react";

interface GameImportProps {
  onImport: (pgn: string) => void;
  loading?: boolean;
}

/**
 * Extracts PGN from a chess.com game URL.
 * Supports formats:
 *   https://www.chess.com/game/live/123456789
 *   https://www.chess.com/game/daily/123456789
 *   https://www.chess.com/analysis/game/live/123456789
 */
async function fetchChessComPgn(url: string): Promise<string> {
  const match = url.match(/chess\.com\/(?:analysis\/)?game\/(live|daily)\/(\d+)/);
  if (!match) throw new Error("Invalid chess.com URL. Use a link like: https://www.chess.com/game/live/123456789");

  // Use our API proxy to avoid CORS
  const res = await fetch(`/api/fetch-game?url=${encodeURIComponent(url)}`);
  const data = await res.json();

  if (!res.ok || !data.pgn) {
    throw new Error(data.error || "Could not fetch game. Try copying the PGN directly from chess.com.");
  }

  return data.pgn;
}

/** Detects if a string is a chess.com URL */
function isChessComUrl(s: string): boolean {
  return /chess\.com\/.*game\/(live|daily)\/\d+/.test(s);
}

export function GameImport({ onImport, loading }: GameImportProps) {
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"paste" | "file">("paste");
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) onImport(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setError("");

    // Detect if it's a chess.com URL
    if (isChessComUrl(input.trim())) {
      setFetching(true);
      try {
        const pgn = await fetchChessComPgn(input.trim());
        onImport(pgn);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setFetching(false);
      }
      return;
    }

    // Otherwise treat as raw PGN
    onImport(input);
  };

  const isLoading = loading || fetching;

  return (
    <div className="bg-[#302e2b] rounded-xl p-6 max-w-lg w-full shadow-xl">
      <h2 className="text-lg font-semibold mb-4">Import Game</h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#1a1816] rounded-lg p-1">
        {([["paste", FileText, "Paste / URL"], ["file", Upload, "File"]] as const).map(([t, Icon, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-[#3a3835] text-text" : "text-muted hover:text-text"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "paste" && (
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Paste a chess.com game link or PGN...\n\nExamples:\nhttps://www.chess.com/game/live/123456789\n\n1. e4 e5 2. Nf3 Nc6 ..."}
            className="w-full h-44 bg-[#1a1816] border border-white/5 rounded-lg p-3 text-sm text-text resize-none focus:outline-none focus:border-accent/50 placeholder:text-muted/50"
          />
          {error && <p className="text-sm text-blunder">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="w-full py-2.5 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {isLoading ? "Loading..." : isChessComUrl(input.trim()) ? "Fetch & Analyze" : "Analyze Game"}
          </button>
        </div>
      )}

      {tab === "file" && (
        <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/40 transition-colors">
          <Upload size={32} className="text-muted mb-2" />
          <span className="text-sm text-muted">Click to upload .pgn file</span>
          <input type="file" accept=".pgn" onChange={handleFile} className="hidden" />
        </label>
      )}
    </div>
  );
}
