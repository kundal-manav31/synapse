import Link from 'next/link';
import { Brain } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-slate-400">SYNAPSE</span>
          <span>&mdash; Daily Brain Challenge</span>
        </div>
        <div className="flex gap-6">
          <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
          <Link href="/play" className="hover:text-slate-300 transition-colors">Play</Link>
          <Link href="/leaderboard" className="hover:text-slate-300 transition-colors">Leaderboard</Link>
        </div>
      </div>
    </footer>
  );
}
