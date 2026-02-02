import { Hono } from 'hono';
import words from '../../../../data/words.json';
import type { Env } from '../types';

interface GameSession {
  results: Array<Array<'correct' | 'present' | 'absent'>>;
  hintsUsed: number;
}

const game = new Hono<{ Bindings: Env }>();

function getSessionKey(instanceId: string, userId: string): string {
  return `game:${instanceId}:${userId}`;
}

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
  return c.json({ wordIndex: index, totalWords: words.answers.length });
});

game.get('/reveal/:instanceId', (c) => {
  const instanceId = c.req.param('instanceId');
  const index = Math.floor(seededRandom(instanceId) * words.answers.length);
  const word = words.answers[index];
  return c.json({ word });
});

game.post('/validate', async (c) => {
  const { guess, instanceId, userId } = await c.req.json<{
    guess: string;
    instanceId: string;
    userId?: string;
  }>();

  const normalizedGuess = guess.toLowerCase().trim();

  if (!words.valid.includes(normalizedGuess)) {
    return c.json({ valid: false, error: 'Not a valid word' });
  }

  const index = Math.floor(seededRandom(instanceId) * words.answers.length);
  const targetWord = words.answers[index];
  const result = calculateResult(normalizedGuess, targetWord);

  // Store result in KV if userId is provided
  if (userId) {
    const sessionKey = getSessionKey(instanceId, userId);
    const existing = await c.env.LEADERBOARDS.get(sessionKey, 'json') as GameSession | null;
    const session: GameSession = existing ?? { results: [], hintsUsed: 0 };
    session.results.push(result);
    await c.env.LEADERBOARDS.put(sessionKey, JSON.stringify(session), { expirationTtl: 86400 }); // 24h TTL
  }

  return c.json({
    valid: true,
    result,
    correct: normalizedGuess === targetWord,
  });
});

game.post('/hint', async (c) => {
  const { instanceId, userId, results: clientResults } = await c.req.json<{
    instanceId: string;
    userId?: string;
    results?: Array<Array<'correct' | 'present' | 'absent'>>;
  }>();

  const index = Math.floor(seededRandom(instanceId) * words.answers.length);
  const targetWord = words.answers[index];

  // Prefer server-side results if userId is provided
  let results: Array<Array<'correct' | 'present' | 'absent'>> = [];
  let session: GameSession | null = null;

  if (userId) {
    const sessionKey = getSessionKey(instanceId, userId);
    session = await c.env.LEADERBOARDS.get(sessionKey, 'json') as GameSession | null;
    if (session) {
      results = session.results;
    }
  }

  // Fallback to client results for backward compatibility (but log warning)
  if (results.length === 0 && clientResults) {
    results = clientResults;
  }

  // Find all indices of letters that are NOT yet correct
  const knownCorrectIndices = new Set<number>();
  results.forEach(row => {
    row.forEach((status, i) => {
      if (status === 'correct') {
        knownCorrectIndices.add(i);
      }
    });
  });

  const availableHintIndices = [0, 1, 2, 3, 4].filter(i => !knownCorrectIndices.has(i));

  if (availableHintIndices.length === 0) {
    return c.json({ error: 'No hints available' }, 400);
  }

  // Pick a random available index to reveal
  const hintIndex = availableHintIndices[Math.floor(Math.random() * availableHintIndices.length)];
  const hintLetter = targetWord[hintIndex];

  // Increment hints used in KV
  if (userId) {
    const sessionKey = getSessionKey(instanceId, userId);
    const currentSession: GameSession = session ?? { results: [], hintsUsed: 0 };
    currentSession.hintsUsed += 1;
    await c.env.LEADERBOARDS.put(sessionKey, JSON.stringify(currentSession), { expirationTtl: 86400 });
  }

  return c.json({
    letter: hintLetter,
    position: hintIndex,
  });
});

function calculateResult(
  guess: string,
  target: string
): Array<'correct' | 'present' | 'absent'> {
  const result: Array<'correct' | 'present' | 'absent'> = [];
  const targetLetters = target.split('');
  const guessLetters = guess.split('');

  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      targetLetters[i] = '';
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i]) continue;
    const letterIndex = targetLetters.indexOf(guessLetters[i]);
    if (letterIndex !== -1) {
      result[i] = 'present';
      targetLetters[letterIndex] = '';
    } else {
      result[i] = 'absent';
    }
  }

  return result;
}

export default game;
