/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Brain, 
  Settings,
  AlertTriangle,
  Zap,
  TrendingUp,
  Loader2,
  Key
} from 'lucide-react';
import { Task } from './types';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { BandwidthChart } from './components/BandwidthChart';
import { BrainStatus } from './components/BrainStatus';
import { CalendarView } from './components/CalendarView';
import { FocusTimer } from './components/FocusTimer';
import { WaitlistModal } from './components/WaitlistModal';
import { getDailyInsights, getOptimizationSuggestions } from './services/ai';
import { format, startOfDay, isSameDay, parseISO, isSameWeek, isSameMonth } from 'date-fns';
import { cn } from './lib/utils';

export default function App() {
  const [tasks, setTasks] = React.useState<Task[]>(() => {
    const saved = localStorage.getItem('brain-bandwidth-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'planner' | 'bandwidth' | 'settings' | 'calendar'>('dashboard');
  const [analysisRange, setAnalysisRange] = React.useState<'day' | 'week' | 'month' | 'year'>('day');
  const [dailyInsights, setDailyInsights] = React.useState<string>("");
  const [optimizationSuggestions, setOptimizationSuggestions] = React.useState<string>("");
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [activeFocusTask, setActiveFocusTask] = React.useState<Task | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = React.useState(false);
  const [userApiKey, setUserApiKey] = React.useState(() => localStorage.getItem('user-gemini-api-key') || '');

  React.useEffect(() => {
    localStorage.setItem('brain-bandwidth-tasks', JSON.stringify(tasks));
    
    // Fetch insights when tasks change
    const fetchInsights = async () => {
      const insights = await getDailyInsights(tasks.filter(t => isSameDay(parseISO(t.startTime), new Date())));
      if (insights.includes("Rate limit reached")) {
        setDailyInsights("Daily AI limit reached. Join the waitlist for unlimited insights!");
      } else {
        setDailyInsights(insights);
      }
    };
    fetchInsights();
  }, [tasks]);

  const addTask = (task: Task) => setTasks(prev => [...prev, task]);
  const toggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const suggestions = await getOptimizationSuggestions(tasks.filter(t => isSameDay(parseISO(t.startTime), new Date())));
    if (suggestions.includes("Rate limit reached")) {
      setIsWaitlistOpen(true);
      setOptimizationSuggestions("Daily AI limit reached. Join the waitlist for unlimited suggestions!");
    } else {
      setOptimizationSuggestions(suggestions);
    }
    setIsOptimizing(false);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `brain-bandwidth-export-${format(new Date(), 'yyyy-MM-dd')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedTasks)) {
          setTasks(importedTasks);
          alert('Data imported successfully!');
        } else {
          alert('Invalid data format.');
        }
      } catch (error) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      setTasks([]);
      localStorage.removeItem('brain-bandwidth-tasks');
      localStorage.removeItem('user-gemini-api-key');
      setUserApiKey('');
    }
  };

  const saveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user-gemini-api-key', userApiKey);
    alert('API Key saved successfully! AI features will now use your personal key.');
  };

  const getTasksForRange = (date: Date, range: 'day' | 'week' | 'month' | 'year') => {
    return tasks.filter(task => {
      const taskDate = parseISO(task.startTime);
      if (task.recurrence === 'none') {
        if (range === 'day') return isSameDay(taskDate, date);
        if (range === 'week') return isSameWeek(taskDate, date);
        if (range === 'month') return isSameMonth(taskDate, date);
        if (range === 'year') return taskDate.getFullYear() === date.getFullYear();
      }
      if (task.recurrence === 'daily') return true;
      if (task.recurrence === 'weekly') {
        if (range === 'day') return isSameWeek(taskDate, date);
        return true;
      }
      if (task.recurrence === 'monthly') {
        if (range === 'day') return isSameMonth(taskDate, date);
        if (range === 'week') return true;
        return true;
      }
      return false;
    });
  };

  const todayTasks = React.useMemo(() => getTasksForRange(selectedDate, 'day'), [tasks, selectedDate]);
  const analysisTasks = React.useMemo(() => getTasksForRange(new Date(), analysisRange), [tasks, analysisRange]);

  const currentHour = new Date().getHours();
  const hourlyLoads = React.useMemo(() => {
    const hours = new Array(24).fill(0);
    todayTasks.forEach(task => {
      const start = parseISO(task.startTime).getHours();
      const end = parseISO(task.endTime).getHours();
      for (let i = start; i <= end; i++) {
        hours[i] += task.bandwidthScore;
      }
    });
    return hours;
  }, [todayTasks]);

  const currentLoad = hourlyLoads[currentHour] || 0;
  const peakLoad = Math.max(...hourlyLoads);
  
  const totalBandwidth = todayTasks.reduce((sum, t) => sum + t.bandwidthScore, 0);
  const isOverloaded = peakLoad > 10;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-emerald-500/30 pb-24 md:pb-0">
      {/* Sidebar Navigation (Desktop) */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white/5 border-r border-white/10 flex-col items-center py-8 gap-8 z-40">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Brain className="text-white" size={28} />
        </div>
        
        <div className="flex flex-col gap-4">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} label="Home" />
          <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={24} />} label="Calendar" />
          <NavButton active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} icon={<Zap size={24} />} label="Tasks" />
          <NavButton active={activeTab === 'bandwidth'} onClick={() => setActiveTab('bandwidth')} icon={<TrendingUp size={24} />} label="Analysis" />
        </div>

        <div className="mt-auto">
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={24} />} label="Settings" />
        </div>
      </nav>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10 flex justify-around items-center py-4 z-40 px-6">
        <MobileNavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} />
        <MobileNavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={24} />} />
        <div className="relative -top-8">
          <button 
            onClick={() => setIsFormOpen(true)}
            className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 active:scale-90 transition-transform"
          >
            <Plus size={28} />
          </button>
        </div>
        <MobileNavButton active={activeTab === 'bandwidth'} onClick={() => setActiveTab('bandwidth')} icon={<Zap size={24} />} />
        <MobileNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={24} />} />
      </nav>

      {/* Main Content */}
      <main className="md:pl-20 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
            <div>
              <p className="text-emerald-500 font-mono text-xs uppercase tracking-[0.2em] mb-2">
                {format(selectedDate, 'EEEE, MMMM do')}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                {activeTab === 'dashboard' && "Daily Overview"}
                {activeTab === 'calendar' && "Calendar"}
                {activeTab === 'planner' && "Task Planner"}
                {activeTab === 'bandwidth' && "Bandwidth Analysis"}
                {activeTab === 'settings' && "Settings"}
              </h1>
            </div>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="hidden md:flex bg-white text-black px-6 py-3 rounded-2xl font-semibold items-center gap-2 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Plus size={20} />
              New Task
            </button>
          </header>

          {/* Dashboard View */}
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Real-time Brain Status Dashboard */}
                <BrainStatus currentLoad={currentLoad} peakLoad={peakLoad} />

                {/* AI Daily Briefing */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Brain size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">AI Daily Briefing</span>
                    </div>
                    <p className="text-white font-medium leading-relaxed">
                      {dailyInsights || "Analyzing your schedule for cognitive optimization..."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard 
                    title="Load for Selected Day" 
                    value={`${totalBandwidth} BW`} 
                    subValue={`${todayTasks.length} Tasks active`}
                    icon={<Zap className="text-emerald-500" />}
                  />
                  <StatCard 
                    title="Mental Energy" 
                    value={`${Math.max(0, 100 - (totalBandwidth * 2))}%`} 
                    subValue="Estimated remaining"
                    icon={<TrendingUp className="text-blue-500" />}
                  />
                </div>

                {/* Schedule */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Schedule for {format(selectedDate, 'MMM do')}</h2>
                    {!isSameDay(selectedDate, new Date()) && (
                      <button 
                        onClick={() => setSelectedDate(new Date())}
                        className="text-xs text-emerald-500 hover:underline"
                      >
                        Back to Today
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todayTasks.length > 0 ? (
                      todayTasks.map(task => (
                        <div key={task.id} className="group relative">
                          <TaskCard 
                            task={task} 
                            onToggle={toggleTask} 
                            onDelete={deleteTask} 
                          />
                          {task.status === 'pending' && (
                            <button 
                              onClick={() => setActiveFocusTask(task)}
                              className="absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                            >
                              <TrendingUp size={14} />
                              Focus
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-12 text-center border border-dashed border-white/10 rounded-3xl text-slate-500">
                        No tasks planned for this day.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <CalendarView 
                  tasks={tasks} 
                  selectedDate={selectedDate} 
                  onDateSelect={(date) => setSelectedDate(date)} 
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                />
              </motion.div>
            )}

            {activeTab === 'planner' && (
              <motion.div 
                key="planner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">All Tasks & Recurring Events</h2>
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onToggle={toggleTask} 
                        onDelete={deleteTask} 
                      />
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-slate-500 text-center py-8">Your task list is empty.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bandwidth' && (
              <motion.div 
                key="bandwidth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-white mb-2">Deep Bandwidth Analysis</h2>
                      <p className="text-slate-400">AI-driven insights into your cognitive load distribution.</p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                      {(['day', 'week', 'month', 'year'] as const).map(range => (
                        <button
                          key={range}
                          onClick={() => setAnalysisRange(range)}
                          className={cn(
                            "px-4 py-1.5 text-xs font-medium rounded-lg transition-all capitalize",
                            analysisRange === range ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-12">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4">
                        {analysisRange.charAt(0).toUpperCase() + analysisRange.slice(1)}ly Load Timeline
                      </h3>
                      <BandwidthChart tasks={analysisTasks} />
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                        <h3 className="text-white font-semibold mb-4">Overload Warnings</h3>
                        {isOverloaded ? (
                          <div className="flex items-start gap-3 text-red-400 bg-red-400/10 p-4 rounded-xl">
                            <AlertTriangle className="shrink-0" size={20} />
                            <p className="text-sm">You have overlapping high-bandwidth tasks. Consider rescheduling "Deep Work" sessions to avoid burnout.</p>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 text-emerald-400 bg-emerald-400/10 p-4 rounded-xl">
                            <Zap className="shrink-0" size={20} />
                            <p className="text-sm">Your schedule is well-balanced. You have enough mental capacity for your planned tasks.</p>
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                        <h3 className="text-white font-semibold mb-4">Energy Distribution</h3>
                        <div className="space-y-3">
                          <DistributionBar label="Deep Work" value={analysisTasks.filter(t => t.category === 'Deep Work').length} color="bg-emerald-500" />
                          <DistributionBar label="Meetings" value={analysisTasks.filter(t => t.category === 'Meetings').length} color="bg-blue-500" />
                          <DistributionBar label="Admin" value={analysisTasks.filter(t => t.category === 'Admin').length} color="bg-slate-500" />
                        </div>
                      </div>
                    </div>

                    {/* AI Optimization Section */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp size={120} />
                      </div>
                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="max-w-xl">
                            <h3 className="text-xl font-semibold text-white mb-2">Smart Schedule Optimization</h3>
                            <p className="text-slate-400 text-sm">
                              Let AI analyze your task distribution and suggest the most efficient way to balance your cognitive load.
                            </p>
                          </div>
                          <button 
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 shrink-0"
                          >
                            {isOptimizing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                            {isOptimizing ? "Optimizing..." : "Optimize Now"}
                          </button>
                        </div>

                        <AnimatePresence>
                          {optimizationSuggestions && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-8 pt-8 border-t border-white/10"
                            >
                              <div className="bg-white/5 rounded-2xl p-6">
                                <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">AI Suggestions</h4>
                                <div className="text-white leading-relaxed whitespace-pre-line">
                                  {optimizationSuggestions}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">Application Settings</h2>
                  
                  <div className="space-y-8">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-500 mb-4">AI Configuration</h3>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Key size={20} />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">Personal Gemini API Key</h4>
                            <p className="text-slate-400 text-sm">Use your own API key to bypass daily limits and get faster responses.</p>
                          </div>
                        </div>
                        
                        <form onSubmit={saveApiKey} className="space-y-4">
                          <div className="relative">
                            <input 
                              type="password"
                              value={userApiKey}
                              onChange={e => setUserApiKey(e.target.value)}
                              placeholder="Enter your Gemini API Key"
                              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <a 
                              href="https://aistudio.google.com/app/apikey" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                            >
                              Get a free API key from Google AI Studio
                            </a>
                            <button 
                              type="submit"
                              className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2 rounded-xl font-semibold transition-all"
                            >
                              Save Key
                            </button>
                          </div>
                        </form>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4">Data Management</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                          <h4 className="text-white font-medium mb-2">Export Data</h4>
                          <p className="text-slate-400 text-sm mb-4">Download your tasks and bandwidth history as a JSON file.</p>
                          <button 
                            onClick={exportData}
                            className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <TrendingUp size={18} className="rotate-90" />
                            Export JSON
                          </button>
                        </div>

                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                          <h4 className="text-white font-medium mb-2">Import Data</h4>
                          <p className="text-slate-400 text-sm mb-4">Restore your tasks from a previously exported JSON file.</p>
                          <label className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            <TrendingUp size={18} className="-rotate-90" />
                            Import JSON
                            <input type="file" accept=".json" onChange={importData} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-4">Danger Zone</h3>
                      <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <h4 className="text-white font-medium mb-2">Reset Application</h4>
                        <p className="text-slate-400 text-sm mb-4">This will permanently delete all tasks and settings. This action cannot be undone.</p>
                        <button 
                          onClick={resetData}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <AlertTriangle size={18} />
                          Reset All Data
                        </button>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">About</h3>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-slate-400 text-sm">
                          BrainBandwidth v1.0.0<br />
                          A cognitive-load aware task manager powered by Google Gemini.
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isFormOpen && (
          <TaskForm 
            onAdd={addTask} 
            onClose={() => setIsFormOpen(false)} 
            onRateLimit={() => setIsWaitlistOpen(true)}
          />
        )}
        {activeFocusTask && (
          <FocusTimer 
            task={activeFocusTask} 
            onClose={() => setActiveFocusTask(null)} 
            onComplete={toggleTask}
          />
        )}
        {isWaitlistOpen && (
          <WaitlistModal onClose={() => setIsWaitlistOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNavButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 rounded-xl transition-all relative",
        active ? "text-emerald-500" : "text-slate-500"
      )}
    >
      {icon}
      {active && <motion.div layoutId="activeNavMobile" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />}
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl transition-all relative group",
        active ? "bg-emerald-500/10 text-emerald-500" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {icon}
      <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </span>
      {active && <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full" />}
    </button>
  );
}

function StatCard({ title, value, subValue, icon, highlight }: { title: string, value: string, subValue: string, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all",
      highlight ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-500">{subValue}</div>
    </div>
  );
}

function DistributionBar({ label, value, color }: { label: string, value: number, color: string }) {
  const percentage = Math.min(100, (value / 5) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn("h-full rounded-full", color)} 
        />
      </div>
    </div>
  );
}
