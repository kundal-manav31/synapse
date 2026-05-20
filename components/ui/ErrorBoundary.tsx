'use client';

import { Component, type ReactNode } from 'react';
import { Brain } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-12 text-center">
          <Brain className="w-8 h-8 text-violet-700" />
          <p className="text-slate-400 text-sm">Something went wrong with this game.</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-full text-sm font-semibold transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
