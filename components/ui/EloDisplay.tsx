'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface EloPoint { date: string; elo: number }
interface Props { history: EloPoint[] }

function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export default function EloDisplay({ history }: Props) {
  const data = history.map(p => ({ date: shortDate(p.date), elo: p.elo }));
  const eloValues = data.map(d => d.elo);
  const minElo = eloValues.length ? Math.min(...eloValues) - 30 : 900;
  const maxElo = eloValues.length ? Math.max(...eloValues) + 30 : 1100;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minElo, maxElo]}
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#64748b' }}
          itemStyle={{ color: '#a78bfa' }}
          formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : value, 'ELO']}
        />
        <Line
          type="monotone"
          dataKey="elo"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#a78bfa' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
