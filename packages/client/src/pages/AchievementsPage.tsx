import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AchievementsPage.css';

// Mirroring the backend definitions for simplicity
const ALL_ACHIEVEMENTS = {
  FIRST_WIN: { id: 'FIRST_WIN', name: 'Prima Victorie', description: 'Câștigă primul tău joc.' },
  STREAK_3: { id: 'STREAK_3', name: 'În Serie', description: 'Câștigă 3 jocuri la rând.' },
  STREAK_5: { id: 'STREAK_5', name: 'De Neoprit', description: 'Câștigă 5 jocuri la rând.' },
  QUICK_SOLVER: { id: 'QUICK_SOLVER', name: 'Contra Cronometru', description: 'Rezolvă puzzle-ul în mai puțin de 30 de secunde.' },
  PERFECT_GUESS: { id: 'PERFECT_GUESS', name: 'Ghinionist Norocos', description: 'Ghicește cuvântul din a doua încercare.' },
  FLAWLESS_GAME: { id: 'FLAWLESS_GAME', name: 'Joc Perfect', description: 'Câștigă un joc fără a avea vreo literă marcată ca "absentă".' },
};

interface Achievement {
  id: string;
  name: string;
  description: string;
}

// ... (imports and definitions)
interface UserAchievements {
  unlocked: Achievement[];
  winStreak: number;
  dayStreak: number; // Added
  totalWins: number;
}

export const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<UserAchievements | null>(null);
// ... (useEffects)
// ...
  return (
    <div className="achievements-page">
      <header className="header">
// ...
      </header>
      <main>
        {loading ? (
          <p>Se încarcă realizările...</p>
        ) : achievements ? (
          <>
            <div className="stats-container">
              <div className="stat-card">
                <h4>Total Victorii</h4>
                <p>{achievements.totalWins}</p>
              </div>
              <div className="stat-card">
                <h4>Serie Victorii</h4>
                <p>{achievements.winStreak}</p>
              </div>
              <div className="stat-card">
                <h4>Zile Consecutive</h4>
                <p>{achievements.dayStreak}</p>
              </div>
            </div>
            <div className="achievements-grid">
              {Object.values(ALL_ACHIEVEMENTS).map(ach => (
                <div key={ach.id} className={`achievement-card ${unlockedIds.has(ach.id) ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon">🏆</div>
                  <h3>{ach.name}</h3>
                  <p>{ach.description}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Nu am putut încărca datele.</p>
        )}
      </main>
    </div>
  );
};

