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
  const display = value === 'backspace' ? '⌫' : value.toUpperCase();

  return (
    <button
      className={`key ${isSpecial ? 'key-special' : ''} key-${state}`}
      onClick={onClick}
    >
      {display}
    </button>
  );
}
