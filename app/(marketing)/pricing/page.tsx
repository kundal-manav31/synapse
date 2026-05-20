import Link from 'next/link';
import { Check, Minus, Brain, ChevronRight } from 'lucide-react';
import PricingCTA from '@/components/ui/PricingCTA';

/* ─── Plan definitions ─── */
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: null,
    description: 'One daily challenge. Forever free.',
    highlight: false,
    cta: 'Start free',
    href: '/play',
    stripePlan: null as null | 'pro' | 'team',
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: '/mo',
    description: 'Unlimited practice and deep cognitive insights.',
    highlight: true,
    cta: 'Upgrade to Pro',
    href: null,
    stripePlan: 'pro' as const,
  },
  {
    name: 'Team',
    price: '$9.99',
    period: '/mo',
    description: 'Private leaderboards for your team or class.',
    highlight: false,
    cta: 'Get Team',
    href: null,
    stripePlan: 'team' as const,
  },
];

/* ─── Feature comparison table rows ─── */
type Access = boolean | string;

interface FeatureRow {
  category?: string; // renders as a section header
  feature: string;
  free: Access;
  pro: Access;
  team: Access;
}

const FEATURES: FeatureRow[] = [
  { category: 'Core gameplay', feature: '', free: true, pro: true, team: true },
  { feature: 'Daily challenge',                         free: true,      pro: true,      team: true },
  { feature: 'Brain ELO score',                         free: true,      pro: true,      team: true },
  { feature: 'Global leaderboard',                      free: true,      pro: true,      team: true },
  { feature: 'Shareable result card',                   free: true,      pro: true,      team: true },
  { feature: 'Game history',                            free: '7 days',  pro: '90 days', team: '90 days' },

  { category: 'Practice & training', feature: '', free: true, pro: true, team: true },
  { feature: 'Unlimited practice mode',                 free: false,     pro: true,      team: true },
  { feature: 'Domain-specific drills',                  free: false,     pro: true,      team: true },

  { category: 'Analytics', feature: '', free: true, pro: true, team: true },
  { feature: 'Cognitive radar chart',                   free: true,      pro: true,      team: true },
  { feature: 'ELO history graph',                       free: false,     pro: true,      team: true },
  { feature: 'Detailed domain breakdown',               free: false,     pro: true,      team: true },
  { feature: 'Weekly Brain Report email',               free: false,     pro: true,      team: true },

  { category: 'Team features', feature: '', free: true, pro: true, team: true },
  { feature: 'Private team leaderboard',                free: false,     pro: false,     team: true },
  { feature: 'Team members',                            free: false,     pro: false,     team: 'Up to 10' },
  { feature: 'Team analytics dashboard',                free: false,     pro: false,     team: true },
  { feature: 'Custom team name & avatar',               free: false,     pro: false,     team: true },
];

/* ─── FAQ ─── */
const FAQ = [
  {
    q: 'Can I cancel any time?',
    a: 'Yes. Cancel from your profile page and your subscription ends at the next billing period. No questions asked.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major credit and debit cards via Stripe. Apple Pay and Google Pay are available where supported.',
  },
  {
    q: 'Is there a free trial?',
    a: 'The Free tier is unlimited — play the daily challenge forever at no cost. The Pro upgrade is a paid subscription with no trial period, but it\'s only $4.99/month and you can cancel any time.',
  },
  {
    q: 'What is Brain ELO?',
    a: 'Brain ELO adapts the chess ELO ranking system to cognitive performance. You start at 1,000. Score above 60/100 to gain ELO, below 40 to lose it. The higher you climb, the harder it is to stay there.',
  },
  {
    q: 'Is SYNAPSE scientifically validated?',
    a: 'SYNAPSE is inspired by established cognitive testing paradigms (Stroop, N-back, mental arithmetic). It is not a clinical diagnostic tool, but is designed as a consistent, repeatable performance benchmark.',
  },
];

/* ─── Helper to render a cell value ─── */
function Cell({ value }: { value: Access }) {
  if (value === true)  return <Check className="w-4 h-4 text-violet-400 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-slate-700 mx-auto" />;
  return <span className="text-slate-300 text-xs font-medium">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-20">

        {/* ── Header ── */}
        <div className="text-center">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            Start free, upgrade when you&apos;re ready. No dark patterns.
          </p>
        </div>

        {/* ── Plan cards ── */}
        <div className="grid sm:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col gap-5 relative ${
                plan.highlight
                  ? 'border-violet-500 bg-violet-950/30'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                  Most popular
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 mb-1 text-sm">{plan.period}</span>}
                </div>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              {plan.stripePlan ? (
                <PricingCTA
                  plan={plan.stripePlan}
                  label={plan.cta}
                  className={`w-full text-center py-3 rounded-full font-bold text-sm transition-colors disabled:opacity-60 ${
                    plan.highlight
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
                      : 'border border-slate-700 hover:border-slate-500 text-slate-300'
                  }`}
                />
              ) : (
                <Link
                  href={plan.href!}
                  className="w-full text-center py-3 rounded-full font-bold text-sm border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* ── Feature comparison table ── */}
        <div>
          <h2 className="text-xl font-black text-white mb-6 text-center">Full feature comparison</h2>

          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-4 bg-slate-900">
              <div className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Feature</div>
              {PLANS.map(p => (
                <div
                  key={p.name}
                  className={`p-4 text-center text-sm font-bold ${p.highlight ? 'text-violet-300' : 'text-slate-300'}`}
                >
                  {p.name}
                </div>
              ))}
            </div>

            {/* Table rows */}
            {FEATURES.map((row, i) => {
              if (row.category) {
                return (
                  <div key={`cat-${i}`} className="grid grid-cols-4 bg-slate-800/60 border-t border-slate-800">
                    <div className="p-3 px-4 col-span-4 text-xs font-bold text-violet-400 uppercase tracking-widest">
                      {row.category}
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={row.feature}
                  className={`grid grid-cols-4 border-t border-slate-800 ${
                    i % 2 === 0 ? 'bg-slate-900/20' : ''
                  }`}
                >
                  <div className="p-3 px-4 text-sm text-slate-400 flex items-center">{row.feature}</div>
                  <div className="p-3 flex items-center justify-center"><Cell value={row.free} /></div>
                  <div className="p-3 flex items-center justify-center bg-violet-950/10"><Cell value={row.pro} /></div>
                  <div className="p-3 flex items-center justify-center"><Cell value={row.team} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div>
          <h2 className="text-2xl font-black text-white mb-8 text-center">Frequently asked questions</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm mb-2">{q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="text-center bg-violet-950/30 border border-violet-800/40 rounded-2xl px-8 py-12 flex flex-col items-center gap-5">
          <Brain className="w-10 h-10 text-violet-400" />
          <h2 className="text-2xl font-black text-white">Start with the free daily challenge</h2>
          <p className="text-slate-400 max-w-md">
            No credit card. No commitment. Play in 2 minutes and see your Brain ELO today.
          </p>
          <Link
            href="/play"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            Play Today&apos;s Challenge <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
