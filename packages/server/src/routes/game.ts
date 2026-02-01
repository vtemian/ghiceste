import { Hono } from 'hono';
import words from '../../../../data/words.json';

const game = new Hono();

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

game.post('/validate', async (c) => {
  const { guess, instanceId } = await c.req.json<{
    guess: string;
    instanceId: string;
  }>();

  const normalizedGuess = guess.toLowerCase().trim();

  if (!words.valid.includes(normalizedGuess)) {
    return c.json({ valid: false, error: 'Not a valid word' });
  }

  const index = Math.floor(seededRandom(instanceId) * words.answers.length);
  const targetWord = words.answers[index];
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
