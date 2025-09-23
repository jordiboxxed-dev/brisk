export interface Account {
  id: string;
  user_id: string;
  name: string;
  currency: 'USD' | 'UYU';
  balance: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  currency: 'USD' | 'UYU';
  created_at: string;
  accounts: { name: string };
  categories: { name: string; icon: string };
}