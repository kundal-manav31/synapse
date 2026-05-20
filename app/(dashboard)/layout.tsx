import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
