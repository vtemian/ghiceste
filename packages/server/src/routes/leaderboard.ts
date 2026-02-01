import { Hono } from 'hono';
import type { Env, LeaderboardEntry } from '../types';

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

  entries.sort((a, b) => {
    if (a.guesses !== b.guesses) return a.guesses - b.guesses;
    return a.timeMs - b.timeMs;
  });

  const trimmed = entries.slice(0, 50);

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
