'use client';

import { useState, useEffect, useRef } from 'react';
import type { PatternConfig } from '@/lib/puzzle-generator';

const ROUND_TIME = 5000;

interface Props {
  config: PatternConfig;
  onComplete: (score: number) => void;
}

type Phase = 'question' | 'feedback';

export default function PatternGame({ config, onComplete }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentRound = config.rounds[roundIndex];
  const totalRounds = config.rounds.length;

  // Per-round countdown
  useEffect(() => {
    if (phase !== 'question') return;
    if (timeLeft <= 0) {
      handleAnswer(null); // time expired = wrong
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 100), 100);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  function handleAnswer(answer: string | null) {
    if (phase !== 'question') return;
    const isCorrect = answer === currentRound.answer;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(newCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPhase('feedback');

    setTimeout(() => {
      setFeedback(null);
      if (roundIndex + 1 >= totalRounds) {
        onCompleteRef.current(Math.round((newCorrect / totalRounds) * 100));
      } else {
        setRoundIndex(i => i + 1);
        setTimeLeft(ROUND_TIME);
        setPhase('question');
      }
    }, 900);
  }

  const progressFraction = timeLeft / ROUND_TIME;

  return (
    <div className="flex flex-col h-full px-4 py-4 gap-4">
      {/* Timer bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            progressFraction > 0.5 ? 'bg-violet-500' :
            progressFraction > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${progressFraction * 100}%` }}
        />
      </div>

      {/* Round indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Round {roundIndex + 1} of {totalRounds}</span>
        <span className="text-slate-500 tabular-nums">{Math.ceil(timeLeft / 1000)}s</span>
      </div>

      {/* Pattern sequence */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
          What comes next?
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {currentRound.sequence.map((shape, i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all duration-300 ${
                shape === '?'
                  ? 'bg-violet-600/30 border-2 border-violet-500 border-dashed text-violet-400'
                  : 'bg-slate-800 text-white'
              }`}
            >
              {shape}
            </div>
          ))}
        </div>

        {/* Answer options */}
        <div className={`grid grid-cols-2 gap-3 w-full max-w-xs transition-all duration-200 ${
          phase === 'feedback' ? 'pointer-events-none' : ''
        }`}>
          {currentRound.options.map((option) => {
            const isChosen = feedback !== null && option === currentRound.answer && feedback === 'correct';
            const isWrong = feedback === 'wrong' && option !== currentRound.answer;

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={phase === 'feedback'}
                className={`h-16 rounded-2xl text-3xl font-bold transition-all duration-200 active:scale-95 ${
                  feedback !== null && option === currentRound.answer
                    ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                    : feedback === 'wrong' && !isWrong
                    ? 'bg-red-500/10 border-2 border-slate-700 text-slate-500'
                    : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 text-white'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
