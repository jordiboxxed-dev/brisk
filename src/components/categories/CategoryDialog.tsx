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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { showError, showSuccess } from '@/utils/toast';
import type { Category } from '../../types';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
}

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  icon: z.string().min(1, 'El icono es requerido.'),
});

const CategoryDialog = ({ isOpen, onClose, onSuccess, category }: CategoryDialogProps) => {
  const { session } = useSession();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      icon: 'Package',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon,
      });
    } else {
      form.reset({
        name: '',
        icon: 'Package',
      });
    }
  }, [category, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user) {
      showError('Debes iniciar sesión para realizar esta acción.');
      return;
    }

    try {
      const categoryData = {
        ...values,
        user_id: session.user.id,
      };

      let error;
      if (category) {
        const { error: updateError } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('categories').insert(categoryData);
        error = insertError;
      }

      if (error) throw error;
      showSuccess(category ? 'Categoría actualizada.' : 'Categoría creada.');
      onSuccess();
    } catch (error: any) {
      showError(`Error: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoría' : 'Añadir Nueva Categoría'}</DialogTitle>
          <DialogDescription>
            Puedes encontrar nombres de iconos en lucide.dev
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la categoría</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Supermercado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono (de Lucide)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ShoppingCart" {...field} />
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

export default CategoryDialog;