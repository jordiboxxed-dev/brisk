import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { showError, showSuccess } from '@/utils/toast';
import AccountDialog from './AccountDialog';
import type { Account } from '../../types';

interface AccountsListProps {
  accounts: Account[];
}

const AccountsList = ({ accounts }: AccountsListProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const queryClient = useQueryClient();

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAccount) return;
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', selectedAccount.id);
      if (error) throw error;
      showSuccess('Cuenta eliminada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    } catch (error: any) {
      showError(`Error al eliminar la cuenta: ${error.message}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    setIsEditDialogOpen(false);
    setSelectedAccount(null);
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tienes ninguna cuenta todavía.</p>
        <p className="text-gray-500">¡Añade una para empezar a registrar tus transacciones!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{account.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(account)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(account)} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-UY', { style: 'currency', currency: account.currency }).format(account.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Saldo actual</p>
          </CardContent>
        </Card>
      ))}

      {selectedAccount && (
        <AccountDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleSuccess}
          account={selectedAccount}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta y todas sus transacciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountsList;