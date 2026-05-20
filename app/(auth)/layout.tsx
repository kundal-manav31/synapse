export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center min-h-screen px-4">
      {children}
    </main>
  );
}
