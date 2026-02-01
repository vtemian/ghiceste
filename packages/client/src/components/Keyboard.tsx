import type { LetterState } from '../hooks/useGame';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
];

interface KeyboardProps {
  onKey: (key: string) => void;
  letterStates: Record<string, LetterState>;
}

export function Keyboard({ onKey, letterStates }: KeyboardProps) {
  return (
    <div className="keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map((key) => (
            <Key
              key={key}
              value={key}
              state={letterStates[key] ?? 'empty'}
              onClick={() => onKey(key)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface KeyProps {
  value: string;
  state: LetterState;
  onClick: () => void;
}

function Key({ value, state, onClick }: KeyProps) {
  const isSpecial = value === 'enter' || value === 'backspace';

  const content = value === 'backspace' ? (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
      <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"/>
    </svg>
  ) : value.toUpperCase();

  return (
    <button
      className={`key ${isSpecial ? 'key-special' : ''} key-${state}`}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
