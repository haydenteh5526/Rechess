/// <reference lib="webworker" />

let stockfish: Worker | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === "init") {
    // Load stockfish.js WASM - expects stockfish.js in public/
    stockfish = new Worker("/stockfish/stockfish.js");
    stockfish.onmessage = (ev: MessageEvent) => {
      self.postMessage({ type: "uci-output", payload: ev.data });
    };
    stockfish.postMessage("uci");
    return;
  }

  if (type === "command" && stockfish) {
    stockfish.postMessage(payload);
  }
};
