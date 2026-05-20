import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Today's Challenge",
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
