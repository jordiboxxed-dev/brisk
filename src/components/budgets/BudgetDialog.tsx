import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
import { startOfMonth } from 'date-fns';
import type { Budget, Category } from '@/types';

interface BudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budget?: Budget | null;
}

const formSchema = z.object({
  category_id: z.string({ required_error: 'La categoría es requerida.' }),
  amount: z.coerce.number().positive('El monto debe ser positivo.'),
});

const BudgetDialog = ({ isOpen, onClose, onSuccess, budget }: BudgetDialogProps) => {
  const { session } = useSession();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (budget) {
      form.reset({
        category_id: budget.category_id,
        amount: budget.amount,
      });
    } else {
      form.reset({
        category_id: undefined,
        amount: 0,
      });
    }
  }, [budget, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user) {
      showError('Debes iniciar sesión para realizar esta acción.');
      return;
    }

    try {
      const budgetData = {
        ...values,
        user_id: session.user.id,
        month: startOfMonth(new Date()).toISOString().split('T')[0], // First day of current month
      };

      let error;
      if (budget) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ amount: values.amount })
          .eq('id', budget.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('budgets').insert(budgetData);
        error = insertError;
      }

      if (error) throw error;
      showSuccess(budget ? 'Presupuesto actualizado.' : 'Presupuesto creado.');
      onSuccess();
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        showError('Ya existe un presupuesto para esta categoría este mes.');
      } else {
        showError(`Error: ${error.message}`);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{budget ? 'Editar Presupuesto' : 'Añadir Presupuesto'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!budget}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto del Presupuesto</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
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

export default BudgetDialog;