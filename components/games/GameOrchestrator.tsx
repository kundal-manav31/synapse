'use client';

import { useState, useRef } from 'react';
import type { DailyPuzzleConfig } from '@/lib/puzzle-generator';
import type { DomainScores } from '@/types';
import MemoryGame from './MemoryGame';
import SpeedGame from './SpeedGame';
import PatternGame from './PatternGame';
import MathGame from './MathGame';
import StroopGame from './StroopGame';

interface Props {
  config: DailyPuzzleConfig;
  startTime: number;
  onComplete: (scores: DomainScores, completionTimeMs: number) => void;
}

const GAME_META = [
  { key: 'memory' as const, label: 'Memory', icon: '🔢', tagline: 'Recall the sequence' },
  { key: 'speed'  as const, label: 'Speed',  icon: '⚡', tagline: 'Tap the right shapes' },
  { key: 'pattern'as const, label: 'Pattern',icon: '🎯', tagline: 'Predict the next shape' },
  { key: 'math'   as const, label: 'Math',   icon: '🧮', tagline: 'Solve it fast' },
  { key: 'stroop' as const, label: 'Stroop', icon: '🎭', tagline: 'Name the ink color' },
];

type OrchestratorPhase = 'playing' | 'between';

export default function GameOrchestrator({ config, startTime, onComplete }: Props) {
  const [gameIndex, setGameIndex] = useState(0);
  const [phase, setPhase] = useState<OrchestratorPhase>('playing');
  const [scores, setScores] = useState<Partial<DomainScores>>({});
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  function handleGameComplete(score: number) {
    const key = GAME_META[gameIndex].key;
    const newScores = { ...scores, [key]: score };
    setScores(newScores);
    setLastScore(score);

    if (gameIndex + 1 >= GAME_META.length) {
      // All games done
      const finalScores: DomainScores = {
        memory:  newScores.memory  ?? 0,
        speed:   newScores.speed   ?? 0,
        pattern: newScores.pattern ?? 0,
        math:    newScores.math    ?? 0,
        stroop:  newScores.stroop  ?? 0,
      };
      onCompleteRef.current(finalScores, Date.now() - startTime);
      return;
    }

    setPhase('between');
    // Fade out, advance, fade in
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setGameIndex(i => i + 1);
        setPhase('playing');
        setVisible(true);
      }, 300);
    }, 1400);
  }

  const currentMeta = GAME_META[gameIndex];
  const nextMeta = GAME_META[gameIndex + 1];

  return (
    <div className="flex flex-col h-full">
      {/* Global progress bar — segments */}
      <div className="flex gap-1 px-4 pt-3 pb-2">
        {GAME_META.map((g, i) => (
          <div
            key={g.key}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < gameIndex ? 'bg-violet-500' :
              i === gameIndex ? (phase === 'between' ? 'bg-violet-500' : 'bg-violet-400/60') :
              'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Game label */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentMeta.icon}</span>
          <span className="text-sm font-semibold text-slate-300">{currentMeta.label}</span>
        </div>
        <span className="text-xs text-slate-500">{gameIndex + 1} / {GAME_META.length}</span>
      </div>

      {/* Game content */}
      <div
        className={`flex-1 relative transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {phase === 'playing' && (
          <div className="h-full" key={gameIndex}>
            {gameIndex === 0 && (
              <MemoryGame config={config.memory} onComplete={handleGameComplete} />
            )}
            {gameIndex === 1 && (
              <SpeedGame config={config.speed} onComplete={handleGameComplete} />
            )}
            {gameIndex === 2 && (
              <PatternGame config={config.pattern} onComplete={handleGameComplete} />
            )}
            {gameIndex === 3 && (
              <MathGame config={config.math} onComplete={handleGameComplete} />
            )}
            {gameIndex === 4 && (
              <StroopGame config={config.stroop} onComplete={handleGameComplete} />
            )}
          </div>
        )}

        {phase === 'between' && (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
            <div className="text-5xl">{currentMeta.icon}</div>
            <div className="text-center">
              <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">
                {currentMeta.label} complete
              </p>
              <p className={`text-5xl font-black ${
                (lastScore ?? 0) >= 80 ? 'text-green-400' :
                (lastScore ?? 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {lastScore ?? 0}
              </p>
              <p className="text-slate-500 text-sm mt-1">out of 100</p>
            </div>
            {nextMeta && (
              <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                <span>Up next:</span>
                <span className="text-white font-semibold">
                  {nextMeta.icon} {nextMeta.label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
