'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpeedConfig } from '@/lib/puzzle-generator';

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
};

interface Props {
  config: SpeedConfig;
  onComplete: (score: number) => void;
}

export default function SpeedGame({ config, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [wrongTaps, setWrongTaps] = useState(0);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const targetCount = config.targets.filter(t => t.color === config.targetColor).length;

  const finish = useCallback((tappedSet: Set<number>, wrongs: number) => {
    const correctTaps = config.targets.filter(
      (t, i) => tappedSet.has(i) && t.color === config.targetColor
    ).length;
    const score = Math.max(0, Math.min(100,
      Math.round((correctTaps / Math.max(1, targetCount)) * 100 - wrongs * 10)
    ));
    onCompleteRef.current(score);
  }, [config.targets, config.targetColor, targetCount]);

  // Countdown timer
  useEffect(() => {
    if (done) return;
    if (timeLeft <= 0) {
      setDone(true);
      // Use latest state via callback
      setTapped(t => { finish(t, wrongTaps); return t; });
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 100), 100);
    return () => clearTimeout(id);
  }, [timeLeft, done, wrongTaps, finish]);

  // Finish early if all targets tapped
  useEffect(() => {
    if (done) return;
    if (tapped.size >= targetCount && targetCount > 0) {
      const allCorrect = config.targets.every(
        (t, i) => t.color !== config.targetColor || tapped.has(i)
      );
      if (allCorrect) {
        setDone(true);
        finish(tapped, wrongTaps);
      }
    }
  }, [tapped, targetCount, done, wrongTaps, config.targets, config.targetColor, finish]);

  const handleTap = useCallback((index: number) => {
    if (done || tapped.has(index)) return;
    const isCorrect = config.targets[index].color === config.targetColor;
    setTapped(prev => new Set([...prev, index]));
    if (!isCorrect) setWrongTaps(w => w + 1);
  }, [done, tapped, config.targets, config.targetColor]);

  const progressFraction = timeLeft / config.timeLimit;
  const secs = Math.ceil(timeLeft / 1000);

  return (
    <div className="flex flex-col h-full">
      {/* Timer bar */}
      <div className="h-1 bg-slate-800">
        <div
          className={`h-full transition-all duration-100 ${
            progressFraction > 0.5 ? 'bg-violet-500' :
            progressFraction > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${progressFraction * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Tap all</p>
          <p className="text-xl font-bold" style={{ color: COLOR_HEX[config.targetColor] }}>
            {config.targetColor.toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Time left</p>
          <p className={`text-xl font-bold tabular-nums ${secs <= 3 ? 'text-red-400' : 'text-white'}`}>
            {secs}s
          </p>
        </div>
      </div>

      {/* Game canvas */}
      <div className="relative flex-1 mx-3 mb-3 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {config.targets.map((target, i) => {
          const isTapped = tapped.has(i);
          const isCorrectColor = target.color === config.targetColor;
          const displayColor = isTapped
            ? (isCorrectColor ? '#22c55e' : '#ef4444')
            : COLOR_HEX[target.color];

          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              disabled={done || isTapped}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 active:scale-90 ${
                isTapped ? 'scale-90 opacity-50' : 'scale-100 opacity-100'
              }`}
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
              aria-label={`${target.color} ${target.shape}`}
            >
              <ShapeIcon shape={target.shape} color={displayColor} />
            </button>
          );
        })}

        {done && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">Time&apos;s up!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShapeIcon({ shape, color }: { shape: 'circle' | 'square' | 'triangle'; color: string }) {
  const size = 46;
  if (shape === 'circle') {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color }} />
    );
  }
  if (shape === 'square') {
    return (
      <div style={{ width: size, height: size, borderRadius: 8, backgroundColor: color }} />
    );
  }
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
      }}
    />
  );
}
