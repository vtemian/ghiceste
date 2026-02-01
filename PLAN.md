# Ghicește - Romanian Wordle Discord Activity

## Implementation Plan

### Overview
Build a Romanian Wordle game as a Discord Activity. Players guess 5-letter Romanian words, compete on session leaderboards (fewest guesses wins, time breaks ties).

**Tech Stack:** TypeScript, React, Vite, Cloudflare Pages + Workers
**Word Source:** dexonline.ro/scrabble (LOC reduced forms - no diacritics)

---

## Phase 1: Project Foundation

### Task 1.1: Initialize Project Structure
**Files to create:**
```
/Users/whitemonk/projects/wizz-discord/
├── packages/
│   ├── client/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── vite-env.d.ts
│   │   │   └── styles/
│   │   │       └── index.css
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── server/
│       ├── src/
│       │   ├── index.ts
│       │   └── types.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── wrangler.toml
├── data/
│   └── words.json
├── package.json
├── pnpm-workspace.yaml
├── .gitignore
├── .env.example
└── README.md
```

**Steps:**
1. Initialize git repo: `git init`
2. Create root `package.json` with pnpm workspace config
3. Create `pnpm-workspace.yaml` pointing to `packages/*`
4. Create `.gitignore` (node_modules, dist, .env, .wrangler)
5. Create `.env.example` with required variables:
   ```
   VITE_DISCORD_CLIENT_ID=
   DISCORD_CLIENT_SECRET=
   ```

**Verification:** `pnpm install` succeeds

---

### Task 1.2: Set Up Client Package
**File:** `packages/client/package.json`
```json
{
  "name": "@ghiceste/client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@discord/embedded-app-sdk": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

**File:** `packages/client/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  envPrefix: 'VITE_',
});
```

**File:** `packages/client/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**File:** `packages/client/index.html`
```html
<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ghicește</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Verification:** `pnpm --filter @ghiceste/client dev` starts Vite server

---

### Task 1.3: Set Up Server Package
**File:** `packages/server/package.json`
```json
{
  "name": "@ghiceste/server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.3.0",
    "wrangler": "^3.0.0"
  }
}
```

**File:** `packages/server/wrangler.toml`
```toml
name = "ghiceste-server"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "development"

# KV namespace for leaderboards (create with: wrangler kv:namespace create LEADERBOARDS)
# [[kv_namespaces]]
# binding = "LEADERBOARDS"
# id = "<your-namespace-id>"
```

**File:** `packages/server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

**Verification:** `pnpm --filter @ghiceste/server dev` starts Wrangler

---

### Task 1.4: Prepare Word List
**Source:** Download from https://dexonline.ro/static/download/scrabble/loc-reduse-6.0.zip

**Steps:**
1. Download and extract the LOC reduced forms (no diacritics)
2. Filter to exactly 5-letter words
3. Split into two lists:
   - `answerWords`: ~500 common words (for daily/session targets)
   - `validGuesses`: ~5000+ words (all valid 5-letter words)
4. Save as `data/words.json`:
   ```json
   {
     "answers": ["carte", "viata", "lumea", ...],
     "valid": ["carte", "viata", "lumea", "abeam", ...]
   }
   ```

**Script to create:** `scripts/prepare-words.ts`
- Reads the LOC file
- Filters to 5-letter words
- Outputs JSON

**Verification:** `data/words.json` exists with both arrays populated

---

## Phase 2: Discord Integration

### Task 2.1: Discord Developer Portal Setup
**Manual steps (document for Vlad):**
1. Go to https://discord.com/developers/applications
2. Create new application "Ghicește"
3. Under OAuth2, note the Client ID and generate a Client Secret
4. Under Activities:
   - Enable "Activities"
   - Set Platform: Web
   - Set URL Mappings:
     - Root: `https://<your-cloudflare-pages-url>`
     - `/api/*`: `https://<your-worker-url>/api/*`
5. Add `.env` file with:
   ```
   VITE_DISCORD_CLIENT_ID=<your-client-id>
   DISCORD_CLIENT_SECRET=<your-client-secret>
   ```

