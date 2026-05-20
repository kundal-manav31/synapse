import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Mode',
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
