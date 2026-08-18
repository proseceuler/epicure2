import { useState, useEffect } from 'react';
import { usePomodoro } from '@/context/PomodoroContext';
import { Play, Pause, Square, BookOpen, Plus, Search } from 'lucide-react';

interface DockProps {
  navigate: (page: string) => void;
  onQuickCapture: () => void;
}

export default function GlobalDock({ navigate, onQuickCapture }: DockProps) {
  const pomo = usePomodoro();
  const [expanded, setExpanded] = useState(false);

  const minutes = Math.floor(pomo.timeLeft / 60);
  const seconds = pomo.timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
      {expanded && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 glass glass-shadow-lg rounded-2xl p-2 flex items-center gap-1">
          <button onClick={() => { navigate('notes'); setExpanded(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors text-sm text-zinc-700">
            <BookOpen className="w-4 h-4" /> New Note
          </button>
          <button onClick={() => { navigate('todos'); setExpanded(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors text-sm text-zinc-700">
            <Plus className="w-4 h-4" /> New Task
          </button>
          <button onClick={() => { onQuickCapture(); setExpanded(false); }} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors text-sm text-zinc-700">
            <Search className="w-4 h-4" /> Dictionary
          </button>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="glass glass-shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2">
          <button
            onClick={() => pomo.setDockOpen(!pomo.dockOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${pomo.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <span className="text-sm font-medium tabular-nums text-zinc-700">{timeStr}</span>
          </button>

          <div className="w-px h-6 bg-zinc-200" />

          <button
            onClick={() => pomo.isRunning ? pomo.pause() : pomo.start()}
            className="p-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            {pomo.isRunning ? <Pause className="w-4 h-4 text-zinc-700" /> : <Play className="w-4 h-4 text-zinc-700" />}
          </button>

          <button
            onClick={pomo.reset}
            className="p-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          <div className="w-px h-6 bg-zinc-200" />

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            <Plus className="w-5 h-5 text-zinc-700" />
          </button>
        </div>
      </div>
    </>
  );
}
