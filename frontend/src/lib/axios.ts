import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Monitor latency for cold starts
  (config as any).wakeUpTimeout = setTimeout(() => {
    useNetworkStore.getState().setIsWakingUpServer(true);
  }, 3000);

  return config;
});

api.interceptors.response.use(
  (response) => {
    if ((response.config as any).wakeUpTimeout) {
      clearTimeout((response.config as any).wakeUpTimeout);
    }
    useNetworkStore.getState().setIsWakingUpServer(false);
    return response;
  },
  (error) => {
    if (error.config && (error.config as any).wakeUpTimeout) {
      clearTimeout((error.config as any).wakeUpTimeout);
    }
    useNetworkStore.getState().setIsWakingUpServer(false);

    // Handle 401 Unauthorized errors (Session Expired)
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      
      // Only logout and redirect if we're not already on the login page
      // to avoid infinite loops and unnecessary toasts
      if (!window.location.pathname.includes('/login')) {
        logout();
        toast.error('Tu sesión ha expirado', {
          description: 'Por favor, inicia sesión de nuevo para continuar.',
        });
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
