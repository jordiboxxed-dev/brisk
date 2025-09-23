import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';
import BudgetDialog from '@/components/budget/BudgetDialog';
import BudgetsList from '@/components/budget/BudgetsList';
import type { Budget, Transaction, BudgetWithSpending } from '@/types';

const BudgetsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const fetchBudgetsData = async () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const budgetsPromise = supabase
      .from('budgets')
      .select('*, categories(name, icon)')
      .eq('month', formatISO(monthStart, { representation: 'date' }));

    const transactionsPromise = supabase
      .from('transactions')
      .select('category_id, amount, currency')
      .eq('type', 'expense')
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    const [{ data: budgets, error: budgetsError }, { data: transactions, error: transactionsError }] = await Promise.all([budgetsPromise, transactionsPromise]);

    if (budgetsError) throw new Error(budgetsError.message);
    if (transactionsError) throw new Error(transactionsError.message);

    return { budgets, transactions };
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['budgets'],
    queryFn: fetchBudgetsData,
  });

  const budgetsWithSpending = useMemo((): BudgetWithSpending[] => {
    if (!data?.budgets || !data?.transactions) return [];

    const spendingByCategory = data.transactions.reduce((acc, tx) => {
      if (!tx.category_id) return acc;
      if (!acc[tx.category_id]) {
        acc[tx.category_id] = { spent: 0, currency: tx.currency };
      }
      acc[tx.category_id].spent += tx.amount;
      return acc;
    }, {} as Record<string, { spent: number; currency: string }>);

    return data.budgets.map(budget => ({
      ...budget,
      spent: spendingByCategory[budget.category_id]?.spent || 0,
      currency: spendingByCategory[budget.category_id]?.currency || 'UYU', // Default currency
    }));
  }, [data]);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Presupuestos</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Añadir Presupuesto
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : isError ? (
        <p className="text-red-500">Error al cargar los presupuestos.</p>
      ) : (
        <BudgetsList budgets={budgetsWithSpending} />
      )}

      <BudgetDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default BudgetsPage;