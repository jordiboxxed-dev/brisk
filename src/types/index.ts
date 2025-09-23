export interface Account {
  id: string;
  user_id: string;
  name: string;
  currency: 'USD' | 'UYU';
  balance: number;
  created_at: string;
}