import type { LetterState } from '../hooks/useGame';

interface GridProps {
  guesses: string[];
  results: LetterState[][];
  currentGuess: string;
}

export function Grid({ guesses, results, currentGuess }: GridProps) {
  const rows = [];

  for (let i = 0; i < guesses.length; i++) {
    rows.push(<Row key={i} word={guesses[i]} result={results[i]} />);
  }

  if (guesses.length < 6) {
    rows.push(
      <Row key={guesses.length} word={currentGuess.padEnd(5, ' ')} result={null} />
    );
  }

  for (let i = guesses.length + 1; i < 6; i++) {
    rows.push(<Row key={i} word="     " result={null} />);
  }

  return <div className="grid">{rows}</div>;
}

interface RowProps {
  word: string;
  result: LetterState[] | null;
}

function Row({ word, result }: RowProps) {
  return (
    <div className="row">
      {word.split('').map((letter, i) => (
        <Cell key={i} letter={letter} state={result?.[i] ?? 'empty'} />
      ))}
    </div>
  );
}

interface CellProps {
  letter: string;
  state: LetterState;
}

function Cell({ letter, state }: CellProps) {
  return <div className={`cell cell-${state}`}>{letter.trim()}</div>;
}
