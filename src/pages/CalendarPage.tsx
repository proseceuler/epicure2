import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SUBJECTS, type Todo, type KanbanTask, type SubjectKey } from '@/lib/types';
import { Card, PageHeader, EmptyState, SubjectBadge } from '@/components/ui';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  source: 'todo' | 'kanban';
  subject_key: SubjectKey | null;
  status?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [{ data: todoData }, { data: kanbanData }] = await Promise.all([
      supabase.from('todos').select('*').not('due_date', 'is', null),
      supabase.from('kanban_tasks').select('*').not('due_date', 'is', null),
    ]);

    const items: DeadlineItem[] = [];
    (todoData as Todo[] | null)?.forEach((t) => {
      if (t.due_date) items.push({ id: t.id, title: t.title, date: t.due_date, source: 'todo', subject_key: t.subject_key, status: t.completed ? 'done' : 'active' });
    });
    (kanbanData as KanbanTask[] | null)?.forEach((t) => {
      if (t.due_date) items.push({ id: t.id, title: t.title, date: t.due_date, source: 'kanban', subject_key: t.subject_key, status: t.status });
    });
    setDeadlines(items);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toDateString();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const deadlinesByDay: Record<number, DeadlineItem[]> = {};
  deadlines.forEach((d) => {
    const dDate = new Date(d.date + 'T00:00:00');
    if (dDate.getFullYear() === year && dDate.getMonth() === month) {
      const day = dDate.getDate();
      if (!deadlinesByDay[day]) deadlinesByDay[day] = [];
      deadlinesByDay[day].push(d);
    }
  });

  const upcomingDeadlines = deadlines
    .filter((d) => {
      const dDate = new Date(d.date + 'T00:00:00');
      return dDate >= new Date(today.toDateString()) && d.status !== 'done';
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Calendar className="w-8 h-8 text-zinc-300 animate-pulse" /></div>;
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <PageHeader title="Upcoming Deadlines Calendar" subtitle="Assignment due dates and exam schedules in one view" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-800">{monthName}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-zinc-200/50"><ChevronLeft className="w-4 h-4 text-zinc-600" /></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200/50 rounded-lg">Today</button>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-zinc-200/50"><ChevronRight className="w-4 h-4 text-zinc-600" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-zinc-400 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayDate = new Date(year, month, day);
                const isToday = dayDate.toDateString() === todayStr;
                const dayDeadlines = deadlinesByDay[day] ?? [];
                const hasOverdue = dayDeadlines.some((d) => d.status !== 'done' && dayDate < new Date(today.toDateString()));

                return (
                  <div
                    key={day}
                    className={`min-h-[60px] p-1 rounded-xl border text-xs transition-all ${
                      isToday ? 'border-zinc-800 bg-zinc-100/50' : 'border-zinc-200/30 hover:border-zinc-300/50'
                    }`}
                  >
                    <div className={`text-right font-medium ${isToday ? 'text-zinc-900' : 'text-zinc-500'}`}>
                      {day}
                    </div>
                    {dayDeadlines.slice(0, 2).map((d) => (
                      <div
                        key={d.id}
                        className={`mt-0.5 px-1 py-0.5 rounded text-[10px] truncate bg-zinc-200/60 text-zinc-600 ${d.status === 'done' ? 'opacity-50 line-through' : ''}`}
                      >
                        {d.title}
                      </div>
                    ))}
                    {dayDeadlines.length > 2 && (
                      <div className="text-[10px] text-zinc-400 mt-0.5">+{dayDeadlines.length - 2} more</div>
                    )}
                    {hasOverdue && <AlertCircle className="w-3 h-3 text-zinc-700 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="font-semibold text-zinc-800 mb-4">Upcoming Deadlines</h3>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState icon={Calendar} title="No upcoming deadlines" subtitle="Add due dates to your tasks to see them here." />
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((d) => {
                const subj = SUBJECTS.find((s) => s.key === d.subject_key);
                const dDate = new Date(d.date + 'T00:00:00');
                const daysAway = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={`${d.source}-${d.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/40 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      daysAway <= 1 ? 'bg-zinc-900 text-white' : daysAway <= 3 ? 'bg-zinc-400 text-zinc-900' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      <span className="text-xs font-medium leading-none">{dDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-sm font-bold leading-none">{dDate.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-700 truncate">{d.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {subj && <SubjectBadge shortName={subj.shortName} />}
                        <span className="text-xs text-zinc-400">
                          {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
