import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface FocusTimerProps {
  task: Task;
  onClose: () => void;
  onComplete: (id: string) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ task, onClose, onComplete }) => {
  const [timeLeft, setTimeLeft] = React.useState(task.durationMinutes * 60);
  const [isActive, setIsActive] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);

  React.useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setIsFinished(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / (task.durationMinutes * 60);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 text-center relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className={cn(
          "absolute inset-0 opacity-10 blur-[100px] -z-10",
          task.category === 'Deep Work' ? "bg-emerald-500" : "bg-blue-500"
        )} />

        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-2 block">Focus Mode</span>
            <h2 className="text-3xl font-bold text-white">{task.title}</h2>
            <p className="text-slate-400 mt-2">{task.category} • {task.bandwidthScore} BW</p>
          </div>

          <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/5"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={754}
                animate={{ strokeDashoffset: 754 - (754 * progress) }}
                className={cn(
                  "transition-all duration-1000",
                  task.category === 'Deep Work' ? "text-emerald-500" : "text-blue-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-mono font-light text-white tracking-tighter">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={() => setTimeLeft(task.durationMinutes * 60)}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
            >
              <RotateCcw size={24} />
            </button>
            
            <button 
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl",
                isActive ? "bg-white/10 text-white" : "bg-emerald-500 text-white shadow-emerald-500/20"
              )}
            >
              {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            <button 
              onClick={() => {
                onComplete(task.id);
                onClose();
              }}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-emerald-500 transition-all"
            >
              <CheckCircle2 size={24} />
            </button>
          </div>

          <AnimatePresence>
            {isFinished && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-500 font-medium"
              >
                Session Complete! Great work.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
