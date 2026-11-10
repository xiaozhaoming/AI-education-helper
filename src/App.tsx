/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { TopNavBar, NavTab } from './components/TopNavBar';
import { DailyTaskView } from './components/DailyTaskView';
import { PrintWorksheetModal } from './components/PrintWorksheetModal';
import { GradingReviewView } from './components/GradingReviewView';
import { MasteryMapView } from './components/MasteryMapView';
import { PointsLedgerView } from './components/PointsLedgerView';
import { CustomTaskModal } from './components/CustomTaskModal';
import { HermesDevModal } from './components/HermesDevModal';
import { apiClient, HermesConnectionConfig } from './services/apiClient';
import { ChildProfile, LearningTask, KnowledgePointNode, PointTransaction, CustomTaskRequest, ColorScheme, ProgressSummary } from './types';

const PRINT_TOKENS: Record<string, string> = {
  '--c-canvas': '#FFFFFF',
  '--c-surface': '#FFFFFF',
  '--c-surface-2': '#F8F8F4',
  '--c-surface-3': '#F0F0E9',
  '--c-ink': '#111827',
  '--c-ink-2': '#4B5563',
  '--c-ink-3': '#585F71',
  '--c-ink-4': '#5F6775',
  '--c-line': '#BEBEAE',
  '--c-line-strong': '#AAAA98',
  '--c-accent': '#111827',
  '--c-accent-ink': '#FFFFFF',
  '--c-accent-soft': '#EDEDE8',
  '--c-accent-panel': '#111827',
  '--c-accent-panel-ink': '#F7F8FA',
  '--c-ok': '#2C7250',
  '--c-ok-bg': '#E8F2EC',
  '--c-ok-line': '#5C8A72',
  '--c-ok-on': '#FFFFFF',
  '--c-warn': '#8A5609',
  '--c-warn-bg': '#F8EFE0',
  '--c-warn-line': '#A97A30',
  '--c-warn-on': '#FFFFFF',
  '--c-danger': '#A63A2C',
  '--c-danger-bg': '#F7E8E5',
  '--c-danger-line': '#B87362',
  '--c-danger-on': '#FFFFFF',
  '--c-info': '#2B5A8C',
  '--c-info-bg': '#E7EEF6',
  '--c-info-line': '#6486B0',
  '--c-info-on': '#FFFFFF',
  '--c-shadow': 'none',
  '--c-shadow-lg': 'none',
  '--c-ring': 'rgba(17, 24, 39, 0.18)',
  '--c-overlay': 'rgba(17, 24, 39, 0.42)',
};

const COLOR_PROPS = [
  'color', 'background-color', 'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'outline-color',
  'text-decoration-color', 'fill', 'stroke', 'caret-color',
] as const;

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

/** 浏览器 Canvas 无法解析现代色彩函数时，把 oklab/oklch 近似换算成 sRGB。 */
const approximateToSrgb = (modern: string): string | null => {
  const match = modern.match(/^(oklab|oklch)\((.*)\)$/i);
  if (!match) return null;

  const [channelPart, alphaPart] = match[2].split('/');
  const channels = channelPart.trim().split(/\s+/);
  if (channels.length !== 3) return null;

  const parseChannel = (token: string, percentageScale: number) => {
    const raw = Number.parseFloat(token);
    return token.includes('%') ? raw / 100 * percentageScale : raw;
  };
  const parseHue = (token: string) => {
    const raw = Number.parseFloat(token);
    if (token.endsWith('rad')) return raw;
    if (token.endsWith('turn')) return raw * 2 * Math.PI;
    if (token.endsWith('grad')) return raw * Math.PI / 200;
    return raw * Math.PI / 180;
  };

  const lightness = parseChannel(channels[0], 1);
  let a: number;
  let b: number;
  if (match[1].toLowerCase() === 'oklch') {
    const chroma = parseChannel(channels[1], 0.4);
    const hue = parseHue(channels[2]);
    a = chroma * Math.cos(hue);
    b = chroma * Math.sin(hue);
  } else {
    a = parseChannel(channels[1], 0.4);
    b = parseChannel(channels[2], 0.4);
  }
  if (![lightness, a, b].every(Number.isFinite)) return null;

  const l_ = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = lightness - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const linearR = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const linearG = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const linearB = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toSrgb = (value: number) => {
    const linear = clampUnit(value);
    const channel = linear <= 0.0031308
      ? 12.92 * linear
      : 1.055 * linear ** (1 / 2.4) - 0.055;
    return Math.round(clampUnit(channel) * 255);
  };

  let alpha = 1;
  if (alphaPart) {
    const rawAlpha = alphaPart.trim();
    const parsed = Number.parseFloat(rawAlpha);
    alpha = clampUnit(rawAlpha.includes('%') ? parsed / 100 : parsed);
  }
  if (!Number.isFinite(alpha)) return null;

  return `rgba(${toSrgb(linearR)}, ${toSrgb(linearG)}, ${toSrgb(linearB)}, ${alpha})`;
};

