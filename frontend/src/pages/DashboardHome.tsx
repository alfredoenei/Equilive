import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { BentoGrid } from '@/components/BentoGrid';

export const DashboardHome = () => {
  const dashboardData = useAppStore(state => state.dashboardData);
  const loading = useAppStore(state => state.loading);
  const fetchDashboard = useAppStore(state => state.fetchDashboard);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="p-8 pb-36 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">

      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2">
            {dashboardData?.house?.name || 'Equilive'}
          </p>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Hola, {user?.name.split(' ')[0]}
          </h1>
        </div>
      </header>

      {/* Grid Content */}
      <BentoGrid data={dashboardData} loading={loading} />
    </div>
  );
};
