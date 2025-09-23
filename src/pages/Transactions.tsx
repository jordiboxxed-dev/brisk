import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionDialog from '@/components/transactions/TransactionDialog';
import TransactionsList from '@/components/transactions/TransactionsList';

const TransactionsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts (name),
        categories (name, icon)
      `)
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  };

  const { data: transactions, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Also invalidate accounts for balance updates
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transacciones</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Añadir Transacción
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <p className="text-red-500">Error al cargar las transacciones.</p>
      ) : (
        <TransactionsList transactions={transactions || []} />
      )}

      <TransactionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default TransactionsPage;