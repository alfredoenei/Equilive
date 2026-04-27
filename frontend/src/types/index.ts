export interface User {
  id: string;
  name: string;
  email: string;
  karma: number;
  houseId: string | null;
}

export interface House {
  id: string;
  name: string;
  inviteCode: string;
  users: Array<Partial<User>>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  karmaReward: number;
  isDone: boolean;
  dueDate?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
  };
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category?: string;
  createdAt: string;
  payerId?: string;
  payer: {
    id: string;
    name: string;
  };
  receiverId?: string;
}

export interface DashboardData {
  user: {
    name: string;
    karma: number;
  };
  house: {
    id: string;
    name: string;
    inviteCode: string;
    memberCount: number;
  } | null;
  pendingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    karmaReward: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    payer: string;
    date: string;
  }>;
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface KarmaHistory {
  date: string;
  amount: number;
}

export interface Alert {
  id: string;
  type: 'EXPENSE' | 'SETTLEMENT' | 'TASK';
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  houseId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
