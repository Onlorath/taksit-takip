import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useLangStore } from '../store/langStore';

export function GlobalLedger() {
  const { lang, t } = useLangStore();

  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const installments = useLiveQuery(() => db.installments.toArray()) || [];

  const unpaidInstallments = installments.filter(inst => !inst.isPaid);
  const totalAccountDebt = unpaidInstallments.reduce((sum, inst) => sum + inst.amount, 0);

  // Generate next 6 calendar months starting from current month
  const projectionMonths: { value: string; label: string }[] = [];
  const baseDate = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const labelStr = d.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' }).toUpperCase();
    projectionMonths.push({ value: monthStr, label: labelStr });
  }

  // Calculate degradation values (remaining debt at each milestone month)
  const chartData = projectionMonths.map((m) => {
    // outstanding debt from this month onwards
    const remainingForMonth = unpaidInstallments
      .filter((inst) => inst.month >= m.value)
      .reduce((sum, inst) => sum + inst.amount, 0);
    return remainingForMonth;
  });

  const maxVal = totalAccountDebt || 1;
  const minVal = 0;

  // Map values to coordinates
  const points = chartData.map((val, idx) => {
    const x = idx * 100;
    const y = 190 - ((val - minVal) / (maxVal - minVal)) * (190 - 20);
    return { x, y, val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Aggregate transaction details
  const activeLedger = transactions.map(tx => {
    const txInstalls = installments.filter(inst => inst.transactionId === tx.id);
    const totalPeriods = txInstalls.length;
    const paidInstalls = txInstalls.filter(inst => inst.isPaid);
    const unpaidInstalls = txInstalls.filter(inst => !inst.isPaid);
    
    // sort unpaid by month ascending to find next
    unpaidInstalls.sort((a, b) => a.month.localeCompare(b.month));
    const nextInstallment = unpaidInstalls[0];
    
    const remainingAmount = unpaidInstalls.reduce((sum, inst) => sum + inst.amount, 0);
    const account = accounts.find(a => a.id === tx.accountId);

    return {
      ...tx,
      accountName: account ? account.name : 'Unknown Account',
      accountCurrency: account ? account.currency : 'USD',
      totalPeriods,
      paidCount: paidInstalls.length,
      remainingAmount,
      nextAmount: nextInstallment ? nextInstallment.amount : 0,
      isCompleted: unpaidInstalls.length === 0,
    };
  }).filter(tx => !tx.isCompleted);

  return (
    <div className="w-full flex flex-col gap-stack-lg">
      {/* Header Section */}
      <div className="mb-stack-lg border-b border-white/10 pb-stack-md mt-4">
        <h1 className="font-display text-[48px] font-bold text-primary mb-stack-sm uppercase tracking-tighter">
          {t('global_ledger')}
        </h1>
        <div className="flex items-baseline gap-4">
          <span className="font-data-lg text-[24px] font-bold text-primary-fixed-dim">
            ${totalAccountDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="font-label-mono text-[12px] text-secondary uppercase">{t('total_debt')}</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mb-stack-lg hairline-border bg-surface-container-low p-stack-md">
        <div className="flex justify-between items-center mb-stack-md border-b border-white/10 pb-stack-sm">
          <span className="font-label-mono text-[12px] text-primary uppercase">{t('installment_degradation')}</span>
          <span className="font-label-mono text-[12px] text-secondary">6 {t('projection').toUpperCase()}</span>
        </div>
        <div className="relative h-[200px] w-full">
          <svg height="100%" preserveAspectRatio="none" viewBox="0 0 500 200" width="100%">
            <line className="stroke-[rgba(255,255,255,0.05)] stroke-1" x1="0" x2="500" y1="50" y2="50"></line>
            <line className="stroke-[rgba(255,255,255,0.05)] stroke-1" x1="0" x2="500" y1="100" y2="100"></line>
            <line className="stroke-[rgba(255,255,255,0.05)] stroke-1" x1="0" x2="500" y1="150" y2="150"></line>
            
            <polyline className="stroke-primary-fixed-dim stroke-2 fill-none" points={polylinePoints}></polyline>
            
            {points.map((p, idx) => (
              <circle 
                key={idx} 
                className="fill-background stroke-primary-fixed-dim stroke-2" 
                cx={p.x} 
                cy={p.y} 
                r="4"
              />
            ))}
          </svg>
        </div>
        <div className="flex justify-between mt-4 font-label-mono text-[12px] text-secondary uppercase">
          {projectionMonths.map((m, idx) => (
            <span key={idx}>{m.label}</span>
          ))}
        </div>
      </div>

      {/* Ledger List */}
      <div>
        <h2 className="font-label-mono text-[12px] text-primary uppercase mb-stack-md border-b border-white/10 pb-stack-sm">
          {t('active_installments')}
        </h2>
        <div className="flex flex-col gap-0">
          {activeLedger.length === 0 && (
            <div className="text-secondary font-label-mono text-[12px] py-4">{t('no_active_records')}</div>
          )}
          {activeLedger.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center py-stack-sm hairline-border-b">
              <div>
                <div className="font-body-lg text-[16px] text-primary">{tx.title}</div>
                <div className="font-label-mono text-[12px] text-secondary mt-1">
                  {tx.accountName.toUpperCase()} • {tx.isRecurring ? t('recurring') : `${tx.paidCount}/${tx.totalPeriods}`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-data-lg text-[20px] font-bold text-primary-fixed-dim">
                  {tx.accountCurrency === 'TRY' ? '₺' : '$'}{tx.nextAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="font-label-mono text-[12px] text-secondary mt-1">
                  {t('rem')}: {tx.accountCurrency === 'TRY' ? '₺' : '$'}{tx.remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
