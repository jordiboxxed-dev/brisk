import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { showError, showSuccess } from '@/utils/toast';
import type { Account } from '../../types';

interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: Account | null;
}

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  balance: z.coerce.number().min(0, 'El saldo no puede ser negativo.'),
  currency: z.enum(['USD', 'UYU'], { required_error: 'La moneda es requerida.' }),
});

const AccountDialog = ({ isOpen, onClose, onSuccess, account }: AccountDialogProps) => {
  const { session } = useSession();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      balance: 0,
      currency: 'UYU',
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        balance: account.balance,
        currency: account.currency,
      });
    } else {
      form.reset({
        name: '',
        balance: 0,
        currency: 'UYU',
      });
    }
  }, [account, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user) {
      showError('Debes iniciar sesión para realizar esta acción.');
      return;
    }

    try {
      const accountData = {
        ...values,
        user_id: session.user.id,
      };

      let error;
      if (account) {
        // Update
        const { error: updateError } = await supabase
          .from('accounts')
          .update(accountData)
          .eq('id', account.id);
        error = updateError;
      } else {
        // Create
        const { error: insertError } = await supabase.from('accounts').insert(accountData);
        error = insertError;
      }

      if (error) throw error;
      showSuccess(account ? 'Cuenta actualizada correctamente.' : 'Cuenta creada correctamente.');
      onSuccess();
    } catch (error: any) {
      showError(`Error: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar Cuenta' : 'Añadir Nueva Cuenta'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la cuenta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Banco Itaú, Efectivo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo inicial</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UYU">Peso Uruguayo (UYU)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDialog;