'use client';

import { useState, useEffect } from 'react';

/** Ticking countdown to the next UTC midnight (when the next puzzle unlocks). */
export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      const midnight = new Date();
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());

      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }

    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono tabular-nums tracking-widest">{timeLeft || '—'}</span>;
}
