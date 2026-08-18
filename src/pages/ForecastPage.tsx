import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  SUBJECTS,
  NUM_TERMS,
  COMPONENT_WEIGHTS,
  COMPONENT_LABELS,
  type Assessment,
  type SubjectKey,
  type ComponentType,
  type ForecastScenario,
} from '@/lib/types';
import { Card, PageHeader, Button, Select, Input, EmptyState } from '@/components/ui';
import { percentage, termGrade } from '@/lib/gradeUtils';
import { Target, Lock, Save, Trash2, TrendingUp, Calculator } from 'lucide-react';

const COMPONENTS: ComponentType[] = ['ww', 'pt', 'ex'];

const SUBJECT_OPTIONS = SUBJECTS.map((s) => ({ value: s.key, label: s.name }));
const QUARTER_OPTIONS = Array.from({ length: NUM_TERMS }, (_, i) => ({
  value: String(i + 1),
  label: `Quarter ${i + 1}`,
}));
const COMPONENT_OPTIONS = COMPONENTS.map((c) => ({ value: c, label: COMPONENT_LABELS[c] }));

/** Score (as a percentage 0-100) needed on a hypothetical new item in `comp`
 *  to bring the weighted overall to `target`. Returns the needed percentage,
 *  the resulting new component average, and whether it is achievable. */
function neededScoreForComponent(
  tg: ReturnType<typeof termGrade>,
  comp: ComponentType,
  target: number,
): { neededPct: number; newAvg: number; currentCount: number; feasible: boolean } {
  const wC = COMPONENT_WEIGHTS[comp];
  const dataC = tg[comp];

  // Contribution from every other component that already has data.
  let othersContribution = 0;
  for (const c of COMPONENTS) {
    if (c === comp) continue;
    if (tg[c].count > 0) othersContribution += tg[c].pct * COMPONENT_WEIGHTS[c];
  }

  // Weighted average the target component would need to hit `target`.
  const newAvg = (target - othersContribution) / wC;

  // Convert that average into the score on the single new item.
  let neededPct: number;
  if (dataC.count > 0) {
    neededPct = newAvg * (dataC.count + 1) - dataC.pct * dataC.count;
  } else {
    neededPct = newAvg;
  }

  const feasible = neededPct >= 0 && neededPct <= 100;
  return { neededPct, newAvg, currentCount: dataC.count, feasible };
}

/** Projected overall if a new item scoring `scorePct` is added to `comp`. */
function projectedOverall(
  tg: ReturnType<typeof termGrade>,
  comp: ComponentType,
  scorePct: number,
): number {
  let overall = 0;
  for (const c of COMPONENTS) {
    const data = tg[c];
    if (c === comp) {
      const newCount = data.count + 1;
      const newAvg =
        data.count > 0 ? (data.pct * data.count + scorePct) / newCount : scorePct;
      overall += newAvg * COMPONENT_WEIGHTS[c];
    } else if (data.count > 0) {
      overall += data.pct * COMPONENT_WEIGHTS[c];
    }
  }
  return overall;
}

function pctColor(p: number): string {
  if (p >= 90) return 'text-emerald-600';
  if (p >= 80) return 'text-blue-600';
  if (p >= 75) return 'text-amber-600';
  return 'text-red-600';
}

