import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Settings, Award, TrendingUp, Calendar } from 'lucide-react';


export const ProfilePage = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  const karmaHistory = useAppStore(state => state.karmaHistory);
  const fetchKarmaHistory = useAppStore(state => state.fetchKarmaHistory);
  const loading = useAppStore(state => state.loading);

  useEffect(() => {
    fetchKarmaHistory();
  }, [fetchKarmaHistory]);

  const hasData = karmaHistory.some(item => item.amount !== 0);

  // Custom Tooltip with Glassmorphism
  interface TooltipPayloadItem {
    value: number;
  }
  interface KarmaTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
  }
  const CustomTooltip = ({ active, payload, label }: KarmaTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-lg font-black text-emerald-mint">
            {payload[0].value > 0 ? `+${payload[0].value}` : payload[0].value} Karma
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 pb-32 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Mi Perfil</p>
          <h1 className="text-5xl font-black text-white tracking-tighter">Resumen</h1>
        </div>
        <Link 
          to="/profile/settings"
          className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 flex items-center justify-center text-white/40 shadow-2xl hover:bg-white/10 transition-all active:scale-90"
        >
          <Settings size={28} strokeWidth={1.5} />
        </Link>
      </header>

      {/* Header Profile Card */}
      <section className="relative overflow-hidden bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-mint/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white text-4xl font-black border border-white/10 shadow-2xl mb-6">
            {user?.name?.[0]}
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{user?.name}</h2>
          <div className="mt-4 flex items-center gap-2 px-5 py-2 bg-emerald-mint/20 text-emerald-mint rounded-full border border-emerald-mint/10 shadow-inner">
            <Award size={18} strokeWidth={2.5} />
            <span className="text-sm font-black tracking-tight">{user?.karma} Karma Total</span>
          </div>
        </div>
      </section>

      {/* Karma Chart Section */}
      <section className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/5 shadow-2xl space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight">Progreso Semanal</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Tu rendimiento</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-white/20">
            <Calendar size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">7 Días</span>
          </div>
        </div>

        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center bg-white/5 rounded-[2rem] border border-white/5 animate-pulse">
              <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">Cargando datos...</span>
            </div>
          ) : !hasData ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-white/5 rounded-[2rem] border-2 border-dashed border-white/5 p-8 text-center">
              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-4">
                <TrendingUp size={28} />
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Sin actividad reciente</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={karmaHistory}>
                <defs>
                  <linearGradient id="colorKarma" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10B981', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10B981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorKarma)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

    </div>
  );
};

