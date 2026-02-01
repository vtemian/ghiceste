import { useEffect, useState } from 'react';

interface GameOverProps {
  won: boolean;
  guesses: number;
  instanceId: string;
}

export function GameOver({ won, guesses, instanceId }: GameOverProps) {
  const [word, setWord] = useState<string | null>(null);

  useEffect(() => {
    if (!won) {
      fetch(`/api/reveal/${instanceId}`)
        .then((res) => res.json())
        .then((data) => setWord(data.word))
        .catch(() => {
          fetch(`/reveal/${instanceId}`)
            .then((res) => res.json())
            .then((data) => setWord(data.word));
        });
    }
  }, [won, instanceId]);

  return (
    <div className="game-over">
      {won ? (
        <>
          <h2 className="game-over-title win">Felicitări!</h2>
          <p>Ai ghicit în {guesses} {guesses === 1 ? 'încercare' : 'încercări'}!</p>
        </>
      ) : (
        <>
          <h2 className="game-over-title lose">Game Over</h2>
          <p>Cuvântul era:</p>
          <p className="revealed-word">{word?.toUpperCase() || '...'}</p>
        </>
      )}
    </div>
  );
}
