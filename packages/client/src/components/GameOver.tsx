import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './GameOver.css';

interface GameOverProps {
  won: boolean;
  guesses: number;
  instanceId: string;
  onPlayAgain: () => void;
}

export function GameOver({ won, guesses, instanceId, onPlayAgain }: GameOverProps) {
  const [word, setWord] = useState<string | null>(null);

  useEffect(() => {
    // Always fetch the word
    fetch(`/api/reveal/${instanceId}`)
      .then((res) => res.json())
      .then((data) => setWord(data.word))
      .catch(() => {
        // Fallback in case of API issue or local dev setup
        fetch(`/reveal/${instanceId}`)
          .then((res) => res.json())
          .then((data) => setWord(data.word));
      });
  }, [instanceId]);

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        {won ? (
          <>
            <h2 className="game-over-title win">Felicitări!</h2>
            <p>Ai ghicit în {guesses} {guesses === 1 ? 'încercare' : 'încercări'}!</p>
          </>
        ) : (
          <>
            <h2 className="game-over-title lose">Ai pierdut!</h2>
          </>
        )}
        <p>Cuvântul a fost:</p>
        <p className="revealed-word">{word?.toUpperCase() || '...'}</p>
        <div className="modal-buttons">
          <button onClick={onPlayAgain}>Joacă din nou</button>
          <Link to="/leaderboard" className="button">Clasament</Link>
        </div>
      </div>
    </div>
  );
}