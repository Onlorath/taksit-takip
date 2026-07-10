import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useLangStore } from '../store/langStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { X, ChevronDown, PlusCircle } from 'lucide-react';

export function AddTransactionDrawer() {
  const { isAddDrawerOpen, setAddDrawerOpen, addTransaction, selectedAccountId } = useUIStore();
  const { t } = useLangStore();
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  const [type, setType] = useState<'INSTALLMENT' | 'SUBSCRIPTION'>('INSTALLMENT');
  const [accountId, setAccountId] = useState(selectedAccountId || '');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [periods, setPeriods] = useState(12);
  const [maturityStr, setMaturityStr] = useState('30');

  const selectedAccountCurrency = accounts.find(a => a.id === accountId)?.currency;
  const currencySymbol = selectedAccountCurrency === 'TRY' ? '₺' : '$';

  useEffect(() => {
    if (isAddDrawerOpen && selectedAccountId) {
      setAccountId(selectedAccountId);
    }
  }, [isAddDrawerOpen, selectedAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !totalAmount || !accountId) return;

    await addTransaction({
      accountId,
      title,
      totalAmount: parseFloat(totalAmount),
      isRecurring: type === 'SUBSCRIPTION',
      periods: type === 'SUBSCRIPTION' ? 1 : periods,
      maturityOffset: parseInt(maturityStr, 10),
    });
    
    // Reset form
    setTitle('');
    setTotalAmount('');
    setPeriods(12);
  };

  return (
    <AnimatePresence>
      {isAddDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setAddDrawerOpen(false)}
          >
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, { offset, velocity }) => {
                if (offset.y > 150 || velocity.y > 500) {
                  setAddDrawerOpen(false);
                }
              }}
              className="bg-zinc-900/95 w-full h-[751px] rounded-t-xl border-t border-x border-white/10 flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-margin-mobile pb-4 border-b border-white/10 flex justify-between items-end">
                <h2 className="font-headline-md text-[24px] font-semibold uppercase tracking-tight text-white">{t('add_record')}</h2>
                <button 
                  onClick={() => setAddDrawerOpen(false)}
                  aria-label="Close" 
                  className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-2 -mr-2 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-margin-mobile flex flex-col gap-stack-lg">
                {/* Type Toggle */}
                <div className="flex border border-white/10 rounded-sm overflow-hidden p-1">
                  <button 
                    type="button"
                    onClick={() => setType('INSTALLMENT')}
                    className={`flex-1 py-3 text-center font-label-mono text-[12px] uppercase tracking-widest border border-transparent transition-colors cursor-pointer ${type === 'INSTALLMENT' ? 'bg-primary-fixed text-on-primary-fixed font-bold' : 'text-secondary hover:text-primary'}`}
                  >
                    {t('installment')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('SUBSCRIPTION')}
                    className={`flex-1 py-3 text-center font-label-mono text-[12px] uppercase tracking-widest border border-transparent transition-colors cursor-pointer ${type === 'SUBSCRIPTION' ? 'bg-primary-fixed text-on-primary-fixed font-bold' : 'text-secondary hover:text-primary'}`}
                  >
                    {t('subscription')}
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-0 h-full">
                  
                  {!selectedAccountId && (
                    <div className="flex flex-col border-b border-white/10 pb-2 mb-stack-md group">
                      <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('source_account')}</label>
                      <div className="relative w-full">
                        <select 
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-[16px] text-primary focus:ring-0 appearance-none cursor-pointer outline-none"
                          required
                        >
                          <option value="" disabled className="bg-surface-container text-primary">{t('select_account')}</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="bg-surface-container text-primary">{acc.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" size={20} />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col border-b border-white/10 pb-2 mb-stack-md group">
                    <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('entity_desc')}</label>
                    <input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent border-none p-0 font-body-lg text-[16px] text-primary placeholder-white/20 focus:ring-0 focus:outline-none" 
                      placeholder="AWS_EC2_COMPUTE" 
                      type="text"
                      required
                    />
                  </div>

                  <div className="flex flex-col border-b border-white/10 pb-2 mb-stack-md group">
                    <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('value_usd')}</label>
                    <div className="flex items-baseline">
                      <span className="font-data-lg text-[20px] text-primary-fixed-dim mr-1 font-bold">{currencySymbol}</span>
                      <input 
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="w-full bg-transparent border-none p-0 font-data-lg text-[20px] font-bold text-primary placeholder-white/20 focus:ring-0 focus:outline-none" 
                        placeholder="0.00" 
                        step="0.01" 
                        type="number"
                        required
                      />
                    </div>
                  </div>

                  {type === 'INSTALLMENT' && (
                    <div className="flex flex-col pb-4 mb-stack-md">
                      <div className="flex justify-between items-end mb-4">
                        <label className="font-label-mono text-[12px] text-secondary uppercase">{t('periods')}</label>
                        <span className="font-data-lg text-[20px] font-bold text-primary">{periods}x</span>
                      </div>
                      <input 
                        className="w-full" 
                        max="36" 
                        min="1" 
                        type="range" 
                        value={periods}
                        onChange={(e) => setPeriods(parseInt(e.target.value, 10))}
                      />
                      <div className="flex justify-between mt-2 font-label-mono text-[10px] text-secondary/50">
                        <span>1</span>
                        <span>36</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col border-b border-white/10 pb-2 group mb-auto">
                    <label className="font-label-mono text-[12px] text-secondary mb-1 group-focus-within:text-primary-fixed-dim transition-colors uppercase">{t('maturity_offset')}</label>
                    <div className="relative w-full">
                      <select 
                        value={maturityStr}
                        onChange={(e) => setMaturityStr(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-[16px] text-primary focus:ring-0 appearance-none cursor-pointer outline-none"
                      >
                        <option value="0" className="bg-surface-container text-primary">{t('immediate')}</option>
                        <option value="30" className="bg-surface-container text-primary">{t('offset_30')}</option>
                        <option value="60" className="bg-surface-container text-primary">{t('offset_60')}</option>
                        <option value="90" className="bg-surface-container text-primary">{t('offset_90')}</option>
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" size={20} />
                    </div>
                  </div>

                  {/* Action Button Footer */}
                  <div className="pt-4 border-t border-white/10 mt-4 pb-safe">
                    <button 
                      type="submit"
                      className="w-full bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed font-headline-md text-[24px] font-semibold py-4 rounded-none transition-colors uppercase flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PlusCircle size={28} />
                      {t('commit_tx')}
                    </button>
                  </div>
                </form>
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
