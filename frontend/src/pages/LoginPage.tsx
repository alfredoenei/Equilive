import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { ApiResponse, User } from '@/types';


export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password });
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/');

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/20 blur-[120px] rounded-full -z-10" />
      
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40 mb-6">
            <LogIn className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Equilive</h1>
          <p className="text-white/40 mt-2 font-medium">La armonía en tu hogar empieza aquí</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl text-sm font-medium border border-rose-500/20">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                <input
                  type="email"
                  required
                  className="w-full bg-white text-slate-900 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-brand-500/20 transition-all font-medium placeholder:text-slate-300"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                <input
                  type="password"
                  required
                  className="w-full bg-white text-slate-900 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-brand-500/20 transition-all font-medium placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white py-4 px-4 rounded-2xl font-bold shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center uppercase tracking-widest text-sm"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-brand-500 font-bold hover:text-brand-400 transition-colors">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
};
