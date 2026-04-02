import { AppLayout } from '@/components/layout/AppLayout';
import { SalesDashboard } from '@/components/dashboard/SalesDashboard';

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <SalesDashboard />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
