# SYNAPSE — Master Build Prompt for Claude Code

> Copy this entire file into Claude Code as your starting prompt.
> Work through it phase by phase. Each phase ends with a working, testable milestone.

---

## WHAT WE ARE BUILDING

A web game called **SYNAPSE** — a daily 2-minute cognitive challenge where every player in the world gets the same puzzle sequence, earns a Brain ELO score, sees their global rank, and shares a colorful result card on social media (like Wordle but competitive and brain-focused).

**Core loop:** Play → Score → Rank → Share → Come back tomorrow.

**Monetization:** Free tier (1 daily challenge) + Pro subscription ($4.99/mo via Stripe) + Team tier ($9.99/mo).

**The goal is a production-ready, monetizable web app.**

---

## TECH STACK

- **Framework:** Next.js 15 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Payments:** Stripe (subscriptions)
- **Deployment:** Vercel
- **Package manager:** pnpm

Do not deviate from this stack unless there is a hard technical blocker.

---

## PROJECT STRUCTURE

Scaffold this structure before writing any feature code:

```
synapse/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (game)/
│   │   ├── play/page.tsx          # Daily challenge
│   │   ├── results/page.tsx       # Post-game results + share card
│   │   └── practice/page.tsx      # Pro-only unlimited mode
│   ├── (dashboard)/
│   │   ├── profile/page.tsx       # ELO history, streak, radar chart
│   │   └── leaderboard/page.tsx   # Global + friends leaderboard
│   ├── (marketing)/
│   │   ├── page.tsx               # Landing page
│   │   └── pricing/page.tsx
│   ├── api/
│   │   ├── daily-puzzle/route.ts  # GET today's puzzle seed
│   │   ├── submit-score/route.ts  # POST score, calculate ELO
│   │   ├── leaderboard/route.ts   # GET global rankings
│   │   └── stripe/
│   │       ├── checkout/route.ts
│   │       └── webhook/route.ts
│   └── layout.tsx
├── components/
│   ├── games/
│   │   ├── MemoryGame.tsx
│   │   ├── SpeedGame.tsx
│   │   ├── PatternGame.tsx
│   │   ├── MathGame.tsx
│   │   └── StroopGame.tsx
│   ├── ui/
│   │   ├── ResultCard.tsx         # The shareable social card
│   │   ├── BrainRadar.tsx         # Cognitive domain radar chart
│   │   ├── EloDisplay.tsx
│   │   ├── StreakBadge.tsx
│   │   └── Countdown.tsx          # Time until next daily puzzle
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── elo.ts                     # ELO calculation logic
│   ├── puzzle-generator.ts        # Deterministic daily puzzle from date seed
│   └── stripe.ts
├── types/
│   └── index.ts
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## PHASE 1 — Foundation (Database + Auth + Scaffold)

### 1A. Initialize the Project

```bash
pnpm create next-app@latest synapse --typescript --tailwind --app --no-src-dir
cd synapse
pnpm add @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js
pnpm add recharts lucide-react clsx
pnpm add -D @types/node
```

### 1B. Supabase Schema

Create `supabase/migrations/001_initial_schema.sql` with exactly this schema:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  elo integer not null default 1000,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  last_played_date date,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'team')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- DAILY PUZZLES table (one row per calendar date, same for all players)
create table public.daily_puzzles (
  id uuid primary key default uuid_generate_v4(),
  puzzle_date date unique not null,
  seed integer not null,               -- deterministic seed for puzzle generation
  difficulty integer not null default 5 check (difficulty between 1 and 10),
  created_at timestamptz not null default now()
);

-- GAME SESSIONS table (one per player per day)
create table public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  puzzle_id uuid references public.daily_puzzles(id) not null,
  puzzle_date date not null,
  
  -- Per-domain scores (0-100 each)
  memory_score integer check (memory_score between 0 and 100),
  speed_score integer check (speed_score between 0 and 100),
  pattern_score integer check (pattern_score between 0 and 100),
  math_score integer check (math_score between 0 and 100),
  stroop_score integer check (stroop_score between 0 and 100),
  
  total_score integer,                 -- weighted composite
  elo_before integer,
  elo_after integer,
  elo_change integer,
  global_rank integer,                 -- rank among all players that day
  percentile integer,                  -- top X% globally
  completion_time_ms integer,          -- total time taken
  
  completed_at timestamptz not null default now(),
  
  unique(user_id, puzzle_date)         -- one attempt per day per user
);

-- LEADERBOARD VIEW (daily)
create or replace view public.daily_leaderboard as
select
  gs.puzzle_date,
  gs.total_score,
  gs.global_rank,
  gs.percentile,
  gs.elo_after as elo,
  p.username,
  p.display_name,
  p.avatar_url,
  p.streak_current
from public.game_sessions gs
join public.profiles p on gs.user_id = p.id
order by gs.puzzle_date desc, gs.total_score desc;

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.daily_puzzles enable row level security;

-- Profiles: users can read all, write only their own
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Game sessions: users can read all (for leaderboard), write only their own
create policy "Game sessions are viewable by everyone" on public.game_sessions for select using (true);
create policy "Users can insert their own sessions" on public.game_sessions for insert with check (auth.uid() = user_id);

-- Daily puzzles: readable by all authenticated users
create policy "Daily puzzles readable by all" on public.daily_puzzles for select using (true);

-- Function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Brain Athlete')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Run this migration in your Supabase project dashboard under SQL Editor.

### 1C. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRO_PRICE_ID=your_stripe_pro_price_id
STRIPE_TEAM_PRICE_ID=your_stripe_team_price_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Milestone 1 complete when:** Project runs on localhost:3000, Supabase is connected, schema is applied.

---

## PHASE 2 — Core Game Engine

This is the heart of the product. Build each mini-game as a standalone React component that receives a `config` prop (generated from the daily seed) and calls an `onComplete(score: number)` callback when finished.

### 2A. Puzzle Generator (`lib/puzzle-generator.ts`)

The daily puzzle must be **deterministic** — every player gets identical puzzles. Use a seeded pseudo-random number generator (use the `seedrandom` package: `pnpm add seedrandom @types/seedrandom`).

```typescript
// lib/puzzle-generator.ts
import seedrandom from 'seedrandom';

