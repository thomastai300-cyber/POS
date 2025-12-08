import { Navbar } from '@/components/layout/Navbar';
import { StockManagement } from '@/components/stock/StockManagement';

const Stock = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <StockManagement />
      </main>
    </div>
  );
};

export default Stock;
