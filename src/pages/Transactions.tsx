import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionDialog from '@/components/transactions/TransactionDialog';
import TransactionsList from '@/components/transactions/TransactionsList';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay } from 'date-fns';
import type { Account, Transaction } from '@/types';

const TransactionsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [accountId, setAccountId] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<string>('all');
  const queryClient = useQueryClient();

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, accounts (name), categories (name, icon)')
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  };

  const { data: transactions, isLoading, isError } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const isAfterStartDate = !dateRange?.from || txDate >= startOfDay(dateRange.from);
      const isBeforeEndDate = !dateRange?.to || txDate <= endOfDay(dateRange.to);
      const matchesAccount = accountId === 'all' || tx.account_id === accountId;
      const matchesType = transactionType === 'all' || tx.type === transactionType;
      return isAfterStartDate && isBeforeEndDate && matchesAccount && matchesType;
    });
  }, [transactions, dateRange, accountId, transactionType]);

  const resetFilters = () => {
    setDateRange(undefined);
    setAccountId('all');
    setTransactionType('all');
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
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

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las cuentas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cuentas</SelectItem>
              {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={transactionType} onValueChange={setTransactionType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={resetFilters}>
            <X className="w-4 h-4 mr-2" />
            Limpiar Filtros
          </Button>
        </CardContent>
      </Card>

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
        <TransactionsList transactions={filteredTransactions} />
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