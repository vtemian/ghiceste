import { useEffect, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useGame } from './hooks/useGame';
import { Grid } from './components/Grid';
import { Keyboard } from './components/Keyboard';
import { GameOver } from './components/GameOver';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LeaderboardPreview } from './components/LeaderboardPreview';
import { HardModeToggle } from './components/HardModeToggle';
import { HardModeInfoModal } from './components/HardModeInfoModal';
import { AchievementsPage } from './pages/AchievementsPage';
import { HelpTooltip } from './components/HelpTooltip';

import './styles/index.css';
import './components/LeaderboardPreview.css';
import './components/HardModeToggle.css';
import './components/HardModeInfoModal.css';
import './pages/AchievementsPage.css';
import './components/HelpTooltip.css';

interface DiscordUser {
  instanceId: string;
  userId: string;
  username: string;
}

// Check if running inside Discord iframe
function isInDiscord(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('frame_id');
}

// Mock user for local development
function getMockUser(): DiscordUser {
  return {
    instanceId: 'local-dev-session',
    userId: 'local-user-123',
    username: 'LocalDev',
  };
}

export default function App() {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInDiscord()) {
      // Running in Discord - use real SDK
      import('./lib/discord').then(({ initializeDiscord }) => {
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
      });
    } else {
      // Local dev mode - use mock user
      console.log('Running in local dev mode (not in Discord)');
      setUser(getMockUser());
    }
  }, []);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!user) {
    return <div className="loading">Se încarcă...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<GamePage user={user} />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/achievements" element={<AchievementsPage />} />
    </Routes>
  );
}

function GamePage({ user }: { user: DiscordUser }) {
  const { state, addLetter, removeLetter, submitGuess, getHint, keyboardState, resetGame, toggleHardMode } = useGame(user.instanceId, user.userId);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showHardModeInfo, setShowHardModeInfo] = useState(false);

  const handleToggleHardMode = () => {
    if (!state.hardMode && state.guesses.length === 0) {
      setShowHardModeInfo(true);
    }
    toggleHardMode();
  };
  
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleGetHint = async () => {
    const result = await getHint();
    if (result?.error) {
      showToast(result.error);
    }
  };

  const hintHelpText = "Butonul de 'Indiciu' va dezvălui o literă corectă pe care nu ai descoperit-o deja. Poți folosi un singur indiciu pentru fiecare rând, începând cu a treia încercare. Fiecare indiciu folosit va adăuga o penalizare la scorul final.";

  const handleKey = useCallback((key: string) => {
    if (state.gameOver) return;

    if (key === 'enter') {
      submitGuess().then((result) => {
        if (!result) return;

        if ('error' in result) {
          showToast(result.error as string);
          return;
        }

        if (result.gameOver) {
          setShowGameOver(true);
          if (result.won && !submitted) {
            fetch('/api/leaderboard/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instanceId: user.instanceId,
                userId: user.userId,
                username: user.username,
                guesses: result.guesses,
                timeMs: result.timeMs,
                hintsUsed: state.hintsUsed,
              }),
            })
            .then(res => res.json())
            .then(data => {
              if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
                data.newlyUnlocked.forEach((ach: any, index: number) => {
                  setTimeout(() => {
                    showToast(`🏆 Realizare Deblocată: ${ach.name}`);
                  }, (index + 1) * 1500); // Stagger notifications
                });
              }
            });
            
            setSubmitted(true);
          }
        }
      });
    } else if (key === 'backspace') {
      removeLetter();
    } else {
      addLetter(key);
    }
  }, [submitGuess, removeLetter, addLetter, user, state, submitted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
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

  const handlePlayAgain = () => {
    resetGame();
    setShowGameOver(false);
    setSubmitted(false);
  };

  return (
    <>
      <HardModeToggle
        isHardMode={state.hardMode}
        onToggle={handleToggleHardMode}
        disabled={state.guesses.length > 0}
      />
      {showHardModeInfo && <HardModeInfoModal onClose={() => setShowHardModeInfo(false)} />}
      <div className="game-layout">
        <div className="game-container">
          <header className="header">
            GHICEȘTE
          </header>
          <div className="game-controls">
            <button 
              className="hint-button" 
              onClick={handleGetHint}
              disabled={state.guesses.length < 3 || state.gameOver || state.hintUsedForCurrentTry || state.hardMode}
            >
              Indiciu ({state.hintsUsed})
            </button>
            <HelpTooltip text={hintHelpText} />
          </div>
          {toast && <div className="toast">{toast}</div>}
          <Grid
            guesses={state.guesses}
            results={state.results}
            currentGuess={state.currentGuess}
            hardMode={state.hardMode}
            lockedLetters={state.lockedLetters}
            gameOver={state.gameOver}
          />
          <Keyboard onKey={handleKey} letterStates={keyboardState()} />
          {showGameOver && (
            <GameOver
              won={state.won}
              guesses={state.guesses.length}
              instanceId={user.instanceId}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </div>
        <LeaderboardPreview instanceId={user.instanceId} currentUserId={user.userId} />
      </div>
    </>
  );
}