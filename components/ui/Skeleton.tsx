import { clsx } from 'clsx';

interface Props { className?: string }

export function Skeleton({ className }: Props) {
  return (
    <div className={clsx('animate-pulse rounded-lg bg-slate-800', className)} />
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="w-full flex flex-col gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
          <Skeleton className="w-8 h-5 rounded" />
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2 w-16" />
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex flex-col gap-1 items-end">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      {/* Chart placeholder */}
      <Skeleton className="h-56 rounded-2xl" />
      {/* Bars */}
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
