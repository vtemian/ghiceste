import { LetterState } from '../hooks/useGame';

const ROWS = 6;
const COLS = 5;

interface GridProps {
  guesses: string[];
  results: LetterState[][];
  currentGuess: string;
  hardMode: boolean;
  lockedLetters: (string | null)[];
  gameOver: boolean;
}

export function Grid({ guesses, results, currentGuess, hardMode, lockedLetters, gameOver }: GridProps) {
  const currentGuessRow = guesses.length;

  const getDisplayGuess = () => {
    let display = '';
    let guessInputIndex = 0;
    for (let i = 0; i < COLS; i++) {
      if (lockedLetters[i]) {
        display += lockedLetters[i];
      } else {
        display += currentGuess[guessInputIndex] || ' ';
        guessInputIndex++;
      }
    }
    return display.padEnd(COLS, ' ');
  };

  const displayGuess = getDisplayGuess();

  return (
    <div className="grid">
      {Array.from({ length: ROWS }).map((_, rowIndex) => (
        <div key={rowIndex} className="row">
          {Array.from({ length: COLS }).map((_, colIndex) => {
            const isCurrentRow = !gameOver && rowIndex === currentGuessRow;
            const letter = isCurrentRow
              ? displayGuess[colIndex]
              : guesses[rowIndex]?.[colIndex] || '';
            
            let state = isCurrentRow ? '' : results[rowIndex]?.[colIndex] || '';
            let isFilled = isCurrentRow && displayGuess[colIndex] !== ' ';

            // If it's the current row and the letter is locked (either by hard mode or a hint), style it as correct
            if (isCurrentRow && lockedLetters[colIndex]) {
              state = 'correct';
              isFilled = true; // Ensure it gets the filled border style
            }

            return (
              <div
                key={colIndex}
                className={`cell cell-${state} ${isFilled ? 'cell-filled' : ''}`}
              >
                {letter}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
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
  const hasLetter = letter.trim() !== '';
  const classes = `cell cell-${state}${hasLetter && state === 'empty' ? ' cell-filled' : ''}`;
  return <div className={classes}>{letter.trim()}</div>;
}
