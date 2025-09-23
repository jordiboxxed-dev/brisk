import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/types';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

const IncomeExpenseChart = ({ transactions }: IncomeExpenseChartProps) => {
  const dataByCurrency = transactions.reduce((acc, tx) => {
    if (!acc[tx.currency]) {
      acc[tx.currency] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      acc[tx.currency].income += tx.amount;
    } else {
      acc[tx.currency].expense += tx.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const charts = Object.entries(dataByCurrency).map(([currency, data]) => {
    const chartData = [
      {
        name: 'Mes Actual',
        Ingresos: data.income,
        Gastos: data.expense,
      },
    ];
    return (
      <div key={currency}>
        <h3 className="text-lg font-semibold mb-2 text-center">{currency}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency,
                  notation: 'compact'
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency,
                }).format(value)
              }
            />
            <Legend />
            <Bar dataKey="Ingresos" fill="#22c55e" />
            <Bar dataKey="Gastos" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos vs. Gastos (Mes Actual)</CardTitle>
      </CardHeader>
      <CardContent>
        {charts.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {charts}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No hay datos para mostrar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;