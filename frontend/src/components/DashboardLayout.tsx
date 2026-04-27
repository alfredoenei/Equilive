import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Toaster } from 'sonner';
import { useSocket } from '@/hooks/useSocket';

export const DashboardLayout = () => {
  useSocket();
  
  return (
    <div className="min-h-screen bg-[#1E293B] selection:bg-brand-500/30 relative z-0 overflow-x-hidden">
      {/* Premium Glow Background */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Content Area */}
      <main className="w-full max-w-xl mx-auto px-4">
        <Outlet />
        {/* Physical spacer to ensure scroll ends above the fixed navigation */}
        <div className="h-32 w-full" aria-hidden="true" />
      </main>

      {/* Navigation */}
      <BottomNavigation />

      <Toaster position="top-center" richColors />
    </div>
  );
};
