/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, Check, Palette, Rocket, BookOpen, Compass } from 'lucide-react';
import { UIStyleTheme } from '../types';

interface StyleShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: UIStyleTheme;
  onSelectTheme: (theme: UIStyleTheme) => void;
}

export const StyleShowcaseModal: React.FC<StyleShowcaseModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  if (!isOpen) return null;

  const STYLES = [
    {
      id: 'playful_warm' as UIStyleTheme,
      name: '风格 1：温暖童趣绘本风 (Warm Montessori)',
      tag: '亲和护眼 · 儿童首选',
      icon: '🌻',
      description: '采用护眼暖阳橙与柔和奶白，搭配圆润弧度与手作质感，消除低年级孩子对算术的紧绷感，营造如翻阅精美课外绘本般的愉悦学习体验。',
      colors: ['#F59E0B', '#FB923C', '#FFFBEB', '#78350F'],
      previewBorder: 'border-amber-300',
      previewBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      accentLabel: '温暖阳光 · 陪伴激励'
    },
    {
      id: 'modern_editorial' as UIStyleTheme,
      name: '风格 2：现代极简工坊风 (Modern Editorial)',
      tag: '理性克制 · 真实纸质',
      icon: '📐',
      description: '汲取瑞士平面排印与北欧工坊美学，极度克制的黑白灰调与精密发丝细分割线，还原线下真实白纸黑字高密度印刷质感，专注纯粹算理。',
      colors: ['#0F172A', '#475569', '#F8FAFC', '#E2E8F0'],
      previewBorder: 'border-slate-300',
      previewBg: 'bg-gradient-to-br from-white to-slate-100',
      accentLabel: '极简纸感 · 排印层次'
    },
    {
      id: 'cosmic_explorer' as UIStyleTheme,
      name: '风格 3：太空探索空间站 (Cosmic Mission Control)',
      tag: '航天探索 · 趣味充能',
      icon: '🚀',
      description: '专为怀揣航天梦想的小朋友定制！深邃星空青蓝搭配思维能量晶石，把“做题”变为“空间站思维燃料充能”，每一次落笔都在推进星系航行。',
      colors: ['#0284C7', '#38BDF8', '#0F172A', '#E0F2FE'],
      previewBorder: 'border-sky-400',
      previewBg: 'bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white',
      accentLabel: '太空仪表 · 能量任务'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                选择你喜欢的 UI 视觉风格（共 3 款定制风格）
              </h2>
              <p className="text-[11px] text-slate-500">
                可实时一键切换整套系统的色彩意象、布局卡片、排版质感与按钮样式
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: 3 Styles Cards */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STYLES.map((style) => {
              const isSelected = currentTheme === style.id;

              return (
                <div
                  key={style.id}
                  onClick={() => onSelectTheme(style.id)}
                  className={`rounded-3xl border-2 p-5 transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/20 shadow-md ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs bg-white'
                  }`}
                >
                  <div className="space-y-4">
                    {/* 样式微缩模拟窗 */}
                    <div className={`w-full h-36 rounded-2xl p-3 border ${style.previewBorder} ${style.previewBg} overflow-hidden relative shadow-inner flex flex-col justify-between`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{style.icon}</span>
                          <span className="text-xs font-bold truncate max-w-[120px]">
                            {style.id === 'cosmic_explorer' ? '🚀 嘟嘟指挥舱' : '📚 嘟嘟学习桌'}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-slate-800 font-mono shadow-2xs">
                          {style.id === 'cosmic_explorer' ? '⚡ 125 能量' : '🪙 125 积分'}
                        </span>
                      </div>

                      {/* 模拟题目条目 */}
                      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs rounded-xl p-2 border border-black/5 text-[10px] space-y-1">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex justify-between">
                          <span>9 + 4 = [ ? ]</span>
                          <span className="text-emerald-600 font-mono">10+3=13</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-amber-500 rounded-full" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] opacity-75">
                        <span>A4 纸笔印刷就绪</span>
                        <span>{style.accentLabel}</span>
                      </div>
                    </div>

                    {/* 风格详情与色卡 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {style.name.split('：')[1]}
                        </h3>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {style.tag}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed min-h-[56px]">
                        {style.description}
                      </p>

                      {/* 色板色环 */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400">核心基调:</span>
                        {style.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 选中按钮 */}
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>当前正在使用</span>
                        </>
                      ) : (
                        <span>切换为该风格</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-between">
            <span>
              💡 <strong>提示：</strong>选择任一风格后，系统将自动记住您的偏好。您随时可在界面顶部切换。
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
            >
              完成挑选
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