**Verification:** Application appears in Discord Developer Portal with Activities enabled

---

### Task 2.2: Discord SDK Initialization
**File:** `packages/client/src/lib/discord.ts`
```typescript
import { DiscordSDK } from '@discord/embedded-app-sdk';

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;

if (!clientId) {
  throw new Error('VITE_DISCORD_CLIENT_ID is required');
}

export const discordSdk = new DiscordSDK(clientId);

export async function initializeDiscord(): Promise<{
  instanceId: string;
  channelId: string;
  userId: string;
  username: string;
}> {
  await discordSdk.ready();

  // Authorize - request identify scope
  const { code } = await discordSdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify'],
  });

  // Exchange code for access token via our server
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const { access_token } = await response.json();

  // Authenticate with Discord
  const auth = await discordSdk.commands.authenticate({ access_token });

  return {
    instanceId: discordSdk.instanceId,
    channelId: discordSdk.channelId ?? '',
    userId: auth.user.id,
    username: auth.user.username,
  };
}
```

**Verification:** `initializeDiscord()` returns valid user data when running in Discord

---

### Task 2.3: OAuth Token Exchange Endpoint
**File:** `packages/server/src/routes/token.ts`
```typescript
import { Hono } from 'hono';

type Env = {
  DISCORD_CLIENT_SECRET: string;
  VITE_DISCORD_CLIENT_ID: string;
};

const token = new Hono<{ Bindings: Env }>();

token.post('/token', async (c) => {
  const { code } = await c.req.json<{ code: string }>();

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: c.env.VITE_DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    }),
  });

  const data = await response.json();
  return c.json({ access_token: data.access_token });
});

export default token;
```

**Verification:** POST to `/api/token` with valid code returns access_token

---

## Phase 3: Game Logic

### Task 3.1: Word Selection Endpoint
**File:** `packages/server/src/routes/game.ts`
```typescript
import { Hono } from 'hono';
import words from '../../../data/words.json';

const game = new Hono();

// Seeded random based on instance ID
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

game.get('/word/:instanceId', (c) => {
  const instanceId = c.req.param('instanceId');
  const index = Math.floor(seededRandom(instanceId) * words.answers.length);
  // Don't return the word - only use for validation
  return c.json({ wordIndex: index, totalWords: words.answers.length });
});

game.post('/validate', async (c) => {
  const { guess, instanceId } = await c.req.json<{
    guess: string;
    instanceId: string;
  }>();

  const normalizedGuess = guess.toLowerCase().trim();

  // Check if valid word
  if (!words.valid.includes(normalizedGuess)) {
    return c.json({ valid: false, error: 'Not a valid word' });
  }

  // Get the target word for this session
  const index = Math.floor(seededRandom(instanceId) * words.answers.length);
  const targetWord = words.answers[index];

  // Calculate letter states
  const result = calculateResult(normalizedGuess, targetWord);

  return c.json({
    valid: true,
    result,
    correct: normalizedGuess === targetWord,
  });
});

function calculateResult(
  guess: string,
  target: string
): Array<'correct' | 'present' | 'absent'> {
  const result: Array<'correct' | 'present' | 'absent'> = [];
  const targetLetters = target.split('');
  const guessLetters = guess.split('');

  // First pass: mark correct positions
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetters[i] = ''; // Mark as used
    }
  }

  // Second pass: mark present/absent
  for (let i = 0; i < 5; i++) {
    if (result[i]) continue;

    const letterIndex = targetLetters.indexOf(guessLetters[i]);
    if (letterIndex !== -1) {
      result[i] = 'present';
      targetLetters[letterIndex] = ''; // Mark as used
    } else {
      result[i] = 'absent';
    }
  }

  return result;
}

export default game;
```

**Verification:**
- GET `/api/word/:instanceId` returns consistent wordIndex for same instanceId
- POST `/api/validate` returns correct letter states

---

