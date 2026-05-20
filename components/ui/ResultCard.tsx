'use client';

import { useRef, useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { getEloTier } from '@/lib/elo';
import { track } from '@/lib/analytics';

// Day 1 = launch date
const LAUNCH_MS = new Date('2026-05-20T00:00:00Z').getTime();
function getDayNumber(): number {
  return Math.max(1, Math.floor((Date.now() - LAUNCH_MS) / 86_400_000) + 1);
}

function makeBar(score: number): string {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

interface Scores {
  memory: number;
  speed: number;
  pattern: number;
  math: number;
  stroop: number;
}

interface Props {
  scores: Scores;
  totalScore: number;
  eloBefore: number;
  eloAfter: number;
  eloChange: number;
  globalRank?: number;
  percentile?: number;
  streak?: number;
}

const DOMAINS = [
  { key: 'memory'  as const, label: 'Memory',  icon: '🔢' },
  { key: 'speed'   as const, label: 'Speed',   icon: '⚡' },
  { key: 'pattern' as const, label: 'Pattern', icon: '🎯' },
  { key: 'math'    as const, label: 'Math',    icon: '🧮' },
  { key: 'stroop'  as const, label: 'Stroop',  icon: '🎭' },
];

export default function ResultCard({
  scores, totalScore, eloBefore, eloAfter, eloChange,
  globalRank, percentile, streak,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const dayNumber = getDayNumber();
  const tier = getEloTier(eloAfter);

  /* ─── Share text (emoji version, like Wordle) ─────────────────────── */
  function buildShareText(): string {
    const lines = [
      `🧠 SYNAPSE Day ${dayNumber}`,
      streak && streak > 0 ? `🔥 ${streak} day streak` : null,
      '',
      ...DOMAINS.map(d => `${d.icon} ${makeBar(scores[d.key])} ${scores[d.key]}`),
      '',
      `Total: ${totalScore}/100${percentile ? ` | Top ${percentile}%` : ''} | ELO ${eloAfter.toLocaleString()} (${eloChange >= 0 ? '+' : ''}${eloChange})`,
      'synapse.game  #SYNAPSE',
    ];
    return lines.filter(l => l !== null).join('\n');
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(buildShareText());
      setCopied(true);
      track('result_card_shared', { method: 'copy_text', elo: eloAfter, total_score: totalScore });
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = buildShareText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    }
  }

  async function downloadCard() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      track('result_card_shared', { method: 'save_card', elo: eloAfter, total_score: totalScore });
      link.download = `synapse-day-${dayNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  /* ─── Inline card styles (html2canvas reads computed styles) ──────── */
  const card: React.CSSProperties = {
    background: 'linear-gradient(135deg, #020617 0%, #0f0c29 60%, #1a0a3e 100%)',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: '16px',
    padding: '24px',
    width: '340px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#fff',
  };

  const rule: React.CSSProperties = {
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '16px 0',
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* ── The card itself (this div gets screenshotted) ── */}
      <div ref={cardRef} style={card}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🧠</span>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '3px', color: '#fff' }}>
              SYNAPSE
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
            Day {dayNumber}
          </span>
        </div>

        <div style={rule} />

        {/* Streak */}
        {streak && streak > 0 ? (
          <div style={{ color: '#fb923c', fontSize: '13px', fontWeight: 700, marginBottom: '14px' }}>
            🔥 {streak} day streak
          </div>
        ) : null}

        {/* Domain bars */}
        {DOMAINS.map(({ key, label, icon }) => {
          const s = scores[key] ?? 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ width: '18px', fontSize: '13px', textAlign: 'center' }}>{icon}</span>
              <span style={{ width: '48px', color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${s}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#6d28d9,#a855f7)',
                  borderRadius: '4px',
                }} />
              </div>
              <span style={{ width: '26px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                {s}
              </span>
            </div>
          );
        })}

        <div style={rule} />

        {/* Score summary */}
        <div style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
            Total: {totalScore}/100
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#a78bfa', marginBottom: '4px', fontWeight: 600 }}>
          {tier.emoji} {tier.tier} &nbsp;·&nbsp; ELO {eloAfter.toLocaleString()}&nbsp;
          <span style={{ color: eloChange >= 0 ? '#4ade80' : '#f87171' }}>
            ({eloChange >= 0 ? '+' : ''}{eloChange})
          </span>
        </div>

        {percentile ? (
          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '14px' }}>
            Top {percentile}% globally today
          </div>
        ) : (
          <div style={{ marginBottom: '14px' }} />
        )}

        <div style={rule} />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, letterSpacing: '1px' }}>
            synapse.game
          </span>
          <span style={{ fontSize: '11px', color: '#334155' }}>#SYNAPSE</span>
        </div>
      </div>

      {/* ── Share buttons (outside the screenshot ref) ── */}
      <div className="flex gap-3 w-full max-w-[340px]">
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-violet-500 text-sm font-semibold text-slate-300 transition-all active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
        <button
          onClick={downloadCard}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-sm font-semibold text-white transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Saving…' : 'Save Card'}
        </button>
      </div>
    </div>
  );
}
