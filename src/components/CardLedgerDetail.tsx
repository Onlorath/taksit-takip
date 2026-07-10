import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useUIStore } from '../store/uiStore';
import { useLangStore } from '../store/langStore';
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';

export function CardLedgerDetail() {
  const { selectedAccountId, setSelectedAccountId, setAddDrawerOpen, deleteAccount } = useUIStore();
  const { t } = useLangStore();
  const [showPastPayments, setShowPastPayments] = useState(false);

  const account = useLiveQuery(() => 
    selectedAccountId ? db.accounts.get(selectedAccountId) : undefined
  , [selectedAccountId]);

  const transactions = useLiveQuery(() => 
    selectedAccountId ? db.transactions.where({ accountId: selectedAccountId }).toArray() : []
  , [selectedAccountId]);

  const installments = useLiveQuery(() => 
    db.installments.toArray()
  , []);

  if (!selectedAccountId || !account) return null;

  // Aggregate transaction details
  const activeLedger = (transactions || []).map(tx => {
    const txInstalls = (installments || []).filter(inst => inst.transactionId === tx.id);
    const totalPeriods = txInstalls.length;
    const paidInstalls = txInstalls.filter(inst => inst.isPaid);
    const unpaidInstalls = txInstalls.filter(inst => !inst.isPaid);
    
    // sort unpaid by month ascending to find next
    unpaidInstalls.sort((a, b) => a.month.localeCompare(b.month));
    const nextInstallment = unpaidInstalls[0];
    
    const remainingAmount = unpaidInstalls.reduce((sum, inst) => sum + inst.amount, 0);

    return {
      ...tx,
      totalPeriods,
      paidCount: paidInstalls.length,
      remainingAmount,
      nextAmount: nextInstallment ? nextInstallment.amount : 0,
      isCompleted: unpaidInstalls.length === 0,
    };
  }).filter(tx => !tx.isCompleted);

  const txIds = new Set((transactions || []).map(tx => tx.id));
  const pastInstallments = (installments || [])
    .filter(inst => inst.isPaid && txIds.has(inst.transactionId))
    .sort((a, b) => b.month.localeCompare(a.month))
    .map(inst => {
      const tx = (transactions || []).find(t => t.id === inst.transactionId);
      return { ...inst, title: tx?.title || 'Unknown' };
    });

  const totalAccountDebt = activeLedger.reduce((sum, tx) => sum + tx.remainingAmount, 0);

  return (
    <div className="fixed inset-0 bg-background z-30 overflow-y-auto">
      {/* TopAppBar */}
      <header className="bg-background text-primary font-headline-md text-[24px] font-semibold sticky top-0 w-full z-50 border-b border-white/10 flex justify-between items-center h-16 px-margin-mobile">
        <div className="flex items-center gap-4">
          <ArrowLeft 
            onClick={() => setSelectedAccountId(null)}
            className="hover:text-primary-fixed transition-colors active:opacity-80 cursor-pointer"
            size={24}
          />
          <span className="font-label-mono text-[12px] uppercase tracking-widest text-primary-fixed-dim">
            {t('terminal')}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 px-margin-mobile md:px-margin-desktop py-stack-lg max-w-5xl mx-auto w-full mt-4">
        {/* Header Section */}
        <div className="mb-stack-lg border-b border-white/10 pb-stack-md flex justify-between items-end">
          <div>
            <h1 className="font-display text-[48px] font-bold text-primary mb-stack-sm uppercase tracking-tighter">
              {account.name}
            </h1>
            <div className="flex items-baseline gap-4">
              <span className="font-data-lg text-[20px] font-bold text-primary-fixed-dim">
                {account.currency === 'TRY' ? '₺' : '$'}{totalAccountDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="font-label-mono text-[12px] text-secondary uppercase">{t('total_debt')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (window.confirm(t('confirm_delete'))) {
                  deleteAccount(account.id);
                }
              }}
              className="border border-red-500/50 hover:bg-red-500/10 text-red-500 p-3 rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer"
              title={t('delete_account')}
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={() => setAddDrawerOpen(true)}
              className="bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed p-3 rounded-none transition-colors flex items-center justify-center gap-2 font-label-mono text-[12px] font-bold uppercase tracking-widest cursor-pointer"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">{t('add_record')}</span>
            </button>
          </div>
        </div>

        {/* Chart Section Mock */}
        <div className="mb-stack-lg hairline-border bg-surface-container-low p-stack-md">
          <div className="flex justify-between items-center mb-stack-md border-b border-white/10 pb-stack-sm">
            <span className="font-label-mono text-[12px] text-primary uppercase">{t('installment_degradation')}</span>
            <span className="font-label-mono text-[12px] text-secondary">{t('projection')}</span>
          </div>
          <div className="relative h-[200px] w-full">
            <svg height="100%" preserveAspectRatio="none" viewBox="0 0 500 200" width="100%">
              <line className="stroke-[rgba(255,255,255,0.05)] stroke-1" x1="0" x2="500" y1="50" y2="50"></line>
              <line className="stroke-[rgba(255,255,255,0.05)] stroke-1" x1="0" x2="500" y1="100" y2="100"></line>
              <line className="stroke-[rgba(255,255,255,0.05)] stroke-1" x1="0" x2="500" y1="150" y2="150"></line>
              <polyline className="stroke-primary-fixed-dim stroke-2 fill-none" points="0,20 100,50 200,90 300,140 400,170 500,190"></polyline>
              <circle className="fill-background stroke-primary-fixed-dim stroke-2" cx="0" cy="20" r="4"></circle>
              <circle className="fill-background stroke-primary-fixed-dim stroke-2" cx="100" cy="50" r="4"></circle>
              <circle className="fill-background stroke-primary-fixed-dim stroke-2" cx="200" cy="90" r="4"></circle>
              <circle className="fill-background stroke-primary-fixed-dim stroke-2" cx="300" cy="140" r="4"></circle>
              <circle className="fill-background stroke-primary-fixed-dim stroke-2" cx="400" cy="170" r="4"></circle>
              <circle className="fill-background stroke-primary-fixed-dim stroke-2" cx="500" cy="190" r="4"></circle>
            </svg>
          </div>
        </div>

        {/* Ledger List */}
        <div>
          <div className="flex justify-between items-center mb-stack-md border-b border-white/10 pb-stack-sm">
            <h2 className="font-label-mono text-[12px] text-primary uppercase">
              {showPastPayments ? t('past_payments') : t('active_installments')}
            </h2>
            <button 
              onClick={() => setShowPastPayments(!showPastPayments)}
              className="text-primary-fixed-dim font-label-mono text-[12px] hover:text-primary transition-colors cursor-pointer uppercase font-bold tracking-widest"
            >
              {showPastPayments ? t('active_installments') : t('past_payments')}
            </button>
          </div>
          <div className="flex flex-col gap-0">
            {!showPastPayments ? (
              <>
                {activeLedger.length === 0 && (
                  <div className="text-secondary font-label-mono text-[12px] py-4">{t('no_active_records')}</div>
                )}
                {activeLedger.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center py-stack-sm hairline-border-b">
                    <div>
                      <div className="font-body-lg text-[16px] text-primary">{tx.title}</div>
                      <div className="font-label-mono text-[12px] text-secondary mt-1">
                        {tx.isRecurring ? t('recurring') : `${t('periods')} • ${tx.paidCount}/${tx.totalPeriods}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-data-lg text-[20px] font-bold text-primary-fixed-dim">
                        {account.currency === 'TRY' ? '₺' : '$'}{tx.nextAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="font-label-mono text-[12px] text-secondary mt-1">
                        {t('rem')}: {account.currency === 'TRY' ? '₺' : '$'}{tx.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {pastInstallments.length === 0 && (
                  <div className="text-secondary font-label-mono text-[12px] py-4">{t('no_past_payments')}</div>
                )}
                {pastInstallments.map((inst) => (
                  <div key={inst.id} className="flex justify-between items-center py-stack-sm hairline-border-b opacity-50 hover:opacity-100 transition-opacity">
                    <div>
                      <div className="font-body-lg text-[16px] text-primary line-through">{inst.title}</div>
                      <div className="font-label-mono text-[12px] text-secondary mt-1">{inst.month}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-data-lg text-[20px] font-bold text-primary">
                        {account.currency === 'TRY' ? '₺' : '$'}{inst.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="font-label-mono text-[10px] text-cyan-400 mt-1 uppercase tracking-widest font-bold">
                        {t('paid')}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
