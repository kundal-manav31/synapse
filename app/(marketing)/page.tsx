import Link from 'next/link';
import { Brain, Zap, Share2, Trophy, Flame, ChevronRight, Star } from 'lucide-react';

/* ─── Static mock of the result card (no html2canvas needed) ─── */
function MockResultCard() {
  const domains = [
    { icon: '🔢', label: 'Memory',  score: 87, pct: 87 },
    { icon: '⚡', label: 'Speed',   score: 74, pct: 74 },
    { icon: '🎯', label: 'Pattern', score: 91, pct: 91 },
    { icon: '🧮', label: 'Math',    score: 79, pct: 79 },
    { icon: '🎭', label: 'Stroop',  score: 83, pct: 83 },
  ];

  const card: React.CSSProperties = {
    background: 'linear-gradient(135deg, #020617 0%, #0f0c29 60%, #1a0a3e 100%)',
    border: '1px solid rgba(139,92,246,0.30)',
    borderRadius: '16px',
    padding: '24px',
    width: '300px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#fff',
    boxShadow: '0 0 60px rgba(139,92,246,0.18), 0 20px 40px rgba(0,0,0,0.5)',
  };

  const rule: React.CSSProperties = {
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '14px 0',
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🧠</span>
          <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '3px' }}>SYNAPSE</span>
        </div>
        <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>Day 47</span>
      </div>

      <div style={rule} />

      <div style={{ color: '#fb923c', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
        🔥 14 day streak
      </div>

      {domains.map(({ icon, label, score, pct }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px' }}>
          <span style={{ width: '16px', fontSize: '12px', textAlign: 'center' }}>{icon}</span>
          <span style={{ width: '46px', color: '#64748b', fontSize: '10px', fontWeight: 500 }}>{label}</span>
          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6d28d9,#a855f7)', borderRadius: '3px' }} />
          </div>
          <span style={{ width: '24px', textAlign: 'right', fontSize: '11px', fontWeight: 700 }}>{score}</span>
        </div>
      ))}

      <div style={rule} />

      <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>Total: 83/100</div>
      <div style={{ fontSize: '11px', color: '#a78bfa', marginBottom: '3px', fontWeight: 600 }}>
        🏆 Expert &nbsp;·&nbsp; ELO 1,642{' '}
        <span style={{ color: '#4ade80' }}>(+18)</span>
      </div>
      <div style={{ fontSize: '10px', color: '#475569', marginBottom: '12px' }}>Top 8% globally today</div>

      <div style={rule} />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 700, letterSpacing: '1px' }}>synapse.game</span>
        <span style={{ fontSize: '10px', color: '#334155' }}>#SYNAPSE</span>
      </div>
    </div>
  );
}

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    quote: "I play this every morning before work. My streak is at 47 days and I've climbed from Beginner to Advanced. It's become a ritual.",
    name: 'Marcus T.',
    role: 'Software engineer',
    elo: '1,481 ELO',
    stars: 5,
  },
  {
    quote: "The Stroop game destroys me every time. But my pattern recognition has genuinely improved over the last month. The radar chart proves it.",
    name: 'Priya K.',
    role: 'Student',
    elo: '1,244 ELO',
    stars: 5,
  },
  {
    quote: "Moved from 1000 ELO to 1,612 in 3 months. The global leaderboard competition keeps me coming back. Better than any puzzle app I've tried.",
    name: 'James W.',
    role: 'Designer',
    elo: '1,612 ELO',
    stars: 5,
  },
];

/* ─── FAQ ─── */
const FAQ = [
  {
    q: 'Is this scientifically valid?',
    a: 'SYNAPSE is inspired by established cognitive testing paradigms — the Stroop effect, N-back memory tasks, and rapid arithmetic. It\'s not a clinical tool, but it\'s designed to be a repeatable, consistent benchmark for tracking relative cognitive performance over time.',
  },
  {
    q: 'What is Brain ELO?',
    a: 'Brain ELO adapts the chess ELO system to cognitive performance. You start at 1,000. Each day you compete against the baseline — score above 60/100 to gain ELO, below 40 to lose it. The higher you climb, the harder it is to maintain your rank.',
  },
  {
    q: 'Can I play more than once per day?',
    a: 'The daily challenge resets at midnight UTC and can only be played once — that\'s what makes the leaderboard fair. Pro users unlock unlimited practice mode with randomized puzzles to train specific domains.',
  },
  {
    q: 'How is my global rank calculated?',
    a: 'After you submit, we count how many players scored strictly higher than you that day. Your rank is live — it shifts in real-time as more players complete the challenge throughout the day.',
  },
];

