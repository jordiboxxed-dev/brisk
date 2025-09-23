import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transacciones Recientes</CardTitle>
        <CardDescription>Tus últimos 5 movimientos del mes.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{tx.categories?.name || 'N/A'}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {new Intl.NumberFormat('es-UY', {
                      style: 'currency',
                      currency: tx.currency,
                    }).format(tx.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No hay transacciones este mes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;