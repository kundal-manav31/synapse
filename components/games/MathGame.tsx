'use client';

import { useState, useEffect, useRef } from 'react';
import type { MathConfig } from '@/lib/puzzle-generator';

interface Props {
  config: MathConfig;
  onComplete: (score: number) => void;
}

type Phase = 'question' | 'feedback';

export default function MathGame({ config, onComplete }: Props) {
  const [problemIndex, setProblemIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [timeLeft, setTimeLeft] = useState(config.timePerProblem);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentProblem = config.problems[problemIndex];
  const totalProblems = config.problems.length;

  // Per-problem countdown
  useEffect(() => {
    if (phase !== 'question') return;
    if (timeLeft <= 0) {
      handleAnswer(null);
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 100), 100);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  function handleAnswer(answer: number | null) {
    if (phase !== 'question') return;
    const isCorrect = answer === currentProblem.answer;

    // Speed bonus: up to 20 extra points if answered quickly
    const timeRatio = timeLeft / config.timePerProblem;
    const speedBonus = isCorrect ? Math.round(timeRatio * 20) : 0;

    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    const newPoints = totalPoints + (isCorrect ? 80 + speedBonus : 0);

    setCorrectCount(newCorrect);
    setTotalPoints(newPoints);
    setSelectedOption(answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPhase('feedback');

    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      if (problemIndex + 1 >= totalProblems) {
        const score = Math.min(100, Math.round(newPoints / totalProblems));
        onCompleteRef.current(score);
      } else {
        setProblemIndex(i => i + 1);
        setTimeLeft(config.timePerProblem);
        setPhase('question');
      }
    }, 800);
  }

  const progressFraction = timeLeft / config.timePerProblem;

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

      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{problemIndex + 1} / {totalProblems}</span>
        <span className="text-slate-500 tabular-nums">{Math.ceil(timeLeft / 1000)}s</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">Solve it</p>

        {/* Expression */}
        <div className={`text-5xl sm:text-6xl font-bold tracking-tight transition-all duration-200 ${
          feedback === 'correct' ? 'text-green-400' :
          feedback === 'wrong' ? 'text-red-400' : 'text-white'
        }`}>
          {currentProblem.expression}
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {currentProblem.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrectAnswer = option === currentProblem.answer;

            let btnClass = 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 text-white';
            if (feedback !== null) {
              if (isCorrectAnswer) {
                btnClass = 'bg-green-500/20 border-2 border-green-500 text-green-300';
              } else if (isSelected && feedback === 'wrong') {
                btnClass = 'bg-red-500/20 border-2 border-red-500 text-red-400';
              } else {
                btnClass = 'bg-slate-800/50 border-2 border-slate-800 text-slate-500';
              }
            }

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={phase === 'feedback'}
                className={`h-16 rounded-2xl text-2xl font-bold transition-all duration-150 active:scale-95 disabled:cursor-default ${btnClass}`}
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
