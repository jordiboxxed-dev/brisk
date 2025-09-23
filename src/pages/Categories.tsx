import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryDialog from '@/components/categories/CategoryDialog';
import CategoriesList from '@/components/categories/CategoriesList';

const CategoriesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  };

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categorías</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Añadir Categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-red-500">Error al cargar las categorías.</p>
      ) : (
        <CategoriesList categories={categories || []} />
      )}

      <CategoryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default CategoriesPage;