export interface DailyPuzzleConfig {
  date: string;        // YYYY-MM-DD
  seed: number;
  difficulty: number;  // 1-10
  memory: MemoryConfig;
  speed: SpeedConfig;
  pattern: PatternConfig;
  math: MathConfig;
  stroop: StroopConfig;
}

export function generateDailyPuzzle(date: string, difficulty: number = 5): DailyPuzzleConfig {
  // Derive seed from date so it's the same for everyone
  const dateNum = parseInt(date.replace(/-/g, ''));
  const seed = dateNum % 999983; // prime modulo for distribution
  const rng = seedrandom(seed.toString());
  
  const rand = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

  return {
    date,
    seed,
    difficulty,
    memory: generateMemoryConfig(rand, difficulty),
    speed: generateSpeedConfig(rand, difficulty),
    pattern: generatePatternConfig(rand, difficulty),
    math: generateMathConfig(rand, difficulty),
    stroop: generateStroopConfig(rand, difficulty),
  };
}

// --- Memory Game Config ---
interface MemoryConfig {
  sequences: number[][];   // arrays of digits to memorize
  displayTime: number;     // ms to show sequence
  rounds: number;
}
function generateMemoryConfig(rand: (a:number,b:number)=>number, diff: number): MemoryConfig {
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

// --- Speed Game Config ---
interface SpeedConfig {
  targets: { x: number; y: number; color: string; shape: 'circle' | 'square' | 'triangle' }[];
  targetColor: string;   // only tap this color
  timeLimit: number;     // ms
}
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
function generateSpeedConfig(rand: (a:number,b:number)=>number, diff: number): SpeedConfig {
  const targetColor = COLORS[rand(0, COLORS.length - 1)];
  const totalTargets = 8 + diff * 2;
  return {
    targets: Array.from({ length: totalTargets }, () => ({
      x: rand(5, 90),
      y: rand(10, 90),
      color: COLORS[rand(0, COLORS.length - 1)],
      shape: ['circle', 'square', 'triangle'][rand(0, 2)] as 'circle' | 'square' | 'triangle',
    })),
    targetColor,
    timeLimit: Math.max(8000, 20000 - diff * 800),
  };
}

// --- Pattern Game Config ---
interface PatternConfig {
  rounds: { sequence: string[]; options: string[]; answer: string }[];
}
const SHAPES = ['◆', '●', '▲', '■', '★', '◯', '▼', '◇'];
function generatePatternConfig(rand: (a:number,b:number)=>number, diff: number): PatternConfig {
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
  function rng() { return rand(0, 100) / 100; }
}

// --- Math Game Config ---
interface MathConfig {
  problems: { expression: string; answer: number; options: number[] }[];
  timePerProblem: number;
}
function generateMathConfig(rand: (a:number,b:number)=>number, diff: number): MathConfig {
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
      expression = `${Math.max(a,b)} - ${Math.min(a,b)}`;
    } else {
      answer = a + b;
      expression = `${a} + ${b}`;
    }
    const distractors = [answer + rand(1,5), answer - rand(1,5), answer + rand(6,12)];
    const options = [...distractors, answer].sort(() => rand(0,1) - 0.5);
    return { expression, answer, options };
  });
  return { problems, timePerProblem: Math.max(3000, 8000 - diff * 400) };
}

