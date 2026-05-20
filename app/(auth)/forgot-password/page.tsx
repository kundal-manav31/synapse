'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, Mail, ArrowLeft } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured yet.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-violet-900/40 border border-violet-700/50 flex items-center justify-center">
          <Mail className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            We sent a reset link to{' '}
            <span className="text-white font-medium">{email}</span>.
            Click the link to set a new password.
          </p>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-2 mb-8">
        <Brain className="w-8 h-8 text-violet-400" />
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-slate-400 text-sm text-center">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
