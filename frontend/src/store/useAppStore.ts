import { create } from 'zustand';
import api from '@/lib/axios';
import { useAuthStore } from './useAuthStore';
import type { DashboardData, ApiResponse, KarmaHistory, Task, Expense, Settlement, Alert } from '@/types/index';

interface HouseInfo {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  _count: { memberships: number };
}

interface AppState {
  dashboardData: DashboardData | null;
  karmaHistory: KarmaHistory[];
  tasks: Task[];
  expenses: Expense[];
  balances: Settlement[];
  alerts: Alert[];
  houseMembers: { id: string, name: string, email: string }[];
  myHouses: HouseInfo[];
  activeHouseId: string | null;
  loading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  fetchKarmaHistory: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchBalances: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  markAlertsAsRead: () => Promise<void>;
  fetchHouseMembers: () => Promise<void>;
  fetchMyHouses: () => Promise<void>;
  refreshState: () => Promise<void>;
  injectExpense: (expense: Expense) => void;
  injectTask: (task: Task) => void;
  switchHouse: (houseId: string) => Promise<void>;
  createHouse: (name: string) => Promise<void>;
  joinHouse: (inviteCode: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  settleDebt: (toUserId: string, amount: number) => Promise<void>;
  addExpenseOptimistic: (expense: DashboardData['recentExpenses'][0]) => void;
  createTask: (title: string, karmaReward: number, description?: string, assigneeId?: string) => Promise<void>;
}

interface RefreshStateData {
  house: DashboardData['house'];
  members: { id: string; name: string; email: string }[];
  expenses: Expense[];
  tasks: Task[];
  balances: Settlement[];
  alerts: Alert[];
}

export const useAppStore = create<AppState>((set) => ({
  dashboardData: null,
  karmaHistory: [],
  tasks: [],
  expenses: [],
  balances: [],
  alerts: [],
  houseMembers: [],
  myHouses: [],
  activeHouseId: useAuthStore.getState().user?.houseId || null,
  loading: false,
  error: null,
  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<DashboardData>>('/dashboard/summary');
      set({ dashboardData: response.data.data, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching dashboard';
      set({ error: message, loading: false });
    }
  },
  fetchKarmaHistory: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<KarmaHistory[]>>('/karma/history');
      set({ karmaHistory: response.data.data, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error fetching karma history';
      set({ error: message, loading: false });
    }
  },
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Task[]>>('/tasks');
      set({ tasks: response.data.data, loading: false });
    } catch (err: unknown) {
      set({ error: 'Error fetching tasks', loading: false });
    }
  },
  fetchExpenses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Expense[]>>('/expenses');
      set({ expenses: response.data.data, loading: false });
    } catch (err: unknown) {
      set({ error: 'Error fetching expenses', loading: false });
    }
  },
  fetchBalances: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Settlement[]>>('/expenses/balances');
      set({ balances: response.data.data, loading: false });
    } catch (err: unknown) {
      set({ error: 'Error fetching balances', loading: false });
    }
  },
  fetchAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Alert[]>>('/alerts');
      set({ alerts: response.data.data, loading: false });
    } catch (err: unknown) {
      set({ error: 'Error fetching alerts', loading: false });
    }
  },
  markAlertsAsRead: async () => {
    try {
      await api.patch('/alerts/read');
      set((state) => ({
        alerts: state.alerts.map(a => ({ ...a, isRead: true }))
      }));
    } catch (err: unknown) {
      console.error('Error marking alerts as read:', err);
    }
  },
  fetchHouseMembers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<{ id: string, name: string, email: string }[]>>('/houses/members');
      set({ houseMembers: response.data.data, loading: false });
    } catch (err: unknown) {
      set({ error: 'Error fetching members', loading: false });
    }
  },
  fetchMyHouses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<HouseInfo[]>>('/houses/my-houses');
      set({ myHouses: response.data.data, loading: false });
    } catch (err: unknown) {
      set({ error: 'Error fetching houses', loading: false });
    }
  },
  refreshState: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<ApiResponse<RefreshStateData>>('/houses/current-state');
      const { house, members, expenses, tasks, balances, alerts } = response.data.data;
      
      set((state) => ({ 
        dashboardData: state.dashboardData ? { 
          ...state.dashboardData, 
          house, 
          recentExpenses: (expenses as unknown as Expense[]).slice(0, 5).map((e) => ({
            id: e.id,
            description: e.description,
            amount: e.amount,
            payer: typeof e.payer === 'object' ? e.payer.name : String(e.payer),
            date: e.createdAt
          }))
        } : null,
        houseMembers: members,
        expenses: expenses as unknown as Expense[],
        tasks,
        balances,
        alerts: alerts || [],
        loading: false 
      }));
    } catch (err: unknown) {
      set({ error: 'Error al actualizar estado', loading: false });
    }
  },
  injectExpense: (expense: Expense) => set((state) => {
    const newRecentExpenses = [
      { 
        id: expense.id, 
        description: expense.description, 
        amount: expense.amount, 
        payer: typeof expense.payer === 'string' ? expense.payer : expense.payer.name, 
        date: expense.createdAt 
      }, 
      ...(state.dashboardData?.recentExpenses || [])
    ].slice(0, 5);

    return {
      expenses: [expense, ...state.expenses],
      dashboardData: state.dashboardData ? {
        ...state.dashboardData,
        recentExpenses: newRecentExpenses
      } : null
    };
  }),
  injectTask: (task: Task) => set((state) => ({
    tasks: [task, ...state.tasks],
    dashboardData: state.dashboardData ? {
      ...state.dashboardData,
      pendingTasks: !task.isDone ? [
        { 
          id: task.id, 
          title: task.title, 
          dueDate: task.dueDate || '', 
          karmaReward: task.karmaReward 
        }, 
        ...state.dashboardData.pendingTasks
      ].slice(0, 3) : state.dashboardData.pendingTasks
    } : null
  })),
  switchHouse: async (houseId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<ApiResponse<{ token: string, activeHouseId: string }>>('/users/switch-house', { houseId });
      const { setAuth, user } = useAuthStore.getState();
      if (user) {
        setAuth({ ...user, houseId }, response.data.data.token);
      }
      
      set({ activeHouseId: houseId });
      
      // OPTIMIZED: Use the new bootstrap endpoint
      await useAppStore.getState().refreshState();
      
      set({ loading: false });
    } catch (err: unknown) {
      set({ error: 'Error al cambiar de casa', loading: false });
      throw err;
    }
  },
  createHouse: async (name) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<ApiResponse<{ house: HouseInfo, token: string }>>('/houses', { name });
      const { setAuth, user } = useAuthStore.getState();
      if (user) {
        setAuth({ ...user, houseId: response.data.data.house.id }, response.data.data.token);
      }
      set({ activeHouseId: response.data.data.house.id });
      // Parallel fetch after house creation
      await Promise.all([
        useAppStore.getState().fetchMyHouses(),
        useAppStore.getState().fetchDashboard(),
      ]);
      set({ loading: false });
    } catch (err: unknown) {
      set({ error: 'Error al crear casa', loading: false });
      throw err;
    }
  },
  joinHouse: async (inviteCode) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<ApiResponse<{ house: HouseInfo, token: string }>>('/houses/join', { inviteCode });
      const { setAuth, user } = useAuthStore.getState();
      if (user) {
        setAuth({ ...user, houseId: response.data.data.house.id }, response.data.data.token);
      }
      set({ activeHouseId: response.data.data.house.id });
      // Parallel fetch after joining
      await Promise.all([
        useAppStore.getState().fetchMyHouses(),
        useAppStore.getState().fetchDashboard(),
      ]);
      set({ loading: false });
    } catch (err: unknown) {
      set({ error: 'Error al unirse a casa', loading: false });
      throw err;
    }
  },
  completeTask: async (taskId) => {
    // Optimistic Update
    const previousTasks = useAppStore.getState().tasks;
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, isDone: true } : t)
    }));

    try {
      await api.patch(`/tasks/${taskId}/complete`);
    } catch (err: unknown) {
      // Rollback
      set({ tasks: previousTasks });
      throw err;
    }
  },
  settleDebt: async (toUserId, amount) => {
    set({ loading: true, error: null });
    try {
      await api.post('/expenses/settle', { toUserId, amount });
      // Re-fetch everything to ensure consistent state
      const [expRes, balRes] = await Promise.all([
        api.get<ApiResponse<Expense[]>>('/expenses'),
        api.get<ApiResponse<Settlement[]>>('/expenses/balances')
      ]);
      set({ 
        expenses: expRes.data.data, 
        balances: balRes.data.data, 
        loading: false 
      });
    } catch (err: unknown) {
      set({ error: 'Error al liquidar deuda', loading: false });
      throw err;
    }
  },
  addExpenseOptimistic: (newExpense) => set((state) => {

    if (!state.dashboardData) return state;
    
    return {
      dashboardData: {
        ...state.dashboardData,
        recentExpenses: [newExpense, ...state.dashboardData.recentExpenses].slice(0, 5)
      }
    };
  }),
  createTask: async (title, karmaReward, description, assigneeId) => {
    set({ loading: true, error: null });
    try {
      await api.post('/tasks', { title, karmaReward, description, assigneeId });
      // Re-fetch tasks
      const response = await api.get<ApiResponse<Task[]>>('/tasks');
      set({ tasks: response.data.data, loading: false });
    } catch (err: unknown) {
      set({ error: 'Error al crear tarea', loading: false });
      throw err;
    }
  },
}));
