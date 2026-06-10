import type { EngineEval, MultiPVResult } from "@rechess/shared";

type EngineCallback = (output: string) => void;

export class StockfishEngine {
  private worker: Worker | null = null;
  private listeners: EngineCallback[] = [];
  private ready = false;
  private readyResolve: (() => void) | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      try {
        const url = ["/stockfish", "/stockfish.js"].join("");
        this.worker = new globalThis.Worker(url);
        this.worker.onmessage = (e) => {
          this.handleOutput(typeof e.data === "string" ? e.data : "");
        };
        this.worker.onerror = (e) => {
          reject(new Error("Stockfish failed to load: " + e.message));
        };
        // Timeout if engine doesn't respond in 10s
        const timeout = setTimeout(() => reject(new Error("Stockfish timed out")), 10000);
        const origResolve = resolve;
        this.readyResolve = () => { clearTimeout(timeout); origResolve(); };
        this.send("uci");
      } catch (e) {
        reject(new Error("Failed to create Stockfish worker"));
      }
    });
  }

  private handleOutput(line: string) {
    if (line === "uciok" && !this.ready) {
      this.ready = true;
      this.send("isready");
    }
    if (line === "readyok" && this.readyResolve) {
      this.readyResolve();
      this.readyResolve = null;
    }
    for (const cb of this.listeners) cb(line);
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  /** Analyze a position, returns eval for each PV line */
  async analyze(fen: string, depth = 18, multiPv = 2): Promise<MultiPVResult> {
    return new Promise((resolve) => {
      const lines: Map<number, EngineEval> = new Map();

      const handler = (line: string) => {
        if (line.startsWith("info") && line.includes("score") && line.includes(" pv ")) {
          const ev = parseInfoLine(line);
          if (ev) lines.set(ev.pvIndex, ev.eval);
        }
        if (line.startsWith("bestmove")) {
          this.listeners = this.listeners.filter((l) => l !== handler);
          const result: EngineEval[] = [];
          for (let i = 1; i <= multiPv; i++) {
            const ev = lines.get(i);
            if (ev) result.push(ev);
          }
          resolve({ lines: result });
        }
      };

      this.listeners.push(handler);
      this.send("stop");
      this.send(`setoption name MultiPV value ${multiPv}`);
      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth}`);
    });
  }

  /** Get a quick eval for live analysis */
  startAnalysis(fen: string, onEval: (ev: EngineEval) => void, depth = 20): void {
    this.send("stop");
    this.send("setoption name MultiPV value 1");
    this.send(`position fen ${fen}`);

    // Remove old streaming listeners
    this.listeners = this.listeners.filter((l) => !(l as any).__streaming);

    const handler = (line: string) => {
      if (line.startsWith("info") && line.includes("score") && line.includes(" pv ")) {
        const parsed = parseInfoLine(line);
        if (parsed && parsed.pvIndex === 1) onEval(parsed.eval);
      }
    };
    (handler as any).__streaming = true;
    this.listeners.push(handler);
    this.send(`go depth ${depth}`);
  }

  stop() {
    this.send("stop");
  }

  destroy() {
    this.worker?.terminate();
    this.worker = null;
  }
}

function parseInfoLine(line: string): { pvIndex: number; eval: EngineEval } | null {
  const depthMatch = line.match(/depth (\d+)/);
  const pvIdxMatch = line.match(/multipv (\d+)/);
  const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
  const pvMatch = line.match(/ pv (.+)/);

  if (!scoreMatch || !pvMatch) return null;

  const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
  const pvIndex = pvIdxMatch ? parseInt(pvIdxMatch[1]) : 1;
  const pv = pvMatch[1].split(" ");
  const bestMove = pv[0];

  const ev: EngineEval = { bestMove, pv, depth };
  if (scoreMatch[1] === "cp") ev.cp = parseInt(scoreMatch[2]);
  else ev.mate = parseInt(scoreMatch[2]);

  return { pvIndex, eval: ev };
}