// --- Stroop Game Config ---
interface StroopConfig {
  trials: { word: string; inkColor: string; answer: string }[];
  timePerTrial: number;
}
const COLOR_WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];
const HEX = { RED: '#ef4444', BLUE: '#3b82f6', GREEN: '#22c55e', YELLOW: '#eab308', PURPLE: '#a855f7' };
function generateStroopConfig(rand: (a:number,b:number)=>number, diff: number): StroopConfig {
  const count = 5 + diff;
  const trials = Array.from({ length: count }, () => {
    const word = COLOR_WORDS[rand(0, COLOR_WORDS.length - 1)];
    const inkColor = COLOR_WORDS[rand(0, COLOR_WORDS.length - 1)];
    return { word, inkColor, answer: inkColor };
  });
  return { trials, timePerTrial: Math.max(1500, 4000 - diff * 200) };
}
```

### 2B. ELO System (`lib/elo.ts`)

```typescript
// lib/elo.ts

const K_FACTOR = 32;
const BASE_ELO = 1000;

export interface EloResult {
  newElo: number;
  eloChange: number;
}

/**
 * Calculate new ELO based on performance vs expected.
 * We treat the "opponent" as the average player (ELO 1000).
 * Score above 60 = win, below 40 = loss, 40-60 = draw.
 */
