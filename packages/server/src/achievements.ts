// src/achievements.ts

export type AchievementID = 
  | 'FIRST_WIN'
  | 'STREAK_3'
  | 'STREAK_5'
  | 'QUICK_SOLVER' // e.g., under 30 seconds
  | 'PERFECT_GUESS' // Solved in 2 guesses
  | 'FLAWLESS_GAME'; // No absent letters in any guess

export interface Achievement {
  id: AchievementID;
  name: string;
  description: string;
}

export interface UserAchievements {
  userId: string;
  unlocked: AchievementID[];
  winStreak: number; // Consecutive wins
  dayStreak: number; // Consecutive days with a win
  lastWinTimestamp: number; // Timestamp of the last win
  totalWins: number;
}

export const ALL_ACHIEVEMENTS: Record<AchievementID, Achievement> = {
  FIRST_WIN: {
    id: 'FIRST_WIN',
    name: 'Prima Victorie',
    description: 'Câștigă primul tău joc.',
  },
  STREAK_3: {
    id: 'STREAK_3',
    name: 'În Serie',
    description: 'Câștigă 3 jocuri la rând.',
  },
  STREAK_5: {
    id: 'STREAK_5',
    name: 'De Neoprit',
    description: 'Câștigă 5 jocuri la rând.',
  },
  QUICK_SOLVER: {
    id: 'QUICK_SOLVER',
    name: 'Contra Cronometru',
    description: 'Rezolvă puzzle-ul în mai puțin de 30 de secunde.',
  },
  PERFECT_GUESS: {
    id: 'PERFECT_GUESS',
    name: 'Ghinionist Norocos',
    description: 'Ghicește cuvântul din a doua încercare.',
  },
  FLAWLESS_GAME: {
    id: 'FLAWLESS_GAME',
    name: 'Joc Perfect',
    description: 'Câștigă un joc fără a avea vreo literă marcată ca "absentă".',
  },
};

interface GameResult {
  won: boolean;
  guesses: number;
  timeMs: number;
  results: Array<Array<'correct' | 'present' | 'absent'>>;
}

// Helper to check if two timestamps are on consecutive days
const areOnConsecutiveDays = (ts1: number, ts2: number) => {
  const d1 = new Date(ts1);
  d1.setHours(0, 0, 0, 0); // Normalize to start of day
  const d2 = new Date(ts2);
  d2.setHours(0, 0, 0, 0); // Normalize to start of day
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
};

// Helper to check if two timestamps are on the same day
const areOnSameDay = (ts1: number, ts2: number) => {
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

export function checkAndGrantAchievements(
  result: GameResult,
  currentUserData: UserAchievements | null
): { updatedData: UserAchievements; newlyUnlocked: AchievementID[] } {
  const data: UserAchievements = currentUserData || {
    userId: '', // This will be set by the caller
    unlocked: [],
    winStreak: 0,
    dayStreak: 0,
    lastWinTimestamp: 0,
    totalWins: 0,
  };

  const newlyUnlocked: AchievementID[] = [];
  const hasAchievement = (id: AchievementID) => data.unlocked.includes(id);
  const now = Date.now();

  if (result.won) {
    // --- Update stats ---
    data.winStreak += 1;
    data.totalWins += 1;

    // --- Day Streak Logic ---
    if (data.lastWinTimestamp > 0) {
      if (areOnConsecutiveDays(data.lastWinTimestamp, now)) {
        data.dayStreak += 1; // It's the next day, increment streak
      } else if (!areOnSameDay(data.lastWinTimestamp, now)) {
        data.dayStreak = 1; // It's not the same day or the next day, so reset streak to 1
      }
      // If it's the same day, do nothing to the day streak.
    } else {
      data.dayStreak = 1; // First win ever
    }
    data.lastWinTimestamp = now; // Update last win time

    // --- Check for new achievements ---

    // FIRST_WIN
    if (data.totalWins === 1 && !hasAchievement('FIRST_WIN')) {
      newlyUnlocked.push('FIRST_WIN');
    }

    // STREAK_3
    if (data.winStreak >= 3 && !hasAchievement('STREAK_3')) {
      newlyUnlocked.push('STREAK_3');
    }
    
    // STREAK_5
    if (data.winStreak >= 5 && !hasAchievement('STREAK_5')) {
      newlyUnlocked.push('STREAK_5');
    }

    // QUICK_SOLVER
    if (result.timeMs < 30000 && !hasAchievement('QUICK_SOLVER')) {
      newlyUnlocked.push('QUICK_SOLVER');
    }

    // PERFECT_GUESS (2 guesses is standard for this type of achievement)
    if (result.guesses === 2 && !hasAchievement('PERFECT_GUESS')) {
      newlyUnlocked.push('PERFECT_GUESS');
    }

    // FLAWLESS_GAME
    const hasAbsentLetter = result.results.flat().some(r => r === 'absent');
    if (!hasAbsentLetter && !hasAchievement('FLAWLESS_GAME')) {
      newlyUnlocked.push('FLAWLESS_GAME');
    }

  } else {
    // Game was lost, reset consecutive win streak
    data.winStreak = 0;
  }
  
  data.unlocked.push(...newlyUnlocked);

  return { updatedData: data, newlyUnlocked };
}
