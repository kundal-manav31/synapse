'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { StroopConfig } from '@/lib/puzzle-generator';
import { HEX } from '@/lib/puzzle-generator';

interface Props {
  config: StroopConfig;
  onComplete: (score: number) => void;
}

type Phase = 'question' | 'feedback';

const ALL_COLORS = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];

function buildOptions(answer: string): string[] {
  const others = ALL_COLORS.filter(c => c !== answer);
  // Simple deterministic shuffle based on answer string
  const seed = answer.charCodeAt(0);
  const shuffled = [...others].sort((a, b) =>
    ((seed * a.charCodeAt(0)) % 7) - ((seed * b.charCodeAt(0)) % 7)
  );
  const result = [shuffled[0], shuffled[1], shuffled[2], answer];
  return result.sort((a, b) =>
    ((seed * 31 + a.charCodeAt(1)) % 5) - ((seed * 31 + b.charCodeAt(1)) % 5)
  );
}

export default function StroopGame({ config, onComplete }: Props) {
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [timeLeft, setTimeLeft] = useState(config.timePerTrial);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentTrial = config.trials[trialIndex];
  const totalTrials = config.trials.length;

  // Pre-compute options for each trial once
  const trialOptions = useMemo(() =>
    config.trials.map(trial => buildOptions(trial.answer)),
    [config.trials]
  );

  // Per-trial countdown
  useEffect(() => {
    if (phase !== 'question') return;
    if (timeLeft <= 0) {
      handleAnswer(null);
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 100), 100);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  function handleAnswer(answer: string | null) {
    if (phase !== 'question') return;
    const isCorrect = answer === currentTrial.answer;

    // Speed bonus: faster = more points (max 100/trial, min 50)
    const timeRatio = timeLeft / config.timePerTrial;
    const trialScore = isCorrect ? Math.round(50 + timeRatio * 50) : 0;
    const newScore = score + trialScore;

    setScore(newScore);
    setSelectedColor(answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setPhase('feedback');

    setTimeout(() => {
      setFeedback(null);
      setSelectedColor(null);
      if (trialIndex + 1 >= totalTrials) {
        const finalScore = Math.min(100, Math.round(newScore / totalTrials));
        onCompleteRef.current(finalScore);
      } else {
        setTrialIndex(i => i + 1);
        setTimeLeft(config.timePerTrial);
        setPhase('question');
      }
    }, 700);
  }

  const progressFraction = timeLeft / config.timePerTrial;
  const options = trialOptions[trialIndex] ?? [];

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

      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{trialIndex + 1} / {totalTrials}</span>
        <span className="text-slate-500 tabular-nums">{Math.ceil(timeLeft / 1000)}s</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
          What color is the <span className="text-white">ink</span>?
        </p>

        {/* The Stroop word */}
        <div
          className={`text-6xl sm:text-7xl font-black tracking-tight transition-all duration-200 ${
            feedback === 'correct' ? 'scale-110' :
            feedback === 'wrong' ? 'opacity-50' : 'scale-100'
          }`}
          style={{ color: HEX[currentTrial.inkColor] ?? '#fff' }}
        >
          {currentTrial.word}
        </div>

        {/* Color buttons */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {options.map((color) => {
            const isSelected = selectedColor === color;
            const isCorrectAnswer = color === currentTrial.answer;

            let btnStyle: React.CSSProperties = { backgroundColor: HEX[color] ?? '#888' };
            let btnClass = 'opacity-100';

            if (feedback !== null) {
              if (isCorrectAnswer) {
                btnClass = 'ring-4 ring-white ring-offset-2 ring-offset-slate-950';
              } else if (isSelected && feedback === 'wrong') {
                btnClass = 'opacity-30';
              } else {
                btnClass = 'opacity-20';
              }
            }

            return (
              <button
                key={color}
                onClick={() => handleAnswer(color)}
                disabled={phase === 'feedback'}
                className={`h-16 rounded-2xl text-white font-bold text-sm tracking-wider transition-all duration-150 active:scale-95 disabled:cursor-default ${btnClass}`}
                style={btnStyle}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