export function calculateElo(currentElo: number, normalizedScore: number): EloResult {
  // normalizedScore: 0-100
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
  // Weighted composite — weights based on cognitive importance
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
```

### 2C. Build Each Mini-Game Component

Build each game in `components/games/`. Every game component must follow this exact interface:

```typescript
interface GameProps {
  config: <GameSpecificConfig>;
  onComplete: (score: number) => void;  // score 0-100
  timeLimit?: number;                    // override in ms
}
```

#### MemoryGame.tsx
- Show a sequence of digits on screen for `config.displayTime` ms
- Hide them, then show an input grid
- Player types back the sequence (or taps digit buttons)
- Score = (correct answers / total rounds) * 100
- Add satisfying animations: digits appear one at a time, then fade out

#### SpeedGame.tsx
- Grid of colored shapes appear on screen
- Show instruction: "Tap all [COLOR] shapes as fast as you can!"
- Player taps matching shapes, wrong taps deduct points
- Score = (correct taps / target count) * 100 - (wrong taps * 10), clamped 0-100
- Use a timer bar that depletes visually

#### PatternGame.tsx  
- Show sequence of shapes with last one as "?"
- Show 4 multiple choice options below
- 3 rounds, 5 seconds per round
- Score = (correct / total) * 100

#### MathGame.tsx
- Show arithmetic expression in large text
- 4 answer buttons below
- Timer bar per problem
- Score = (correct / total) * 100, bonus points for speed

#### StroopGame.tsx
- Show a COLOR WORD in a mismatched ink color (e.g., "RED" written in blue ink)
- Player picks the ink color from 4 buttons (NOT the word)
- This is deliberately confusing — that's the point
- Score = (correct / total) * 100, faster = higher score

**Visual requirements for all games:**
- Dark background (#0f172a or similar)
- Progress bar at top showing which game (1/5, 2/5 etc.)
- Smooth transitions between games (slide or fade)
- Satisfying feedback on correct/wrong (green flash / red shake)
- Mobile-first layout (works perfectly on phones)

**Milestone 2 complete when:** All 5 games play through in sequence on localhost, scores are logged to console.

---

## PHASE 3 — Daily Challenge Orchestrator

### 3A. Play Page (`app/(game)/play/page.tsx`)

This page is the full game experience. It must:

1. On load, fetch today's puzzle from `/api/daily-puzzle`
2. Check if user has already played today (if yes, redirect to `/results`)
3. Show an intro screen: "Today's Challenge — Ready?" with a countdown
4. Run all 5 games in sequence using a `GameOrchestrator` component
5. On completion, POST to `/api/submit-score` with all 5 domain scores
6. Redirect to `/results` with the session data

```typescript
// State machine for the game flow
type GamePhase = 
  | 'loading'
  | 'intro'
  | 'memory'
  | 'speed'
  | 'pattern'
  | 'math'
  | 'stroop'
  | 'submitting'
  | 'done';
```

### 3B. Daily Puzzle API (`app/api/daily-puzzle/route.ts`)

```typescript
// GET /api/daily-puzzle
// Returns today's puzzle config (or creates it if it doesn't exist)
// The puzzle seed is deterministic from the date — no randomness server-side
```

Logic:
1. Get today's date in UTC
2. Check `daily_puzzles` table for today's date
3. If not found, generate seed from date and insert it
4. Return the puzzle config (generated client-side from seed, or generate here)
5. Also return whether the current user has already played today

### 3C. Submit Score API (`app/api/submit-score/route.ts`)

```typescript
// POST /api/submit-score
// Body: { memory_score, speed_score, pattern_score, math_score, stroop_score, completion_time_ms }
```

Logic:
1. Verify user is authenticated
2. Verify user hasn't already submitted today (idempotency check)
3. Calculate composite score using `calculateCompositeScore()`
4. Get user's current ELO from `profiles`
5. Calculate new ELO using `calculateElo()`
6. Insert row into `game_sessions`
7. Update `profiles` with new ELO, streak, last_played_date
8. Calculate global rank: `SELECT COUNT(*) FROM game_sessions WHERE puzzle_date = today AND total_score > submitted_score`
9. Calculate percentile
10. Update `game_sessions` row with rank and percentile
11. Return full session data for the results page

**Streak logic:**
- If `last_played_date` = yesterday → `streak_current += 1`
- If `last_played_date` = today → already played, reject
- Otherwise → `streak_current = 1`
- If `streak_current > streak_longest` → update `streak_longest`

**Milestone 3 complete when:** Full game plays, scores submit to database, ELO updates correctly.

---

## PHASE 4 — Results Page & Shareable Card

### 4A. Results Page (`app/(game)/results/page.tsx`)

After submitting, show:
- **Brain ELO** (large, animated count-up from old to new ELO)
- **ELO change** (+12 or -8 with color)
- **Global rank** (#4,821 of 38,420 players today)
- **Percentile** (Top 12%)
- **5-domain breakdown** (colored bars for each score)
- **Streak badge** (🔥 Day 14)
- **Shareable Result Card** (the social-viral centerpiece)
- **CTA:** "Come back tomorrow" with countdown timer to midnight

### 4B. Result Card Component (`components/ui/ResultCard.tsx`)

This is your viral growth engine. It must look stunning and be shareable.

Visual design:
```
┌─────────────────────────────┐
│  🧠 SYNAPSE  •  Day 47      │
│  ──────────────────────     │
│  🔥 14 day streak           │
│                             │
│  🔢 ██████████  Memory  94  │
│  ⚡ ████████    Speed   78  │
│  🎯 █████████   Pattern 88  │
│  🧮 ███████     Math    72  │
│  🎭 ████████    Stroop  81  │
│                             │
│  Total: 83/100              │
│  ELO: 1,642 (+18) 🏆 Expert │
│  Top 8% globally today      │
│  ─────────────────────      │
│  synapse.game  #SYNAPSE     │
└─────────────────────────────┘
```

Share functionality:
- "Copy to Clipboard" button — copies a text version (emoji-based, like Wordle)
- "Download Card" button — uses `html2canvas` (`pnpm add html2canvas`) to screenshot the card as a PNG
- Pre-written share text: `"SYNAPSE Day 47 🔥14 streak\n🔢████████ 94\n⚡██████ 78\n🎯████████ 88\n🧮██████ 72\n🎭███████ 81\nTotal: 83/100 | Top 8% | ELO 1,642\nsynapse.game"`

The emoji bar in the copy text: 10 blocks filled proportionally (e.g., score 80 = 8 filled + 2 empty).

**Milestone 4 complete when:** Results page shows all stats, share card downloads correctly.

---

## PHASE 5 — Leaderboard & Profile

### 5A. Leaderboard Page (`app/(dashboard)/leaderboard/page.tsx`)

Two tabs: **Global** and **Friends**

Global leaderboard:
- Show top 100 players for today's date
- Each row: Rank | Avatar | Username | Score | ELO | Streak
- Highlight the current user's row (sticky if not in top 100)
- Show "Your rank: #4,821" at the bottom if not in top 100

Friends leaderboard:
- Future feature placeholder for now — show "Invite friends" prompt

Use Supabase's real-time subscription to update live as scores come in.

### 5B. Profile Page (`app/(dashboard)/profile/page.tsx`)

Show:
- **Brain Radar Chart** (recharts `RadarChart`) — 5 domains as a pentagon
- **ELO History** (recharts `LineChart`) — ELO over last 30 days
- **Streak calendar** — GitHub-style contribution grid showing days played (green = played, empty = missed)
- **Personal bests** per domain
- **Subscription tier badge**

**Milestone 5 complete when:** Leaderboard and profile render with real data from Supabase.

---

## PHASE 6 — Auth Pages

### 6A. Sign Up (`app/(auth)/signup/page.tsx`)

Form fields: Email, Password, Username (unique, 3-20 chars, alphanumeric + underscores only)

On submit:
1. Validate username uniqueness via Supabase query
2. Call `supabase.auth.signUp()` with `options.data = { username, display_name: username }`
3. The `handle_new_user` trigger auto-creates their profile
4. Redirect to `/play`

### 6B. Login (`app/(auth)/login/page.tsx`)

Standard email + password login. Also add "Continue with Google" using `supabase.auth.signInWithOAuth({ provider: 'google' })`.

On success → redirect to `/play` (or `/results` if already played today).

**Milestone 6 complete when:** Full auth flow works, new users get profiles automatically.

---

## PHASE 7 — Landing Page & Marketing

### 7A. Landing Page (`app/(marketing)/page.tsx`)

Design a dark, sleek landing page with:

**Hero section:**
- Headline: "Your brain has a rank. Find out where you stand."
- Subheadline: "2 minutes a day. 5 cognitive challenges. One global leaderboard. Free forever."
- CTA button: "Play Today's Challenge →" (links to `/play`)
- Animated preview of the result card

**How it works section:**
- 3 steps with icons: Play (2 min daily challenge) → Score (Brain ELO calculated) → Share (Beat your friends)

**Social proof section:**
- Fake-but-plausible early stats: "14,820 players today" / "Average streak: 8 days"
- 3 testimonial cards

**Pricing section:**
- Free vs Pro vs Team cards (match the concept from research)
- "Start free, upgrade when you're ready"

**FAQ section:**
- "Is this scientifically valid?" / "What is Brain ELO?" / "Can I play more than once per day?"

### 7B. Pricing Page (`app/(marketing)/pricing/page.tsx`)

Detailed pricing with feature comparison table.

---

## PHASE 8 — Stripe Monetization

### 8A. Stripe Setup

1. Create two products in Stripe dashboard:
   - SYNAPSE Pro: $4.99/month recurring
   - SYNAPSE Team: $9.99/month recurring
2. Get their Price IDs and add to `.env.local`

### 8B. Checkout API (`app/api/stripe/checkout/route.ts`)

```typescript
// POST /api/stripe/checkout
// Body: { priceId: string }
// Returns: { url: string } — redirect to Stripe Checkout
```

Logic:
1. Get authenticated user
2. Get or create Stripe customer (store `stripe_customer_id` in profiles)
3. Create Stripe Checkout Session with:
   - `mode: 'subscription'`
   - `success_url: /profile?upgraded=true`
   - `cancel_url: /pricing`
   - `customer: stripeCustomerId`
4. Return the checkout URL

### 8C. Webhook Handler (`app/api/stripe/webhook/route.ts`)

Handle these Stripe events:
- `checkout.session.completed` → update `profiles.subscription_tier` to 'pro' or 'team', save `stripe_subscription_id`
- `customer.subscription.deleted` → downgrade back to 'free'
- `customer.subscription.updated` → update tier accordingly

Use `stripe.webhooks.constructEvent()` to verify signature.

### 8D. Gate Pro Features

In the practice page and weekly reports:
```typescript
// Check subscription in server component
const { data: profile } = await supabase.from('profiles').select('subscription_tier').single();
if (profile?.subscription_tier === 'free') {
  redirect('/pricing?reason=pro-required');
}
```

**Milestone 8 complete when:** Stripe checkout works, subscription updates profile tier, practice mode is gated.

---

## PHASE 9 — Polish & Production Readiness

### 9A. Mobile Responsiveness

Every page must work perfectly on 375px wide screens (iPhone SE). Test specifically:
- The game screens (biggest challenge — ensure touch targets are 44px+)
- The result card (must look good on mobile)
- The leaderboard table (may need card-based layout on mobile)

### 9B. Loading States & Error Handling

Every async operation needs:
- Skeleton loading state (not just spinners)
- Error state with retry button
- Optimistic UI for score submission

### 9C. SEO & Social Meta Tags

In `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'SYNAPSE — Daily Brain Challenge',
  description: 'A 2-minute daily cognitive duel. Test your memory, speed, and reasoning. See how you rank against the world.',
  openGraph: {
    title: 'SYNAPSE — Daily Brain Challenge',
    description: 'Play today\'s challenge. See your Brain ELO.',
    images: ['/og-image.png'],
  },
  twitter: { card: 'summary_large_image' },
};
```

### 9D. Analytics

Add PostHog (`pnpm add posthog-js`):
- Track: `game_started`, `game_completed`, `score_submitted`, `result_card_shared`, `upgrade_clicked`

### 9E. Rate Limiting

On `/api/submit-score`, check:
1. User has played today already → return 409 Conflict
2. Score values are within valid range (0-100) → validate server-side
3. Completion time is reasonable (>30s, <10min) → reject obvious cheaters

### 9F. Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

Set all `.env.local` variables in Vercel project settings.

Add Vercel Cron Job to pre-generate tomorrow's puzzle at 23:50 UTC daily.

**Milestone 9 complete when:** Deployed to production URL, all features work end-to-end.**

---

## BUILD ORDER SUMMARY

Work through these in order. Don't skip ahead.

| Phase | What you're building | Done when... |
|-------|---------------------|--------------|
| 1 | Project scaffold + DB schema + Auth config | App runs, DB connected |
| 2 | All 5 mini-game components | Games play in browser |
| 3 | Daily challenge + score submission API | Scores save to Supabase |
| 4 | Results page + shareable card | Card downloads correctly |
| 5 | Leaderboard + profile page | Real data renders |
| 6 | Auth pages (signup/login) | New users onboard |
| 7 | Landing page + pricing page | Marketing site live |
| 8 | Stripe subscriptions | Payments process |
| 9 | Polish + deploy to Vercel | Live at your domain |

---

## KEY DESIGN PRINCIPLES

Keep these in mind at every step:

1. **Speed first.** The game must load in under 2 seconds. Lazy load everything not needed immediately.
2. **Mobile first.** Design for 375px, then scale up. Most players will be on phones.
3. **The share card is the acquisition engine.** It must look stunning. Invest time here.
4. **One action per screen.** Don't crowd the game UI. Each mini-game gets the whole screen.
5. **Scarcity is the hook.** Always show the countdown to the next daily puzzle. Make it visceral.
6. **Streak anxiety works.** Show the streak prominently everywhere. It should feel fragile.
7. **No dark patterns.** Don't spam modals or force ads. The Pro upgrade should feel like a reward, not a gate.

---

## COMMON PITFALLS TO AVOID

- **Don't let users replay the daily puzzle.** The `unique(user_id, puzzle_date)` constraint + server-side check protects this.
- **Don't generate the puzzle differently on server vs client.** Use the same `generateDailyPuzzle(date, seed)` function everywhere, seeded from the date.
- **Don't calculate ELO client-side.** Always do it server-side in `/api/submit-score` to prevent cheating.
- **Don't expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.** Only use it in API routes and server components.
- **Don't forget to handle timezones.** Use UTC dates for `puzzle_date` everywhere. A player in Tokyo and New York must get the same puzzle on the same calendar day (UTC).

---

## AFTER MVP — GROWTH FEATURES (build these next)

Once the core loop is live and you have users, add these in order of impact:

1. **Friends/leagues system** — invite friends via link, create private leaderboards
2. **Weekly Brain Report email** — automated Resend.com email with their radar chart as an image
3. **Progressive Web App (PWA)** — add `manifest.json` and service worker for "Add to Home Screen"
4. **Push notifications** — "Today's challenge is live 🧠" at their local midnight
5. **React Native app** — port the web game to mobile using Expo
6. **Practice mode depth** — 10+ mini-games in rotation (only 5 used daily)
7. **Corporate wellness tier** — team dashboards for companies ($49/mo for up to 25 seats)
8. **Cognitive certificates** — "Top 1% in Memory — certified by SYNAPSE" shareable PDF
9. **Daily streak freeze** — buy with coins earned from playing (engagement loop + IAP)

---

*Start with Phase 1. Ask Claude Code to build one phase at a time.*
*When a phase is complete, test it manually, then move to the next phase.*
