import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Plus, ListChecks, Bell, ArrowUpRight, Wallet, CheckCircle } from 'lucide-react';

import { Skeleton } from '@/components/Skeleton';
import { BottomDrawer } from '@/components/BottomDrawer';
import { NewExpenseForm } from '@/components/NewExpenseForm';
import type { DashboardData } from '@/types';


interface BentoGridProps {
  data: DashboardData | null;
  loading: boolean;
}

export const BentoGrid = ({ data, loading }: BentoGridProps) => {
  const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false);
  const navigate = useNavigate();


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-6 animate-pulse">
        <Skeleton className="col-span-2 h-64 rounded-[3rem]" />
        <div className="col-span-2 flex gap-4">
          <Skeleton className="h-24 w-24 rounded-3xl" />
          <Skeleton className="h-24 w-24 rounded-3xl" />
          <Skeleton className="h-24 flex-1 rounded-3xl" />
        </div>
        <Skeleton className="col-span-2 h-56 rounded-[2.5rem]" />
      </div>
    );
  }

  const getKarmaMessage = (karma: number) => {
    if (karma >= 120) return 'EL ALMA DE LA CASA';
    if (karma >= 80) return 'BUEN COMPAÑERO';
    return 'TOCA COLABORAR';
  };

  const karma = data?.user.karma ?? 100;

  return (
    <>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-6"
      >
        {/* Karma Card - Premium Version */}
        <motion.div variants={item} className="col-span-2 relative overflow-hidden bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-lg rounded-3xl p-10 text-white border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-mint/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/10 blur-[80px] rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10 space-y-4">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Karma Social</p>
            <div className="flex flex-col items-center">
              <span className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent drop-shadow-2xl leading-none">
                {karma}
              </span>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest">
                {getKarmaMessage(karma)}
              </div>
            </div>
          </div>
        </motion.div>


        {/* Quick Actions Row */}
        <motion.div variants={item} className="col-span-2 grid grid-cols-3 gap-4 w-full">
          <button 
            onClick={() => setIsExpenseDrawerOpen(true)}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] active:scale-95 transition-all hover:bg-white/10 group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Plus size={28} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-slate-300">Gasto</span>
          </button>
          <button 
            onClick={() => navigate('/tasks')}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] active:scale-95 transition-all hover:bg-white/10 group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <ListChecks size={28} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-slate-300">Tarea</span>
          </button>
          <button className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] active:scale-95 transition-all hover:bg-white/10 group">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Bell size={28} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-slate-300">Alerta</span>
          </button>
        </motion.div>

        {/* Pending Tasks */}
        <motion.div variants={item} className="col-span-2 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Próximas Tareas</h3>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/10">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="space-y-4">
            {data && data.pendingTasks.length > 0 ? (
              data.pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-5 p-4 bg-white/5 rounded-[1.5rem] border border-white/5 group hover:bg-white/10 transition-all duration-500">
                  <div className="w-10 h-10 rounded-[1rem] bg-white/5 flex items-center justify-center text-white/40 border border-white/10 shadow-inner">
                    <ListChecks size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white tracking-tight leading-tight">{task.title}</p>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Ganas +{task.karmaReward} Karma</p>
                  </div>
                  <div className="text-[9px] font-black text-emerald-mint bg-emerald-mint/10 border border-emerald-mint/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    Hoy
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-white/10 mb-4 border border-white/5">
                  <CheckCircle size={32} strokeWidth={1} />
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">¡Hogar al día!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity / Expenses */}
        <motion.div variants={item} className="col-span-2 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_0_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Finanzas Recientes</h3>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/10">
              <Wallet size={14} />
            </div>
          </div>
          <div className="space-y-4">
            {data && data.recentExpenses.length > 0 ? (
              data.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 group hover:bg-white/5 rounded-[1.5rem] transition-all duration-500 border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-[1rem] bg-white text-navy-deep flex items-center justify-center font-black text-xs shadow-xl">
                      {expense.payer[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight leading-tight">{expense.description}</p>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">Por {expense.payer}</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-white tracking-tighter">${expense.amount}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-white/10 mb-4 border border-white/5">
                  <Wallet size={32} strokeWidth={1} />
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sin gastos nuevos</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Drawers */}
      <BottomDrawer
        open={isExpenseDrawerOpen}
        onOpenChange={setIsExpenseDrawerOpen}
        title="Registrar Gasto"
      >
        <div className="p-6">
          <NewExpenseForm onSuccess={() => setIsExpenseDrawerOpen(false)} />
        </div>
      </BottomDrawer>
    </>
  );
};


