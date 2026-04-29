import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { CheckCircle2, Clock, Award, ListTodo, Trophy, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { ApiResponse } from '@/types/index';

interface Recommendation {
  userId: string;
  userName: string;
  score: number;
  reason: string;
}

export const TasksPage = () => {
  // Granular Zustand selectors
  const tasks = useAppStore(state => state.tasks);
  const loading = useAppStore(state => state.loading);
  const houseMembers = useAppStore(state => state.houseMembers);
  const fetchTasks = useAppStore(state => state.fetchTasks);
  const fetchHouseMembers = useAppStore(state => state.fetchHouseMembers);
  const completeTask = useAppStore(state => state.completeTask);
  const createTask = useAppStore(state => state.createTask);

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    karmaReward: 10,
    description: '',
    assigneeId: ''
  });

  const fetchRecommendation = useCallback(async (title: string) => {
    if (!title.trim()) return;
    setLoadingRec(true);
    setRecommendation(null);
    try {
      const res = await api.get<ApiResponse<Recommendation>>('/tasks/recommend', {
        params: { title: title.trim() },
      });
      const rec = res.data.data;
      setRecommendation(rec);
      setNewTask(prev => ({ ...prev, assigneeId: rec.userId }));
    } catch {
      // Silently fail — recommendation is optional
    } finally {
      setLoadingRec(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchHouseMembers();
  }, [fetchTasks, fetchHouseMembers]);

  const handleCreateTask = useCallback(async () => {
    if (!newTask.title) return;
    setSubmitting(true);
    try {
      await createTask(
        newTask.title, 
        newTask.karmaReward, 
        newTask.description || undefined, 
        newTask.assigneeId || undefined
      );
      toast.success('✨ Tarea creada correctamente');
      setNewTask({ title: '', karmaReward: 10, description: '', assigneeId: '' });
      setRecommendation(null);
      setShowCreate(false);
    } catch {
      toast.error('Error al crear la tarea');
    } finally {
      setSubmitting(false);
    }
  }, [newTask, createTask]);

  const handleComplete = useCallback(async (taskId: string, title: string) => {
    try {
      await completeTask(taskId);
      toast.success('🚀 ¡Tarea completada!', {
        description: `Has ganado Karma por completar: ${title}`,
        icon: <Trophy className="text-amber-500" />
      });
    } catch {
      toast.error('Error al completar la tarea');
    }
  }, [completeTask]);

  // Memoized derived data
  const filteredTasks = useMemo(() => 
    tasks.filter(t => activeTab === 'pending' ? !t.isDone : t.isDone),
    [tasks, activeTab]
  );

  const pendingCount = useMemo(() => tasks.filter(t => !t.isDone).length, [tasks]);

  if (loading && tasks.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Hogar</p>
          <h1 className="text-5xl font-black text-white tracking-tighter">Tareas</h1>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className={`
            w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl
            ${showCreate 
              ? 'bg-coral-soft/10 text-coral-soft border border-coral-soft/20 rotate-45' 
              : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}
          `}
        >
          <ListTodo size={28} />
        </button>
      </header>

      {/* New Task Form Overlay */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-8"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-1">¿Qué hay que hacer?</label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Ej: Limpiar el refrigerador"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-white/20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-1">Karma</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={newTask.karmaReward}
                      onChange={e => setNewTask({...newTask, karmaReward: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-emerald-mint focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                    <Award size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-mint/40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-1">Asignar a</label>
                    <button
                      type="button"
                      disabled={!newTask.title.trim() || loadingRec}
                      onClick={() => fetchRecommendation(newTask.title)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest
                        transition-all duration-300 active:scale-90
                        ${loadingRec
                          ? 'bg-brand-500/20 text-brand-500 border border-brand-500/30'
                          : newTask.title.trim()
                            ? 'bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 border border-brand-500/20'
                            : 'bg-white/5 text-white/15 cursor-not-allowed'}
                      `}
                    >
                      <Sparkles 
                        size={12} 
                        className={`
                          ${loadingRec ? 'animate-[spin_2s_linear_infinite] text-brand-400' : ''} 
                          transition-colors
                        `} 
                      />
                      {loadingRec ? 'Analizando...' : 'IA'}
                    </button>
                  </div>
                  <select
                    value={newTask.assigneeId}
                    onChange={e => {
                      setNewTask({...newTask, assigneeId: e.target.value});
                      if (recommendation && e.target.value !== recommendation.userId) {
                        setRecommendation(null);
                      }
                    }}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-[10px] font-black text-white/60 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none uppercase tracking-widest"
                  >
                    <option value="" className="bg-navy-deep">Cualquiera</option>
                    {houseMembers.map(m => (
                      <option key={m.id} value={m.id} className="bg-navy-deep">{m.name}</option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {recommendation && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="text-[9px] font-bold text-white/30 leading-relaxed mt-1.5 px-1"
                      >
                        ✨ {recommendation.reason}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateTask}
              disabled={!newTask.title || submitting}
              className="w-full h-16 bg-white text-navy-deep rounded-2xl font-black text-sm shadow-2xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em]"
            >
              {submitting ? 'GUARDANDO...' : 'CREAR TAREA'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white/5 backdrop-blur-sm rounded-[1.5rem] w-full border border-white/5">
        {(['pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative flex-1 py-3 text-[10px] font-black transition-all duration-500
              ${activeTab === tab ? 'text-white' : 'text-white/20 hover:text-white/40'}
            `}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabTasks"
                className="absolute inset-0 bg-white/5 rounded-xl shadow-inner border border-white/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 uppercase tracking-[0.3em]">
              {tab === 'pending' ? `Pendientes (${pendingCount})` : 'Completadas'}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`
                  p-6 rounded-[2.5rem] border transition-all duration-500 shadow-xl
                  ${task.isDone 
                    ? 'bg-white/5 border-white/5 grayscale opacity-40' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'}
                `}
              >
                <div className="flex items-start gap-5">
                  <button
                    disabled={task.isDone}
                    onClick={() => handleComplete(task.id, task.title)}
                    className={`
                      mt-1 flex-shrink-0 transition-all duration-300 active:scale-90
                      ${task.isDone ? 'text-emerald-mint' : 'text-white/20 hover:text-emerald-mint'}
                    `}
                  >
                    {task.isDone 
                      ? <CheckCircle2 size={32} strokeWidth={2.5} /> 
                      : <div className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center hover:border-emerald-mint transition-colors" />
                    }
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-black text-base tracking-tight ${task.isDone ? 'text-white/40 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      <div className={`
                        flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                        ${task.isDone ? 'bg-white/5 text-white/30' : 'bg-emerald-mint/20 text-emerald-mint'}
                      `}>
                        <Award size={12} />
                        +{task.karmaReward}
                      </div>
                    </div>
                    
                    <p className={`text-xs font-medium leading-relaxed mb-6 ${task.isDone ? 'text-white/20' : 'text-white/40'}`}>
                      {task.description || 'Sin descripción adicional.'}
                    </p>

                    <div className="flex items-center justify-between pt-5 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[10px] font-black text-white/60 shadow-inner">
                          {task.assignee ? task.assignee.name[0] : '?'}
                        </div>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                          {task.assignee ? task.assignee.name : 'ABIERTA'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                        <Clock size={12} />
                        {task.isDone ? 'Hecha' : 'Pendiente'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center bg-white/5 rounded-[3.5rem] border-2 border-dashed border-white/5"
            >
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-white/10 shadow-inner mb-8">
                {activeTab === 'pending' ? <ListTodo size={48} strokeWidth={1} /> : <Trophy size={48} strokeWidth={1} />}
              </div>
              <h3 className="font-black text-white text-xl tracking-tight">
                {activeTab === 'pending' ? 'Hogar Impecable' : 'Poco a poco'}
              </h3>
              <p className="text-[10px] text-white/20 mt-3 max-w-[200px] mx-auto leading-relaxed uppercase tracking-[0.2em] font-black">
                {activeTab === 'pending' 
                  ? 'No hay tareas pendientes en este momento.' 
                  : 'Completa tareas para ver tu historial aquí.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
