import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { fetchBalances, fetchExpenses, fetchTasks, fetchDashboard } = useAppStore();

  useEffect(() => {
    if (!token || !user?.houseId) return;

    const socket = getSocket(token);

    if (!socket) return;

    // Listen for events
    socket.on('expense_created', (expense) => {
      console.log('📡 Real-time update: Expense injected');
      useAppStore.getState().injectExpense(expense);
      // We still re-fetch balances because debt logic is backend-heavy
      useAppStore.getState().fetchBalances();
    });

    socket.on('settlement_created', () => {
      console.log('📡 Real-time update: Settlement created');
      useAppStore.getState().fetchBalances();
      useAppStore.getState().fetchExpenses();
      useAppStore.getState().fetchDashboard();
    });

    socket.on('task_updated', (task) => {
      console.log('📡 Real-time update: Task injected');
      useAppStore.getState().injectTask(task);
    });

    socket.on('new_alert', (alert) => {
      console.log('📡 Real-time alert:', alert);
    });

    // CTO Recommendation: Handle reconnection on window focus
    const handleFocus = () => {
      if (socket.disconnected) {
        console.log('🔌 Reconnecting socket on focus...');
        socket.connect();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      socket.off('expense_created');
      socket.off('settlement_created');
      socket.off('task_updated');
      socket.off('new_alert');
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, user?.houseId, fetchBalances, fetchExpenses, fetchTasks, fetchDashboard]);
};
