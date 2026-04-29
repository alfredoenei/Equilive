import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useNetworkStore } from './store/useNetworkStore';

// Lazy Loaded Pages
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardLayout = lazy(() => import('./components/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const DashboardHome = lazy(() => import('./pages/DashboardHome').then(m => ({ default: m.DashboardHome })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const UserSettingsPage = lazy(() => import('./pages/UserSettingsPage').then(m => ({ default: m.UserSettingsPage })));

const LoadingScreen = () => (
  <div className="min-h-screen bg-navy-deep flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-emerald-mint/20 border-t-emerald-mint rounded-full animate-spin" />
  </div>
);

const WakeUpScreen = () => (
  <div className="fixed inset-0 z-[100] bg-navy-deep/95 backdrop-blur-md flex flex-col items-center justify-center p-6 transition-all duration-500 animate-in fade-in">
    {/* Premium Glow Background */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-mint/10 blur-[100px] rounded-full pointer-events-none" />
    
    <div className="relative z-10 flex flex-col items-center">
      {/* Pulse Logo Indicator */}
      <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
        <div className="absolute inset-0 border-4 border-emerald-mint border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-2 bg-emerald-mint/20 rounded-full animate-pulse" />
        <div className="absolute inset-4 bg-emerald-mint/30 rounded-full animate-ping" />
      </div>

      <div className="text-center space-y-3 animate-in slide-in-from-bottom-4 duration-700 delay-150">
        <h2 className="text-2xl font-black text-white tracking-tight">Despertando el servidor...</h2>
        <p className="text-white/50 text-sm font-medium px-8 leading-relaxed">
          Los servidores gratuitos toman una siesta. <br/> 
          Esto puede tardar unos <span className="text-emerald-mint/80 font-bold">30 segundos</span>.
        </p>
      </div>
      
      {/* Subtle Slow Progress Bar */}
      <div className="mt-12 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-mint rounded-full animate-[progress_30s_ease-in-out_forwards]" />
      </div>
    </div>
  </div>
);

const App = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isWakingUpServer = useNetworkStore((state) => state.isWakingUpServer);

  return (
    <>
      {isWakingUpServer && <WakeUpScreen />}
      <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!token ? <LoginPage /> : <Navigate to="/" />} 
          />
          <Route 
            path="/register" 
            element={!token ? <RegisterPage /> : <Navigate to="/" />} 
          />

          {/* Protected Routing */}
          <Route
            path="/"
            element={
              !token ? (
                <Navigate to="/login" />
              ) : !user?.houseId ? (
                <OnboardingPage />
              ) : (
                <DashboardLayout />
              )
            }
          >
            {/* Nested Dashboard Routes */}
            <Route index element={<DashboardHome />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="alerts" element={<AlertsPage />} />

            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/settings" element={<UserSettingsPage />} />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </>
  );
};

export default App;

