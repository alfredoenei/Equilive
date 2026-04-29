import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useNetworkStore } from '@/store/useNetworkStore';


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
    return Promise.reject(error);
  }
);

export default api;
