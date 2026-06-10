/**
 * Stockfish WASM Smoke Test
 * 
 * Run this in the browser console on http://localhost:3000 to verify
 * Stockfish loads and responds to UCI commands.
 * 
 * Expected output:
 *   ✓ Worker created
 *   ✓ Received uciok
 *   ✓ Received readyok  
 *   ✓ Received bestmove
 *   ✓ All tests passed!
 */

async function testStockfish() {
  console.log("🧪 Stockfish WASM Smoke Test");

  const worker = new Worker("/stockfish/stockfish.js");
  let resolved = false;

  const result = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject("Timeout: no response from Stockfish"), 10000);
    let gotUciOk = false;
    let gotReadyOk = false;

    worker.onmessage = (e) => {
      const msg = typeof e.data === "string" ? e.data : "";

      if (msg === "uciok") {
        console.log("  ✓ Received uciok");
        gotUciOk = true;
        worker.postMessage("isready");
      }

      if (msg === "readyok") {
        console.log("  ✓ Received readyok");
        gotReadyOk = true;
        worker.postMessage("position startpos");
        worker.postMessage("go depth 5");
      }

      if (msg.startsWith("bestmove")) {
        console.log("  ✓ Received " + msg);
        clearTimeout(timeout);
        resolve(msg);
      }
    };

    worker.onerror = (e) => {
      clearTimeout(timeout);
      reject("Worker error: " + e.message);
    };

    console.log("  ✓ Worker created");
    worker.postMessage("uci");
  });

  worker.terminate();
  console.log("  ✓ All tests passed! Best move:", result);
  return result;
}

// Auto-run if loaded as script
testStockfish().catch(console.error);