/** 用 1×1 Canvas 让浏览器归一化现代颜色，并通过像素采样保留 alpha。 */
const toRgba = (modern: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const sentinel = '#000';

  context.fillStyle = sentinel;
  const sentinelValue = context.fillStyle;
  context.fillStyle = modern;

  if (context.fillStyle === sentinelValue) {
    const fallback = approximateToSrgb(modern);
    if (!fallback) {
      console.warn(`无法归一化现代颜色：${modern}`);
      throw new Error(`浏览器无法解析颜色 ${modern}`);
    }
    console.warn(`Canvas 无法解析现代颜色，已近似换算：${modern} → ${fallback}`);
    context.fillStyle = fallback;
  }

  context.clearRect(0, 0, 1, 1);
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(3))})`;
};

const normalizeModernColors = (root: HTMLElement) => {
  const originals: Array<{ el: HTMLElement; prop: string; value: string; priority: string }> = [];
  const isModern = (value: string) => /oklab|oklch|color\(/i.test(value);
  const restore = () => {
    originals.forEach(({ el, prop, value, priority }) => {
      if (value) {
        el.style.setProperty(prop, value, priority);
      } else {
        el.style.removeProperty(prop);
      }
    });
  };

  const visit = (el: HTMLElement) => {
    const computed = getComputedStyle(el);
    for (const prop of COLOR_PROPS) {
      const value = computed.getPropertyValue(prop);
      if (value && isModern(value)) {
        originals.push({
          el,
          prop,
          value: el.style.getPropertyValue(prop),
          priority: el.style.getPropertyPriority(prop),
        });
        el.style.setProperty(prop, toRgba(value), 'important');
      }
    }
  };

  try {
    visit(root);
    root.querySelectorAll<HTMLElement>('*').forEach(visit);
  } catch (error) {
    restore();
    throw error;
  }

  return restore;
};

/**
 * html2canvas 不解析 @media print，卷面上的 print:border-none 对图片导出无效。
 * 导出前把根容器的边框/圆角/阴影内联清零，导出后由调用方在 finally 还原。
 * 只改传入的这个根节点，不碰全局 documentElement。
 */
const stripExportBorder = (root: HTMLElement): (() => void) => {
  const target = root as HTMLElement;
  const prev = {
    border: target.style.border,
    borderRadius: target.style.borderRadius,
    boxShadow: target.style.boxShadow,
  };
  target.style.border = 'none';
  target.style.borderRadius = '0';
  target.style.boxShadow = 'none';
  return () => {
    target.style.border = prev.border;
    target.style.borderRadius = prev.borderRadius;
    target.style.boxShadow = prev.boxShadow;
  };
};

const waitForExportRoot = async (): Promise<HTMLElement> => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const exportRoot = document.querySelector<HTMLElement>('[data-export-root]');
    if (exportRoot) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return document.querySelector<HTMLElement>('[data-export-root]') ?? exportRoot;
    }
  }
  throw new Error('未找到 A4 卷面');
};

export default function App() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('dudu_color_scheme') as ColorScheme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    // 没存过就跟随系统
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('task');
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [task, setTask] = useState<LearningTask | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePointNode[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [config, setConfig] = useState<HermesConnectionConfig>(apiClient.getConfig());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [grade, setGrade] = useState<string>(() => localStorage.getItem('dudu_grade') || 'G1');
  const [subject, setSubject] = useState<string>(() => localStorage.getItem('dudu_subject') || 'Math');

  // 皮肤落到 <html class="dark">，CSS 变量随之翻转
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', colorScheme === 'dark');
    localStorage.setItem('dudu_color_scheme', colorScheme);
  }, [colorScheme]);

  const handleToggleColorScheme = () => {
    setColorScheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      root_toggle_hint(next);
      return next;
    });
  };

  /** 只负责提示，类名与持久化由上面的 effect 统一处理 */
  const root_toggle_hint = (next: ColorScheme) => {
    showToast(next === 'dark' ? '🌙 已切换：夜工坊（深墨蓝）' : '☀️ 已切换：纸墨本源（印刷暖白）');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  /** 统一读取；Hermes 模式下失败必须暴露，不许静默用假数据 */
  const refreshData = async (nextGrade?: string, nextSubject?: string) => {
    const gradeToUse = nextGrade ?? grade;
    const subjectToUse = nextSubject ?? subject;
    try {
      const p = await apiClient.getChildProfile();
      setProfile(p);

      // 今日任务缺失只影响模块三，不能阻断孩子档案与学习进度。
      const t = await apiClient.getTodayTask().catch(() => null);
      setTask(t);

      const kp = await apiClient.getKnowledgePoints(`?grade=${gradeToUse}&subject=${subjectToUse}`);
      const tx = await apiClient.getPointTransactions();
      setKnowledgePoints(kp);
      setTransactions(tx);
      setLoadError(null);
      return { ok: true as const };
    } catch (e) {
      const msg = (e as Error).message || '未知错误';
      setLoadError(msg);
      // 不保留旧的假数据：清空，让 UI 如实显示不可用
      setProfile(null);
      setTask(null);
      setKnowledgePoints([]);
      setTransactions([]);
      return { ok: false as const, error: msg };
    }
  };

  /** 进度接口独立请求；失败只影响首页模块一、二，不用任何假数据兜底 */
  const refreshProgress = async () => {
    setProgressLoading(true);
    try {
      const data = await apiClient.fetchProgress(30);
      setProgress(data);
      setProgressError(null);
    } catch (e) {
      setProgress(null);
      setProgressError((e as Error).message || '未知错误');
    } finally {
      setProgressLoading(false);
    }
  };

  const handleFilterChange = (nextGrade: string, nextSubject: string) => {
    localStorage.setItem('dudu_grade', nextGrade);
    localStorage.setItem('dudu_subject', nextSubject);
    setGrade(nextGrade);
    setSubject(nextSubject);
    refreshData(nextGrade, nextSubject);
  };

  // 首次载入：若后端可达则自动切到本地模式（真实数据优先）
  useEffect(() => {
    (async () => {
      const cfg = apiClient.getConfig();
      if (cfg.mode !== 'hermes_local') {
        try {
          const base = cfg.hermesBaseUrl.replace(/\/$/, '');
          const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
          const j = await res.json();
          if (res.ok && j?.ok) {
            apiClient.updateConfig({ mode: 'hermes_local' });
            setConfig(apiClient.getConfig());
            showToast('🔗 已检测到本地 Hermes 服务，自动切换为真实数据模式');
          }
        } catch {
          // 后端没起来：保持沙箱，但明确告知
          showToast('⚠️ 未检测到 http://localhost:8000，当前为沙箱演示数据');
        }
      }
      await refreshData();
      await refreshProgress();
    })();
  }, []);

  const handleRealUpload = async (file: File) => {
    try {
      const { task: updated, backend } = await apiClient.submitPhotoReal(file);
      setTask(updated);
      await refreshData();
      const s = backend?.graded?.summary;
      const mastery = backend?.mastery;
      showToast(
        `📸 已识别 ${s?.recognized ?? 0} 题：正确 ${s?.correct ?? 0}、错误 ${s?.wrong ?? 0}、` +
        `待核对 ${s?.gated ?? 0}。掌握度：${mastery?.state ?? '未更新'}`
      );
      setCurrentTab('review');
    } catch (e) {
      showToast(`❌ 上传失败：${(e as Error).message}`);
      await refreshData();
    }
  };

  const handleSimulateUpload = async (mode: 'perfect' | 'low_confidence' | 'error') => {
    const updatedTask = await apiClient.submitPhotoSimulation({
      hasLowConfidence: mode === 'low_confidence',
      hasError: mode === 'error'
    });
    setTask(updatedTask);
    await refreshData();

    if (mode === 'perfect') {
      showToast(`🎉 飞书表单拍照上传成功！全部题目高置信度通过批改，获得 ${updatedTask.customRewardPoints ?? updatedTask.defaultRewardPoints} 积分！`);
      setCurrentTab('review');
    } else if (mode === 'low_confidence') {
      showToast('⚠️ 飞书表单拍照上传完成！检测到第 2 题字迹涂改，已自动转入待家长核对。');
      setCurrentTab('review');
    } else {
      showToast('📝 飞书表单拍照上传完成！检测到算理错误，已自动关联 Obsidian 易错模式归因。');
      setCurrentTab('review');
    }
  };

  // v1.6.3 的「批改与复核」页将重新接入上传流程；函数本体保留，首页不再传参。
  void handleSimulateUpload;
  void handleRealUpload;

  const handleConfirmParentCorrection = async (
    questionId: string,
    correctedAnswer: string,
    confirmedCorrect: boolean
  ) => {
    const updatedTask = await apiClient.confirmParentReview(questionId, correctedAnswer, confirmedCorrect);
    setTask(updatedTask);
    await refreshData();
    showToast(`✅ 已核准第 ${questionId} 题手写答案为“${correctedAnswer}”，积分已入账！`);
  };

  const handleGeneratePlanTask = async () => {
    const newTask = await apiClient.generatePlanTask();
    setTask(newTask);
    await refreshData();
    showToast('📅 已根据星图教学大纲重新生成今日综合计划卷！');
  };

  const handleGenerateCustomTask = async (req: CustomTaskRequest) => {
    const newTask = await apiClient.generateCustomTask(req);
    setTask(newTask);
    await refreshData();
    showToast(`✨ 已为您生成定制试卷：《${req.title}》，可直接打印！`);
  };

  const handleUpdateRewardPoints = async (newPts: number) => {
    const updated = await apiClient.updateTaskRewardPoints(newPts);
    setTask(updated);
    showToast(`🪙 本次任务奖励积分已手工调整为：${newPts} 分`);
  };

  const handleSpendPoints = async (amount: number, reason: string) => {
    await apiClient.spendPoints(amount, reason);
    await refreshData();
    showToast(`🎁 线下物理奖励兑换成功：已手工扣减 -${amount} 积分！`);
  };

  const handleAddPoints = async (amount: number, reason: string) => {
    await apiClient.addPoints(amount, reason);
    await refreshData();
    showToast(`🌟 家长手工奖励：+${amount} 积分已增加！`);
  };

  const handlePrinted = async () => {
    if (task && task.status === 'pending_print') {
      const updated = await apiClient.markTaskInProgress();
      setTask(updated);
    }
    showToast(`🖨️ 系统打印已触发！请交由${profile?.name || '孩子'}脱离屏幕用铅笔独立作答。`);
  };

  const handleExportImage = async () => {
    if (!task) {
      showToast('图片导出失败：暂无练习卷');
      return;
    }
    if (isExportingImage) return;

    setIsExportingImage(true);
    showToast('🖼️ 正在生成 PNG 2 倍高清图片…');

    try {
      setIsPrintModalOpen(true);
      const exportRoot = await waitForExportRoot();
      const worksheetId = exportRoot.dataset.exportWorksheetId || task.material.worksheetId;
      const root = document.documentElement;
      const previousTokenStyles = new Map<string, { value: string; priority: string }>();

      Object.entries(PRINT_TOKENS).forEach(([token, value]) => {
        previousTokenStyles.set(token, {
          value: root.style.getPropertyValue(token),
          priority: root.style.getPropertyPriority(token),
        });
        root.style.setProperty(token, value);
      });

      try {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const restoreColors = normalizeModernColors(exportRoot);
        // 导出前临时去掉卡片边框与圆角：html2canvas 不读 @media print，
        // 卷面上的 print:border-none 对图片导出无效，实测导出图四周有 2px 灰边
        const restoreBorder = stripExportBorder(exportRoot);
        let canvas: HTMLCanvasElement;
        try {
          canvas = await html2canvas(exportRoot, {
            backgroundColor: '#FFFFFF',
            scale: 2,
            useCORS: true,
            logging: false,
          });
        } finally {
          restoreColors();
          restoreBorder();
        }
        const imageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });
        if (!imageBlob) throw new Error('Canvas 转 PNG 失败');

        const downloadUrl = URL.createObjectURL(imageBlob);
        try {
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = `练习卷-${worksheetId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
        } finally {
          URL.revokeObjectURL(downloadUrl);
        }
        showToast('🖼️ PNG 2 倍高清图片已导出');
      } finally {
        previousTokenStyles.forEach(({ value, priority }, token) => {
          if (value) {
            root.style.setProperty(token, value, priority);
          } else {
            root.style.removeProperty(token);
          }
        });
      }
    } catch (e) {
      const reason = (e as Error).message || '未知错误';
      showToast(`图片导出失败：${reason}`);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleUpdateConfig = (newCfg: Partial<HermesConnectionConfig>) => {
    apiClient.updateConfig(newCfg);
    setConfig(apiClient.getConfig());
    showToast('⚙️ Hermes 运行配置已保存');
  };

  const handleResetDemo = () => {
    apiClient.resetToDefaultDemo();
    refreshData();
    showToast('🔄 已重置为出厂演示状态');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col items-center justify-center px-6 text-center gap-4">
        {loadError ? (
          <>
            <div className="text-3xl">🔌</div>
            <div className="text-ink font-bold text-base">无法读取孩子档案</div>
            <div className="text-ink-3 text-xs max-w-xl leading-relaxed font-mono break-all">
              {loadError}
            </div>
            <div className="text-ink-3 text-xs max-w-xl leading-relaxed">
              请确认后端已启动：<span className="font-mono">cd AI家庭学习系统/app &amp;&amp; .venv/bin/python3.12 server.py</span>
              <br />
              当前后端地址：<span className="font-mono">{config.hermesBaseUrl}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => refreshData()}
                className="px-4 py-2 rounded-xl bg-surface-3 text-ink text-xs font-semibold hover:bg-surface-3"
              >
                重试
              </button>
              <button
                onClick={() => {
                  apiClient.updateConfig({ mode: 'mock' });
                  setConfig(apiClient.getConfig());
                  setLoadError(null);
                  refreshData();
                }}
                className="px-4 py-2 rounded-xl bg-surface border border-line-strong text-ink-2 text-xs font-semibold hover:bg-surface-3"
              >
                改用沙箱演示数据
              </button>
            </div>
          </>
        ) : (
          <div className="text-ink-3 text-sm">加载学习中心中...</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col selection:bg-accent-soft selection:text-ink">
      {/* 顶部主导航栏 */}
      <TopNavBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        taskStatus={task?.status}
        onOpenDevModal={() => setIsDevModalOpen(true)}
        colorScheme={colorScheme}
        onToggleColorScheme={handleToggleColorScheme}
        grade={grade}
        subject={subject}
        onFilterChange={handleFilterChange}
      />

      {/* 主视图区域（大屏与笔记本双端高利用率） */}
      <main className="flex-1 pb-16">
        {currentTab === 'task' && (
          <DailyTaskView
            profile={profile}
            task={task}
            progress={progress}
            progressError={progressError}
            progressLoading={progressLoading}
            onRetryProgress={refreshProgress}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onGoToReview={() => setCurrentTab('review')}
            onExportImage={handleExportImage}
            onGeneratePlanTask={handleGeneratePlanTask}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
            onUpdateRewardPoints={handleUpdateRewardPoints}
          />
        )}

        {currentTab === 'review' && task && (
          <GradingReviewView
            task={task}
            onBackToTask={() => setCurrentTab('task')}
            onConfirmParentCorrection={handleConfirmParentCorrection}
          />
        )}

        {currentTab === 'map' && (
          <MasteryMapView knowledgePoints={knowledgePoints} childName={profile?.name} />
        )}

        {currentTab === 'points' && (
          <PointsLedgerView
            profile={profile}
            transactions={transactions}
            onSpendPoints={handleSpendPoints}
            onAddPoints={handleAddPoints}
          />
        )}
      </main>

      {/* 底部轻量页脚 */}
      <footer className="border-t border-line bg-surface py-4 text-center text-xs text-ink-3 transition-colors no-print">
        AI 家庭学习系统 · 数字系统负责诊断规划 · 现实世界专注纸笔手写思考与奖励兑换
      </footer>

      {/* A4 打印模态窗口 */}
      {task && (
        <PrintWorksheetModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          material={task.material}
          profile={profile}
          onPrinted={handlePrinted}
          isExportingImage={isExportingImage}
        />
      )}

      {/* 临时定制生成模态窗口 */}
      <CustomTaskModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onGenerateCustom={handleGenerateCustomTask}
      />


      {/* Hermes 配置与移交说明模态窗口 */}
      <HermesDevModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onResetDemo={handleResetDemo}
      />

      {/* 浮动轻量通知 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface text-ink px-5 py-3.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 max-w-md animate-fade-in border border-line">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
