import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Landmark } from 'lucide-react';
import { useLangStore } from '../store/langStore';

export interface StackAccount {
  id: string;
  name: string;
  type: 'bank' | 'credit';
  balance: number;
  currency: 'USD' | 'TRY';
}

interface AccountsCardStackProps {
  accounts: StackAccount[];
  onAccountClick?: (id: string) => void;
}

export function AccountsCardStack({ accounts, onAccountClick }: AccountsCardStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLangStore();

  const cardHeight = 160;
  const collapsedGap = 35;
  const expandedGap = 176; // cardHeight + 16px gap

  // Calculate dynamic container height based on expansion state
  const containerHeight = isExpanded 
    ? cardHeight + (accounts.length > 0 ? accounts.length - 1 : 0) * expandedGap 
    : cardHeight + (accounts.length > 0 ? accounts.length - 1 : 0) * collapsedGap;

  const handleCardClick = (id: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
    } else {
      if (onAccountClick) onAccountClick(id);
      setIsExpanded(false);
    }
  };

  return (
    <motion.div 
      className="relative w-full"
      animate={{ height: accounts.length > 0 ? containerHeight : 160 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {accounts.map((acc, i) => {
        // Render from top to bottom structurally, but zIndex reverses this so index 0 is on top visually.
        return (
          <motion.div
            key={acc.id}
            onClick={() => handleCardClick(acc.id)}
            className="absolute top-0 left-0 w-full h-[160px] cursor-pointer bg-zinc-950 border border-zinc-800 p-6 flex flex-col justify-between shadow-none rounded-none"
            style={{ zIndex: accounts.length - i }}
            initial={false}
            animate={{
              y: isExpanded ? i * expandedGap : i * collapsedGap,
              scale: isExpanded ? 1 : Math.max(1 - i * 0.05, 0.8),
              opacity: isExpanded ? 1 : Math.max(1 - i * 0.15, 0),
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            whileHover={{ scale: isExpanded ? 1.02 : (1 - i * 0.05) + 0.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex justify-between items-start">
              <div className="font-label-mono text-[14px] text-white tracking-widest uppercase">{acc.name}</div>
              {acc.type === 'credit' ? (
                <CreditCard size={20} className="text-zinc-500" />
              ) : (
                <Landmark size={20} className="text-zinc-500" />
              )}
            </div>
            <div>
              <div className="font-label-mono text-[10px] text-zinc-500 mb-1 tracking-widest">{t('balance')}</div>
              <div className="font-data-lg text-[24px] font-bold text-cyan-400 tracking-tight">
                {acc.currency === 'TRY' ? '₺' : '$'}{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </motion.div>
        );
      })}
      
      {accounts.length === 0 && (
        <div className="w-full h-[160px] border border-zinc-800 border-dashed bg-transparent p-6 flex flex-col justify-center items-center rounded-none">
          <span className="font-label-mono text-[12px] text-zinc-500 tracking-widest">{t('no_accounts')}</span>
        </div>
      )}
    </motion.div>
  );
}
