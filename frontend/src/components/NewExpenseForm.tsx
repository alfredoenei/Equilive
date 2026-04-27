import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import type { ApiResponse, Expense } from '@/types';


const expenseSchema = z.object({
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'El monto debe ser un número positivo',
  }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface NewExpenseFormProps {
  onSuccess: () => void;
}

export const NewExpenseForm = ({ onSuccess }: NewExpenseFormProps) => {
  const { addExpenseOptimistic, fetchDashboard } = useAppStore();
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    const amount = Number(data.amount);
    
    // 1. Optimistic Update
    const optimisticExpense = {
      id: Math.random().toString(), // Temp ID
      description: data.description,
      amount,
      payer: user?.name || 'Yo',
      date: new Date().toISOString(),
    };
    
    addExpenseOptimistic(optimisticExpense);
    
    // 2. Close Drawer
    onSuccess();
    
    try {
      // 3. Backend Request
      await api.post<ApiResponse<Expense>>('/expenses', {
        description: data.description,
        amount,
      });
      
      // 4. Refresh real data quietly
      await fetchDashboard();
      reset();

    } catch (error) {
      console.error('Failed to create expense', error);
      // In a real app, we would rollback here and show a toast
      alert('Error al guardar el gasto. Reintentando...');
      fetchDashboard();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-1">
          ¿En qué has gastado?
        </label>
        <input
          {...register('description')}
          placeholder="Ej: Compra Mercadona, Internet..."
          className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-white/20"
        />
        {errors.description && (
          <p className="mt-1 text-[10px] text-coral-soft font-black uppercase tracking-widest">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-1">
          Monto total
        </label>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 font-black">$</span>
          <input
            {...register('amount')}
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-10 text-sm font-black text-white focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-white/20"
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-[10px] text-coral-soft font-black uppercase tracking-widest">{errors.amount.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-16 bg-white text-navy-deep rounded-2xl font-black text-sm shadow-2xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em]"
      >
        {isSubmitting ? 'GUARDANDO...' : 'REGISTRAR GASTO'}
      </button>
    </form>
  );
};
