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
import { StyleShowcaseModal } from './components/StyleShowcaseModal';
import { apiClient, HermesConnectionConfig } from './services/apiClient';
import { ChildProfile, LearningTask, KnowledgePointNode, PointTransaction, CustomTaskRequest, UIStyleTheme } from './types';

export default function App() {
  const [activeTheme, setActiveTheme] = useState<UIStyleTheme>(() => {
    const saved = localStorage.getItem('dudu_ui_theme') as UIStyleTheme;
    return saved === 'modern_editorial' || saved === 'cosmic_explorer' ? saved : 'playful_warm';
  });
  const [currentTab, setCurrentTab] = useState<NavTab>('task');
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [task, setTask] = useState<LearningTask | null>(null);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePointNode[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [config, setConfig] = useState<HermesConnectionConfig>(apiClient.getConfig());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectTheme = (theme: UIStyleTheme) => {
    setActiveTheme(theme);
    localStorage.setItem('dudu_ui_theme', theme);
    showToast(`🎨 已切换为：${theme === 'playful_warm' ? '温暖童趣绘本风' : theme === 'modern_editorial' ? '现代极简工坊风' : '太空探索空间站'}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = async () => {
    const p = await apiClient.getChildProfile();
    const t = await apiClient.getTodayTask();
    const kp = await apiClient.getKnowledgePoints();
    const tx = await apiClient.getPointTransactions();
    setProfile(p);
    setTask(t);
    setKnowledgePoints(kp);
    setTransactions(tx);
  };

  useEffect(() => {
    refreshData();
  }, []);

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
    showToast('📅 已根据星图教学大纲重新生成今日 24 题综合计划卷！');
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
    showToast('🖨️ 系统打印已触发！请交由嘟嘟脱离屏幕用铅笔独立作答。');
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
        加载学习中心中...
      </div>
    );
  }

  const getAppBgClass = () => {
    switch (activeTheme) {
      case 'modern_editorial':
        return 'min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-slate-300';
      case 'cosmic_explorer':
        return 'min-h-screen bg-[#070e1b] text-slate-100 font-sans flex flex-col selection:bg-sky-500 selection:text-white';
      default:
        return 'min-h-screen bg-[#FFFDF7] text-slate-900 font-sans flex flex-col selection:bg-amber-200';
    }
  };

  const isCosmic = activeTheme === 'cosmic_explorer';

  return (
    <div className={getAppBgClass()}>
      {/* 顶部主导航栏 */}
      <TopNavBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        taskStatus={task.status}
        onOpenDevModal={() => setIsDevModalOpen(true)}
        onOpenStyleModal={() => setIsStyleModalOpen(true)}
        hermesMode={config.mode}
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* 主视图区域（大屏与笔记本双端高利用率） */}
      <main className="flex-1 pb-16">
        {currentTab === 'task' && (
          <DailyTaskView
            profile={profile}
            task={task}
            activeTheme={activeTheme}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onGoToReview={() => setCurrentTab('review')}
            onSimulateUpload={handleSimulateUpload}
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
          <MasteryMapView knowledgePoints={knowledgePoints} />
        )}

        {currentTab === 'points' && (
          <PointsLedgerView
            profile={profile}
            transactions={transactions}
            activeTheme={activeTheme}
            onSpendPoints={handleSpendPoints}
            onAddPoints={handleAddPoints}
          />
        )}
      </main>

      {/* 底部轻量页脚 */}
      <footer className={`border-t py-4 text-center text-xs transition-colors ${
        isCosmic ? 'border-slate-800 bg-slate-950 text-slate-500' : 'border-slate-200/60 bg-white text-slate-400'
      }`}>
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

      {/* 3 款 UI 风格设计展示与挑选模态窗口 */}
      <StyleShowcaseModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        currentTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2 max-w-md animate-fade-in border border-slate-800">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
