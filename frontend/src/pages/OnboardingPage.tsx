import { useState } from 'react';
import { Home, Plus, Users, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import type { ApiResponse, House } from '@/types';
import { toast } from 'sonner';


export const OnboardingPage = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const { updateUser, setToken } = useAuthStore();

  const handleCreateHouse = async () => {
    setLoading('create');
    setError('');
    try {
      const name = prompt('¿Cómo se llama tu nueva casa?', 'La Mansión');
      if (!name) return;
      const res = await api.post<ApiResponse<{ house: House; token: string }>>('/houses', { name });
      const { house, token } = res.data.data;
      setToken(token);
      updateUser({ houseId: house.id });
      toast.success('¡Casa creada!');
    } catch (err: any) {
      toast.error('Error al crear la casa');
      setError('Error al crear la casa');
    } finally {
      setLoading(null);
    }
  };

  const handleJoinHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('join');
    setError('');
    try {
      const res = await api.post<ApiResponse<{ house: House; token: string }>>('/houses/join', { inviteCode });
      const { house, token } = res.data.data;
      setToken(token);
      updateUser({ houseId: house.id });
      toast.success('¡Te has unido a la casa!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Código de invitación inválido';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(null);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center max-w-lg mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
          ¡Hola! Tu hogar <br /> te está esperando
        </h1>
        <p className="text-slate-500 mt-3 text-lg">¿Cómo quieres empezar hoy?</p>
      </div>

      <div className="space-y-6">
        <button 
          onClick={handleCreateHouse}
          disabled={!!loading}
          className="w-full bg-white p-6 rounded-3xl border-2 border-transparent hover:border-brand-500 shadow-xl shadow-slate-200/50 text-left transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="bg-brand-100 p-4 rounded-2xl group-hover:bg-brand-600 transition-colors">
              <Plus className="text-brand-600 group-hover:text-white transition-colors" />
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-brand-500 transition-colors" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mt-4">Crear un Piso Nuevo</h3>
          <p className="text-slate-500 text-sm mt-1">Sé el primero de tu casa en entrar.</p>
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium">O TAMBIÉN</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-100 p-4 rounded-2xl">
              <Users className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Unirme a una casa</h3>
              <p className="text-slate-500 text-sm">Pega el código de tus compañeros</p>
            </div>
          </div>

          <form onSubmit={handleJoinHouse} className="space-y-4">
            <input 
              type="text" 
              placeholder="Ej: ABC123"
              className="input-field text-center text-2xl font-mono uppercase tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-base"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}
            <button 
              type="submit"
              disabled={!!loading || inviteCode.length < 6}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {loading === 'join' ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirmar Código'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
