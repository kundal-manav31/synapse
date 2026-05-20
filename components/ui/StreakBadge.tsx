'use client';

interface Props {
  playedDates: string[];
  currentStreak: number;
  longestStreak: number;
}

function utcIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function StreakBadge({ playedDates, currentStreak, longestStreak }: Props) {
  const played = new Set(playedDates);

  // Build 91-day (13-week) grid ending today
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const todayStr = utcIso(todayUtc);

  // Pad so the first column starts on a Sunday
  const endDate = new Date(todayUtc);
  const startRaw = new Date(todayUtc);
  startRaw.setUTCDate(startRaw.getUTCDate() - 90); // 91 days back
  const startDow = startRaw.getUTCDay(); // 0=Sun
  // Rewind start to the prior Sunday
  startRaw.setUTCDate(startRaw.getUTCDate() - startDow);

  const days: Date[] = [];
  const cur = new Date(startRaw);
  while (cur <= endDate) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  // Group into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              const iso = utcIso(day);
              const didPlay = played.has(iso);
              const isToday = iso === todayStr;
              const isFuture = iso > todayStr;
              return (
                <div
                  key={di}
                  title={iso}
                  className={[
                    'w-3 h-3 rounded-sm',
                    isFuture
                      ? 'bg-slate-900'
                      : didPlay
                        ? 'bg-violet-500'
                        : 'bg-slate-800',
                    isToday ? 'ring-1 ring-violet-400' : '',
                  ].join(' ')}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-6 text-xs text-slate-500">
        <span>
          <span className="text-white font-bold text-sm">{currentStreak}</span>
          {' '}day streak
        </span>
        <span>
          <span className="text-white font-bold text-sm">{longestStreak}</span>
          {' '}longest
        </span>
      </div>
    </div>
  );
}
