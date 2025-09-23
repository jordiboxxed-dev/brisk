import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Account } from '@/types';

interface BalanceSummaryProps {
  accounts: Pick<Account, 'balance' | 'currency'>[];
}

const BalanceSummary = ({ accounts }: BalanceSummaryProps) => {
  const totalBalances = accounts.reduce((acc, account) => {
    acc[account.currency] = (acc[account.currency] || 0) + account.balance;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(totalBalances).map(([currency, balance]) => (
        <Card key={currency}>
          <CardHeader>
            <CardTitle>Saldo Total ({currency})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('es-UY', { style: 'currency', currency }).format(balance)}
            </div>
          </CardContent>
        </Card>
      ))}
      {Object.keys(totalBalances).length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sin Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Añade una cuenta para ver tu saldo.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BalanceSummary;