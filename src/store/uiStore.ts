import { create } from 'zustand';
import { db, type Transaction, type Installment } from '../db/db';

interface UIState {
  selectedAccountId: string | null;
  isAddDrawerOpen: boolean;
  activeTab: 'home' | 'data' | 'prefs';
  setSelectedAccountId: (id: string | null) => void;
  setAddDrawerOpen: (open: boolean) => void;
  setActiveTab: (tab: 'home' | 'data' | 'prefs') => void;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'> & { periods: number; maturityOffset: number }) => Promise<void>;
  addAccount: (name: string, type: 'bank' | 'credit', initialBalance: number, currency: 'USD' | 'TRY') => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  markInstallmentAsPaid: (installmentId: string) => Promise<void>;
}

export const useUIStore = create<UIState>((set) => ({
  selectedAccountId: null,
  isAddDrawerOpen: false,
  activeTab: 'home',
  
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  setAddDrawerOpen: (open) => set({ isAddDrawerOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addAccount: async (name, type, initialBalance, currency) => {
    const id = crypto.randomUUID();
    const today = new Date().toISOString().split('T')[0];
    await db.accounts.add({
      id,
      name,
      type,
      balance: initialBalance,
      currency: currency,
      statementDate: today,
    });
  },

  deleteAccount: async (accountId) => {
    const txs = await db.transactions.where({ accountId }).toArray();
    const txIds = txs.map(tx => tx.id);
    
    if (txIds.length > 0) {
      const installs = await db.installments.where('transactionId').anyOf(txIds).toArray();
      const installIds = installs.map(inst => inst.id);
      await db.installments.bulkDelete(installIds);
      await db.transactions.bulkDelete(txIds);
    }
    
    await db.accounts.delete(accountId);
    set({ selectedAccountId: null });
  },

  markInstallmentAsPaid: async (installmentId) => {
    await db.installments.update(installmentId, { isPaid: true });
  },

  addTransaction: async (data) => {
    const { periods, maturityOffset, ...txData } = data;
    const transactionId = crypto.randomUUID();
    
    await db.transactions.add({
      ...txData,
      id: transactionId,
      createdAt: new Date().toISOString(),
    });

    const installments: Installment[] = [];
    const installmentAmount = txData.totalAmount / periods;
    
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + maturityOffset);

    for (let i = 0; i < periods; i++) {
      const paymentDate = new Date(baseDate);
      paymentDate.setMonth(baseDate.getMonth() + i);
      
      const monthStr = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;

      installments.push({
        id: crypto.randomUUID(),
        transactionId,
        month: monthStr,
        amount: installmentAmount,
        isPaid: false,
      });
    }

    await db.installments.bulkAdd(installments);
    
    set({ isAddDrawerOpen: false });
  },
}));
