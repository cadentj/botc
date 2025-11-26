# BotC Server

Hono server with WebSocket support for Blood on the Clocktower game.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Initialize database schema:
```bash
pnpm db:push
```

Or generate migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

## Development

Run the dev server:
```bash
pnpm dev
```

The server will start on `http://localhost:3000` with WebSocket support at `ws://localhost:3000/ws`.

## Database

SQLite database is stored at:
- Development: `../../data/botc.db` (relative to server directory)
- Production (Fly.io): `/data/botc.db` (mounted volume)

## Deployment to Fly.io

1. Create a volume:
```bash
fly volumes create botc_data --size 1
```

2. Deploy:
```bash
fly deploy
```

The `fly.toml` is configured to mount the volume at `/data` and set `FLY_VOLUME_PATH=/data/botc.db`.

