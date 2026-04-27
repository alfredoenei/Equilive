import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Home, Settings, LogOut, ChevronRight, 
  Mail, Shield, Bell, Moon, PlusCircle, LogIn,
  Camera, CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

type Tab = 'account' | 'spaces' | 'prefs';

export const UserSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const { user, logout } = useAuthStore();
  const { myHouses, fetchMyHouses, switchHouse, createHouse, joinHouse } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyHouses();
  }, [fetchMyHouses]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitch = async (houseId: string, houseName: string) => {
    setSwitchingId(houseId);
    const toastId = toast.loading(`Cambiando a ${houseName}...`);
    try {
      await switchHouse(houseId);
      toast.success(`Ahora estás en ${houseName}`, { id: toastId });
    } catch (err) {
      toast.error('Error al cambiar de casa', { id: toastId });
    } finally {
      setSwitchingId(null);
    }
  };

  const handleCreate = async () => {
    const name = window.prompt('Nombre de la nueva casa:');
    if (!name) return;
    try {
      await createHouse(name);
      toast.success('Casa creada correctamente');
    } catch (err) {
      toast.error('Error al crear casa');
    }
  };

  const handleJoin = async () => {
    const code = window.prompt('Introduce el código de invitación:');
    if (!code) return;
    try {
      await joinHouse(code);
      toast.success('Te has unido a la casa');
    } catch (err) {
      toast.error('Código inválido o ya eres miembro');
    }
  };

  return (
    <div className="p-8 pb-32 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Preferencias</p>
          <h1 className="text-5xl font-black text-white tracking-tighter">Ajustes</h1>
        </div>
        <div className="w-14 h-14 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 flex items-center justify-center text-white/40 shadow-2xl">
          <Settings size={28} strokeWidth={1.5} />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex p-1.5 bg-white/5 backdrop-blur-sm rounded-[1.5rem] w-full border border-white/5">
        {(['account', 'spaces', 'prefs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative flex-1 py-3.5 text-[10px] font-black transition-all duration-500 flex flex-col items-center gap-2
              ${activeTab === tab ? 'text-white' : 'text-white/20 hover:text-white/40'}
            `}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeSettingsTab"
                className="absolute inset-0 bg-white/5 rounded-xl shadow-inner border border-white/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex flex-col items-center uppercase tracking-[0.3em]">
              {tab === 'account' && <User size={14} />}
              {tab === 'spaces' && <Home size={14} />}
              {tab === 'prefs' && <Shield size={14} />}
              <span className="mt-1">{tab === 'account' ? 'Cuenta' : tab === 'spaces' ? 'Casas' : 'Privacidad'}</span>
            </span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {activeTab === 'account' && (
            <div className="space-y-8">
              {/* Profile Header Card */}
              <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center text-center">
                <div className="relative mb-6 group">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-white text-4xl font-black border border-white/10 shadow-2xl">
                    {user?.name?.[0]}
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-3 bg-white text-navy-deep rounded-2xl border border-white/10 shadow-2xl active:scale-90 transition-all opacity-0 group-hover:opacity-100">
                    <Camera size={16} />
                  </button>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{user?.name}</h2>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">{user?.email}</p>
              </div>

              {/* Personal Data */}
              <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden divide-y divide-white/5">
                <div className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 text-white/40 flex items-center justify-center border border-white/10">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Identificador</p>
                      <p className="text-sm font-bold text-white tracking-tight">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 text-white/40 flex items-center justify-center border border-white/10">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Contraseña</p>
                      <p className="text-sm font-bold text-white tracking-tight">••••••••••••</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-white px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all uppercase tracking-widest">Cambiar</button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4">
                <button 
                  onClick={handleLogout}
                  className="w-full py-6 bg-coral-soft/5 text-coral-soft rounded-[2.5rem] border border-coral-soft/10 font-black text-sm flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-coral-soft/10 uppercase tracking-[0.3em]"
                >
                  <LogOut size={22} strokeWidth={2.5} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}

          {activeTab === 'spaces' && (
            <div className="space-y-8">
              <div className="px-2">
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Mis Espacios</h3>
              </div>
              
              <div className="space-y-4">
                {myHouses.map((house) => {
                  const isActive = house.id === user?.houseId;
                  return (
                    <div 
                      key={house.id}
                      className={`
                        p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between
                        ${isActive 
                          ? 'bg-white/10 border-white/20 shadow-2xl' 
                          : 'bg-white/5 border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:border-white/10'}
                      `}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center ${isActive ? 'bg-white text-navy-deep shadow-2xl' : 'bg-white/5 text-white/40'}`}>
                          <Home size={28} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <div>
                          <h4 className="font-black text-white text-lg tracking-tight">{house.name}</h4>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">
                            {house._count.memberships} MIEMBROS • {house.inviteCode}
                          </p>
                        </div>
                      </div>
                      
                      {isActive ? (
                        <div className="w-8 h-8 bg-emerald-mint text-navy-deep rounded-full flex items-center justify-center shadow-lg shadow-emerald-mint/20 animate-pulse">
                          <CheckCircle2 size={16} strokeWidth={3} />
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleSwitch(house.id, house.name)}
                          disabled={switchingId !== null}
                          className="h-10 px-5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                        >
                          {switchingId === house.id ? '...' : 'Activar'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <button 
                  onClick={handleCreate}
                  className="py-8 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-white/30 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <PlusCircle size={32} className="group-hover:scale-110 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nueva Casa</span>
                </button>
                <button 
                  onClick={handleJoin}
                  className="py-8 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-white/30 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <LogIn size={32} className="group-hover:scale-110 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Unirme</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'prefs' && (
            <div className="space-y-8">
              <div className="bg-white/5 rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-white tracking-tight leading-tight">Notificaciones</h4>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Alertas en tiempo real</p>
                    </div>
                  </div>
                  <div className="w-14 h-8 bg-emerald-mint/20 rounded-full p-1.5 flex justify-end border border-emerald-mint/30">
                    <div className="w-5 h-5 bg-emerald-mint rounded-full shadow-lg" />
                  </div>
                </div>

                <div className="p-6 flex items-center justify-between opacity-40 grayscale">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 text-white/40 flex items-center justify-center border border-white/10">
                      <Moon size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-white tracking-tight leading-tight">Modo Oscuro</h4>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Beta • Activado</p>
                    </div>
                  </div>
                  <div className="w-14 h-8 bg-white/10 rounded-full p-1.5 border border-white/10">
                    <div className="w-5 h-5 bg-white rounded-full opacity-40 shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="p-10 bg-white/5 rounded-[3rem] border border-white/5 text-center">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-2">Equilive Core</p>
                <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Versión 1.2.0 • Premium Edition</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
