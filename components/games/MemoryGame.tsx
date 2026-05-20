'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MemoryConfig } from '@/lib/puzzle-generator';

interface Props {
  config: MemoryConfig;
  onComplete: (score: number) => void;
}

type Phase = 'showing' | 'inputting' | 'feedback';

export default function MemoryGame({ config, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('showing');
  const [showIndex, setShowIndex] = useState(0);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentSequence = config.sequences[round];
  const perDigitTime = Math.max(400, config.displayTime / currentSequence.length);

  // Show digits one at a time
  useEffect(() => {
    if (phase !== 'showing') return;
    if (showIndex >= currentSequence.length) {
      const t = setTimeout(() => setPhase('inputting'), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowIndex(i => i + 1), perDigitTime);
    return () => clearTimeout(t);
  }, [showIndex, phase, currentSequence.length, perDigitTime]);

  const handleDigit = useCallback((digit: number) => {
    if (phase !== 'inputting') return;
    const next = [...userInput, digit];
    setUserInput(next);

    if (next.length < currentSequence.length) return;

    const isCorrect = next.every((d, i) => d === currentSequence[i]);
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(newCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPhase('feedback');

    setTimeout(() => {
      setFeedback(null);
      if (round + 1 >= config.rounds) {
        onCompleteRef.current(Math.round((newCorrect / config.rounds) * 100));
      } else {
        setRound(r => r + 1);
        setShowIndex(0);
        setUserInput([]);
        setPhase('showing');
      }
    }, 900);
  }, [phase, userInput, currentSequence, correctCount, round, config.rounds]);

  const handleBackspace = useCallback(() => {
    if (phase !== 'inputting') return;
    setUserInput(u => u.slice(0, -1));
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-between h-full py-6 px-4 gap-6">
      {/* Round indicator */}
      <div className="flex gap-2">
        {Array.from({ length: config.rounds }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < round ? 'bg-violet-500' : i === round ? 'bg-violet-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm">
        {phase === 'showing' && (
          <>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
              Memorize the sequence
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {currentSequence.map((digit, i) => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-bold transition-all duration-300 ${
                    i < showIndex
                      ? 'bg-violet-600 text-white scale-100 shadow-lg shadow-violet-900'
                      : 'bg-slate-800 text-slate-600 scale-90'
                  }`}
                >
                  {i < showIndex ? digit : '?'}
                </div>
              ))}
            </div>
          </>
        )}

        {(phase === 'inputting' || phase === 'feedback') && (
          <>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
              Repeat the sequence
            </p>

            {/* Input display */}
            <div className="flex gap-3 flex-wrap justify-center">
              {currentSequence.map((_, i) => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-bold border-2 transition-all duration-200 ${
                    feedback === 'correct'
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : feedback === 'wrong' && userInput[i] !== undefined
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : userInput[i] !== undefined
                      ? 'border-violet-500 bg-violet-600/20 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-transparent'
                  }`}
                >
                  {userInput[i] ?? '·'}
                </div>
              ))}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  disabled={phase === 'feedback' || userInput.length >= currentSequence.length}
                  className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-2xl font-bold transition-all duration-100 disabled:opacity-40 select-none"
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleDigit(0)}
                disabled={phase === 'feedback' || userInput.length >= currentSequence.length}
                className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-2xl font-bold transition-all duration-100 disabled:opacity-40 select-none"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                disabled={phase === 'feedback'}
                className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 text-xl font-bold transition-all duration-100 disabled:opacity-40 select-none"
              >
                ⌫
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
