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
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">暂无上传的作答记录</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          请先在任务中打印 A4 练习卷并由嘟嘟完成纸笔作答，通过飞书表单拍照上传后，这里将呈现分层识别、确定性批改与积分发放明细。
        </p>
        <button
          onClick={onBackToTask}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
        >
          返回今日任务
        </button>
      </div>
    );
  }

  const results = submission.results;
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回任务与试卷工作台</span>
        </button>

        <div className="text-xs text-slate-500 font-mono">
          提交编号: {submission.submissionId} · 关联试卷: {submission.worksheetId}
        </div>
      </div>

      {/* 成绩与成长概览条 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              纸笔作答智能批改报告
            </span>
            {hasPendingConfirmation ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                ⚠️ 检测到涂改模糊 · 待家长核准
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                ✅ 全部题目已核验入账
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {task.title}
          </h1>
          <p className="text-xs text-slate-500">
            作答时间：{new Date(submission.submittedAt).toLocaleString()} · 
            基于真实一年级试卷多题型结构进行分层判定
          </p>
        </div>

        {/* 统计指标 */}
        <div className="flex items-center gap-6 bg-slate-50 border border-slate-200/80 px-6 py-4 rounded-2xl shrink-0">
          <div className="text-center">
            <div className="text-xs text-slate-500">做对题目</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {correctCount} / {totalCount}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <div className="text-xs text-slate-500">正确率</div>
            <div className={`text-2xl font-black tabular-nums ${accuracyRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {accuracyRate}%
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <div className="text-xs text-slate-500">本卷获得积分</div>
            <div className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
              <Coins className="w-5 h-5 text-amber-500 fill-amber-300" />
              <span>+{totalEarnedPoints} 分</span>
            </div>
          </div>
        </div>
      </div>

      {/* 鼓励性儿童评语 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <span className="text-2xl">🌟</span>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-amber-950">
            AI 教学中枢给嘟嘟的鼓励分析：
          </div>
          <p className="text-amber-900/90 leading-relaxed">
            {accuracyRate >= 85
              ? '太厉害了！整份综合练习卷的口算和拆数表现极其扎实，凑十法运用自然流畅，恭喜嘟嘟斩获全部积分！'
              : '答题非常认真！个别比大小或进位处再多看一眼大数想几凑十，多积累积分，线下可以兑换心仪礼物！'}
          </p>
        </div>
      </div>

      {/* 逐题分层批改明细（大屏与笔记本双端多栏响应式） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            全卷 {totalCount} 题识别与判定明细
          </h2>
          <span className="text-xs text-slate-500">
            难易分阶梯：口算 1 分，比大小 2 分，拆数 2 分，应用题 3 分
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
                className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-colors ${
                  r.needsConfirmation
                    ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                    : r.finalCorrect
                    ? 'bg-white border-slate-200'
                    : 'bg-amber-50/40 border-amber-300'
                }`}
              >
                {/* 题号与批改状态 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {r.questionId} · {question.sectionTitle.split('（')[0]}
                    </span>
                    {r.needsConfirmation && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        字迹模糊 ({Math.round(r.recognitionConfidence * 100)}%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      +{r.earnedPoints}/{question.points}分
                    </span>

                    {r.needsConfirmation ? (
                      <span className="text-xs font-bold text-rose-600">待核准</span>
                    ) : r.finalCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        正确
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-bold">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        错误
                      </span>
                    )}
                  </div>
                </div>

                {/* 算式与书写对比 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="text-base font-bold font-mono text-slate-900 truncate">
                    {question.promptText}
                    <span className="text-slate-400">?</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400">手写识别: </span>
                      <strong className="text-slate-800">{r.parentCorrectedAnswer || r.recognizedText}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">标准答案: </span>
                      <strong className="text-emerald-600">{question.standardAnswer}</strong>
                    </div>
                  </div>
                </div>

                {/* 算理解析 */}
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                  {question.thinkingHint}
                </div>

                {/* 错误归因 */}
                {r.errorPatternId && !r.finalCorrect && (
                  <div className="bg-rose-50 rounded-xl p-2.5 border border-rose-100 text-xs space-y-1 text-rose-900">
                    <div className="font-bold flex items-center justify-between text-[11px]">
                      <span>Obsidian 归因: {r.errorPatternId}</span>
                    </div>
                    <p className="text-rose-800/90 text-[10px]">{r.errorExplanation}</p>
                  </div>
                )}

                {/* 家长人工复核修正栏目 */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm font-mono text-center focus:ring-2 focus:ring-amber-500"
                        placeholder="答案"
                      />
                      <button
                        onClick={() => handleSaveCorrection(r, question.standardAnswer)}
                        className="px-3 py-1 bg-amber-500 text-white rounded-lg font-semibold flex items-center gap-1 hover:bg-amber-600 text-xs"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingQuestionId(null)}
                        className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-slate-400">
                        {r.parentCorrectedAnswer
                          ? `已手工核准 (原OCR: ${r.recognizedText})`
                          : `识别置信度: ${Math.round(r.recognitionConfidence * 100)}%`}
                      </span>

                      {r.needsConfirmation ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onConfirmParentCorrection(r.questionId, r.recognizedText, true)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 text-[11px]"
                          >
                            <Check className="w-3 h-3" />
                            识别无误
                          </button>
                          <button
                            onClick={() => startEdit(r)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 text-[11px]"
                          >
                            <Edit3 className="w-3 h-3" />
                            纠正
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(r)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
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
