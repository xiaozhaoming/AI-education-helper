/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Edit3,
  ExternalLink,
  Save,
  ArrowLeft,
  Check,
  Coins
} from 'lucide-react';
import { LearningTask, QuestionSubmissionResult } from '../types';

interface GradingReviewViewProps {
  task: LearningTask;
  onBackToTask: () => void;
  onConfirmParentCorrection: (
    questionId: string,
    correctedAnswer: string,
    confirmedCorrect: boolean
  ) => Promise<void>;
}

export const GradingReviewView: React.FC<GradingReviewViewProps> = ({
  task,
  onBackToTask,
  onConfirmParentCorrection
}) => {
  const submission = task.submission;
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  if (!submission) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-warn-bg flex items-center justify-center text-warn">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-ink">暂无上传的作答记录</h2>
        <p className="text-sm text-ink-3 max-w-md mx-auto">
          请先在任务中打印 A4 练习卷并由孩子完成纸笔作答，通过飞书表单拍照上传后，这里将呈现分层识别、确定性批改与积分发放明细。
        </p>
        <button
          onClick={onBackToTask}
          className="px-5 py-2.5 rounded-xl bg-surface text-ink text-xs font-bold hover:bg-surface-3 transition-colors shadow-tok"
        >
          返回今日任务
        </button>
      </div>
    );
  }

  const results = submission.results;

  // 分值阶梯按本卷真实 points 汇总，避免写死「口算1分/比大小2分/应用题3分」与实际卷面矛盾
  const scoreTiers = (() => {
    const bySection = new Map<string, { title: string; points: Set<number> }>();
    for (const q of task.material.questions) {
      const key = q.section || 'default';
      if (!bySection.has(key)) {
        bySection.set(key, { title: (q.sectionTitle || '').split('（')[0] || '题目', points: new Set() });
      }
      bySection.get(key)!.points.add(q.points);
    }
    return [...bySection.values()]
      .map((v) => `${v.title} ${[...v.points].join('/')} 分`)
      .join('，');
  })();
  const correctCount = results.filter(r => r.finalCorrect).length;
  const totalCount = results.length;
  const accuracyRate = Math.round((correctCount / totalCount) * 100);
  const hasPendingConfirmation = results.some(r => r.needsConfirmation);
  const totalEarnedPoints = results.reduce((sum, r) => sum + r.earnedPoints, 0);

  const startEdit = (item: QuestionSubmissionResult) => {
    setEditingQuestionId(item.questionId);
    setManualInput(item.recognizedText);
  };

  const handleSaveCorrection = async (item: QuestionSubmissionResult, qStandard: string | number) => {
    const isCorrect = manualInput.trim() === String(qStandard);
    await onConfirmParentCorrection(item.questionId, manualInput.trim(), isCorrect);
    setEditingQuestionId(null);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 顶部导航与操作 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToTask}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink bg-surface border border-line px-3.5 py-2 rounded-xl transition-colors shadow-tok"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回任务与试卷工作台</span>
        </button>

        <div className="text-xs text-ink-3 font-mono">
          提交编号: {submission.submissionId} · 关联试卷: {submission.worksheetId}
        </div>
      </div>

      {/* 成绩与成长概览条 */}
      <div className="bg-surface rounded-xl border border-line p-6 sm:p-8 shadow-tok flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-warn">
              纸笔作答智能批改报告
            </span>
            {hasPendingConfirmation ? (
              <span className="px-2.5 py-0.5 rounded-full bg-danger-bg text-danger text-[12px] font-bold">
                ⚠️ 检测到涂改模糊 · 待家长核准
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-ok-bg text-ok text-[12px] font-bold">
                ✅ 全部题目已核验入账
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
            {task.title}
          </h1>
          <p className="text-xs text-ink-3">
            作答时间：{new Date(submission.submittedAt).toLocaleString()} · 
            基于真实一年级试卷多题型结构进行分层判定
          </p>
        </div>

        {/* 统计指标 */}
        <div className="flex items-center gap-6 bg-surface-2 border border-line px-6 py-4 rounded-lg shrink-0">
          <div className="text-center">
            <div className="text-xs text-ink-3">做对题目</div>
            <div className="text-2xl font-black text-ink tabular-nums">
              {correctCount} / {totalCount}
            </div>
          </div>
          <div className="w-px h-8 bg-surface-3" />
          <div className="text-center">
            <div className="text-xs text-ink-3">正确率</div>
            <div className={`text-2xl font-black tabular-nums ${accuracyRate >= 80 ? 'text-ok' : 'text-warn'}`}>
              {accuracyRate}%
            </div>
          </div>
          <div className="w-px h-8 bg-surface-3" />
          <div className="text-center">
            <div className="text-xs text-ink-3">本卷获得积分</div>
            <div className="text-2xl font-black text-warn flex items-center justify-center gap-1">
              <Coins className="w-5 h-5 text-warn fill-warn" />
              <span>+{totalEarnedPoints} 分</span>
            </div>
          </div>
        </div>
      </div>

      {/* 鼓励性儿童评语 */}
      <div className="bg-gradient-to-r from-warn-bg to-warn-bg border border-warn-line rounded-lg p-4 sm:p-5 flex items-start gap-3">
        <span className="text-2xl">🌟</span>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-warn">
            AI 教学中枢给出的鼓励分析：
          </div>
          <p className="text-warn leading-relaxed">
            {accuracyRate >= 85
              ? '太厉害了！整份综合练习卷的口算和拆数表现极其扎实，凑十法运用自然流畅，恭喜斩获全部积分！'
              : '答题非常认真！个别比大小或进位处再多看一眼大数想几凑十，多积累积分，线下可以兑换心仪礼物！'}
          </p>
        </div>
      </div>

      {/* 逐题分层批改明细（大屏与笔记本双端多栏响应式） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">
            全卷 {totalCount} 题识别与判定明细
          </h2>
          <span className="text-xs text-ink-3">
            按题目难度分阶：{scoreTiers}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((r) => {
            const question = task.material.questions.find(q => q.questionId === r.questionId);
            if (!question) return null;

            const isEditing = editingQuestionId === r.questionId;

            return (
              <div
                key={r.questionId}
                className={`rounded-lg border p-4 sm:p-5 space-y-3 transition-colors ${
                  r.needsConfirmation
                    ? 'bg-danger-bg/40 border-danger-line ring-1 ring-danger-line'
                    : r.finalCorrect
                    ? 'bg-surface border-line'
                    : 'bg-warn-bg/40 border-warn-line'
                }`}
              >
                {/* 题号与批改状态 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-ink-3">
                      {r.questionId} · {question.sectionTitle.split('（')[0]}
                    </span>
                    {r.needsConfirmation && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-bg text-danger text-[12px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {r.recognitionConfidence < 0.85
                          ? `识别置信度偏低 (${Math.round(r.recognitionConfidence * 100)}%)`
                          : '判定待人工确认'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-warn bg-warn-bg px-2 py-0.5 rounded-md border border-warn-line">
                      +{r.earnedPoints}/{question.points}分
                    </span>

                    {r.needsConfirmation ? (
                      <span className="text-xs font-bold text-danger">待核准</span>
                    ) : r.finalCorrect ? (
                      <span className="inline-flex items-center gap-1 text-ok text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-ok" />
                        正确
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-danger text-xs font-bold">
                        <XCircle className="w-4 h-4 text-danger" />
                        错误
                      </span>
                    )}
                  </div>
                </div>

                {/* 算式与书写对比 */}
                <div className="bg-surface-2 p-3 rounded-xl border border-line space-y-1.5">
                  <div className="text-base font-bold font-mono text-ink truncate">
                    {question.promptText}
                    <span className="text-ink-3">?</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-line">
                    <div>
                      <span className="text-[12px] text-ink-3">手写识别: </span>
                      <strong className="text-ink">{r.parentCorrectedAnswer || r.recognizedText}</strong>
                    </div>
                    <div>
                      <span className="text-[12px] text-ink-3">标准答案: </span>
                      <strong className="text-ok">{question.standardAnswer}</strong>
                    </div>
                  </div>
                </div>

                {/* 算理解析 */}
                <div className="text-[12px] text-ink-2 bg-surface p-2.5 rounded-lg border border-line">
                  {question.thinkingHint}
                </div>

                {/* 错误归因 */}
                {r.errorPatternId && !r.finalCorrect && (
                  <div className="bg-danger-bg rounded-xl p-2.5 border border-danger-line text-xs space-y-1 text-danger">
                    <div className="font-bold flex items-center justify-between text-[12px]">
                      <span>Obsidian 归因: {r.errorPatternId}</span>
                    </div>
                    <p className="text-danger text-[12px]">{r.errorExplanation}</p>
                  </div>
                )}

                {/* 家长人工复核修正栏目 */}
                <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        className="w-20 px-2 py-1 border border-line-strong rounded-lg text-sm font-mono text-center focus:ring-2 focus:ring-warn"
                        placeholder="答案"
                      />
                      <button
                        onClick={() => handleSaveCorrection(r, question.standardAnswer)}
                        className="px-3 py-1 bg-warn text-warn-on rounded-lg font-semibold flex items-center gap-1 hover:bg-warn-line text-xs"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingQuestionId(null)}
                        className="px-2 py-1 text-ink-3 hover:text-ink-2 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[12px] text-ink-3">
                        {r.parentCorrectedAnswer
                          ? `已手工核准 (原OCR: ${r.recognizedText})`
                          : `识别置信度: ${Math.round(r.recognitionConfidence * 100)}%`}
                      </span>

                      {r.needsConfirmation ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onConfirmParentCorrection(r.questionId, r.recognizedText, true)}
                            className="px-2.5 py-1 bg-ok hover:bg-ok-line text-ok-on rounded-lg font-bold flex items-center gap-1 text-[12px]"
                          >
                            <Check className="w-3 h-3" />
                            识别无误
                          </button>
                          <button
                            onClick={() => startEdit(r)}
                            className="px-2.5 py-1 bg-surface-3 hover:bg-surface-3 text-ink-2 rounded-lg font-medium flex items-center gap-1 text-[12px]"
                          >
                            <Edit3 className="w-3 h-3" />
                            纠正
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(r)}
                          className="text-[12px] text-ink-3 hover:text-ink-2 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          复核修改
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};