/* ─── Domains ─── */
const DOMAINS = [
  { icon: '🔢', name: 'Memory',  desc: 'Recall digit sequences under pressure. Longer sequences at higher difficulty.' },
  { icon: '⚡', name: 'Speed',   desc: 'Tap the right colored shapes before time runs out. Precision matters as much as pace.' },
  { icon: '🎯', name: 'Pattern', desc: 'Identify what comes next in a shape sequence. Pattern recognition is a core fluid intelligence marker.' },
  { icon: '🧮', name: 'Math',    desc: 'Solve arithmetic expressions quickly. Speed bonus rewards mental math fluency.' },
  { icon: '🎭', name: 'Stroop',  desc: 'Name the ink color of a word that says something different. Classic cognitive interference task.' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: copy */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <div className="flex items-center gap-2 bg-violet-950/60 border border-violet-800/50 rounded-full px-4 py-1.5 text-violet-300 text-xs font-semibold uppercase tracking-widest">
              <Brain className="w-3.5 h-3.5" />
              Daily Brain Challenge
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-white">
              Your brain has a rank.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
                Find out where you stand.
              </span>
            </h1>

            <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
              2 minutes a day. 5 cognitive challenges. One global leaderboard. Free forever.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/play"
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-full text-base transition-colors shadow-lg shadow-violet-900/40"
              >
                Play Today&apos;s Challenge
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold px-6 py-3.5 rounded-full text-sm transition-colors"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Today&apos;s leaderboard
              </Link>
            </div>

            <p className="text-slate-500 text-sm">No account needed · Plays in 2 minutes</p>
          </div>

          {/* Right: mock result card */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <MockResultCard />
            <p className="text-xs text-slate-600">Your result card after playing</p>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-4 text-center">
          {[
            { value: '14,820', label: 'players today' },
            { value: '8 days', label: 'average streak' },
            { value: '5',       label: 'cognitive domains' },
            { value: '2 min',   label: 'daily commitment' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-violet-400">{value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest text-center mb-3">How it works</p>
          <h2 className="text-3xl font-black text-center text-white mb-14">Three steps. Two minutes. Every day.</h2>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-7 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-slate-800" />

            {[
              { icon: Brain,  step: '01', title: 'Play',  desc: '5 cognitive mini-games served in a fixed 2-minute window: memory, speed, pattern recognition, math, and the Stroop effect.' },
              { icon: Zap,    step: '02', title: 'Score', desc: 'Your Brain ELO updates instantly based on today\'s performance versus all other players worldwide.' },
              { icon: Share2, step: '03', title: 'Share', desc: 'Your result card is generated automatically. Copy it, save it as a PNG, and challenge your friends.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center z-10 relative">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white">{step}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 Cognitive domains ── */}
      <section className="border-t border-slate-800 bg-slate-900/30 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest text-center mb-3">What we test</p>
          <h2 className="text-3xl font-black text-center text-white mb-14">5 domains of cognitive performance</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOMAINS.map(({ icon, name, desc }) => (
              <div
                key={name}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-bold text-white">{name}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}

            {/* Play CTA card */}
            <div className="bg-violet-950/40 border border-violet-700/40 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center">
              <Brain className="w-8 h-8 text-violet-400" />
              <p className="text-violet-200 font-bold text-sm">See how you score in all 5</p>
              <Link
                href="/play"
                className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                Play now <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest text-center mb-3">What players say</p>
          <h2 className="text-3xl font-black text-center text-white mb-14">Thousands of brains ranked daily</h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, elo, stars }) => (
              <div
                key={name}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
                <div className="border-t border-slate-800 pt-3">
                  <p className="text-white font-semibold text-sm">{name}</p>
                  <p className="text-slate-500 text-xs">{role} · <span className="text-violet-400">{elo}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section className="border-t border-slate-800 bg-slate-900/30 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest text-center mb-3">Pricing</p>
          <h2 className="text-3xl font-black text-center text-white mb-3">Free forever. Upgrade when ready.</h2>
          <p className="text-slate-400 text-center mb-14 max-w-md mx-auto">
            The daily challenge is always free. Pro unlocks unlimited practice and deep analytics.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {[
              {
                name: 'Free',
                price: '$0',
                sub: 'forever',
                features: ['Daily challenge', 'Brain ELO score', 'Global leaderboard', 'Shareable card'],
                highlight: false,
                cta: 'Start free',
                href: '/play',
              },
              {
                name: 'Pro',
                price: '$4.99',
                sub: '/month',
                features: ['Everything in Free', 'Unlimited practice', 'Weekly Brain Report', '90-day history'],
                highlight: true,
                cta: 'Get Pro',
                href: '/pricing',
              },
              {
                name: 'Team',
                price: '$9.99',
                sub: '/month',
                features: ['Everything in Pro', 'Private leaderboard', 'Up to 10 members', 'Team analytics'],
                highlight: false,
                cta: 'Get Team',
                href: '/pricing',
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-5 flex flex-col gap-4 ${
                  plan.highlight
                    ? 'border-violet-500 bg-violet-950/30 relative'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm mb-0.5">{plan.sub}</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="text-slate-400 text-xs flex items-center gap-2">
                      <span className="text-violet-400 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`text-center py-2.5 rounded-full text-sm font-bold transition-colors ${
                    plan.highlight
                      ? 'bg-violet-600 hover:bg-violet-500 text-white'
                      : 'border border-slate-700 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center">
            <Link href="/pricing" className="text-sm text-slate-500 hover:text-violet-400 transition-colors flex items-center justify-center gap-1">
              See full feature comparison <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest text-center mb-3">FAQ</p>
          <h2 className="text-3xl font-black text-center text-white mb-14">Common questions</h2>

          <div className="flex flex-col gap-5">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-2">{q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-slate-800 py-24 px-4 bg-slate-900/30">
        <div className="max-w-xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-400" />
            <span className="text-orange-400 font-bold">Today&apos;s challenge is live</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Where does your brain rank today?
          </h2>
          <p className="text-slate-400">
            Join 14,820 players who&apos;ve already played. No sign-up required to start.
          </p>
          <Link
            href="/play"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-4 rounded-full text-base transition-colors shadow-lg shadow-violet-900/40"
          >
            <Brain className="w-5 h-5" />
            Play Now — It&apos;s Free
          </Link>
        </div>
      </section>
    </div>
  );
}
