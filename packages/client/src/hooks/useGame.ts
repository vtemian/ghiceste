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
  hardMode: boolean;
  lockedLetters: (string | null)[];
  hintsUsed: number;
  hintUsedForCurrentTry: boolean;
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
    hardMode: false,
    lockedLetters: Array(5).fill(null),
    hintsUsed: 0,
    hintUsedForCurrentTry: false,
  });

  const toggleHardMode = useCallback(() => {
    // Can only toggle at the start of a game
    if (state.guesses.length === 0) {
      setState((s) => ({ ...s, hardMode: !s.hardMode, lockedLetters: Array(5).fill(null) }));
    }
  }, [state.guesses.length]);

  const resetGame = useCallback(() => {
    setState((s) => ({ // Keep hardMode setting on reset
      guesses: [],
      results: [],
      currentGuess: '',
      gameOver: false,
      won: false,
      startTime: Date.now(),
      endTime: null,
      hardMode: s.hardMode,
      lockedLetters: Array(5).fill(null),
      hintsUsed: 0,
      hintUsedForCurrentTry: false,
    }));
  }, []);

  const addLetter = useCallback((letter: string) => {
    if (state.gameOver) return;

    const lockedCount = state.lockedLetters.filter(Boolean).length;
    if (state.currentGuess.length >= 5 - lockedCount) return;

    setState((s) => ({ ...s, currentGuess: s.currentGuess + letter.toLowerCase() }));
  }, [state.gameOver, state.currentGuess.length, state.lockedLetters]);

  const removeLetter = useCallback(() => {
    if (state.gameOver || state.currentGuess.length === 0) return;
    setState((s) => ({ ...s, currentGuess: s.currentGuess.slice(0, -1) }));
  }, [state.gameOver, state.currentGuess.length]);

  const submitGuess = useCallback(async () => {
    let fullGuess = '';
    let guessInputIndex = 0;
    for (let i = 0; i < 5; i++) {
      if (state.lockedLetters[i]) {
        fullGuess += state.lockedLetters[i];
      } else {
        fullGuess += state.currentGuess[guessInputIndex] || '';
        guessInputIndex++;
      }
    }

    if (state.gameOver || fullGuess.length !== 5) return;

    const response = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess: fullGuess, instanceId }),
    });

    const data = await response.json();

    if (!data.valid) {
      return { error: data.error };
    }

    const newGuesses = [...state.guesses, fullGuess];
    const newResults = [...state.results, data.result];
    const won = data.correct;
    const gameOver = won || newGuesses.length >= 6;
    const endTime = gameOver ? Date.now() : null;
    const timeMs = endTime ? endTime - state.startTime : 0;

    // Update locked letters if in hard mode
    const newLockedLetters = [...state.lockedLetters];
    if (state.hardMode) {
      data.result.forEach((result: LetterState, i: number) => {
        if (result === 'correct') {
          newLockedLetters[i] = fullGuess[i];
        }
      });
    }

    setState((s) => ({
      ...s,
      guesses: newGuesses,
      results: newResults,
      currentGuess: '', // Reset for next attempt
      gameOver,
      won,
      endTime,
      lockedLetters: newLockedLetters,
      hintUsedForCurrentTry: false, // Reset for next try
    }));

    return { gameOver, won, guesses: newGuesses.length, timeMs };
  }, [state, instanceId]);

  const getHint = useCallback(async () => {
    if (state.gameOver) return { error: 'Jocul s-a terminat.' };
    if (state.hintUsedForCurrentTry) return { error: 'Poți folosi un singur indiciu pe încercare.' };

    const response = await fetch('/api/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceId,
        results: state.results,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { error: data.error || 'Nu s-a putut obține un indiciu.' };
    }

    const { letter, position } = await response.json();

    const newLockedLetters = [...state.lockedLetters];
    if (!newLockedLetters[position]) {
      newLockedLetters[position] = letter;
      setState((s) => ({
        ...s,
        lockedLetters: newLockedLetters,
        hintsUsed: s.hintsUsed + 1,
        hintUsedForCurrentTry: true,
      }));
    }
    return {}; // Success
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
    getHint,
    keyboardState,
    resetGame,
    toggleHardMode,
  };
}
