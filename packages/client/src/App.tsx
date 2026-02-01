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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleKey = useCallback((key: string) => {
    if (key === 'enter') {
      submitGuess().then((result) => {
        if (!result) return;

        if ('error' in result) {
          showToast(result.error as string);
          return;
        }

        if (result.gameOver && result.won && !submitted) {
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
      {toast && <div className="toast">{toast}</div>}
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
