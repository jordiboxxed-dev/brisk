import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import BalanceSummary from '@/components/dashboard/BalanceSummary';
import CategoryChart from '@/components/dashboard/CategoryChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const fetchDashboardData = async () => {
    const today = new Date();
    const startDate = startOfMonth(today).toISOString();
    const endDate = endOfMonth(today).toISOString();

    const accountsPromise = supabase.from('accounts').select('balance, currency');
    const transactionsPromise = supabase
      .from('transactions')
      .select('*, categories(name, icon), accounts(name)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    const [{ data: accounts, error: accountsError }, { data: transactions, error: transactionsError }] = await Promise.all([accountsPromise, transactionsPromise]);

    if (accountsError) throw new Error(accountsError.message);
    if (transactionsError) throw new Error(transactionsError.message);

    return { accounts, transactions };
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <p className="text-red-500">Error al cargar los datos del dashboard.</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="mb-6">
        <BalanceSummary accounts={data?.accounts || []} />
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <CategoryChart transactions={data?.transactions || []} />
        </div>
        <div className="md:col-span-3">
          <RecentTransactions transactions={data?.transactions || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;