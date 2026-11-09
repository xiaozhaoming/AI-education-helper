/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins, Settings, CheckCircle2, Map, Sparkles, BookOpen, Palette, HelpCircle, Zap } from 'lucide-react';
import { ChildProfile, TaskStatus, UIStyleTheme } from '../types';

export type NavTab = 'task' | 'review' | 'map' | 'points';

interface TopNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: ChildProfile;
  taskStatus: TaskStatus;
  onOpenDevModal: () => void;
  onOpenStyleModal: () => void;
  hermesMode: 'mock' | 'hermes_local';
  activeTheme: UIStyleTheme;
  onSelectTheme: (theme: UIStyleTheme) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  taskStatus,
  onOpenDevModal,
  onOpenStyleModal,
  hermesMode,
  activeTheme,
  onSelectTheme
}) => {
  // 依据主题调整顶部视觉细节
  const getBrandIconStyle = () => {
    switch (activeTheme) {
      case 'modern_editorial':
        return 'bg-slate-900 text-white rounded-lg shadow-sm';
      case 'cosmic_explorer':
        return 'bg-gradient-to-tr from-sky-600 to-cyan-400 text-white rounded-2xl shadow-sky-500/20 shadow-lg';
      default:
        return 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-2xl shadow-amber-500/20 shadow-md';
    }
  };

  const getHeaderBg = () => {
    switch (activeTheme) {
      case 'modern_editorial':
        return 'bg-white/95 border-b border-slate-200';
      case 'cosmic_explorer':
        return 'bg-slate-900/95 border-b border-slate-800 text-slate-100 shadow-lg';
      default:
        return 'bg-white/95 border-b border-amber-100/80';
    }
  };

  const isCosmic = activeTheme === 'cosmic_explorer';
  const isEditorial = activeTheme === 'modern_editorial';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md transition-all duration-300 ${getHeaderBg()}`}>
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div
          className="flex items-center gap-3 shrink-0 cursor-pointer"
          onClick={() => onSelectTab('task')}
        >
          <div className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-105 ${getBrandIconStyle()}`}>
            {isCosmic ? <Zap className="w-5 h-5 text-amber-300" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold tracking-tight whitespace-nowrap ${isCosmic ? 'text-white' : 'text-slate-900'}`}>
                {isCosmic ? '嘟嘟思维空间站' : 'AI 家庭学习系统'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                isCosmic ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : isEditorial ? 'bg-slate-100 text-slate-700 font-sans' : 'bg-amber-100 text-amber-800'
              }`}>
                {activeTheme === 'playful_warm' ? '暖橙童趣' : activeTheme === 'modern_editorial' ? '极简工坊' : '太空探索'}
              </span>
            </div>
            <div className={`text-[11px] flex items-center gap-1.5 leading-none ${isCosmic ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className={`font-semibold ${isCosmic ? 'text-slate-200' : 'text-slate-800'}`}>{profile.name}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.grade}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.curriculum}</span>
            </div>
          </div>
        </div>

        {/* 风格切换选择器（三种风格实时 MOCK 试穿切换） */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl border text-xs transition-colors shrink-0 whitespace-nowrap ${
          isCosmic ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-100/90 border-slate-200/80'
        }`}>
          <button
            onClick={onOpenStyleModal}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap ${
              isCosmic ? 'text-cyan-400 hover:text-cyan-200' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="查看三种风格设计说明与对比"
          >
            <Palette className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">风格对比</span>
          </button>

          <button
            onClick={() => onSelectTheme('playful_warm')}
            className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 text-xs shrink-0 whitespace-nowrap ${
              activeTheme === 'playful_warm'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : isCosmic ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="风格 1：温暖童趣绘本风（自然护眼、亲和力强）"
          >
            <span>🌻</span>
            <span className="hidden sm:inline">温暖童趣</span>
          </button>

          <button
            onClick={() => onSelectTheme('modern_editorial')}
            className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 text-xs shrink-0 whitespace-nowrap ${
              activeTheme === 'modern_editorial'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : isCosmic ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="风格 2：现代极简工坊风（北欧克制、印刷品本源）"
          >
            <span>📐</span>
            <span className="hidden sm:inline">极简工坊</span>
          </button>

          <button
            onClick={() => onSelectTheme('cosmic_explorer')}
            className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 text-xs shrink-0 whitespace-nowrap ${
              activeTheme === 'cosmic_explorer'
                ? 'bg-sky-500 text-white shadow-sky-500/30 shadow-xs font-bold'
                : isCosmic ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="风格 3：太空探索空间站（趣味任务、航天充能感）"
          >
            <span>🚀</span>
            <span className="hidden sm:inline">太空探索</span>
          </button>
        </div>

        {/* Zone 2: 4 single-line clean navigation links */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
          <button
            onClick={() => onSelectTab('task')}
            className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'task'
                ? isCosmic
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : isEditorial
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-amber-100 text-amber-950 font-semibold'
                : isCosmic
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>任务与纸笔卷</span>
          </button>
          <button
            onClick={() => onSelectTab('review')}
            className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'review'
                ? isCosmic
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : isEditorial
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-amber-100 text-amber-950 font-semibold'
                : isCosmic
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCosmic ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>批改与复核</span>
            {taskStatus === 'needs_review' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="存在待家长核对题目" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('map')}
            className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'map'
                ? isCosmic
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : isEditorial
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-amber-100 text-amber-950 font-semibold'
                : isCosmic
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Map className={`w-4 h-4 ${isCosmic ? 'text-cyan-400' : 'text-sky-600'}`} />
            <span>知识点星图</span>
          </button>

          <button
            onClick={() => onSelectTab('points')}
            className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'points'
                ? isCosmic
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : isEditorial
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-amber-100 text-amber-950 font-semibold'
                : isCosmic
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Coins className={`w-4 h-4 ${isCosmic ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>成长积分台账</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action & points indicator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            onClick={() => onSelectTab('points')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
              isCosmic
                ? 'bg-slate-800 border-sky-500/40 text-sky-200 hover:bg-slate-700 shadow-sky-500/20 shadow-xs'
                : isEditorial
                ? 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50 font-mono shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-900'
            }`}
            title="点击查看成长积分流水与手工核销"
          >
            {isCosmic ? (
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            ) : (
              <Coins className="w-4 h-4 text-amber-600 fill-amber-300" />
            )}
            <span className="tabular-nums">{profile.pointsBalance}</span>
            <span className={`text-xs font-normal ${isCosmic ? 'text-sky-300' : 'text-slate-500'}`}>
              {isCosmic ? '能量' : '分'}
            </span>
          </div>

          <button
            onClick={onOpenDevModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
              isCosmic
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="配置 Hermes 调度中枢通信与飞书/Obsidian契约"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Hermes</span>
          </button>
        </div>
      </div>
    </header>
  );
};
