<div align="center">
  <img src="web/public/icons/icon-512.svg" height="80" width="80" />
  <h1>Rechess</h1>
  <p><strong>Chess game review & analysis tool</strong></p>
  <p>Analyze your chess games with Stockfish-powered move classifications, accuracy scores, and interactive analysis.</p>

  ![License](https://img.shields.io/github/license/haydenteh5526/Rechess)
  ![Last Commit](https://img.shields.io/github/last-commit/haydenteh5526/Rechess)
  ![Top Language](https://img.shields.io/github/languages/top/haydenteh5526/Rechess)

  **[Live Demo →](https://rechess-rosy.vercel.app/)**
</div>

---

## Features

- **Game Review** — Import PGN or chess.com game URL, get full engine analysis with move-by-move classifications
- **Analysis Board** — Move pieces freely with live Stockfish evaluation and best move arrows
- **Move Classifications** — Brilliant, Best, Excellent, Good, Book, Inaccuracy, Mistake, Blunder
- **Accuracy Scores** — Chess.com-style accuracy percentage per player
- **Eval Bar & PV Line** — Real-time evaluation with principal variation display
- **Opening Detection** — ECO opening book recognition
- **Configurable Depth** — 12, 18, 20, or 24 depth analysis
- **Drag & Drop** — Move pieces by dragging (mouse and touch)
- **Sound Effects** — Move, capture, check sounds
- **PWA** — Installable, works offline
- **Share** — Save and share analyzed games via link

## Screenshots

> Coming soon

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4 |
| Animation | Framer Motion |
| Engine | Stockfish 16 WASM (client-side, no server needed) |
| Auth & DB | Supabase (PostgreSQL, Auth, RLS) |
| Chess Logic | chess.js |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
git clone https://github.com/haydenteh5526/Rechess.git
cd Rechess
npm install
```

### Run

```bash
cd web
cp .env.local.example .env.local
npm run dev
```

Open **http://localhost:3000**

> No server required — Stockfish runs entirely in your browser via WASM.

## Project Structure

```
rechess/
├── web/             → Next.js frontend
│   ├── src/
│   │   ├── app/         → Pages (/, /review, /analysis, /review/[id])
│   │   ├── components/  → ChessBoard, EvalBar, MoveList, Navigation
│   │   ├── hooks/       → useAuth
│   │   ├── lib/         → Engine, analyzer, sounds, supabase
│   │   └── workers/     → Stockfish Web Worker
│   └── public/
│       └── stockfish/   → Stockfish WASM binary
├── shared/          → Shared TypeScript types & chess logic
│   └── src/
│       ├── types.ts       → MoveClassification, EngineEval, GameReview
│       ├── chess-logic.ts → cpLoss, classifyMove, accuracy formula
│       └── openings.ts    → ECO opening detection
└── supabase/        → Database migrations
```

## Keyboard Shortcuts

| Key | Analysis | Review |
|-----|----------|--------|
| ← | Undo move | Previous move |
| → | Redo move | Next move |
| ↑ | Go to latest | Jump to last |
| ↓ | Reset board | Jump to first |

## Environment Variables

### Web (`web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Stockfish](https://stockfishchess.org/) — Strong open-source chess engine
- [stockfish.js](https://github.com/nicfab/stockfish.js) — Stockfish WASM build
- [chess.js](https://github.com/jhlywa/chess.js) — Chess move validation
- [chess.com](https://chess.com) — UI/UX inspiration
- [Reqi](https://github.com/haydenteh5526/Reqi) — Sister project for Xiangqi