export default function ForecastPage() {
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('math');
  const [quarter, setQuarter] = useState(1);
  const [targetGrade, setTargetGrade] = useState(90);
  const [lockedGrade, setLockedGrade] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState('');

  // Target-mode controls
  const [targetComponent, setTargetComponent] = useState<ComponentType>('ww');
  const [targetMaxScore, setTargetMaxScore] = useState(50);

  // What-if calculator controls
  const [whatIfComponent, setWhatIfComponent] = useState<ComponentType>('ex');
  const [whatIfScore, setWhatIfScore] = useState(85);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const subject = SUBJECTS.find((s) => s.key === selectedSubject)!;

  // --- Load assessments for the selected subject ---
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('subject_key', selectedSubject)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (error) {
        console.error('Failed to load assessments', error);
        setAssessments([]);
      } else {
        setAssessments((data as Assessment[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [selectedSubject]);

  // --- Derived current term grade (the "locked" real grade) ---
  const grade = useMemo(
    () => termGrade(assessments, quarter, selectedSubject),
    [assessments, quarter, selectedSubject],
  );

  useEffect(() => {
    setLockedGrade(grade.hasData ? grade.overall : null);
  }, [grade]);

  // --- Load saved scenarios ---
  const loadScenarios = useCallback(async () => {
    const { data, error } = await supabase
      .from('forecast_scenarios')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load scenarios', error);
      return;
    }
    setScenarios((data as ForecastScenario[]) ?? []);
  }, []);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // --- Target-mode breakdown for every component ---
  const targetBreakdown = useMemo(() => {
    return COMPONENTS.map((c) => ({
      comp: c,
      label: COMPONENT_LABELS[c],
      ...neededScoreForComponent(grade, c, targetGrade),
    }));
  }, [grade, targetGrade]);

  const activeTarget = targetBreakdown.find((b) => b.comp === targetComponent)!;
  const neededScoreOutOfMax = activeTarget
    ? Math.max(0, Math.round((activeTarget.neededPct / 100) * targetMaxScore))
    : 0;

  // --- What-if projection ---
  const projected = useMemo(
    () => projectedOverall(grade, whatIfComponent, whatIfScore),
    [grade, whatIfComponent, whatIfScore],
  );

  // --- Save a scenario ---
  const handleSave = async () => {
    const name = newScenarioName.trim();
    if (!name) {
      setMessage({ kind: 'err', text: 'Give your scenario a name first.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const payload = {
      name,
      subject_key: selectedSubject,
      quarter,
      target_grade: targetGrade,
      scenario_data: {
        target_component: targetComponent,
        target_max_score: targetMaxScore,
        locked_grade: lockedGrade,
        breakdown: targetBreakdown.map((b) => ({
          component: b.comp,
          needed_pct: Number(b.neededPct.toFixed(2)),
          feasible: b.feasible,
          current_count: b.currentCount,
        })),
      },
    };
    const { error } = await supabase.from('forecast_scenarios').insert(payload).select();
    setBusy(false);
    if (error) {
      setMessage({ kind: 'err', text: `Could not save: ${error.message}` });
      return;
    }
    setNewScenarioName('');
    setMessage({ kind: 'ok', text: `Saved "${name}".` });
    loadScenarios();
  };

  // --- Delete a scenario ---
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('forecast_scenarios').delete().eq('id', id);
    if (error) {
      setMessage({ kind: 'err', text: `Could not delete: ${error.message}` });
      return;
    }
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const subjectScenarios = scenarios.filter(
    (s) => s.subject_key === selectedSubject && s.quarter === quarter,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade Forecaster"
        subtitle="Set a target, see the minimum score you need, and save what-if plans."
        action={
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <Target className="w-4 h-4" /> Plan ahead
          </span>
        }
      />

      {/* Selectors */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Subject</label>
            <Select
              value={selectedSubject}
              onChange={(v) => setSelectedSubject(v as SubjectKey)}
              options={SUBJECT_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Quarter</label>
            <Select
              value={String(quarter)}
              onChange={(v) => setQuarter(Number(v))}
              options={QUARTER_OPTIONS}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Locked real current grade */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <Lock className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-800">Current Real Grade</h3>
              <p className="text-xs text-zinc-500">Computed from your entered assessments — read only.</p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-400">Loading…</p>
          ) : lockedGrade === null ? (
            <EmptyState
              icon={Lock}
              title="No grades recorded yet"
              subtitle={`Add ${subject.shortName} assessments for Quarter ${quarter} to lock in a current grade.`}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Locked overall</p>
                  <p className={`text-4xl font-bold ${pctColor(lockedGrade)}`}>
                    {lockedGrade.toFixed(2)}%
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                  <Lock className="w-3 h-3" /> read-only
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {COMPONENTS.map((c) => {
                  const data = grade[c];
                  return (
                    <div key={c} className="glass rounded-xl p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {COMPONENT_LABELS[c]}
                      </p>
                      <p className={`text-lg font-bold mt-1 ${data.count ? pctColor(data.pct) : 'text-zinc-300'}`}>
                        {data.count ? `${data.pct.toFixed(1)}%` : '—'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{data.count} item{data.count === 1 ? '' : 's'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Target Grade mode */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <Target className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-800">Target Grade Mode</h3>
              <p className="text-xs text-zinc-500">Minimum score on your next assessment to reach the target.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Target overall (%)</label>
              <Input
                type="number"
                value={String(targetGrade)}
                onChange={(v) => setTargetGrade(Math.max(0, Math.min(100, Number(v) || 0)))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Next assessment in</label>
              <Select
                value={targetComponent}
                onChange={(v) => setTargetComponent(v as ComponentType)}
                options={COMPONENT_OPTIONS}
              />
            </div>
          </div>

          {/* Per-component breakdown */}
          <div className="space-y-2 mb-4">
            {targetBreakdown.map((b) => {
              const isSel = b.comp === targetComponent;
              return (
                <button
                  key={b.comp}
                  onClick={() => setTargetComponent(b.comp)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                    isSel ? 'glass-shadow bg-white/60' : 'glass hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${isSel ? 'bg-zinc-800' : 'bg-zinc-300'}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-700">{b.label}</p>
                      <p className="text-[10px] text-zinc-400">
                        {b.currentCount} existing item{b.currentCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${b.feasible ? pctColor(b.neededPct) : 'text-red-500'}`}>
                      {b.neededPct > 100 ? '> 100%' : b.neededPct < 0 ? '0%' : `${b.neededPct.toFixed(1)}%`}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {b.feasible ? 'needed' : 'out of reach'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Concrete score needed */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500">Min. score needed</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400">out of</span>
                <input
                  type="number"
                  min={1}
                  value={targetMaxScore}
                  onChange={(e) => setTargetMaxScore(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 px-2 py-1 glass-input rounded-lg text-xs text-zinc-700"
                />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${activeTarget.feasible ? pctColor(activeTarget.neededPct) : 'text-red-500'}`}>
                {activeTarget.neededPct > 100 ? '—' : neededScoreOutOfMax}
              </span>
              <span className="text-sm text-zinc-400">/ {targetMaxScore}</span>
            </div>
            {!activeTarget.feasible && (
              <p className="text-xs text-red-500 mt-2">
                {activeTarget.neededPct > 100
                  ? `Even a perfect score in ${COMPONENT_LABELS[targetComponent]} won't reach ${targetGrade}%. Try another component or a lower target.`
                  : `You're already projected above ${targetGrade}% — any score keeps you on track.`}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* What-if calculator */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
            <Calculator className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-800">What-if Calculator</h3>
            <p className="text-xs text-zinc-500">Drag the slider — see your projected overall instantly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Hypothetical assessment in</label>
              <Select
                value={whatIfComponent}
                onChange={(v) => setWhatIfComponent(v as ComponentType)}
                options={COMPONENT_OPTIONS}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-500">Score on that assessment</label>
                <span className={`text-sm font-bold ${pctColor(whatIfScore)}`}>{whatIfScore}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={whatIfScore}
                onChange={(e) => setWhatIfScore(Number(e.target.value))}
                className="w-full accent-zinc-800"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-6 h-6 text-zinc-400 mb-2" />
            <p className="text-xs text-zinc-500 mb-1">Projected overall</p>
            <p className={`text-5xl font-bold ${pctColor(projected)}`}>{projected.toFixed(2)}%</p>
            {lockedGrade !== null && (
              <p className="text-xs text-zinc-400 mt-3">
                {projected > lockedGrade ? (
                  <span className="text-emerald-600">▲ +{(projected - lockedGrade).toFixed(2)} vs. current</span>
                ) : projected < lockedGrade ? (
                  <span className="text-red-500">▼ {(projected - lockedGrade).toFixed(2)} vs. current</span>
                ) : (
                  <span>— no change from current</span>
                )}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Save scenario + list */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
            <Save className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-800">Saved Scenarios</h3>
            <p className="text-xs text-zinc-500">Snapshots of a target plan for {subject.shortName} · Q{quarter}.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            value={newScenarioName}
            onChange={setNewScenarioName}
            placeholder={`e.g. "Ace the term exam" — target ${targetGrade}%`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          <Button onClick={handleSave} disabled={busy} className="shrink-0">
            <Save className="w-4 h-4" /> Save scenario
          </Button>
        </div>

        {message && (
          <p
            className={`text-xs mb-4 ${message.kind === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {message.text}
          </p>
        )}

        {subjectScenarios.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No saved scenarios yet"
            subtitle="Name a plan above and save it to revisit it later."
          />
        ) : (
          <ul className="space-y-2">
            {subjectScenarios.map((s) => (
              <li
                key={s.id}
                className="glass rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">{s.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Target{' '}
                    <span className={`font-semibold ${pctColor(s.target_grade)}`}>
                      {s.target_grade}%
                    </span>
                    {' · '}Q{s.quarter}
                    {lockedGrade !== null && (
                      <>{' · '}current {lockedGrade.toFixed(1)}%</>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(s.id)}
                  className="text-red-500 hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
