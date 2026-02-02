import { Hono } from 'hono';
import { Env, LeaderboardEntry } from '../types';
import {
  ALL_ACHIEVEMENTS,
  checkAndGrantAchievements,
  UserAchievements,
} from '../achievements';

const achievements = new Hono<{ Bindings: Env }>();

// GET a user's achievements
achievements.get('/:userId', async (c) => {
  const { userId } = c.req.param();
  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  const data = await c.env.ACHIEVEMENTS.get(userId, 'json') as UserAchievements | null;

  if (!data) {
    return c.json({
      userId,
      unlocked: [],
      winStreak: 0,
      totalWins: 0,
    });
  }

  // Return full achievement details, not just IDs
  const unlockedWithDetails = data.unlocked.map(id => ALL_ACHIEVEMENTS[id]);

  return c.json({
    ...data,
    unlocked: unlockedWithDetails,
  });
});

// POST a game result to check for new achievements
achievements.post('/update', async (c) => {
  const { userId, won, guesses, timeMs, results } = await c.req.json<{
    userId: string;
    won: boolean;
    guesses: number;
    timeMs: number;
    results: Array<Array<'correct' | 'present' | 'absent'>>;
  }>();

  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  const currentUserData = await c.env.ACHIEVEMENTS.get(userId, 'json') as UserAchievements | null;

  const gameResult = { won, guesses, timeMs, results };
  const { updatedData, newlyUnlocked } = checkAndGrantAchievements(gameResult, currentUserData);

  updatedData.userId = userId; // Ensure userId is set

  await c.env.ACHIEVEMENTS.put(userId, JSON.stringify(updatedData));

  const newlyUnlockedWithDetails = newlyUnlocked.map(id => ALL_ACHIEVEMENTS[id]);

  // Return the achievements that were just unlocked
  return c.json({
    newlyUnlocked: newlyUnlockedWithDetails,
  });
});

export default achievements;
