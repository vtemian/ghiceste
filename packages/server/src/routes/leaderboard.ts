import { Hono } from 'hono';
import type { Env, LeaderboardEntry } from '../types';

const leaderboard = new Hono<{ Bindings: Env }>();

leaderboard.post('/submit', async (c) => {
  const { instanceId, userId, username, guesses, timeMs, hintsUsed } = await c.req.json<
    LeaderboardEntry & { instanceId: string }
  >();

  if (!userId || !username || guesses === undefined || timeMs === undefined) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const key = `session:${instanceId}`;
  const existing = await c.env.LEADERBOARDS.get(key, 'json') as LeaderboardEntry[] | null;
  const entries = existing ?? [];
  
  const newEntry: LeaderboardEntry = {
    userId,
    username,
    guesses,
    timeMs,
    timestamp: Date.now(),
    hintsUsed: hintsUsed || 0,
  };
  
  const existingIndex = entries.findIndex((e) => e.userId === userId);
  
  if (existingIndex !== -1) {
    const existingEntry = entries[existingIndex];
    const existingScore = (existingEntry.guesses || 6) + (existingEntry.hintsUsed || 0);
    const newScore = newEntry.guesses + newEntry.hintsUsed;
    
    // Update only if new score is better (lower is better)
    if (newScore < existingScore || (newScore === existingScore && newEntry.timeMs < existingEntry.timeMs)) {
      entries[existingIndex] = newEntry;
    }
  } else {
    entries.push(newEntry);
  }

  entries.sort((a, b) => {
    const scoreA = (a.guesses || 6) + (a.hintsUsed || 0);
    const scoreB = (b.guesses || 6) + (b.hintsUsed || 0);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.timeMs - b.timeMs;
  });

  await c.env.LEADERBOARDS.put(key, JSON.stringify(entries.slice(0, 100)));

  return c.json({ success: true });
});

leaderboard.get('/:instanceId', async (c) => {
  const instanceId = c.req.param('instanceId');
  const key = `session:${instanceId}`;
  const entries = await c.env.LEADERBOARDS.get(key, 'json') as LeaderboardEntry[] | null;

  return c.json({ entries: entries ?? [] });
});

export default leaderboard;
