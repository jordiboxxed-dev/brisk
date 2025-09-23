import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Transaction } from '@/types';

interface CategoryChartProps {
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CategoryChart = ({ transactions }: CategoryChartProps) => {
  const expenseDataByCurrency = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => {
      if (!acc[tx.currency]) {
        acc[tx.currency] = {};
      }
      const categoryName = tx.categories?.name || 'Sin Categoría';
      acc[tx.currency][categoryName] = (acc[tx.currency][categoryName] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, Record<string, number>>);

  const charts = Object.entries(expenseDataByCurrency).map(([currency, categoryData]) => {
    const chartData = Object.entries(categoryData).map(([name, value]) => ({
      name,
      value,
    }));

    if (chartData.length === 0) {
      return null;
    }

    return (
      <div key={currency}>
        <h3 className="text-lg font-semibold mb-2 text-center">{currency}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('es-UY', {
                  style: 'currency',
                  currency: currency,
                }).format(value)
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Categoría (Mes Actual)</CardTitle>
      </CardHeader>
      <CardContent>
        {charts.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {charts}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No hay gastos este mes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryChart;