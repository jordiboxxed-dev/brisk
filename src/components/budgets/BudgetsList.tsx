import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { showError, showSuccess } from '@/utils/toast';
import BudgetDialog from '@/components/budgets/BudgetDialog';
import type { BudgetWithSpending, Budget } from '@/types';
import { cn } from '@/lib/utils';

interface BudgetsListProps {
  budgets: BudgetWithSpending[];
}

const Icon = ({ name, ...props }: { name: string } & Icons.LucideProps) => {
  const LucideIcon = Icons[name as keyof typeof Icons] as Icons.LucideIcon;
  if (!LucideIcon) {
    return <Icons.Package {...props} />;
  }
  return <LucideIcon {...props} />;
};

const BudgetsList = ({ budgets }: BudgetsListProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const queryClient = useQueryClient();

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBudget) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', selectedBudget.id);
      if (error) throw error;
      showSuccess('Presupuesto eliminado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    } catch (error: any) {
      showError(`Error al eliminar el presupuesto: ${error.message}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedBudget(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    setIsEditDialogOpen(false);
    setSelectedBudget(null);
  };

  if (budgets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No has creado ningún presupuesto para este mes.</p>
        <p className="text-gray-500">¡Añade uno para empezar a controlar tus gastos!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => {
        const spent = budget.spent || 0;
        const amount = budget.amount;
        const progress = amount > 0 ? (spent / amount) * 100 : 0;
        const currency = budget.currency || 'UYU';

        return (
          <Card key={budget.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name={budget.categories?.icon || 'Package'} className="w-5 h-5 text-muted-foreground" />
                {budget.categories?.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(budget)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(budget)} className="text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-UY', { style: 'currency', currency }).format(spent)}
                </span>
                <span className="text-sm text-muted-foreground">
                  de {new Intl.NumberFormat('es-UY', { style: 'currency', currency }).format(amount)}
                </span>
              </div>
              <Progress value={progress} className={cn(progress > 100 && 'bg-red-500')} />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {progress.toFixed(0)}% gastado
              </p>
            </CardContent>
          </Card>
        );
      })}

      {selectedBudget && (
        <BudgetDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleSuccess}
          budget={selectedBudget}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el presupuesto para esta categoría.
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

export default BudgetsList;