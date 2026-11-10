/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNavBar, NavTab } from './components/TopNavBar';
import { DailyTaskView } from './components/DailyTaskView';
import { PrintWorksheetModal } from './components/PrintWorksheetModal';
import { GradingReviewView } from './components/GradingReviewView';
import { MasteryMapView } from './components/MasteryMapView';
import { PointsLedgerView } from './components/PointsLedgerView';
import { CustomTaskModal } from './components/CustomTaskModal';
import { HermesDevModal } from './components/HermesDevModal';
import { apiClient, HermesConnectionConfig } from './services/apiClient';
import { ChildProfile, LearningTask, KnowledgePointNode, PointTransaction, CustomTaskRequest, ColorScheme } from './types';

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
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePointNode[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
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
      const t = await apiClient.getTodayTask();
      const kp = await apiClient.getKnowledgePoints(`?grade=${gradeToUse}&subject=${subjectToUse}`);
      const tx = await apiClient.getPointTransactions();
      setProfile(p);
      setTask(t);
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

  if (!profile || !task) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col items-center justify-center px-6 text-center gap-4">
        {loadError ? (
          <>
            <div className="text-3xl">🔌</div>
            <div className="text-ink font-bold text-base">无法连接本地 Hermes 服务</div>
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
        taskStatus={task.status}
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
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onGoToReview={() => setCurrentTab('review')}
            onSimulateUpload={handleSimulateUpload}
            onRealUpload={handleRealUpload}
            isHermesMode={config.mode === 'hermes_local'}
            onGeneratePlanTask={handleGeneratePlanTask}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
            onUpdateRewardPoints={handleUpdateRewardPoints}
          />
        )}

        {currentTab === 'review' && (
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
      <PrintWorksheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        material={task.material}
        profile={profile}
        onPrinted={handlePrinted}
      />

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
