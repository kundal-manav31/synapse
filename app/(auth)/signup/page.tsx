'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Mail } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters: letters, numbers, underscores only.');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured yet. Add Supabase credentials to .env.local.');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      setError('Username is already taken.');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If session is immediately available, email confirmation is disabled — go straight to play
    if (data.session) {
      router.push('/play');
      router.refresh();
      return;
    }

    // Confirmation email sent — show the check-your-email screen
    setConfirming(true);
    setLoading(false);
  }

  /* ── Email confirmation waiting screen ── */
  if (confirming) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-violet-900/40 border border-violet-700/50 flex items-center justify-center">
          <Mail className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-white font-medium">{email}</span>.
            Click it to activate your account and start playing.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button
            className="text-violet-400 hover:text-violet-300 underline"
            onClick={() => setConfirming(false)}
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-2 mb-8">
        <Brain className="w-8 h-8 text-violet-400" />
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-slate-400 text-sm">Free forever. No credit card needed.</p>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-300">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="braingamer42"
          />
          <p className="text-xs text-slate-500 mt-1">3-20 chars, letters / numbers / underscores</p>
        </div>

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

        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-300">Password</label>
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

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
