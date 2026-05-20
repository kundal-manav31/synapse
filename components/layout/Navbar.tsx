'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Brain, Trophy, User, LogOut, LogIn } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();

    // Initial session check
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Keep in sync with auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Brain className="w-5 h-5 text-violet-400" />
          <span className="text-white">SYNAPSE</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/play"
            className="text-sm font-medium bg-violet-600 hover:bg-violet-500 px-4 py-1.5 rounded-full transition-colors"
          >
            Play
          </Link>

          <Link
            href="/leaderboard"
            className={`transition-colors ${pathname === '/leaderboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            title="Leaderboard"
          >
            <Trophy className="w-5 h-5" />
          </Link>

          {/* Show after mount to avoid hydration mismatch */}
          {mounted && (
            user ? (
              <>
                <Link
                  href="/profile"
                  className={`transition-colors ${pathname === '/profile' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={signOut}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                title="Sign in"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
