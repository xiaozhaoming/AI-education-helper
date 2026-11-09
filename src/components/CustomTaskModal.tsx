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
  const [title, setTitle] = useState('嘟嘟数学定制特训：20以内进位加法攻坚卷');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-base">
              按需定制生成练习卷（临时需求）
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* 试卷标题 */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 text-xs">试卷标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              placeholder="请输入试卷标题，例如：嘟嘟周末专项口算冲刺卷"
            />
          </div>

          {/* 试卷类型选择 */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 text-xs">试卷结构与排版类型</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPaperType('standard_comprehensive');
                  setTitle('小学一年级数学：20以内进位加法综合练习卷');
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  paperType === 'standard_comprehensive'
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>综合练习卷</span>
                  {paperType === 'standard_comprehensive' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  24题 · 口算+比大小+凑十拆数+应用题 (推荐)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaperType('speed_calculation');
                  setTitle('小学一年级数学：20以内进位加法口算冲刺卡');
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  paperType === 'speed_calculation'
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>口算冲刺卡</span>
                  {paperType === 'speed_calculation' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  32题 · 纯口算紧凑 4 列排版，练习计算速度
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaperType('concept_split');
                  setTitle('小学一年级数学：凑十法拆数算理攻坚卷');
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  paperType === 'concept_split'
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>拆数算理卷</span>
                  {paperType === 'concept_split' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  16题 · 强化大数想凑十、拆小数思维
                </div>
              </button>
            </div>
          </div>

          {/* 难度与积分倍率 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 text-xs">难度系数</label>
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setDifficulty('normal');
                    setPointsMultiplier(1.0);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    difficulty === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
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
                    difficulty === 'advanced' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
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
                    difficulty === 'challenge' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  高挑战 (1.5x)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 text-xs">预估题量与奖励积分</label>
              <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-xs">{getEstQuestionCount()} 道题</span>
                  <div className="text-[10px] text-slate-500">满分 100 分</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-700 text-sm flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    +{getEstPoints()} 积分
                  </span>
                  <div className="text-[10px] text-amber-600">难易题目阶梯赋分</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-[11px] text-slate-500 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <span>生成后立即替换当前任务，并可直接在今日任务工作台中预览与打印 A4 练习纸。</span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              取消
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs transition-colors flex items-center gap-2"
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
