'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, CheckCircle } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured yet.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setDone(true);
      // Give the user a moment to read the success message, then redirect
      setTimeout(() => {
        router.push('/play');
        router.refresh();
      }, 2_000);
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        <CheckCircle className="w-12 h-12 text-green-400" />
        <div>
          <h1 className="text-2xl font-bold mb-2">Password updated</h1>
          <p className="text-slate-400 text-sm">Redirecting you to the game…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-2 mb-8">
        <Brain className="w-8 h-8 text-violet-400" />
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-slate-400 text-sm">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-300">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Min 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-300">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Repeat your password"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
