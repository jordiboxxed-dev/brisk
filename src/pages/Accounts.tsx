import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import AccountDialog from '../components/accounts/AccountDialog';
import AccountsList from '../components/accounts/AccountsList';
import { Skeleton } from '@/components/ui/skeleton';

const AccountsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  };

  const { data: accounts, isLoading, isError } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cuentas</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Añadir Cuenta
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <p className="text-red-500">Error al cargar las cuentas.</p>
      ) : (
        <AccountsList accounts={accounts || []} />
      )}

      <AccountDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default AccountsPage;