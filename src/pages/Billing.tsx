import { Navbar } from '@/components/layout/Navbar';
import { POSSystem } from '@/components/pos/POSSystem';

export default function Billing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <POSSystem />
      </main>
    </div>
  );
}
