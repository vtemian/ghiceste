# Ghicește

A Romanian Wordle clone built as a Discord Activity.

## Features

- 5-letter Romanian words (no diacritics)
- Session-based gameplay - each Discord Activity instance gets a unique word
- Leaderboard showing who solved it fastest
- Victory/fail screens with word reveal

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Cloudflare Workers + Hono
- **Database**: Cloudflare KV (for leaderboards)
- **Hosting**: Cloudflare Pages + Workers

## Project Structure

```
packages/
  client/          # React frontend
  server/          # Cloudflare Worker backend
data/
  words.json       # Word list (800 answers, 11k+ valid words)
scripts/
  add-entry-point.js    # Discord entry point command setup
  configure-activity.js # Activity configuration helper
```

## Local Development

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
# Root .env
VITE_DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# packages/server/.dev.vars
DISCORD_CLIENT_SECRET=your_client_secret
VITE_DISCORD_CLIENT_ID=your_client_id
```

3. Start development servers:
```bash
# Terminal 1 - Backend
cd packages/server && pnpm dev

# Terminal 2 - Frontend
cd packages/client && pnpm dev
```

4. For Discord testing, use cloudflared tunnel:
```bash
cloudflared tunnel --url http://localhost:5173
```

## Deployment

### Backend (Cloudflare Workers)
```bash
cd packages/server
pnpm wrangler deploy
pnpm wrangler secret put DISCORD_CLIENT_SECRET
```

### Frontend (Cloudflare Pages)
```bash
cd packages/client && pnpm build
npx wrangler pages deploy dist --project-name=ghiceste
```

## Discord Setup

1. Create an app at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable Activities in Activities → Settings
3. Configure URL mappings:
   - Root `/` → your-frontend.pages.dev
   - `/api` → your-backend.workers.dev
4. Set OAuth2 redirect to your frontend URL
5. Run the entry point script:
```bash
node scripts/add-entry-point.js YOUR_BOT_TOKEN 2
```

## Word List

Words sourced from [dexonline.ro/scrabble](https://dexonline.ro/scrabble), filtered to 5-letter words without diacritics.