### Task 3.2: Client Game State
**File:** `packages/client/src/hooks/useGame.ts`
```typescript
import { useState, useCallback } from 'react';

export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export interface GameState {
  guesses: string[];
  results: LetterState[][];
  currentGuess: string;
  gameOver: boolean;
  won: boolean;
  startTime: number;
  endTime: number | null;
}

export function useGame(instanceId: string) {
  const [state, setState] = useState<GameState>({
    guesses: [],
    results: [],
    currentGuess: '',
    gameOver: false,
    won: false,
    startTime: Date.now(),
    endTime: null,
  });

  const addLetter = useCallback((letter: string) => {
    if (state.gameOver || state.currentGuess.length >= 5) return;
    setState((s) => ({ ...s, currentGuess: s.currentGuess + letter.toLowerCase() }));
  }, [state.gameOver, state.currentGuess.length]);

  const removeLetter = useCallback(() => {
    if (state.gameOver || state.currentGuess.length === 0) return;
    setState((s) => ({ ...s, currentGuess: s.currentGuess.slice(0, -1) }));
  }, [state.gameOver, state.currentGuess.length]);

  const submitGuess = useCallback(async () => {
    if (state.gameOver || state.currentGuess.length !== 5) return;

    const response = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess: state.currentGuess, instanceId }),
    });

    const data = await response.json();

    if (!data.valid) {
      // TODO: Show error toast
      return;
    }

    const newGuesses = [...state.guesses, state.currentGuess];
    const newResults = [...state.results, data.result];
    const won = data.correct;
    const gameOver = won || newGuesses.length >= 6;

    setState((s) => ({
      ...s,
      guesses: newGuesses,
      results: newResults,
      currentGuess: '',
      gameOver,
      won,
      endTime: gameOver ? Date.now() : null,
    }));

    return { gameOver, won, guesses: newGuesses.length };
  }, [state, instanceId]);

  const keyboardState = useCallback((): Record<string, LetterState> => {
    const states: Record<string, LetterState> = {};
    state.guesses.forEach((guess, i) => {
      guess.split('').forEach((letter, j) => {
        const current = state.results[i][j];
        const existing = states[letter];
        // Priority: correct > present > absent
        if (current === 'correct' || !existing) {
          states[letter] = current;
        } else if (current === 'present' && existing === 'absent') {
          states[letter] = current;
        }
      });
    });
    return states;
  }, [state.guesses, state.results]);

  return {
    state,
    addLetter,
    removeLetter,
    submitGuess,
    keyboardState,
  };
}
```

**Verification:** Hook correctly tracks game state and keyboard colors

---

## Phase 4: UI Components

### Task 4.1: Game Grid Component
**File:** `packages/client/src/components/Grid.tsx`
```typescript
import { LetterState } from '../hooks/useGame';

interface GridProps {
  guesses: string[];
  results: LetterState[][];
  currentGuess: string;
}

export function Grid({ guesses, results, currentGuess }: GridProps) {
  const rows = [];

  // Completed guesses
  for (let i = 0; i < guesses.length; i++) {
    rows.push(
      <Row key={i} word={guesses[i]} result={results[i]} />
    );
  }

  // Current guess row
  if (guesses.length < 6) {
    rows.push(
      <Row key={guesses.length} word={currentGuess.padEnd(5, ' ')} result={null} />
    );
  }

  // Empty rows
  for (let i = guesses.length + 1; i < 6; i++) {
    rows.push(
      <Row key={i} word="     " result={null} />
    );
  }

  return <div className="grid">{rows}</div>;
}

interface RowProps {
  word: string;
  result: LetterState[] | null;
}

function Row({ word, result }: RowProps) {
  return (
    <div className="row">
      {word.split('').map((letter, i) => (
        <Cell
          key={i}
          letter={letter}
          state={result?.[i] ?? 'empty'}
        />
      ))}
    </div>
  );
}

interface CellProps {
  letter: string;
  state: LetterState;
}

function Cell({ letter, state }: CellProps) {
  return (
    <div className={`cell cell-${state}`}>
      {letter.trim()}
    </div>
  );
}
```

**Verification:** Grid displays 6 rows × 5 columns with correct colors

---

