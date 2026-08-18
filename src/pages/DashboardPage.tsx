import { useState, useEffect, useMemo } from 'react';
import { Clock, CircleCheck as CheckCircle2, CalendarClock, GraduationCap, Timer, Layers, Pin, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  SUBJECTS,
  type Assessment,
  type Todo,
  type Note,
  type TimetableEntry,
  type Flashcard,
  type PomodoroSession,
  type SubjectKey,
} from '@/lib/types';
import { termGrade, gradeHex } from '@/lib/gradeUtils';
import { Card, PageHeader, Button, EmptyState, Badge } from '@/components/ui';

interface DashboardPageProps {
  navigate: (page: string) => void;
}

// ---- helpers ---------------------------------------------------------------

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** "HH:MM" in 24h, local time — matches Postgres `time` column serialization. */
function nowHHMM(date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Start of the current week (Sunday 00:00) as an ISO string. */
function startOfWeek(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString();
}

/** Today's date as YYYY-MM-DD in local time (for `due_date` comparisons). */
function todayLocalISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convert "HH:MM" to a readable 12h label like "2:30 PM". */
function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

const subjectByKey = (key: SubjectKey) =>
  SUBJECTS.find((s) => s.key === key);

// ---- widget: overview stat cards ------------------------------------------

interface StatCardData {
  label: string;
  value: string;
  icon: typeof Clock;
  tint: string;
}

function StatCard({ data }: { data: StatCardData }) {
  const Icon = data.icon;
  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${data.tint}1a`, color: data.tint }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-800 leading-none">{data.value}</p>
        <p className="text-xs text-zinc-500 mt-1 truncate">{data.label}</p>
      </div>
    </Card>
  );
}

// ---- component -------------------------------------------------------------

export default function DashboardPage({ navigate }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);

  const [focusMinutes, setFocusMinutes] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState(0);
  const [gpaAverage, setGpaAverage] = useState<number | null>(null);

  const [nextClass, setNextClass] = useState<TimetableEntry | null>(null);
  const [todaysClassesCount, setTodaysClassesCount] = useState(0);

  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);

  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);

  const [deadlineTodos, setDeadlineTodos] = useState<Todo[]>([]);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const today = todayLocalISO();
      const weekStart = startOfWeek();
      const now = nowHHMM();
      const dow = new Date().getDay();

      const [
        sessionsRes,
        activeTodosRes,
        upcomingRes,
        timetableRes,
        flashcardsRes,
        notesRes,
        deadlinesRes,
        assessmentsRes,
      ] = await Promise.all([
        supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('session_type', 'focus')
          .gte('completed_at', weekStart),
        supabase
          .from('todos')
          .select('*')
          .eq('completed', false),
        supabase
          .from('todos')
          .select('*')
          .eq('completed', false)
          .gte('due_date', today),
        supabase.from('timetable_entries').select('*'),
        supabase
          .from('flashcards')
          .select('*')
          .lte('due_date', today),
        supabase
          .from('notes')
          .select('*')
          .eq('pinned', true)
          .order('updated_at', { ascending: false }),
        supabase
          .from('todos')
          .select('*')
          .eq('completed', false)
          .gte('due_date', today)
          .order('due_date', { ascending: true })
          .limit(5),
        supabase.from('assessments').select('*'),
      ]);

      if (cancelled) return;

      // 1. Overview stats
      const sessions = (sessionsRes.data ?? []) as PomodoroSession[];
      setFocusMinutes(
        sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
      );
      setActiveTasks((activeTodosRes.data ?? []).length);
      setUpcomingDeadlines((upcomingRes.data ?? []).length);

      const allAssessments = (assessmentsRes.data ?? []) as Assessment[];
      setAssessments(allAssessments);

      // Current quarter: the latest quarter that has any assessment data.
      if (allAssessments.length > 0) {
        const maxQ = allAssessments.reduce(
          (max, a) => Math.max(max, a.quarter),
          0
        );
        setCurrentQuarter(maxQ);
      }

      // 2. Next class today
      const entries = (timetableRes.data ?? []) as TimetableEntry[];
      const todays = entries
        .filter((e) => e.day_of_week === dow)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      setTodaysClassesCount(todays.length);
      setNextClass(todays.find((e) => e.start_time > now) ?? null);

      // 3. Flashcards due
      setDueFlashcards((flashcardsRes.data ?? []) as Flashcard[]);

      // 4. Pinned notes
      setPinnedNotes((notesRes.data ?? []) as Note[]);

      // 5. Upcoming deadline todos
      setDeadlineTodos((deadlinesRes.data ?? []) as Todo[]);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // 6. Subject overview — per-subject term grade for current quarter.
  const subjectGrades = useMemo(() => {
    return SUBJECTS.map((subject) => {
      const grade = termGrade(assessments, currentQuarter, subject.key);
      return { subject, ...grade };
    });
  }, [assessments, currentQuarter]);

  // Compute the overall GPA-style average across subjects that have data.
  useEffect(() => {
    const withData = subjectGrades.filter((g) => g.hasData);
    if (withData.length === 0) {
      setGpaAverage(null);
      return;
    }
    const avg =
      withData.reduce((sum, g) => sum + g.overall, 0) / withData.length;
    setGpaAverage(avg);
  }, [subjectGrades]);

  const overviewStats: StatCardData[] = [
    {
      label: 'Focus minutes this week',
      value: loading ? '—' : `${focusMinutes}m`,
      icon: Timer,
      tint: '#8b5cf6',
    },
    {
      label: 'Active tasks',
      value: loading ? '—' : String(activeTasks),
      icon: CheckCircle2,
      tint: '#10b981',
    },
    {
      label: 'Upcoming deadlines',
      value: loading ? '—' : String(upcomingDeadlines),
      icon: CalendarClock,
      tint: '#f59e0b',
    },
    {
      label: `Term ${currentQuarter} GPA average`,
      value: loading
        ? '—'
        : gpaAverage === null
          ? 'N/A'
          : `${gpaAverage.toFixed(1)}%`,
      icon: GraduationCap,
      tint: '#3b82f6',
    },
  ];

  const nextClassSubject = nextClass
    ? subjectByKey(nextClass.subject_key)
    : null;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your study overview at a glance"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('pomodoro')}
          >
            <Sparkles className="w-4 h-4" />
            Start focusing
          </Button>
        }
      />

      {/* 1. Overview stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} data={stat} />
        ))}
      </div>

      {/* 2 + 3. Next class + review due */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Next class countdown */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-700">
              Next class today
            </h3>
          </div>

          {loading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-zinc-100/60" />
          ) : nextClass && nextClassSubject ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: nextClassSubject.color }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-800 truncate">
                    {nextClassSubject.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {nextClass.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(nextClass.start_time)} –{' '}
                      {formatTime(nextClass.end_time)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('timetable')}
              >
                Timetable
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-zinc-500">No more classes today.</p>
              {todaysClassesCount > 0 && (
                <p className="text-xs text-zinc-400 mt-1">
                  {todaysClassesCount} class
                  {todaysClassesCount === 1 ? '' : 'es'} already finished.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Review due today */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-700">
              Review due today
            </h3>
          </div>

          {loading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-zinc-100/60" />
          ) : dueFlashcards.length > 0 ? (
            <div className="flex flex-col h-full">
              <p className="text-3xl font-bold text-zinc-800">
                {dueFlashcards.length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                card{dueFlashcards.length === 1 ? '' : 's'} ready for review
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4 self-start"
                onClick={() => navigate('flashcards')}
              >
                Review now
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-2">
                <Layers className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-zinc-600">
                All caught up!
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                No flashcards due today.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* 4 + 5. Pinned notes + upcoming deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pinned notes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-700">
                Pinned notes
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('notes')}
            >
              All notes
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-zinc-100/60"
                />
              ))}
            </div>
          ) : pinnedNotes.length > 0 ? (
            <div className="space-y-3">
              {pinnedNotes.slice(0, 3).map((note) => (
                <button
                  key={note.id}
                  onClick={() => navigate('notes')}
                  className="w-full text-left glass rounded-2xl p-4 glass-hover transition-colors"
                >
                  <p className="font-medium text-sm text-zinc-800 truncate">
                    {note.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {note.content.replace(/[#*`>]/g, '').trim() || 'No content'}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Pin}
              title="No pinned notes"
              subtitle="Pin a note to keep it handy here."
            />
          )}
        </Card>

        {/* Upcoming deadlines */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-700">
                Upcoming deadlines
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('todos')}>
              All tasks
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-2xl bg-zinc-100/60"
                />
              ))}
            </div>
          ) : deadlineTodos.length > 0 ? (
            <div className="space-y-2">
              {deadlineTodos.map((todo) => {
                const subject = todo.subject_key
                  ? subjectByKey(todo.subject_key)
                  : null;
                const dueDate = todo.due_date
                  ? new Date(`${todo.due_date}T00:00:00`)
                  : null;
                const isOverdue =
                  dueDate && dueDate < new Date(todayLocalISO() + 'T00:00:00');
                return (
                  <button
                    key={todo.id}
                    onClick={() => navigate('todos')}
                    className="w-full flex items-center gap-3 glass rounded-2xl p-3 glass-hover transition-colors text-left"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: subject?.color ?? '#a1a1aa',
                      }}
                    />
                    <span className="text-sm text-zinc-700 truncate flex-1">
                      {todo.title}
                    </span>
                    {todo.due_date && (
                      <Badge color={isOverdue ? 'red' : 'amber'}>
                        {isOverdue ? 'Overdue' : formatShortDate(todo.due_date)}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming deadlines"
              subtitle="You're all caught up for now."
            />
          )}
        </Card>
      </div>

      {/* 6. Subject overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-700">
              Subject overview · Term {currentQuarter}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('grades')}>
            Grade calculator
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SUBJECTS.map((s) => (
              <div
                key={s.key}
                className="h-24 animate-pulse rounded-2xl bg-zinc-100/60"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {subjectGrades.map(({ subject, overall, hasData }) => (
              <button
                key={subject.key}
                onClick={() => navigate('grades')}
                className="glass rounded-2xl p-4 glass-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-xs font-medium text-zinc-600 truncate">
                    {subject.shortName}
                  </span>
                </div>
                {hasData ? (
                  <>
                    <p
                      className="text-2xl font-bold leading-none"
                      style={{ color: gradeHex(overall) }}
                    >
                      {overall.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Current term grade
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-zinc-300 leading-none">
                      —
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      No grades yet
                    </p>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/** Compact "Mon 12" style date label for deadline badges. */
function formatShortDate(yyyy_mm_dd: string): string {
  const d = new Date(`${yyyy_mm_dd}T00:00:00`);
  const dayLabel = DAYS[d.getDay()];
  return `${dayLabel} ${d.getDate()}`;
}
