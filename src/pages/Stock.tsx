import { AppLayout } from '@/components/layout/AppLayout';
import { StockManagement } from '@/components/stock/StockManagement';

const Stock = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <StockManagement />
      </div>
    </AppLayout>
  );
};

export default Stock;
