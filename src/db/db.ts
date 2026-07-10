import Dexie, { type Table } from 'dexie';

export interface Account {
  id: string;
  name: string;
  type: 'credit' | 'bank';
  balance: number;
  statementDate: string;
  currency: 'USD' | 'TRY';
}

export interface Transaction {
  id: string;
  accountId: string;
  title: string;
  totalAmount: number;
  isRecurring: boolean;
  createdAt: string;
}

export interface Installment {
  id: string;
  transactionId: string;
  month: string; // YYYY-MM
  amount: number;
  isPaid: boolean;
}

export class AppDb extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  installments!: Table<Installment, string>;

  constructor() {
    super('LedgerDB');
    this.version(1).stores({
      accounts: 'id, name, type',
      transactions: 'id, accountId, title, isRecurring, createdAt',
      installments: 'id, transactionId, month, isPaid',
    });
  }
}

export const db = new AppDb();