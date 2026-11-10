/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  RefreshCw,
  AlertCircle,
  Coins,
  Sliders,
  Edit2,
  Check,
  Info,
  CalendarDays,
  ImageDown
} from 'lucide-react';
import { ChildProfile, LearningTask, ProgressSummary, WrongItem } from '../types';

interface DailyTaskViewProps {
  profile: ChildProfile;
  task: LearningTask | null;
  progress: ProgressSummary | null;
  progressError: string | null;
  progressLoading: boolean;
  onRetryProgress: () => Promise<void>;
  onOpenPrintModal: () => void;
  onGoToReview: () => void;
  onExportImage: () => void;
  onGeneratePlanTask: () => Promise<void>;
  onOpenCustomModal: () => void;
  onUpdateRewardPoints: (newPoints: number) => Promise<void>;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 按周一起始，把真实窗口内的每一天连续排成 7 列，并补足完整行。 */
function buildCalendarCells(start: string, end: string): (string | null)[] {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  const leadingBlanks = (startDate.getDay() + 6) % 7;
  const dates: string[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    dates.push(formatIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const cells: (string | null)[] = [...Array(leadingBlanks).fill(null), ...dates];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatMonthRanges(start: string, end: string): string {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getMonth() + 1}月${startDate.getDate()}–${endDate.getDate()}日`;
  }
  const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
  return `${startDate.getMonth() + 1}月${startDate.getDate()}–${monthEnd}日 · ${endDate.getMonth() + 1}月1–${endDate.getDate()}日`;
}

function formatSubmittedAt(value: string): string {
  if (!value) return '提交时间未记录';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * 判断句只读取接口中的最大错因与正确率。
 * 接口没有连续全对次数，因此 0.9 作为这里采用的“稳定线”判断阈值。
 */
function buildProgressJudgment(progress: ProgressSummary): string {
  if (progress.kpi.active_day_count === 0) {
    return '本期还没有学习记录，暂无法判断掌握状态。';
  }

  const mainPattern = progress.error_patterns.reduce<ProgressSummary['error_patterns'][number] | null>(
    (largest, item) => (!largest || item.count > largest.count ? item : largest),
    null
  );

  let causeText: string;
  if (!mainPattern || mainPattern.count <= 0 || !mainPattern.pattern_id) {
    causeText = '错题未归类，需要家长人工看一遍';
  } else if (mainPattern.pattern_id === 'ERR-MATH-MAKE10-CONFUSE') {
    causeText = '方法路径是对的，但拆数点数有偏差';
  } else if (mainPattern.pattern_id === 'ERR-MATH-CARRY-MISSED') {
    causeText = '进位环节有遗漏';
  } else {
    causeText = `主要错因为「${mainPattern.name}」，需要结合错题人工确认`;
  }

  const rate = progress.kpi.correct_rate;
  const ratePercent = Math.round(rate * 100);
  const rateText = rate >= 0.9 ? '接近稳定' : rate >= 0.75 ? '尚未稳定' : '需要重点巩固';
  const ending = rate >= 0.9
    ? '已达稳定线，可考虑加新知识点'
    : '未达连续 3 次全对的稳定掌握门槛 → 继续巩固，暂不加新知识点';

  return `${causeText}；本期正确率 ${ratePercent}%，${rateText}。${ending}。`;
}

function knowledgeStatusStyle(statusKey: string): string {
  switch (statusKey) {
    case 'reinforcing':
      return 'bg-warn-bg text-warn border-warn-line';
    case 'unassessed':
      return 'bg-surface-3 text-ink-3 border-line';
    case 'needs_learning':
      return 'bg-danger-bg text-danger border-danger-line';
    case 'learning':
      return 'bg-info-bg text-info border-info-line';
    case 'initial_mastery':
    case 'stable_mastery':
      return 'bg-ok-bg text-ok border-ok-line';
    default:
      return 'bg-surface-3 text-ink-2 border-line';
  }
}

export const DailyTaskView: React.FC<DailyTaskViewProps> = ({
  profile,
  task,
  progress,
  progressError,
  progressLoading,
  onRetryProgress,
  onOpenPrintModal,
  onGoToReview,
  onExportImage,
  onGeneratePlanTask,
  onOpenCustomModal,
  onUpdateRewardPoints
}) => {
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [tempPoints, setTempPoints] = useState(task?.customRewardPoints ?? task?.defaultRewardPoints ?? 0);

  const questions = task?.material.questions || [];
  const currentPoints = task?.customRewardPoints ?? task?.defaultRewardPoints ?? 0;
  const difficulty = task?.material.paperType === 'standard_comprehensive'
    ? '综合'
    : task?.material.paperType === 'speed_calculation'
      ? '基础'
      : '概念';

  const handlePlanGenerate = async () => {
    setIsGeneratingPlan(true);
    try {
      await onGeneratePlanTask();
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSavePoints = async () => {
    await onUpdateRewardPoints(tempPoints);
    setIsEditingPoints(false);
  };

  const getTaskStatusBadge = () => {
    if (!task) return null;
    switch (task.status) {
      case 'pending_print':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warn-bg text-warn text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" />
            待打印练习纸
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-info-bg text-info text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            作答进行中
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-bg text-danger text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            待家长核对
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ok-bg text-ok text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            批改完成
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-3 text-ink-2 text-xs font-semibold">
            {task.status}
          </span>
        );
    }
  };

  const renderProgressError = () => (
    <div className="rounded-xl border border-danger-line bg-danger-bg p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-danger">
            进度数据读取失败：<span className="font-mono break-all">{progressError}</span>
          </div>
          <button
            type="button"
            onClick={() => void onRetryProgress()}
            disabled={progressLoading}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-line text-xs font-semibold text-ink hover:bg-surface-3 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${progressLoading ? 'animate-spin' : ''}`} />
            重试
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="rounded-xl bg-accent-panel text-accent-panel-ink px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-accent-panel-ink/80">
            <span className="text-xl">{profile.avatar}</span>
            <span>早上好，{profile.name}同学！</span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight">
            一年级数学认知工坊 · 纸墨本源深度思考
          </h1>
          <p className="mt-1 text-xs text-accent-panel-ink/70">
            {profile.grade} · {profile.curriculum}数学｜当前重点：{task?.knowledgePointTitle ?? '今日任务待生成'}
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 text-xs text-accent-panel-ink/75">
              <Flame className="w-3.5 h-3.5" />连续学习
            </div>
            <div className="text-2xl font-black tabular-nums">{profile.streakDays} 天</div>
          </div>
          <div className="w-px h-10 bg-accent-panel-ink/25" />
          <div className="text-center">
            <div className="flex items-center gap-1 text-xs text-accent-panel-ink/75">
              <Coins className="w-3.5 h-3.5" />可用积分
            </div>
            <div className="text-2xl font-black tabular-nums">{profile.pointsBalance} 分</div>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-surface shadow-tok overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-surface-3 border-b border-line">
          <span className="w-5 h-5 rounded-md bg-ink text-accent-ink text-xs font-black flex items-center justify-center">1</span>
          <h2 className="font-black text-sm text-ink">近 30 天学习进度</h2>
          <span className="text-xs text-ink-3">
            {progress ? `滚动窗口 ${progress.window.start} 至 ${progress.window.end}` : '真实数据窗口'}
          </span>
          <span className="ml-auto text-[11px] font-mono text-ink-3">
            {progress?.source || 'GET /api/progress'}
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {progressError ? renderProgressError() : progressLoading || !progress ? (
            <div className="py-12 text-center text-sm text-ink-3">正在读取近 30 天真实学习进度...</div>
          ) : (() => {
            const activeDays = new Set(progress.active_days);
            const cells = buildCalendarCells(progress.window.start, progress.window.end);
            const errorTotal = progress.error_patterns.reduce((sum, item) => sum + item.count, 0);
            return (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-[288px_minmax(0,1fr)] gap-5 items-start">
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: '学习天数',
                          value: progress.kpi.active_day_count,
                          unit: `/${progress.window.days} 天`,
                          detail: progress.kpi.active_day_count < 7 ? '刚开始累积' : '观察窗口已建立'
                        },
                        {
                          label: '完成练习卷',
                          value: progress.kpi.worksheet_count,
                          unit: '份',
                          detail: `${progress.kpi.graded_count} 题已判`
                        },
                        {
                          label: '本期正确率',
                          value: Math.round(progress.kpi.correct_rate * 100),
                          unit: '%',
                          detail: `${progress.kpi.correct_count} 对 / ${progress.kpi.graded_count} 题`
                        },
                        {
                          label: '在学知识点',
                          value: progress.kpi.active_kp_count,
                          unit: '个',
                          detail: `${progress.knowledge_points.length} 条掌握记录`
                        }
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-line bg-surface-2 p-2.5">
                          <div className="text-[11px] text-ink-3">{item.label}</div>
                          <div className="mt-0.5 font-black text-ink leading-tight">
                            <span className="text-lg tabular-nums">{item.value}</span>
                            <span className="ml-1 text-[11px] font-medium text-ink-2">{item.unit}</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-ink-3">{item.detail}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-lg border border-line bg-surface-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                          <CalendarDays className="w-3.5 h-3.5" />学习日历
                        </div>
                        <div className="text-[10px] text-ink-3">{formatMonthRanges(progress.window.start, progress.window.end)}</div>
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-1">
                        {WEEKDAYS.map((day) => (
                          <div key={day} className="text-center text-[10px] font-bold text-ink-3">{day}</div>
                        ))}
                      </div>
                      <div className="mt-1 grid grid-cols-7 gap-1">
                        {cells.map((date, index) => {
                          if (!date) {
                            return <div key={`blank-${index}`} className="aspect-square rounded-[5px] bg-transparent border-0" />;
                          }
                          const day = parseLocalDate(date).getDate();
                          const learned = activeDays.has(date);
                          const today = date === progress.window.end;
                          const monthSwitch = day === 1 && date !== progress.window.start;
                          const stateClass = today
                            ? 'bg-surface border-2 border-warn text-warn font-black'
                            : learned
                              ? 'bg-ok border-ok-line text-ok-on font-black'
                              : 'bg-surface-3 border-line text-ink-2';
                          return (
                            <div
                              key={date}
                              title={`${date}${learned ? ' · 已学习' : ' · 未学习'}${today ? ' · 今天' : ''}`}
                              className={`aspect-square rounded-[5px] border flex items-center justify-center text-[11px] ${stateClass} ${monthSwitch ? 'border-l-[3px] border-l-ink' : ''}`}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-line-strong pt-2 text-[10px] text-ink-3">
                        <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-ok mr-1 align-middle" />已学习</span>
                        <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-surface border-2 border-warn mr-1 align-middle" />今天</span>
                        <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-surface-3 border border-line mr-1 align-middle" />未学习</span>
                        <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-surface-3 border-l-[3px] border-l-ink mr-1 align-middle" />跨月</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-3xl space-y-3">
                    <div className="rounded-lg border border-line bg-surface-2 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-surface-3 border-b border-line">
                        <div className="text-xs font-black text-ink">知识点掌握</div>
                        <div className="text-[10px] text-ink-3">{progress.knowledge_points.length} 个 · 近 {progress.window.days} 天</div>
                      </div>
                      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_84px_58px_58px] gap-2 px-3 py-1.5 text-[10px] font-bold text-ink-3 border-b border-line">
                        <div>知识点</div><div className="text-center">状态</div><div className="text-center">证据</div><div className="text-center">趋势</div>
                      </div>
                      {progress.knowledge_points.length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-ink-3">本期暂无知识点记录</div>
                      ) : progress.knowledge_points.map((point) => (
                        <div key={point.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_84px_58px_58px] gap-2 items-center px-3 py-2 border-b border-line last:border-b-0 text-xs">
                          <div className="min-w-0">
                            <div className="font-semibold text-ink leading-snug">{point.title}</div>
                            <div className="text-[10px] font-mono text-ink-3 truncate">{point.id}</div>
                          </div>
                          <div className="text-center">
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${knowledgeStatusStyle(point.status_key)}`}>{point.status}</span>
                          </div>
                          <div className="hidden sm:block text-center text-[11px] text-ink-2">{point.evidence_count} 次</div>
                          <div className={`hidden sm:block text-center text-[11px] font-bold ${point.trend.includes('下降') ? 'text-danger' : 'text-ink-3'}`}>{point.trend || '—'}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-danger-line bg-danger-bg p-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-xs font-black text-danger">错因分布</div>
                        <div className="text-[10px] text-danger">本期 {errorTotal} 道错题</div>
                      </div>
                      {errorTotal === 0 ? (
                        <div className="text-xs text-ink-2">本期无错题</div>
                      ) : progress.error_patterns.map((pattern) => (
                        <div key={`${pattern.pattern_id}-${pattern.name}`} className="flex items-center gap-2 mb-1.5 last:mb-0">
                          <div className="w-24 sm:w-32 shrink-0 text-[10px] text-ink-2 truncate" title={pattern.name}>{pattern.name}</div>
                          <div className="flex-1 h-2 rounded-full bg-surface border border-line overflow-hidden">
                            <div className="h-full bg-danger" style={{ width: `${Math.round((pattern.count / errorTotal) * 100)}%` }} />
                          </div>
                          <div className="w-5 text-right text-[10px] font-black text-danger">{pattern.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
                  <div className="rounded-lg border border-info-line bg-info-bg p-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-info"><Sparkles className="w-3.5 h-3.5" />本期判断</div>
                    <div className="mt-1.5 text-xs leading-relaxed text-ink-2">{buildProgressJudgment(progress)}</div>
                  </div>
                  <div className="rounded-lg border border-dashed border-line-strong bg-surface-3 p-3 flex gap-2">
                    <Info className="w-4 h-4 text-ink shrink-0" />
                    <div className="text-[10px] leading-relaxed text-ink-2">
                      {progress.kpi.active_day_count < 7 ? (
                        <><span className="font-bold text-ink">本期只有 {progress.kpi.active_day_count} 天数据</span>，不画趋势折线；1 个点连不成线。满 7 天后才展示真实趋势。</>
                      ) : (
                        <><span className="font-bold text-ink">本期已有 {progress.kpi.active_day_count} 天数据。</span>当前仅展示聚合结果，折线图不在本期范围内。</>
                      )}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface shadow-tok overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-surface-3 border-b border-line">
          <span className="w-5 h-5 rounded-md bg-ink text-accent-ink text-xs font-black flex items-center justify-center">2</span>
          <h2 className="font-black text-sm text-ink">上次学习情况</h2>
          <span className="text-xs text-ink-3">最近一次已批改的提交</span>
          <span className="ml-auto text-[11px] font-mono text-ink-3">{progress?.last_submission?.submission_id || '暂无提交'}</span>
        </div>
        <div className="p-4 sm:p-5">
          {progressError ? renderProgressError() : progressLoading || !progress ? (
            <div className="py-8 text-center text-sm text-ink-3">正在读取上次学习记录...</div>
          ) : !progress.last_submission ? (
            <div className="py-10 text-center rounded-xl bg-surface-2 border border-line text-sm text-ink-3">还没有已批改的提交</div>
          ) : (() => {
            const submission = progress.last_submission;
            const correctRate = submission.graded_count > 0 ? submission.correct_count / submission.graded_count : 0;
            const patternMap = new Map(progress.error_patterns.map((pattern) => [pattern.pattern_id, pattern.name]));
            const getPatternName = (item: WrongItem) => item.err_pattern_id
              ? patternMap.get(item.err_pattern_id) || item.err_pattern_id
              : '未归类';
            return (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
                  <div>
                    <div className="text-[10px] font-mono text-ink-3">{submission.worksheet_id}</div>
                    <div className="mt-1 text-sm font-black text-ink leading-snug">{task?.knowledgePointTitle ?? '本次练习'} · {submission.graded_count} 题练习卷</div>
                    <div className="mt-1.5 text-[10px] text-ink-3 leading-relaxed">
                      {formatSubmittedAt(submission.uploaded_at)} 提交<br />
                      {submission.confidence > 0 ? `识别置信度 ${Math.round(submission.confidence * 100)}%` : '识别置信度未记录'}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-warn tabular-nums">{submission.correct_count}</span>
                      <span className="text-xs text-ink-2">/ {submission.graded_count} 题答对</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-surface-3 border border-line overflow-hidden">
                      <div className="h-full bg-ok" style={{ width: `${Math.round(correctRate * 100)}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-ink-3">
                      <span>正确率 {Math.round(correctRate * 100)}%</span>
                      <span>目标：连续 3 次全对</span>
                    </div>
                    <div className="mt-3 inline-flex rounded-full border border-warn-line bg-warn-bg px-2.5 py-1 text-[10px] font-bold text-warn">{submission.status}</div>
                  </div>

                  <div className="w-full max-w-3xl rounded-lg border border-line bg-surface-2 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-surface-3 border-b border-line">
                      <div className="text-xs font-black text-ink">需要看的 {submission.wrong_items.length} 道错题</div>
                      <div className="text-[10px] text-ink-3">逐题错因已按真实归因反查</div>
                    </div>
                    {submission.wrong_items.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-ink-3">本次没有记录错题</div>
                    ) : submission.wrong_items.map((item) => (
                      <div key={item.question_id} className="grid grid-cols-[58px_minmax(0,1fr)] sm:grid-cols-[58px_minmax(0,1fr)_auto] gap-2.5 items-center px-3 py-2 border-b border-line last:border-b-0">
                        <div className="font-mono text-xs font-black text-ink">{item.question_id}<div>{item.expression}</div></div>
                        <div className="min-w-0 text-xs text-ink-2">
                          孩子写 <span className="font-black text-danger">{item.child_answer}</span>
                          <span className="ml-2 text-ink-3">应为 {item.expected}</span>
                          {item.err_note && <div className="mt-0.5 text-[10px] text-ink-3">{item.err_note}</div>}
                        </div>
                        <div className={`justify-self-start sm:justify-self-end whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-bold ${item.err_pattern_id ? 'border-danger-line bg-danger-bg text-danger' : 'border-line bg-surface-3 text-ink-3'}`}>
                          {getPatternName(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {task?.submission && (
                  <div className="mt-3 pt-3 border-t border-dashed border-line-strong flex justify-end">
                    <button
                      type="button"
                      onClick={onGoToReview}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-warn hover:text-ink"
                    >
                      去「批改与复核」看逐题明细 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {task ? (
      <section className="rounded-xl border border-warn-line bg-warn-bg shadow-tok overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-warn-line border-b border-warn-line">
          <span className="w-5 h-5 rounded-md bg-warn text-warn-on text-xs font-black flex items-center justify-center">3</span>
          <h2 className="font-black text-sm text-ink">今天要执行的任务</h2>
          <span className="text-xs text-ink">{task.assignedDate} · 纸笔练习</span>
          <div className="ml-auto flex items-center gap-2">
            {task.isDraft && (
              <span className="rounded-full border border-warn-line bg-warn-bg px-2 py-0.5 text-[10px] font-bold text-warn">
                草稿·未发布
              </span>
            )}
            {getTaskStatusBadge()}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_396px] gap-5 items-start">
            <div>
              <div className="text-[10px] font-mono text-warn">{task.material.worksheetId}</div>
              <h3 className="mt-1 text-lg font-black text-ink">{task.title}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['题量', `${questions.length} 道`],
                  ['建议用时', `约 ${task.estimatedMinutes} 分钟`],
                  ['难度', difficulty],
                  ['出题来源', task.generationMode === 'plan' ? '教学星图计划' : '家长临时定制']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line bg-surface p-2.5">
                    <div className="text-[10px] text-ink-3">{label}</div>
                    <div className="mt-0.5 text-xs font-black text-ink">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePlanGenerate}
                  disabled={isGeneratingPlan}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface text-xs font-bold text-ink hover:bg-surface-3 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                  按计划刷新
                </button>
                <button
                  type="button"
                  onClick={onOpenCustomModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface text-xs font-bold text-ink hover:bg-surface-3"
                >
                  <Sliders className="w-3.5 h-3.5 text-warn" />
                  按需定制
                </button>
              </div>
              <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs">
                <span className="font-semibold text-ink-2">本次奖励</span>
                {isEditingPoints ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={tempPoints}
                      onChange={(event) => setTempPoints(Number(event.target.value))}
                      className="w-16 rounded border border-warn-line bg-surface-2 px-2 py-1 font-bold text-ink"
                    />
                    <button type="button" onClick={() => void handleSavePoints()} className="p-1 rounded bg-warn text-warn-on" title="保存积分">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-black text-warn">+{currentPoints} 积分</span>
                    <button type="button" onClick={() => setIsEditingPoints(true)} className="text-warn" title="家长手工调整本次积分">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="rounded-lg border border-warn-line bg-surface p-3">
                <div className="text-xs font-black text-warn">打印这张卷子</div>
                <div className="mt-0.5 text-[10px] text-ink-2">两种方式，卷面完全一致。按手上的打印机选择。</div>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenPrintModal}
                    className="rounded-lg border border-line bg-surface-2 p-3 text-left hover:border-warn hover:bg-warn-bg transition-colors"
                  >
                    <Printer className="w-5 h-5 text-warn" />
                    <div className="mt-1 text-xs font-black text-ink">下载 PDF</div>
                    <div className="mt-0.5 text-[10px] text-ink-3">连着电脑的打印机</div>
                    <div className="mt-1.5 text-[10px] font-bold text-warn">→ A4 单页</div>
                  </button>
                  <button
                    type="button"
                    onClick={onExportImage}
                    className="rounded-lg border border-line bg-surface-2 p-3 text-left hover:border-warn hover:bg-warn-bg transition-colors"
                  >
                    <ImageDown className="w-5 h-5 text-warn" />
                    <div className="mt-1 text-xs font-black text-ink">下载图片</div>
                    <div className="mt-0.5 text-[10px] text-ink-3">微信打开→蓝牙打印</div>
                    <div className="mt-1.5 text-[10px] font-bold text-warn">→ PNG 2 倍高清</div>
                  </button>
                </div>
              </div>
              <div className="mt-2.5 flex gap-2 rounded-lg border border-dashed border-line-strong bg-surface p-3">
                <Info className="w-4 h-4 text-warn shrink-0" />
                <div className="text-[10px] leading-relaxed text-ink-2">
                  <span className="font-black text-ink">做完不用在这里上传。</span>扫卷首二维码进飞书表单拍照提交，数据直接回流表格，Hermes 自动读取批改。
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ['1', '打印', 'PDF 或图片'],
              ['2', '孩子作答', '铅笔独立完成'],
              ['3', '扫卷首码提交', '飞书表单拍照'],
              ['4', '自动批改', '结果回流首页']
            ].map(([number, title, detail]) => (
              <div key={number} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2">
                <span className="w-4 h-4 rounded-full border border-line bg-surface-3 text-[9px] font-black text-ink-2 flex items-center justify-center shrink-0">{number}</span>
                <div>
                  <div className="text-[10px] font-black text-ink">{title}</div>
                  <div className="text-[9px] text-ink-3">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      ) : (
        <section className="rounded-xl border border-warn-line bg-warn-bg shadow-tok overflow-hidden min-h-[372px]">
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-warn-line border-b border-warn-line">
            <span className="w-5 h-5 rounded-md bg-warn text-warn-on text-xs font-black flex items-center justify-center">3</span>
            <h2 className="font-black text-sm text-ink">今天要执行的任务</h2>
          </div>
          <div className="p-4 sm:p-5 min-h-[320px] flex items-center justify-center">
            <div className="w-full rounded-lg border border-dashed border-line-strong bg-surface p-6 sm:p-8 text-center">
              <h3 className="text-base font-black text-ink">今天还没有已发布的任务</h3>
              <p className="mt-1.5 text-xs text-ink-2">可以先用草稿打印练习，或按需定制一份</p>
              <button
                type="button"
                onClick={handlePlanGenerate}
                disabled={isGeneratingPlan}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-warn px-4 py-2.5 text-xs font-bold text-warn-on hover:bg-warn-line disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                用今日草稿生成练习卷
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="pt-2 border-t border-line text-[10px] leading-relaxed text-ink-3">
        <span className="font-bold text-ink">数据真实性：</span>
        模块一、二全部来自飞书真实进度；模块三为现有今日任务。空白日期表示无学习记录，不填假值。
      </div>
    </div>
  );
};