### Task 4.2: Keyboard Component
**File:** `packages/client/src/components/Keyboard.tsx`
```typescript
import { LetterState } from '../hooks/useGame';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
];

interface KeyboardProps {
  onKey: (key: string) => void;
  letterStates: Record<string, LetterState>;
}

export function Keyboard({ onKey, letterStates }: KeyboardProps) {
  return (
    <div className="keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map((key) => (
            <Key
              key={key}
              value={key}
              state={letterStates[key] ?? 'empty'}
              onClick={() => onKey(key)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface KeyProps {
  value: string;
  state: LetterState;
  onClick: () => void;
}

function Key({ value, state, onClick }: KeyProps) {
  const isSpecial = value === 'enter' || value === 'backspace';
  const display = value === 'backspace' ? '⌫' : value.toUpperCase();

  return (
    <button
      className={`key ${isSpecial ? 'key-special' : ''} key-${state}`}
      onClick={onClick}
    >
      {display}
    </button>
  );
}
```

**Verification:** Keyboard renders with correct key colors based on guesses

---

### Task 4.3: Styles
**File:** `packages/client/src/styles/index.css`
```css
:root {
  --color-correct: #538d4e;
  --color-present: #b59f3b;
  --color-absent: #3a3a3c;
  --color-empty: #121213;
  --color-border: #3a3a3c;
  --color-text: #ffffff;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #121213;
  color: var(--color-text);
  font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
}

#root {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.header {
  font-size: 2rem;
  font-weight: bold;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  width: 100%;
  text-align: center;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 1rem 0;
}

.row {
  display: flex;
  gap: 5px;
}

.cell {
  width: 62px;
  height: 62px;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  text-transform: uppercase;
}

.cell-correct { background: var(--color-correct); border-color: var(--color-correct); }
.cell-present { background: var(--color-present); border-color: var(--color-present); }
.cell-absent { background: var(--color-absent); border-color: var(--color-absent); }
.cell-empty { background: transparent; }

.keyboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.key {
  height: 58px;
  min-width: 43px;
  padding: 0 0.5rem;
  border: none;
  border-radius: 4px;
  background: #818384;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
}

.key-special {
  min-width: 65px;
  font-size: 0.75rem;
}

.key-correct { background: var(--color-correct); }
.key-present { background: var(--color-present); }
.key-absent { background: var(--color-absent); }

.key:hover {
  opacity: 0.8;
}

.leaderboard {
  margin-top: 1rem;
  width: 100%;
  padding: 1rem;
  background: #1a1a1b;
  border-radius: 8px;
}

.leaderboard h2 {
  margin-bottom: 0.5rem;
}

.leaderboard-entry {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.leaderboard-entry:last-child {
  border-bottom: none;
}
```

**Verification:** Game looks like classic Wordle with dark theme

---

## Phase 5: Leaderboard

### Task 5.1: Leaderboard API
**File:** `packages/server/src/routes/leaderboard.ts`
```typescript
import { Hono } from 'hono';

type Env = {
  LEADERBOARDS: KVNamespace;
};

interface LeaderboardEntry {
  userId: string;
  username: string;
  guesses: number;
  timeMs: number;
  timestamp: number;
}

const leaderboard = new Hono<{ Bindings: Env }>();

leaderboard.post('/submit', async (c) => {
  const { instanceId, userId, username, guesses, timeMs } = await c.req.json<{
    instanceId: string;
    userId: string;
    username: string;
    guesses: number;
    timeMs: number;
  }>();

  const key = `session:${instanceId}`;
  const existing = await c.env.LEADERBOARDS.get(key, 'json') as LeaderboardEntry[] | null;
  const entries = existing ?? [];

  // Check if user already submitted
  const existingIndex = entries.findIndex((e) => e.userId === userId);
  if (existingIndex !== -1) {
    return c.json({ error: 'Already submitted' }, 400);
  }

  entries.push({
    userId,
    username,
    guesses,
    timeMs,
    timestamp: Date.now(),
  });

  // Sort: fewer guesses first, then faster time
  entries.sort((a, b) => {
    if (a.guesses !== b.guesses) return a.guesses - b.guesses;
    return a.timeMs - b.timeMs;
  });

  // Keep top 50
  const trimmed = entries.slice(0, 50);

  // Store with 24h expiry
  await c.env.LEADERBOARDS.put(key, JSON.stringify(trimmed), {
    expirationTtl: 86400,
  });

  const rank = trimmed.findIndex((e) => e.userId === userId) + 1;
  return c.json({ rank, total: trimmed.length });
});

leaderboard.get('/:instanceId', async (c) => {
  const instanceId = c.req.param('instanceId');
  const key = `session:${instanceId}`;
  const entries = await c.env.LEADERBOARDS.get(key, 'json') as LeaderboardEntry[] | null;

  return c.json({ entries: entries ?? [] });
});

export default leaderboard;
```

