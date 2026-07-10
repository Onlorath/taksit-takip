import { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo, useAnimation } from 'framer-motion';
import { Check } from 'lucide-react';

export interface InstallmentData {
  id: string;
  transactionId: string;
  month: string;
  amount: number;
  isPaid: boolean;
  title: string;
  currencySymbol: string;
}

interface SwipeableInstallmentItemProps {
  installment: InstallmentData;
  onMarkAsPaid: (id: string) => void;
}

export function SwipeableInstallmentItem({ installment, onMarkAsPaid }: SwipeableInstallmentItemProps) {
  const [isPaid, setIsPaid] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Mapping drag x value to the Check icon's visual properties for organic feedback
  const iconScale = useTransform(x, [0, 80], [0.5, 1.2]);
  const iconOpacity = useTransform(x, [0, 80], [0, 1]);
  const iconRotate = useTransform(x, [0, 80], [-45, 0]);

  const handleDragEnd = async (_e: any, info: PanInfo) => {
    // Threshold is 80px
    if (info.offset.x > 80 && !isPaid) {
      if (navigator.vibrate) {
        navigator.vibrate(50); // Haptic feedback
      }
      setIsPaid(true);
      
      // Animate the card flying off to the right
      await controls.start({ 
        x: window.innerWidth, 
        transition: { type: "spring", stiffness: 400, damping: 25 } 
      });
      
      // Call the actual function to mark as paid
      onMarkAsPaid(installment.id);
    } else {
      // Snap back if threshold not met
      controls.start({ 
        x: 0, 
        transition: { type: "spring", stiffness: 400, damping: 25 } 
      });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 1, height: 'auto', marginBottom: 0 }}
      animate={
        isPaid 
          ? { opacity: 0, height: 0, borderBottomWidth: 0 } 
          : { opacity: 1, height: 'auto' }
      }
      transition={{ opacity: { duration: 0.2 }, height: { duration: 0.3, delay: 0.1 } }}
      className="relative overflow-hidden border-b border-white/10 last:border-0"
    >
      {/* Hidden Reveal Layer - Aggressive accent */}
      <div className="absolute inset-0 bg-cyan-400 flex items-center px-6 justify-start">
        <motion.div style={{ scale: iconScale, opacity: iconOpacity, rotate: iconRotate }}>
          <Check className="text-black" size={28} strokeWidth={3} />
        </motion.div>
      </div>

      {/* Top Swipeable Layer - Brutalist Dark Mode */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }} // Elastic resistance
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className="relative bg-zinc-950 p-stack-md flex justify-between items-center cursor-grab active:cursor-grabbing z-10 hover:bg-surface-container-low transition-colors"
      >
        <div className="flex flex-col gap-unit">
          <div className="font-body-lg text-[16px] text-primary">{installment.title}</div>
          <div className="font-label-mono text-[12px] text-secondary">{installment.month}</div>
        </div>
        <div className="font-data-lg text-[20px] font-bold text-primary">
          -{installment.currencySymbol}{installment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </motion.div>
    </motion.div>
  );
}
