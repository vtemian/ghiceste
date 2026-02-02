import { useState, useCallback } from 'react';

export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export interface GameState {
  guesses: string[];
  results: LetterState[][];
  currentGuess: string;
  gameOver: boolean;
  won: boolean;
  startTime: number;
  endTime: number | null;
}

export function useGame(instanceId: string) {
  const [state, setState] = useState<GameState>({
    guesses: [],
    results: [],
    currentGuess: '',
    gameOver: false,
    won: false,
    startTime: Date.now(),
    endTime: null,
  });

  const resetGame = useCallback(() => {
    setState({
      guesses: [],
      results: [],
      currentGuess: '',
      gameOver: false,
      won: false,
      startTime: Date.now(),
      endTime: null,
    });
  }, []);

  const addLetter = useCallback((letter: string) => {
    if (state.gameOver || state.currentGuess.length >= 5) return;
    setState((s) => ({ ...s, currentGuess: s.currentGuess + letter.toLowerCase() }));
  }, [state.gameOver, state.currentGuess.length]);

  const removeLetter = useCallback(() => {
    if (state.gameOver || state.currentGuess.length === 0) return;
    setState((s) => ({ ...s, currentGuess: s.currentGuess.slice(0, -1) }));
  }, [state.gameOver, state.currentGuess.length]);

  const submitGuess = useCallback(async () => {
    if (state.gameOver || state.currentGuess.length !== 5) return;

    const response = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess: state.currentGuess, instanceId }),
    });

    const data = await response.json();

    if (!data.valid) {
      return { error: data.error };
    }

    const newGuesses = [...state.guesses, state.currentGuess];
    const newResults = [...state.results, data.result];
    const won = data.correct;
    const gameOver = won || newGuesses.length >= 6;
    const endTime = gameOver ? Date.now() : null;
    const timeMs = endTime ? endTime - state.startTime : 0;

    setState((s) => ({
      ...s,
      guesses: newGuesses,
      results: newResults,
      currentGuess: '',
      gameOver,
      won,
      endTime,
    }));

    return { gameOver, won, guesses: newGuesses.length, timeMs };
  }, [state, instanceId]);

  const keyboardState = useCallback((): Record<string, LetterState> => {
    const states: Record<string, LetterState> = {};
    state.guesses.forEach((guess, i) => {
      guess.split('').forEach((letter, j) => {
        const current = state.results[i][j];
        const existing = states[letter];
        if (current === 'correct' || !existing) {
          states[letter] = current;
        } else if (current === 'present' && existing === 'absent') {
          states[letter] = current;
        }
      });
    });
    return states;
  }, [state.guesses, state.results]);

  return {
    state,
    addLetter,
    removeLetter,
    submitGuess,
    keyboardState,
    resetGame,
  };
}