**Verification:**
- POST `/api/leaderboard/submit` stores score
- GET `/api/leaderboard/:instanceId` returns sorted entries

---

### Task 5.2: Leaderboard UI Component
**File:** `packages/client/src/components/Leaderboard.tsx`
```typescript
import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  guesses: number;
  timeMs: number;
}

interface LeaderboardProps {
  instanceId: string;
  currentUserId: string;
}

export function Leaderboard({ instanceId, currentUserId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leaderboard/${instanceId}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries);
        setLoading(false);
      });

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetch(`/api/leaderboard/${instanceId}`)
        .then((res) => res.json())
        .then((data) => setEntries(data.entries));
    }, 5000);

    return () => clearInterval(interval);
  }, [instanceId]);

  if (loading) return <div className="leaderboard">Loading...</div>;

  return (
    <div className="leaderboard">
      <h2>Clasament</h2>
      {entries.length === 0 ? (
        <p>Fii primul care termină!</p>
      ) : (
        entries.slice(0, 10).map((entry, i) => (
          <div
            key={entry.userId}
            className={`leaderboard-entry ${entry.userId === currentUserId ? 'current-user' : ''}`}
          >
            <span>
              {i + 1}. {entry.username}
            </span>
            <span>
              {entry.guesses}/6 • {formatTime(entry.timeMs)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
```

**Verification:** Leaderboard displays and updates in real-time

---

## Phase 6: Integration & Polish

### Task 6.1: Main App Component
**File:** `packages/client/src/App.tsx`
```typescript
import { useEffect, useState, useCallback } from 'react';
import { initializeDiscord } from './lib/discord';
import { useGame } from './hooks/useGame';
import { Grid } from './components/Grid';
import { Keyboard } from './components/Keyboard';
import { Leaderboard } from './components/Leaderboard';
import './styles/index.css';

interface DiscordUser {
  instanceId: string;
  userId: string;
  username: string;
}

export default function App() {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDiscord()
      .then((data) => {
        setUser({
          instanceId: data.instanceId,
          userId: data.userId,
          username: data.username,
        });
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!user) {
    return <div className="loading">Se încarcă...</div>;
  }

  return <Game user={user} />;
}

function Game({ user }: { user: DiscordUser }) {
  const { state, addLetter, removeLetter, submitGuess, keyboardState } = useGame(user.instanceId);
  const [submitted, setSubmitted] = useState(false);

  const handleKey = useCallback((key: string) => {
    if (key === 'enter') {
      submitGuess().then((result) => {
        if (result?.gameOver && result.won && !submitted) {
          // Submit to leaderboard
          fetch('/api/leaderboard/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instanceId: user.instanceId,
              userId: user.userId,
              username: user.username,
              guesses: result.guesses,
              timeMs: state.endTime! - state.startTime,
            }),
          });
          setSubmitted(true);
        }
      });
    } else if (key === 'backspace') {
      removeLetter();
    } else {
      addLetter(key);
    }
  }, [submitGuess, removeLetter, addLetter, user, state, submitted]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKey('enter');
      } else if (e.key === 'Backspace') {
        handleKey('backspace');
      } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        handleKey(e.key.toLowerCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKey]);

  return (
    <>
      <header className="header">GHICEȘTE</header>
      <Grid
        guesses={state.guesses}
        results={state.results}
        currentGuess={state.currentGuess}
      />
      <Keyboard onKey={handleKey} letterStates={keyboardState()} />
      {state.gameOver && (
        <Leaderboard instanceId={user.instanceId} currentUserId={user.userId} />
      )}
    </>
  );
}
```

