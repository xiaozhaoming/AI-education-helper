/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, Sliders, CheckCircle2, Coins, BookOpen } from 'lucide-react';
import { CustomTaskRequest } from '../types';

interface CustomTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateCustom: (req: CustomTaskRequest) => Promise<void>;
}

export const CustomTaskModal: React.FC<CustomTaskModalProps> = ({
  isOpen,
  onClose,
  onGenerateCustom
}) => {
  const [title, setTitle] = useState('数学定制特训：20以内进位加法攻坚卷');
  const [paperType, setPaperType] = useState<'standard_comprehensive' | 'speed_calculation' | 'concept_split'>('standard_comprehensive');
  const [difficulty, setDifficulty] = useState<'normal' | 'advanced' | 'challenge'>('normal');
  const [pointsMultiplier, setPointsMultiplier] = useState(1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onGenerateCustom({
        title,
        knowledgePointId: 'MATH-G1-ADD-CARRY-001',
        paperType,
        difficulty,
        pointsMultiplier
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstQuestionCount = () => {
    if (paperType === 'speed_calculation') return 32;
    if (paperType === 'concept_split') return 16;
    return 24; // standard_comprehensive
  };

  const getEstPoints = () => {
    const base = paperType === 'speed_calculation' ? 32 : 38;
    return Math.round(base * pointsMultiplier);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--c-overlay)] backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-surface rounded-xl shadow-2xl border border-line overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-warn" />
            <h2 className="font-bold text-ink text-base">
              按需定制生成练习卷（临时需求）
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-3 hover:text-ink-2 hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-ink-2">
          {/* 试卷标题 */}
          <div className="space-y-1.5">
            <label className="font-semibold text-ink text-xs">试卷标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-warn focus:bg-surface transition-all"
              placeholder="请输入试卷标题，例如：周末专项口算冲刺卷"
            />
          </div>

          {/* 试卷类型选择 */}
          <div className="space-y-1.5">
            <label className="font-semibold text-ink text-xs">试卷结构与排版类型</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPaperType('standard_comprehensive');
                  setTitle('小学一年级数学：20以内进位加法综合练习卷');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  paperType === 'standard_comprehensive'
                    ? 'bg-warn-bg/80 border-warn-line ring-2 ring-warn/20 text-ink'
                    : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>综合练习卷</span>
                  {paperType === 'standard_comprehensive' && <CheckCircle2 className="w-4 h-4 text-warn" />}
                </div>
                <div className="text-[12px] text-ink-3 mt-1">
                  24题 · 口算+比大小+凑十拆数+应用题 (推荐)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaperType('speed_calculation');
                  setTitle('小学一年级数学：20以内进位加法口算冲刺卡');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  paperType === 'speed_calculation'
                    ? 'bg-warn-bg/80 border-warn-line ring-2 ring-warn/20 text-ink'
                    : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>口算冲刺卡</span>
                  {paperType === 'speed_calculation' && <CheckCircle2 className="w-4 h-4 text-warn" />}
                </div>
                <div className="text-[12px] text-ink-3 mt-1">
                  32题 · 纯口算紧凑 4 列排版，练习计算速度
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaperType('concept_split');
                  setTitle('小学一年级数学：凑十法拆数算理攻坚卷');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  paperType === 'concept_split'
                    ? 'bg-warn-bg/80 border-warn-line ring-2 ring-warn/20 text-ink'
                    : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>拆数算理卷</span>
                  {paperType === 'concept_split' && <CheckCircle2 className="w-4 h-4 text-warn" />}
                </div>
                <div className="text-[12px] text-ink-3 mt-1">
                  16题 · 强化大数想凑十、拆小数思维
                </div>
              </button>
            </div>
          </div>

          {/* 难度与积分倍率 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-ink text-xs">难度系数</label>
              <div className="flex rounded-xl bg-surface-3 p-1 border border-line">
                <button
                  type="button"
                  onClick={() => {
                    setDifficulty('normal');
                    setPointsMultiplier(1.0);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    difficulty === 'normal' ? 'bg-surface text-ink shadow-tok' : 'text-ink-2'
                  }`}
                >
                  标准 (1.0x)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDifficulty('advanced');
                    setPointsMultiplier(1.2);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    difficulty === 'advanced' ? 'bg-surface text-ink shadow-tok' : 'text-ink-2'
                  }`}
                >
                  进阶 (1.2x)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDifficulty('challenge');
                    setPointsMultiplier(1.5);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    difficulty === 'challenge' ? 'bg-surface text-ink shadow-tok' : 'text-ink-2'
                  }`}
                >
                  高挑战 (1.5x)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-ink text-xs">预估题量与奖励积分</label>
              <div className="bg-warn-bg/80 border border-warn-line rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink text-xs">{getEstQuestionCount()} 道题</span>
                  <div className="text-[12px] text-ink-3">满分 100 分</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-warn text-sm flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    +{getEstPoints()} 积分
                  </span>
                  <div className="text-[12px] text-warn">难易题目阶梯赋分</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-2 border border-line rounded-lg p-3 text-[12px] text-ink-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-ink-3 shrink-0" />
            <span>生成后立即替换当前任务，并可直接在今日任务工作台中预览与打印 A4 练习纸。</span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-ink-2 hover:text-ink font-medium"
            >
              取消
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-warn hover:bg-warn-line text-warn-on font-bold shadow-tok transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? '正在排版生成中...' : '立即生成定制练习卷'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};