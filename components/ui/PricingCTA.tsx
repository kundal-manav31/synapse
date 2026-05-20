'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';

interface Props {
  plan: 'pro' | 'team';
  label: string;
  className?: string;
}

export default function PricingCTA({ plan, label, className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setLoading(true);
    setError('');

    try {
      // If Supabase not configured, send to signup so they can at least create an account
      if (!isSupabaseConfigured()) {
        router.push('/signup');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?next=/pricing');
        return;
      }

      track('upgrade_clicked', { plan });
      const res = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout. Try again.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? 'Redirecting to checkout…' : label}
      </button>
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </div>
  );
}
