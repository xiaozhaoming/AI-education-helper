/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { APP_VERSION_LABEL } from '../version';
import { Coins, Settings, CheckCircle2, Map, BookOpen, Sun, Moon } from 'lucide-react';
import { ChildProfile, TaskStatus, ColorScheme, OptionItem, OptionsResponse } from '../types';
import { apiClient } from '../services/apiClient';

export type NavTab = 'task' | 'review' | 'map' | 'points';

interface TopNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: ChildProfile;
  taskStatus?: TaskStatus;
  onOpenDevModal: () => void;
  colorScheme: ColorScheme;
  onToggleColorScheme: () => void;
  grade?: string;
  subject?: string;
  onFilterChange?: (grade: string, subject: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  taskStatus,
  onOpenDevModal,
  colorScheme,
  onToggleColorScheme,
  grade,
  subject,
  onFilterChange
}) => {
  const isDark = colorScheme === 'dark';

  const [grades, setGrades] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const base = apiClient.getConfig().hermesBaseUrl.replace(/\/$/, '');
        const res = await fetch(`${base}/api/options`, { signal: AbortSignal.timeout(5000) });
        const j = (await res.json()) as OptionsResponse;
        if (alive && j?.ok) {
          setGrades(j.grades || []);
          setSubjects(j.subjects || []);
        }
      } catch {
        // 后端不可达时不阻塞顶部导航渲染
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const navBtn = (tab: NavTab, label: string, Icon: React.ElementType, extra?: React.ReactNode) => {
    const active = currentTab === tab;
    return (
      <button
        onClick={() => onSelectTab(tab)}
        aria-current={active ? 'page' : undefined}
        className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
          active
            ? 'bg-accent text-accent-ink border-accent font-semibold'
            : 'text-ink-2 border-transparent hover:text-ink hover:bg-surface-3'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {extra}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-surface/92 border-b border-line no-print">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">

        {/* Zone 1 · 品牌与服务对象 */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => onSelectTab('task')}>
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent text-accent-ink">
            <span className="text-[15px] font-bold tracking-tight leading-none">思</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight whitespace-nowrap text-ink">
                思维空间站
              </span>
              <span
                className="text-[12px] px-1.5 py-0.5 rounded font-mono bg-surface-3 text-ink-3 border border-line"
                title={`版本 ${APP_VERSION_LABEL}`}
              >
                {APP_VERSION_LABEL}
              </span>
            </div>
            <div className="text-[12px] flex items-center gap-1.5 leading-none text-ink-3">
              <span className="font-semibold text-ink-2">{profile.name}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.grade}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.curriculum}</span>
            </div>
          </div>
        </div>

        {/* Zone 2 · 四个单一职责导航项 */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
          {navBtn('task', '任务与纸笔卷', BookOpen)}
          {navBtn(
            'review',
            '批改与复核',
            CheckCircle2,
            taskStatus === 'needs_review' ? (
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" title="存在待家长核对题目" />
            ) : null
          )}
          {navBtn('map', '知识点星图', Map)}
          {navBtn('points', '成长积分台账', Coins)}
        </nav>

        {/* Zone 3 · 明暗切换 + 次要操作 */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          <select
            value={grade}
            onChange={(e) => onFilterChange?.(e.target.value, subject ?? 'Math')}
            aria-label="选择年级"
            className="bg-surface-2 border border-line text-ink-2 text-[12px] rounded-lg px-2 py-1"
          >
            {grades.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>

          <select
            value={subject}
            onChange={(e) => onFilterChange?.(grade ?? 'G1', e.target.value)}
            aria-label="选择学科"
            className="bg-surface-2 border border-line text-ink-2 text-[12px] rounded-lg px-2 py-1"
          >
            {subjects.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* 明暗切换：皮肤唯一入口 */}
          <button
            onClick={onToggleColorScheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line text-xs font-medium text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors whitespace-nowrap shrink-0"
            title={isDark ? '切换到白天（纸墨本源）' : '切换到黑夜（夜工坊）'}
            aria-label="切换明暗皮肤"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isDark ? '白天' : '黑夜'}</span>
          </button>

          <div
            onClick={() => onSelectTab('points')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg border border-line bg-surface-3 text-xs sm:text-sm font-bold text-ink cursor-pointer hover:border-line-strong transition-colors"
            title="点击查看成长积分流水与手工核销"
          >
            <Coins className="w-4 h-4 text-warn" />
            <span className="tabular-nums">{profile.pointsBalance}</span>
            <span className="text-xs font-normal text-ink-3">分</span>
          </div>

          <button
            onClick={onOpenDevModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-line bg-surface-3 text-ink-2 hover:text-ink hover:border-line-strong transition-colors whitespace-nowrap shrink-0"
            title="配置 Hermes 调度中枢通信与飞书/Obsidian 契约"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hermes</span>
          </button>
        </div>
      </div>
    </header>
  );
};