**Verification:** Full game flow works in Discord Activity

---

### Task 6.2: Server Entry Point
**File:** `packages/server/src/index.ts`
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import token from './routes/token';
import game from './routes/game';
import leaderboard from './routes/leaderboard';

type Env = {
  DISCORD_CLIENT_SECRET: string;
  VITE_DISCORD_CLIENT_ID: string;
  LEADERBOARDS: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

app.route('/api', token);
app.route('/api', game);
app.route('/api/leaderboard', leaderboard);

app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
```

**Verification:** All API routes work correctly

---

### Task 6.3: Local Development Setup
**File:** `package.json` (root)
```json
{
  "name": "ghiceste",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "tunnel": "cloudflared tunnel --url http://localhost:5173"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**Steps to run locally:**
1. Install cloudflared: `brew install cloudflared`
2. `pnpm install`
3. `pnpm dev` (in one terminal)
4. `pnpm tunnel` (in another terminal)
5. Update Discord Developer Portal with tunnel URL
6. Launch activity in Discord

**Verification:** Activity launches and works in Discord

---

## Phase 7: Deployment

### Task 7.1: Cloudflare Setup
**Steps:**
1. Create Cloudflare account (if needed)
2. Create KV namespace:
   ```bash
   cd packages/server
   pnpm wrangler kv:namespace create LEADERBOARDS
   ```
3. Update `wrangler.toml` with namespace ID
4. Set secrets:
   ```bash
   pnpm wrangler secret put DISCORD_CLIENT_SECRET
   pnpm wrangler secret put VITE_DISCORD_CLIENT_ID
   ```

**Verification:** `pnpm wrangler whoami` shows account

---

### Task 7.2: Deploy Worker
**Steps:**
```bash
cd packages/server
pnpm deploy
```

Note the worker URL (e.g., `https://ghiceste-server.<account>.workers.dev`)

**Verification:** `curl https://<worker-url>/health` returns `{"status":"ok"}`

---

### Task 7.3: Deploy Client to Cloudflare Pages
**Steps:**
1. Connect GitHub repo to Cloudflare Pages
2. Configure build:
   - Build command: `pnpm build`
   - Build output: `packages/client/dist`
   - Root directory: `/`
3. Set environment variables in Pages dashboard:
   - `VITE_DISCORD_CLIENT_ID`

Or deploy manually:
```bash
cd packages/client
pnpm build
pnpm wrangler pages deploy dist --project-name=ghiceste
```

**Verification:** Pages URL loads the app

---

### Task 7.4: Final Discord Configuration
**Steps:**
1. Update Discord Developer Portal Activity URL mappings:
   - Root: `https://ghiceste.pages.dev` (your Pages URL)
   - `/api/*` → `https://ghiceste-server.<account>.workers.dev/api/*`
2. Test in Discord

**Verification:** Activity launches from Discord and full game flow works

---

## Summary

| Phase | Tasks | Est. Files |
|-------|-------|------------|
| 1. Foundation | Project setup, packages, word list | 15 |
| 2. Discord | Portal setup, SDK init, OAuth | 2 |
| 3. Game Logic | Word selection, validation, state | 2 |
| 4. UI | Grid, Keyboard, Styles | 3 |
| 5. Leaderboard | API + UI | 2 |
| 6. Integration | App component, server entry | 2 |
| 7. Deployment | Cloudflare setup | Config |

**Total new files:** ~26

**External dependencies:**
- Discord Developer Portal account
- Cloudflare account
- cloudflared (for local tunneling)

**Sources:**
- [Discord Embedded App SDK](https://github.com/discord/embedded-app-sdk)
- [Discord SDK Examples](https://github.com/discord/embedded-app-sdk-examples)
- [Dexonline Scrabble Word List](https://dexonline.ro/scrabble)
