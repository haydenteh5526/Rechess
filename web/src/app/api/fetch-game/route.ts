import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  const match = url.match(/chess\.com\/(?:analysis\/)?game\/(live|daily)\/(\d+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid chess.com URL" }, { status: 400 });
  }

  const [, type, gameId] = match;

  try {
    // chess.com public API: get game directly by fetching from the player's archive
    // First, get game info from callback to find the players
    const callbackRes = await fetch(`https://www.chess.com/callback/${type}/game/${gameId}`, {
      headers: { "User-Agent": "Mozilla/5.0 Rechess/1.0" },
    });

    if (!callbackRes.ok) {
      return NextResponse.json({ error: "Game not found on chess.com" }, { status: 404 });
    }

    const callbackData = await callbackRes.json();
    const headers = callbackData.game?.pgnHeaders;
    if (!headers) {
      return NextResponse.json({ error: "Could not read game data" }, { status: 404 });
    }

    // Get the white player's username and game date to search their archive
    const username = (headers.White || "").toLowerCase();
    const date = headers.Date || ""; // "2024.01.01"
    const [year, month] = date.split(".");

    if (!username || !year || !month) {
      return NextResponse.json({ error: "Could not determine player/date" }, { status: 404 });
    }

    // Fetch the player's monthly archive
    const archiveRes = await fetch(
      `https://api.chess.com/pub/player/${username}/games/${year}/${month}`,
      { headers: { "User-Agent": "Rechess/1.0" } }
    );

    if (!archiveRes.ok) {
      return NextResponse.json({ error: "Could not fetch player's game archive" }, { status: 404 });
    }

    const archiveData = await archiveRes.json();
    const games = archiveData.games || [];

    // Find the game by URL match
    const targetUrl = `https://www.chess.com/game/${type}/${gameId}`;
    const game = games.find((g: any) => g.url === targetUrl);

    if (game?.pgn) {
      return NextResponse.json({ pgn: game.pgn });
    }

    // Fallback: try to find by game ID in URL
    const gameById = games.find((g: any) => g.url?.includes(gameId));
    if (gameById?.pgn) {
      return NextResponse.json({ pgn: gameById.pgn });
    }

    return NextResponse.json({ error: "Game found but PGN not available. Try copying PGN manually from chess.com." }, { status: 404 });
  } catch (e) {
    return NextResponse.json({ error: "Fetch failed: " + (e as Error).message }, { status: 502 });
  }
}
