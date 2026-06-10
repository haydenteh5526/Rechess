# Rechess

Chess game review and analysis tool — visually and functionally matching chess.com's Game Review feature. Powered by Stockfish 16 WASM running entirely client-side.

## Features

- **Analysis Board** — Interactive board with live Stockfish eval, best move arrows, PV line, opening detection
- **Game Review** — Import PGN or chess.com game URL, get move-by-move classifications and accuracy scores
- **Move Classifications** — Brilliant, Best, Excellent, Good, Book, Inaccuracy, Mistake, Blunder
- **Chess.com UI** — Matching dark theme, board colors, move list, navigation controls
- **PWA** — Installable on mobile/desktop, works offline after first load
- **Configurable Depth** — Quick (12), Standard (18), or Deep (22-24) analysis

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, TypeScript
- **Engine**: Stockfish 16 WASM (client-side via Web Worker)
- **Auth & DB**: Supabase (PostgreSQL, Auth, Row-Level Security)
- **UI**: Framer Motion, Lucide React
- **Chess Logic**: chess.js

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp web/.env.local.example web/.env.local

# Start dev server
cd web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase Setup (optional, for auth & sharing)

1. Create a project at [supabase.com](https://supabase.com)
2. Update `web/.env.local` with your project URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the migration in Supabase SQL Editor:
   ```sql
   -- Copy contents of supabase/migrations/001_game_reviews.sql
   ```
4. Enable Google OAuth in Supabase Auth → Providers
5. Uncomment auth gates in `web/src/app/review/page.tsx` and `web/src/app/analysis/page.tsx`

### Deploy to Vercel

```bash
# Push to GitHub, then:
vercel deploy
```

Ensure these headers are set (already configured in `next.config.ts`):
- `Cross-Origin-Embedder-Policy: credentialless`
- `Cross-Origin-Opener-Policy: same-origin`

## Project Structure

```
rechess/
├── shared/              # Shared types & chess logic
│   └── src/
│       ├── types.ts         # MoveClassification, EngineEval, GameReview
│       ├── chess-logic.ts   # cpLoss, classifyMove, accuracy formula
│       └── openings.ts      # ECO opening detection
├── web/                 # Next.js frontend
│   ├── public/
│   │   └── stockfish/       # Stockfish WASM files
│   └── src/
│       ├── app/             # Pages (/, /analysis, /review, /review/[id])
│       ├── components/      # ChessBoard, EvalBar, MoveList, etc.
│       ├── lib/             # Engine, analyzer, sounds, supabase
│       └── hooks/           # useAuth
└── supabase/            # Database migrations
```

## Keyboard Shortcuts

### Analysis Page
| Key | Action |
|-----|--------|
| ← | Undo move |
| → | Redo move |
| ↑ | Go to latest |
| ↓ | Reset board |

### Review Page
| Key | Action |
|-----|--------|
| ← | Previous move |
| → | Next move |
| ↑ | Jump to last move |
| ↓ | Jump to first move |

## License

MIT
