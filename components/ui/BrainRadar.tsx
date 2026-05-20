'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';

interface Props {
  scores: { memory: number; speed: number; pattern: number; math: number; stroop: number };
}

const DOMAINS = [
  { key: 'memory'  as const, label: 'Memory'  },
  { key: 'speed'   as const, label: 'Speed'   },
  { key: 'pattern' as const, label: 'Pattern' },
  { key: 'math'    as const, label: 'Math'    },
  { key: 'stroop'  as const, label: 'Stroop'  },
];

export default function BrainRadar({ scores }: Props) {
  const data = DOMAINS.map(d => ({ domain: d.label, score: scores[d.key] ?? 0 }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="domain"
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
