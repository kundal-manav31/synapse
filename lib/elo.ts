const K_FACTOR = 32;
const BASE_ELO = 1000;

export interface EloResult {
  newElo: number;
  eloChange: number;
}

export function calculateElo(currentElo: number, normalizedScore: number): EloResult {
  const actualScore = normalizedScore >= 60 ? 1 : normalizedScore >= 40 ? 0.5 : 0;
  const expectedScore = 1 / (1 + Math.pow(10, (BASE_ELO - currentElo) / 400));
  const eloChange = Math.round(K_FACTOR * (actualScore - expectedScore));
  const newElo = Math.max(100, currentElo + eloChange);
  return { newElo, eloChange };
}

export function calculateCompositeScore(scores: {
  memory: number;
  speed: number;
  pattern: number;
  math: number;
  stroop: number;
}): number {
  const weights = { memory: 0.25, speed: 0.15, pattern: 0.25, math: 0.20, stroop: 0.15 };
  return Math.round(
    scores.memory * weights.memory +
    scores.speed * weights.speed +
    scores.pattern * weights.pattern +
    scores.math * weights.math +
    scores.stroop * weights.stroop
  );
}

export function getEloTier(elo: number): { tier: string; color: string; emoji: string } {
  if (elo >= 2000) return { tier: 'Grandmaster', color: '#f59e0b', emoji: '👑' };
  if (elo >= 1800) return { tier: 'Master', color: '#8b5cf6', emoji: '💎' };
  if (elo >= 1600) return { tier: 'Expert', color: '#3b82f6', emoji: '🏆' };
  if (elo >= 1400) return { tier: 'Advanced', color: '#10b981', emoji: '⚡' };
  if (elo >= 1200) return { tier: 'Intermediate', color: '#6b7280', emoji: '🧠' };
  return { tier: 'Beginner', color: '#9ca3af', emoji: '🌱' };
}
