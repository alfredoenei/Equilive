import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Wallet, ShoppingCart, CheckCircle, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export const AlertsPage = () => {
  const alerts = useAppStore(state => state.alerts);
  const markAlertsAsRead = useAppStore(state => state.markAlertsAsRead);
  const fetchAlerts = useAppStore(state => state.fetchAlerts);
  const loading = useAppStore(state => state.loading);

  useEffect(() => {
    fetchAlerts();
    return () => {
      markAlertsAsRead();
    };
  }, [fetchAlerts, markAlertsAsRead]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SETTLEMENT':
        return <Wallet className="text-emerald-mint" size={20} />;
      case 'EXPENSE':
        return <ShoppingCart className="text-coral-soft" size={20} />;
      case 'TASK':
        return <CheckCircle className="text-blue-400" size={20} />;
      default:
        return <BellOff className="text-slate-400" size={20} />;
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Notificaciones</p>
        <h1 className="text-5xl font-black text-white tracking-tighter">Alertas</h1>
      </header>

      <div className="space-y-4">
        {loading && alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-mint/20 border-t-emerald-mint rounded-full animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando historial...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <BellOff className="text-white/20" size={32} />
            </div>
            <h3 className="text-white font-black text-xl">Todo al día</h3>
            <p className="text-white/40 text-sm max-w-[200px]">No tienes alertas pendientes por ahora.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 flex items-start gap-4 transition-all
                  ${!alert.isRead ? 'border-emerald-mint/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : ''}
                `}
              >
                {!alert.isRead && (
                  <div className="absolute top-6 right-6 w-2 h-2 bg-emerald-mint rounded-full shadow-[0_0_8px_#10B981]" />
                )}
                
                <div className={`p-3 rounded-2xl bg-white/5`}>
                  {getIcon(alert.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <p className={`text-sm font-medium leading-relaxed ${!alert.isRead ? 'text-white' : 'text-white/60'}`}>
                    {alert.message}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
