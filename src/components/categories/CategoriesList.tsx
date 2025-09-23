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
import { showError, showSuccess } from '@/utils/toast';
import CategoryDialog from '@/components/categories/CategoryDialog';
import type { Category } from '../../types';

interface CategoriesListProps {
  categories: Category[];
}

const Icon = ({ name, ...props }: { name: string } & Icons.LucideProps) => {
  const LucideIcon = Icons[name as keyof typeof Icons] as Icons.LucideIcon;
  if (!LucideIcon) {
    return <Icons.Package {...props} />; // Fallback icon
  }
  return <LucideIcon {...props} />;
};

const CategoriesList = ({ categories }: CategoriesListProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', selectedCategory.id);
      if (error) throw error;
      showSuccess('Categoría eliminada correctamente.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error: any) {
      showError(`Error al eliminar la categoría: ${error.message}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setIsEditDialogOpen(false);
    setSelectedCategory(null);
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tienes ninguna categoría todavía.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Icon name={category.icon} className="w-5 h-5 text-muted-foreground" />
              {category.name}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(category)} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            {/* Podríamos añadir más info en el futuro */}
            <p className="text-sm text-muted-foreground">Gestiona esta categoría.</p>
          </CardContent>
        </Card>
      ))}

      {selectedCategory && (
        <CategoryDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleSuccess}
          category={selectedCategory}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si eliminas esta categoría, las transacciones asociadas no se eliminarán pero quedarán sin categoría.
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

export default CategoriesList;