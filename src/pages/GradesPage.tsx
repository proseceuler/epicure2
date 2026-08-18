import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  SUBJECTS,
  COMPONENT_LABELS,
  EX_TYPES,
  NUM_TERMS,
  COMPONENT_WEIGHTS,
  type Assessment,
  type SubjectKey,
  type ComponentType,
  type ExType,
} from '@/lib/types';
import { Card, PageHeader, Button, Select, Input, Modal, EmptyState, Badge } from '@/components/ui';
import { gradeColor, gradeHex, percentage, termGrade, exportTermGrade, downloadText } from '@/lib/gradeUtils';
import { Plus, ChevronDown, ChevronRight, Download, Trash2, Calculator } from 'lucide-react';

const COMPONENTS: ComponentType[] = ['ww', 'pt', 'ex'];

export default function GradesPage() {
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('math');
  const [quarter, setQuarter] = useState(1);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<ComponentType, boolean>>({
    ww: true,
    pt: true,
    ex: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick-add modal form state
  const [formComponent, setFormComponent] = useState<ComponentType>('ww');
  const [formExType, setFormExType] = useState<ExType>('st1');
  const [formName, setFormName] = useState('');
  const [formScore, setFormScore] = useState('');
  const [formMaxScore, setFormMaxScore] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, quarter]);

  async function loadAssessments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('subject_key', selectedSubject)
      .eq('quarter', quarter)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAssessments(data as Assessment[]);
    } else if (error) {
      console.error('Failed to load assessments:', error.message);
      setAssessments([]);
    }
    setLoading(false);
  }

  const subject = SUBJECTS.find((s) => s.key === selectedSubject)!;
  const grade = termGrade(assessments, quarter, selectedSubject);

  function toggleSection(c: ComponentType) {
    setExpandedSections((prev) => ({ ...prev, [c]: !prev[c] }));
  }

  function resetForm() {
    setFormComponent('ww');
    setFormExType('st1');
    setFormName('');
    setFormScore('');
    setFormMaxScore('');
  }

  async function handleAdd() {
    const scoreNum = parseFloat(formScore);
    const maxNum = parseFloat(formMaxScore);
    if (!formName.trim() || isNaN(scoreNum) || isNaN(maxNum) || maxNum <= 0) return;

    setSaving(true);
    const payload = {
      subject_key: selectedSubject,
      quarter,
      component: formComponent,
      ex_type: formComponent === 'ex' ? formExType : null,
      name: formName.trim(),
      score: scoreNum,
      max_score: maxNum,
    };

    const { data, error } = await supabase.from('assessments').insert(payload).select().single();

    setSaving(false);
    if (error) {
      console.error('Failed to add assessment:', error.message);
      return;
    }

    setAssessments((prev) => [data as Assessment, ...prev]);
    setShowAddModal(false);
    resetForm();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete assessment:', error.message);
      return;
    }
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  }

  function handleExport() {
    const subjectName = SUBJECTS.find((s) => s.key === selectedSubject)?.name ?? selectedSubject;
    const text = exportTermGrade(subjectName, quarter, {
      ww: grade.ww,
      pt: grade.pt,
      ex: grade.ex,
      overall: grade.overall,
    });
    downloadText(`${subjectName.toLowerCase().replace(/\s+/g, '_')}_q${quarter}_grade.txt`, text);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Grades"
        subtitle="Track assessments and monitor your term standing"
        action={
          <>
            <Button variant="secondary" size="md" onClick={handleExport} disabled={!grade.hasData}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="primary" size="md" onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Plus className="w-4 h-4" />
              Add Score
            </Button>
          </>
        }
      />

      {/* Subject tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SUBJECTS.map((s) => {
          const active = s.key === selectedSubject;
          return (
            <button
              key={s.key}
              onClick={() => setSelectedSubject(s.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'text-white shadow-sm' : 'glass glass-hover text-zinc-600'
              }`}
              style={active ? { backgroundColor: s.color } : undefined}
            >
              {s.shortName}
            </button>
          );
        })}
      </div>

      {/* Quarter selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-zinc-500 mr-1">Quarter</span>
        {Array.from({ length: NUM_TERMS }, (_, i) => i + 1).map((q) => {
          const active = q === quarter;
          return (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                active ? 'bg-zinc-900 text-white shadow-sm' : 'glass glass-hover text-zinc-600'
              }`}
            >
              {q}
            </button>
          );
        })}
      </div>

      {/* Prominent overall term grade */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${gradeHex(grade.overall)}1a` }}
            >
              <Calculator className="w-7 h-7" style={{ color: gradeHex(grade.overall) }} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">
                {subject.name} · Quarter {quarter}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className="text-4xl font-bold tabular-nums"
                  style={{ color: gradeHex(grade.overall) }}
                >
                  {grade.hasData ? grade.overall.toFixed(1) : '—'}
                  <span className="text-xl">%</span>
                </span>
                {grade.hasData && (
                  <span className="text-sm text-zinc-400">overall term grade</span>
                )}
              </div>
            </div>
          </div>

          {/* Component breakdown mini-stats */}
          <div className="flex gap-3">
            {COMPONENTS.map((c) => {
              const comp = grade[c];
              return (
                <div key={c} className="text-center min-w-[68px]">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">
                    {COMPONENT_LABELS[c].split(' ')[0]}
                  </p>
                  <p
                    className="text-base font-semibold tabular-nums"
                    style={{ color: comp.count > 0 ? gradeHex(comp.pct) : '#d4d4d8' }}
                  >
                    {comp.count > 0 ? `${comp.pct.toFixed(0)}%` : '—'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {Math.round(COMPONENT_WEIGHTS[c] * 100)}% · {comp.count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Collapsible component sections */}
      <div className="space-y-4">
        {COMPONENTS.map((c) => {
          const items = assessments.filter((a) => a.component === c);
          const isOpen = expandedSections[c];
          const compAvg = grade[c];
          return (
            <Card key={c} className="p-0 overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(c)}
                className="w-full flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-zinc-800">{COMPONENT_LABELS[c]}</p>
                    <p className="text-xs text-zinc-400">
                      {items.length} {items.length === 1 ? 'item' : 'items'} · {Math.round(COMPONENT_WEIGHTS[c] * 100)}% weight
                    </p>
                  </div>
                </div>
                {compAvg.count > 0 && (
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: gradeHex(compAvg.pct) }}
                  >
                    {compAvg.pct.toFixed(1)}%
                  </span>
                )}
              </button>

              {/* Animated body */}
              <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-5 pt-1">
                    {items.length === 0 ? (
                      <EmptyState
                        icon={Calculator}
                        title={`No ${COMPONENT_LABELS[c]} scores yet`}
                        subtitle="Add a score to start tracking this component."
                      />
                    ) : (
                      <div className="space-y-2">
                        {items.map((a) => {
                          const pct = percentage(a.score, a.max_score);
                          return (
                            <div
                              key={a.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/40 transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-800 truncate">
                                  {a.name}
                                </p>
                                {a.component === 'ex' && a.ex_type && (
                                  <p className="text-xs text-zinc-400">
                                    {EX_TYPES.find((e) => e.key === a.ex_type)?.label ?? a.ex_type}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-zinc-500 tabular-nums whitespace-nowrap">
                                {a.score}/{a.max_score}
                              </span>
                              <Badge color="zinc" >
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium tabular-nums ${gradeColor(pct)}`}>
                                  {pct.toFixed(1)}%
                                </span>
                              </Badge>
                              <button
                                onClick={() => handleDelete(a.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                aria-label="Delete assessment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick-add modal */}
      {showAddModal && (
        <Modal title="Add Score" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Component</label>
              <Select
                value={formComponent}
                onChange={(v) => setFormComponent(v as ComponentType)}
                options={COMPONENTS.map((c) => ({ value: c, label: COMPONENT_LABELS[c] }))}
              />
            </div>

            {formComponent === 'ex' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Exam Type</label>
                <Select
                  value={formExType}
                  onChange={(v) => setFormExType(v as ExType)}
                  options={EX_TYPES.map((e) => ({ value: e.key, label: e.label }))}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Assessment Name</label>
              <Input
                value={formName}
                onChange={setFormName}
                placeholder="e.g. Quiz 1, Unit Test, Project"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Score</label>
                <Input
                  type="number"
                  value={formScore}
                  onChange={setFormScore}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Max Score</label>
                <Input
                  type="number"
                  value={formMaxScore}
                  onChange={setFormMaxScore}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAdd}
                disabled={saving || !formName.trim() || !formScore || !formMaxScore}
              >
                {saving ? 'Saving…' : 'Save Score'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {loading && assessments.length === 0 && (
        <p className="text-center text-sm text-zinc-400 mt-8">Loading…</p>
      )}
    </div>
  );
}
