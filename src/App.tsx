import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { useUIStore } from './store/uiStore';
import { useLangStore } from './store/langStore';
import { AddTransactionDrawer } from './components/AddTransactionDrawer';
import { CardLedgerDetail } from './components/CardLedgerDetail';
import { GlobalLedger } from './components/GlobalLedger';
import { AccountsCardStack } from './components/AccountsCardStack';
import { SwipeableInstallmentItem } from './components/SwipeableInstallmentItem';
import { Wallet, PlusCircle, LayoutGrid, BarChart3, Settings } from 'lucide-react';

export default function App() {
  const { setAddDrawerOpen, selectedAccountId, setSelectedAccountId, activeTab, setActiveTab, addAccount, markInstallmentAsPaid } = useUIStore();
  
  const [newAccName, setNewAccName] = useState('');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [newAccType, setNewAccType] = useState<'credit' | 'bank'>('credit');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState<'USD' | 'TRY'>('USD');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || (newAccType === 'bank' && !newAccBalance)) return;
    const balance = newAccType === 'bank' ? parseFloat(newAccBalance) : 0;
    await addAccount(newAccName, newAccType, balance, newAccCurrency);
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('credit');
    setNewAccCurrency('USD');
    setActiveTab('home');
  };
  const { lang, setLang, t } = useLangStore();

  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const installments = useLiveQuery(() => db.installments.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const unpaidInstallments = installments.filter(inst => !inst.isPaid);
  const totalDebt = unpaidInstallments.reduce((sum, inst) => sum + inst.amount, 0);

  unpaidInstallments.sort((a, b) => a.month.localeCompare(b.month));
  
  const earliestMonth = unpaidInstallments.length > 0 ? unpaidInstallments[0].month : null;
  const upcomingTotal = earliestMonth 
    ? unpaidInstallments.filter(inst => inst.month === earliestMonth).reduce((sum, inst) => sum + inst.amount, 0)
    : 0;

  const enhancedAccounts = accounts.map(acc => {
    const accTxs = transactions.filter(t => t.accountId === acc.id);
    const txIds = new Set(accTxs.map(t => t.id));
    
    if (acc.type === 'credit') {
      const accDebt = unpaidInstallments
        .filter(inst => txIds.has(inst.transactionId))
        .reduce((sum, inst) => sum + inst.amount, 0);
      return { ...acc, balance: accDebt };
    } else {
      const paidInstalls = installments.filter(inst => inst.isPaid && txIds.has(inst.transactionId));
      const totalPaid = paidInstalls.reduce((sum, inst) => sum + inst.amount, 0);
      return { ...acc, balance: acc.balance - totalPaid };
    }
  });

  const uniqueMonths = Array.from(new Set(unpaidInstallments.map(i => i.month)));

  let filteredForList = unpaidInstallments;
  if (selectedMonthFilter !== 'all') {
    filteredForList = filteredForList.filter(i => i.month === selectedMonthFilter);
  }

  const displayedInstallments = showAllUpcoming ? filteredForList : filteredForList.slice(0, 3);

  const upcomingPaymentsList = displayedInstallments.map(inst => {
    const tx = transactions.find(t => t.id === inst.transactionId);
    const acc = accounts.find(a => a.id === tx?.accountId);
    const currencySymbol = acc?.currency === 'TRY' ? '₺' : '$';
    return {
      ...inst,
      title: tx ? tx.title : 'Unknown',
      currencySymbol,
    };
  });

  const hasTry = accounts.some(a => a.currency === 'TRY');
  const hasUsd = accounts.some(a => a.currency === 'USD');
  const globalSymbol = hasTry && !hasUsd ? '₺' : (hasUsd && !hasTry ? '$' : '');

  return (
    <div className="bg-background text-on-background font-body-lg antialiased pb-24 md:pb-0 min-h-[100dvh]">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-20 bg-background border-b border-white/10 flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop hidden md:flex">
        <div className="flex items-center gap-2 text-primary">
          <Wallet size={24} className="text-primary" />
        </div>
        <div className="font-label-mono text-[12px] tracking-widest text-primary-fixed-dim uppercase">
          {t('terminal')}
        </div>
        <div 
          onClick={() => setAddDrawerOpen(true)}
          className="flex items-center gap-2 text-primary cursor-pointer hover:text-primary-fixed transition-colors active:opacity-80"
        >
          <PlusCircle size={24} />
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-8 md:pt-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto flex flex-col gap-stack-lg">
        {activeTab === 'prefs' ? (
          /* PREFERENCES TAB VIEW */
          <section className="flex flex-col gap-stack-md mt-4">
            <div className="font-label-mono text-[12px] text-secondary uppercase tracking-widest border-b border-white/10 pb-stack-sm">
              {t('preferences')}
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-label-mono text-[12px] text-secondary uppercase">
                {t('select_lang')}
              </label>
              
              <div className="flex border border-white/10 rounded-sm overflow-hidden p-1 max-w-xs bg-surface-container-low">
                <button
                  onClick={() => setLang('en')}
                  className={`flex-1 py-3 text-center font-label-mono text-[12px] uppercase tracking-widest border border-transparent transition-colors cursor-pointer ${
                    lang === 'en' ? 'bg-primary-fixed text-on-primary-fixed font-bold' : 'text-secondary hover:text-primary'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('tr')}
                  className={`flex-1 py-3 text-center font-label-mono text-[12px] uppercase tracking-widest border border-transparent transition-colors cursor-pointer ${
                    lang === 'tr' ? 'bg-primary-fixed text-on-primary-fixed font-bold' : 'text-secondary hover:text-primary'
                  }`}
                >
                  Türkçe
                </button>
              </div>
            </div>

            <div className="font-label-mono text-[12px] text-secondary uppercase tracking-widest border-b border-white/10 pb-stack-sm mt-8">
              {t('manage_accounts')}
            </div>

            <form onSubmit={handleAddAccount} className="flex flex-col gap-4 max-w-sm">
              <div className="flex flex-col border-b border-white/10 pb-2 group">
                <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('account_name')}</label>
                <input 
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full bg-transparent border-none p-0 font-body-lg text-[16px] text-primary placeholder-white/20 focus:ring-0 focus:outline-none" 
                  placeholder="CORP AMEX" 
                  type="text"
                  required
                />
              </div>

              <div className="flex flex-col border-b border-white/10 pb-2 group">
                <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('account_type')}</label>
                <div className="relative w-full">
                  <select 
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as 'credit' | 'bank')}
                    className="w-full bg-transparent border-none p-0 text-[16px] text-primary focus:ring-0 appearance-none cursor-pointer outline-none"
                    required
                  >
                    <option value="credit" className="bg-surface-container text-primary">{t('credit_card')}</option>
                    <option value="bank" className="bg-surface-container text-primary">{t('bank_account')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col border-b border-white/10 pb-2 group">
                <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('currency')}</label>
                <div className="relative w-full">
                  <select 
                    value={newAccCurrency}
                    onChange={(e) => setNewAccCurrency(e.target.value as 'USD' | 'TRY')}
                    className="w-full bg-transparent border-none p-0 text-[16px] text-primary focus:ring-0 appearance-none cursor-pointer outline-none"
                    required
                  >
                    <option value="USD" className="bg-surface-container text-primary">USD ($)</option>
                    <option value="TRY" className="bg-surface-container text-primary">TRY (₺)</option>
                  </select>
                </div>
              </div>

              {newAccType === 'bank' && (
                <div className="flex flex-col border-b border-white/10 pb-2 group">
                  <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('initial_balance')}</label>
                  <div className="flex items-baseline">
                    <span className="font-data-lg text-[20px] text-primary-fixed-dim mr-1 font-bold">{newAccCurrency === 'USD' ? '$' : '₺'}</span>
                    <input 
                      value={newAccBalance}
                      onChange={(e) => setNewAccBalance(e.target.value)}
                      className="w-full bg-transparent border-none p-0 font-data-lg text-[20px] font-bold text-primary placeholder-white/20 focus:ring-0 focus:outline-none" 
                      placeholder="0.00" 
                      step="0.01" 
                      type="number"
                      required
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed font-headline-md text-[20px] font-semibold py-3 mt-2 transition-colors uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle size={24} />
                {t('add_account')}
              </button>
            </form>
          </section>
        ) : activeTab === 'data' ? (
          /* GLOBAL LEDGER DATA VIEW */
          <GlobalLedger />
        ) : (
          /* HOME/DASHBOARD VIEW */
          <>
            {/* Hero Data Section */}
            <section className="flex flex-col gap-unit">
              <div className="font-label-mono text-[12px] text-secondary uppercase tracking-widest">{t('total_remaining_debt')}</div>
              <div className="font-data-lg text-[48px] font-bold text-primary tracking-tighter">
                {globalSymbol}{totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2 text-secondary font-label-mono text-[12px] uppercase tracking-widest mt-2">
                <span>{t('upcoming')}</span>
                <span className="text-error font-bold">
                  -{globalSymbol}{upcomingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </section>

            {/* Accounts Stack */}
            <section className="flex flex-col gap-stack-md">
              <div className="font-label-mono text-[12px] text-secondary uppercase tracking-widest flex justify-between items-center">
                <span>{t('accounts')}</span>
                <PlusCircle className="text-primary cursor-pointer hover:text-primary-fixed md:hidden" size={20} onClick={() => setAddDrawerOpen(true)} />
              </div>
              <div className="overflow-y-auto max-h-[450px] hide-scrollbar w-full relative">
                <AccountsCardStack 
                  accounts={enhancedAccounts} 
                  onAccountClick={(id) => setSelectedAccountId(id)} 
                />
              </div>
            </section>

            {/* Upcoming Payments List */}
            <section className="flex flex-col gap-stack-md">
              <div className="font-label-mono text-[12px] text-secondary uppercase tracking-widest flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span>{t('upcoming_payments')}</span>
                  {uniqueMonths.length > 0 && (
                    <select
                      value={selectedMonthFilter}
                      onChange={(e) => setSelectedMonthFilter(e.target.value)}
                      className="bg-transparent border border-white/10 text-primary text-[10px] py-1 px-2 outline-none focus:border-primary-fixed-dim transition-colors appearance-none cursor-pointer"
                    >
                      <option value="all" className="bg-surface-container">{t('all_months')}</option>
                      {uniqueMonths.map(m => (
                        <option key={m} value={m} className="bg-surface-container">{m}</option>
                      ))}
                    </select>
                  )}
                </div>
                {filteredForList.length > 3 && (
                  <span 
                    className="text-primary-fixed-dim cursor-pointer"
                    onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                  >
                    {showAllUpcoming ? t('show_less') : t('view_all')}
                  </span>
                )}
              </div>
              <div className="border border-white/10 bg-transparent flex flex-col overflow-y-auto max-h-[300px] hide-scrollbar">
                {upcomingPaymentsList.length === 0 && (
                  <div className="p-stack-md text-secondary font-label-mono text-[12px]">{t('no_upcoming_payments')}</div>
                )}
                {upcomingPaymentsList.map((inst) => (
                  <SwipeableInstallmentItem 
                    key={inst.id} 
                    installment={inst} 
                    onMarkAsPaid={markInstallmentAsPaid} 
                  />
                ))}
              </div>
            </section>

            {/* Actions */}
            <section className="grid grid-cols-2 gap-stack-md">
              <button className="bg-primary-fixed-dim text-on-primary-fixed py-3 px-4 font-label-mono text-[12px] font-bold tracking-widest hover:brightness-110 transition-all text-center cursor-pointer">
                {t('initiate_transfer')}
              </button>
              <button className="border border-white/10 bg-transparent text-primary py-3 px-4 font-label-mono text-[12px] font-bold tracking-widest hover:border-primary-fixed-dim transition-all text-center cursor-pointer">
                {t('generate_report')}
              </button>
            </section>
          </>
        )}
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 w-full z-20 bg-background border-t border-white/10 flex justify-around items-center h-16 w-full pb-safe md:hidden">
        <div onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center cursor-pointer w-full h-full transition-transform ${activeTab === 'home' ? 'text-primary-fixed-dim font-bold active:scale-95' : 'text-secondary opacity-50 hover:opacity-100 active:scale-95'}`}>
          <LayoutGrid size={24} className="mb-1" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="font-label-mono text-[10px] uppercase tracking-widest">{t('home')}</span>
        </div>
        <div onClick={() => setActiveTab('data')} className={`flex flex-col items-center justify-center cursor-pointer w-full h-full transition-transform ${activeTab === 'data' ? 'text-primary-fixed-dim font-bold active:scale-95' : 'text-secondary opacity-50 hover:opacity-100 active:scale-95'}`}>
          <BarChart3 size={24} className="mb-1" strokeWidth={activeTab === 'data' ? 2.5 : 2} />
          <span className="font-label-mono text-[10px] uppercase tracking-widest">{t('data')}</span>
        </div>
        <div onClick={() => setActiveTab('prefs')} className={`flex flex-col items-center justify-center cursor-pointer w-full h-full transition-transform ${activeTab === 'prefs' ? 'text-primary-fixed-dim font-bold active:scale-95' : 'text-secondary opacity-50 hover:opacity-100 active:scale-95'}`}>
          <Settings size={24} className="mb-1" strokeWidth={activeTab === 'prefs' ? 2.5 : 2} />
          <span className="font-label-mono text-[10px] uppercase tracking-widest">{t('prefs')}</span>
        </div>
      </nav>

      {/* Drawers and Overlays */}
      <AddTransactionDrawer />
      {selectedAccountId && <CardLedgerDetail />}
    </div>
  );
}
