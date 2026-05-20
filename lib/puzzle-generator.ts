import seedrandom from 'seedrandom';

export interface MemoryConfig {
  sequences: number[][];
  displayTime: number;
  rounds: number;
}

export interface SpeedConfig {
  targets: { x: number; y: number; color: string; shape: 'circle' | 'square' | 'triangle' }[];
  targetColor: string;
  timeLimit: number;
}

export interface PatternConfig {
  rounds: { sequence: string[]; options: string[]; answer: string }[];
}

export interface MathConfig {
  problems: { expression: string; answer: number; options: number[] }[];
  timePerProblem: number;
}

export interface StroopConfig {
  trials: { word: string; inkColor: string; answer: string }[];
  timePerTrial: number;
}

export interface DailyPuzzleConfig {
  date: string;
  seed: number;
  difficulty: number;
  memory: MemoryConfig;
  speed: SpeedConfig;
  pattern: PatternConfig;
  math: MathConfig;
  stroop: StroopConfig;
}

export function generateDailyPuzzle(date: string, difficulty: number = 5): DailyPuzzleConfig {
  const dateNum = parseInt(date.replace(/-/g, ''));
  const seed = dateNum % 999983;
  const rng = seedrandom(seed.toString());

  const rand = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

  return {
    date,
    seed,
    difficulty,
    memory: generateMemoryConfig(rand, difficulty),
    speed: generateSpeedConfig(rand, difficulty),
    pattern: generatePatternConfig(rand, difficulty, rng),
    math: generateMathConfig(rand, difficulty),
    stroop: generateStroopConfig(rand, difficulty),
  };
}

function generateMemoryConfig(rand: (a: number, b: number) => number, diff: number): MemoryConfig {
  const sequenceLength = 3 + Math.floor(diff / 2);
  const rounds = 3;
  return {
    sequences: Array.from({ length: rounds }, () =>
      Array.from({ length: sequenceLength }, () => rand(1, 9))
    ),
    displayTime: Math.max(1000, 3000 - diff * 150),
    rounds,
  };
}

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];

function generateSpeedConfig(rand: (a: number, b: number) => number, diff: number): SpeedConfig {
  const targetColor = COLORS[rand(0, COLORS.length - 1)];
  const totalTargets = 8 + diff * 2;
  const minTargets = 3; // guarantee at least 3 of the target color

  // Assign colors: first minTargets slots are target color, rest random
  const colors = Array.from({ length: totalTargets }, (_, i) =>
    i < minTargets ? targetColor : COLORS[rand(0, COLORS.length - 1)]
  );

  // Fisher-Yates shuffle the color assignments using seeded RNG
  for (let i = colors.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  return {
    targets: Array.from({ length: totalTargets }, (_, i) => ({
      x: rand(5, 90),
      y: rand(10, 90),
      color: colors[i],
      shape: (['circle', 'square', 'triangle'] as const)[rand(0, 2)],
    })),
    targetColor,
    timeLimit: Math.max(8000, 20000 - diff * 800),
  };
}

const SHAPES = ['◆', '●', '▲', '■', '★', '◯', '▼', '◇'];

function generatePatternConfig(
  rand: (a: number, b: number) => number,
  diff: number,
  rng: seedrandom.PRNG
): PatternConfig {
  const rounds = 3;
  return {
    rounds: Array.from({ length: rounds }, () => {
      const base = [SHAPES[rand(0, 3)], SHAPES[rand(4, 7)]];
      const repeats = 2 + Math.floor(diff / 3);
      const sequence = Array.from({ length: repeats * 2 }, (_, i) => base[i % 2]);
      const answer = base[repeats * 2 % 2];
      const distractors = SHAPES.filter(s => s !== answer).slice(0, 3);
      const options = [...distractors, answer].sort(() => rng() - 0.5);
      return { sequence: [...sequence, '?'], options, answer };
    }),
  };
}

function generateMathConfig(rand: (a: number, b: number) => number, diff: number): MathConfig {
  const count = 4 + Math.floor(diff / 2);
  const problems = Array.from({ length: count }, () => {
    const a = rand(1, 10 + diff * 5);
    const b = rand(1, 10 + diff * 3);
    const ops = diff < 4 ? ['+', '-'] : diff < 7 ? ['+', '-', '*'] : ['+', '-', '*', '/'];
    const op = ops[rand(0, ops.length - 1)];
    let answer: number;
    let expression: string;
    if (op === '/') {
      answer = a;
      expression = `${a * b} ÷ ${b}`;
    } else if (op === '*') {
      answer = a * b;
      expression = `${a} × ${b}`;
    } else if (op === '-') {
      answer = a - b;
      expression = `${Math.max(a, b)} - ${Math.min(a, b)}`;
    } else {
      answer = a + b;
      expression = `${a} + ${b}`;
    }
    const distractors = [answer + rand(1, 5), answer - rand(1, 5), answer + rand(6, 12)];
    const options = [...distractors, answer].sort(() => rand(0, 1) - 0.5);
    return { expression, answer, options };
  });
  return { problems, timePerProblem: Math.max(3000, 8000 - diff * 400) };
}

const COLOR_WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];
export const HEX: Record<string, string> = {
  RED: '#ef4444',
  BLUE: '#3b82f6',
  GREEN: '#22c55e',
  YELLOW: '#eab308',
  PURPLE: '#a855f7',
};

function generateStroopConfig(rand: (a: number, b: number) => number, diff: number): StroopConfig {
  const count = 5 + diff;
  const trials = Array.from({ length: count }, () => {
    const word = COLOR_WORDS[rand(0, COLOR_WORDS.length - 1)];
    const inkColor = COLOR_WORDS[rand(0, COLOR_WORDS.length - 1)];
    return { word, inkColor, answer: inkColor };
  });
  return { trials, timePerTrial: Math.max(1500, 4000 - diff * 200) };
}
