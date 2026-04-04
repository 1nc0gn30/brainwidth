import React from 'react';
import { Task } from '../types';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Circle, Clock, Brain, Repeat } from 'lucide-react';
import { cn } from '../lib/utils';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  const isCompleted = task.status === 'completed';

  return (
    <div className={cn(
      "group relative bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10",
      isCompleted && "opacity-60"
    )}>
      <div className="flex items-start gap-4">
        <button 
          onClick={() => onToggle(task.id)}
          className="mt-1 text-slate-400 hover:text-emerald-400 transition-colors"
        >
          {isCompleted ? <CheckCircle2 className="text-emerald-500" /> : <Circle />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={cn(
                "font-medium text-white truncate",
                isCompleted && "line-through text-slate-500"
              )}>
                {task.title}
              </h3>
              {task.recurrence !== 'none' && (
                <Repeat size={12} className="text-emerald-500 shrink-0" />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
              {task.category}
            </span>
          </div>
          
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {task.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              {format(parseISO(task.startTime), 'h:mm a')}
            </div>
            <div className="flex items-center gap-1.5">
              <Brain size={14} className="text-emerald-500" />
              <span className="font-mono text-emerald-400">{task.bandwidthScore} BW</span>
            </div>
            {task.recurrence !== 'none' && (
              <div className="text-[10px] uppercase font-bold text-slate-600">
                {task.recurrence}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

import { X } from 'lucide-react';
