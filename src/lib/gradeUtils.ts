import type { Assessment, ComponentType, SubjectKey } from './types';
import { COMPONENT_WEIGHTS, EX_TYPES } from './types';

export function gradeColor(percentage: number): string {
  if (percentage >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (percentage >= 75) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function gradeHex(percentage: number): string {
  if (percentage >= 90) return '#10b981';
  if (percentage >= 80) return '#3b82f6';
  if (percentage >= 75) return '#f59e0b';
  return '#ef4444';
}

export function percentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return (score / maxScore) * 100;
}

export function componentAverage(assessments: Assessment[]): { pct: number; count: number } {
  if (assessments.length === 0) return { pct: 0, count: 0 };
  const totalPct = assessments.reduce((sum, a) => sum + percentage(a.score, a.max_score), 0);
  return { pct: totalPct / assessments.length, count: assessments.length };
}

export function termGrade(assessments: Assessment[], quarter: number, subjectKey: SubjectKey): {
  ww: { pct: number; count: number };
  pt: { pct: number; count: number };
  ex: { pct: number; count: number };
  overall: number;
  hasData: boolean;
} {
  const subjectAssessments = assessments.filter(
    (a) => a.subject_key === subjectKey && a.quarter === quarter
  );

  const ww = componentAverage(subjectAssessments.filter((a) => a.component === 'ww'));
  const pt = componentAverage(subjectAssessments.filter((a) => a.component === 'pt'));
  const ex = componentAverage(subjectAssessments.filter((a) => a.component === 'ex'));

  let overall = 0;
  let hasComponents = 0;
  if (ww.count > 0) { overall += ww.pct * COMPONENT_WEIGHTS.ww; hasComponents++; }
  if (pt.count > 0) { overall += pt.pct * COMPONENT_WEIGHTS.pt; hasComponents++; }
  if (ex.count > 0) { overall += ex.pct * COMPONENT_WEIGHTS.ex; hasComponents++; }

  const hasData = hasComponents > 0;
  if (!hasData) overall = 0;

  return { ww, pt, ex, overall, hasData };
}

export function minimumScoreNeeded(
  currentAverage: number,
  currentCount: number,
  maxScore: number,
  targetGrade: number
): number {
  const totalAfter = (currentAverage * currentCount + 0) / (currentCount + 1);
  const neededAvg = (targetGrade * (currentCount + 1) - currentAverage * currentCount);
  return Math.max(0, Math.ceil((neededAvg / 100) * maxScore));
}

export function exportTermGrade(subjectName: string, quarter: number, data: {
  ww: { pct: number; count: number };
  pt: { pct: number; count: number };
  ex: { pct: number; count: number };
  overall: number;
}): string {
  const lines = [
    `Term Grade Export`,
    `Subject: ${subjectName}`,
    `Quarter: ${quarter}`,
    ``,
    `Written Work (${data.ww.count} items): ${data.ww.pct.toFixed(2)}%`,
    `Performance Task (${data.pt.count} items): ${data.pt.pct.toFixed(2)}%`,
    `Examination (${data.ex.count} items): ${data.ex.pct.toFixed(2)}%`,
    ``,
    `Overall Term Grade: ${data.overall.toFixed(2)}%`,
    ``,
    `Exported on: ${new Date().toLocaleString()}`,
  ];
  return lines.join('\n');
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
