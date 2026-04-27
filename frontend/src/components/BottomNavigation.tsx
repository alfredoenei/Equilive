import { NavLink } from 'react-router-dom';
import { Home, Wallet, CheckCircle, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';


export const BottomNavigation = () => {
  const alerts = useAppStore(state => state.alerts);
  const unreadCount = alerts.filter(a => !a.isRead).length;

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: Wallet, label: 'Gastos', path: '/expenses' },
    { icon: CheckCircle, label: 'Tareas', path: '/tasks' },
    { icon: Bell, label: 'Alertas', path: '/alerts', badge: unreadCount > 0 },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];


  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 w-full flex justify-center pointer-events-none px-4">
      <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-full px-4 py-3 flex items-center justify-around w-full max-w-lg pointer-events-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center py-2.5 px-4 rounded-[1.5rem] transition-all duration-500 group
              ${isActive 
                ? 'text-white' 
                : 'text-white/20 hover:text-white/40'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-all duration-500 ${isActive ? 'scale-110 text-emerald-mint' : 'group-hover:scale-110'}`} 
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-coral-soft rounded-full shadow-[0_0_8px_#F87171] animate-pulse" />
                  )}
                </div>
                <span className={`text-[8px] mt-1.5 font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="navIndicator"
                    className="absolute -bottom-1 w-1 h-1 bg-emerald-mint rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
