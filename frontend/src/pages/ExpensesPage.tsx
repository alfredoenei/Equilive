import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Wallet, ArrowUpRight, ArrowDownLeft, Receipt, CheckCircle2, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  toName: string;
  amount: number;
}

const SettleModal = ({ isOpen, onClose, onConfirm, toName, amount }: SettleModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy-deep/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
          >
            <div className="p-10 text-center space-y-8">
              <div className="w-24 h-24 bg-emerald-mint/10 rounded-[2rem] flex items-center justify-center text-emerald-mint mx-auto shadow-inner">
                <CheckCircle2 size={48} strokeWidth={2.5} />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-navy-deep tracking-tighter">¿Confirmas el pago?</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                  ¿Has pagado los <span className="font-extrabold text-navy-deep">${amount}</span> a <span className="font-extrabold text-navy-deep">{toName}</span> por fuera de la app?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className="w-full py-5 bg-emerald-mint text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-emerald-mint/20 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Sí, ya lo pagué
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-slate-100 text-slate-400 rounded-[1.5rem] font-black text-sm active:scale-95 transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ExpensesPage = () => {
  // Granular Zustand selectors — component only re-renders when these specific slices change
  const expenses = useAppStore(state => state.expenses);
  const balances = useAppStore(state => state.balances);
  const loading = useAppStore(state => state.loading);
  const houseMembers = useAppStore(state => state.houseMembers);
  const fetchExpenses = useAppStore(state => state.fetchExpenses);
  const fetchBalances = useAppStore(state => state.fetchBalances);
  const fetchHouseMembers = useAppStore(state => state.fetchHouseMembers);
  const settleDebt = useAppStore(state => state.settleDebt);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<{ id: string, name: string, amount: number } | null>(null);

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchExpenses();
    fetchBalances();
    fetchHouseMembers();
  }, [fetchExpenses, fetchBalances, fetchHouseMembers]);

  const handleSettle = useCallback(async () => {
    if (!selectedDebt) return;
    
    const { id: toUserId, name: toName, amount } = selectedDebt;
    setIsModalOpen(false);
    
    const toastId = toast.loading(`Liquidando $${amount} con ${toName}...`);
    try {
      await settleDebt(toUserId, amount);
      toast.success('💸 Deuda saldada exitosamente', {
        id: toastId,
        description: `Has ganado +10 Karma por tu puntualidad.`,
        icon: <Trophy className="text-amber-500" />
      });
    } catch {
      toast.error('Error al liquidar la deuda', { id: toastId });
    }
  }, [selectedDebt, settleDebt]);

  // Memoized derived data — prevents recalculation on every render
  const myDebts = useMemo(() => balances.filter(b => b.from === user?.id), [balances, user?.id]);
  const myCredits = useMemo(() => balances.filter(b => b.to === user?.id), [balances, user?.id]);
  
  const { totalDebt, totalCredit, netBalance } = useMemo(() => {
    const debt = myDebts.reduce((acc, d) => acc + d.amount, 0);
    const credit = myCredits.reduce((acc, c) => acc + c.amount, 0);
    return {
      totalDebt: debt,
      totalCredit: credit,
      netBalance: Math.round((credit - debt) * 100) / 100
    };
  }, [myDebts, myCredits]);

  if (loading && expenses.length === 0) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-12 w-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-[3rem]" />
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-[2rem]" />
          <Skeleton className="h-24 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Finanzas</p>
          <h1 className="text-5xl font-black text-white tracking-tighter">Gastos</h1>
        </div>
        <div className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 flex items-center justify-center text-white/40 shadow-2xl">
          <Wallet size={28} strokeWidth={1.5} />
        </div>
      </header>

      {/* Net Balance Card - Premium Navy Version */}
      <section className="relative overflow-hidden bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 text-white border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-mint/5 blur-[80px] rounded-full -ml-24 -mb-24" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Balance Global</p>
          <div className="flex flex-col items-center">
            <span className={`text-6xl font-black tracking-tighter ${netBalance >= 0 ? 'text-emerald-mint' : 'text-coral-soft'}`}>
              {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance)}
            </span>
            <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${netBalance >= 0 ? 'bg-emerald-mint/20 text-emerald-mint' : 'bg-coral-soft/20 text-coral-soft'}`}>
              {netBalance >= 0 ? 'A tu favor' : 'Pendiente de pago'}
            </div>
          </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-10 mt-12 pt-8 border-t border-white/5">
          <div className="space-y-1">
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">Debes cobrar</p>
            <p className="text-2xl font-black text-white/90 tracking-tight">${totalCredit}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">Debes pagar</p>
            <p className="text-2xl font-black text-white/90 tracking-tight">${totalDebt}</p>
          </div>
        </div>
      </section>

      {/* Balances Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Saldos Individuales</h2>
          <div className="bg-brand-500/10 text-brand-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-brand-500/20">
            {houseMembers.length} MIEMBROS
          </div>
        </div>
        
        <div className="grid gap-4">
          {myDebts.length === 0 && myCredits.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/5 p-12 rounded-[3.5rem] flex flex-col items-center text-center gap-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-mint/10 rounded-[2.5rem] flex items-center justify-center text-emerald-mint shadow-inner">
                <CheckCircle2 size={40} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <p className="font-black text-white text-xl tracking-tight">Cuentas Limpias</p>
                <p className="text-xs text-white/40 font-medium max-w-[220px] mx-auto leading-relaxed uppercase tracking-wider">
                  Cuentas claras, amistades largas. Estás al día con la casa.
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {myDebts.map((debt, i) => (
                <div key={`debt-${i}`} className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-white/10 transition-all duration-500 shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-coral-soft/10 rounded-[1.5rem] flex items-center justify-center text-coral-soft shadow-inner">
                      <ArrowUpRight size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-coral-soft uppercase tracking-widest mb-1">Debes a {debt.toName}</p>
                      <p className="text-2xl font-black text-white tracking-tighter">${debt.amount}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDebt({ id: debt.to, name: debt.toName, amount: debt.amount });
                      setIsModalOpen(true);
                    }}
                    className="h-12 px-6 bg-white text-navy-deep rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-2xl hover:shadow-white/10"
                  >
                    Liquidar
                  </button>
                </div>
              ))}
              {myCredits.map((credit, i) => (
                <div key={`credit-${i}`} className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-xl">
                  <div className="w-14 h-14 bg-emerald-mint/10 rounded-[1.5rem] flex items-center justify-center text-emerald-mint shadow-inner">
                    <ArrowDownLeft size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-mint uppercase tracking-widest mb-1">{credit.fromName} te debe</p>
                    <p className="text-2xl font-black text-white tracking-tighter">${credit.amount}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* History Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Historial Reciente</h2>
          <Receipt size={16} className="text-white/20" />
        </div>
        
        <div className="space-y-4">
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <div key={expense.id} className="bg-white/5 backdrop-blur-xl p-5 rounded-[2rem] border border-white/5 shadow-xl flex items-center justify-between group hover:bg-white/10 transition-all duration-500">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/60 font-black text-sm shadow-inner group-hover:scale-110 transition-transform duration-500">
                    {expense.description.toLowerCase().includes('compra') ? <Wallet size={20} /> : <Receipt size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-tight leading-tight">{expense.description}</p>
                    <p className="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-wider">
                      {expense.payer.id === user?.id ? 'Tú' : expense.payer.name} • {new Date(expense.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white tracking-tighter">${expense.amount}</p>
                  {expense.category === 'SETTLEMENT' && (
                    <span className="text-[8px] font-black bg-emerald-mint/20 text-emerald-mint px-2 py-0.5 rounded-full uppercase tracking-widest mt-1 inline-block">Liquidación</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-[3.5rem] border-2 border-dashed border-white/5">
              <Wallet className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Historial impecable</p>
            </div>
          )}
        </div>
      </section>

      <SettleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSettle}
        toName={selectedDebt?.name || ''}
        amount={selectedDebt?.amount || 0}
      />
    </div>
  );
};
