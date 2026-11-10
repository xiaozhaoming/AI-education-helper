/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Printer,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  Coins,
  Sliders,
  Edit2,
  Check
} from 'lucide-react';
import { ChildProfile, LearningTask } from '../types';

interface DailyTaskViewProps {
  profile: ChildProfile;
  task: LearningTask;
  onOpenPrintModal: () => void;
  onGoToReview: () => void;
  onSimulateUpload: (mode: 'perfect' | 'low_confidence' | 'error') => Promise<void>;
  onRealUpload?: (file: File) => Promise<void>;
  isHermesMode?: boolean;
  onGeneratePlanTask: () => Promise<void>;
  onOpenCustomModal: () => void;
  onUpdateRewardPoints: (newPoints: number) => Promise<void>;
}

export const DailyTaskView: React.FC<DailyTaskViewProps> = ({
  profile,
  task,
  onOpenPrintModal,
  onGoToReview,
  onSimulateUpload,
  onRealUpload,
  isHermesMode = false,
  onGeneratePlanTask,
  onOpenCustomModal,
  onUpdateRewardPoints
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [tempPoints, setTempPoints] = useState(task.customRewardPoints ?? task.defaultRewardPoints);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 按实际题目构成统计，避免写死的「比大小6题/拆数4题/应用题2题」误导家长
  const sections = (task.material.questions || []).reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});
  const totalQ = task.material.questions?.length ?? 0;

  const handleRealPick = () => {
    fileInputRef.current?.click();
  };

  const handleRealFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !onRealUpload) return;
    setIsUploading(true);
    setShowUploadMenu(false);
    try {
      await onRealUpload(f);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulate = async (mode: 'perfect' | 'low_confidence' | 'error') => {
    setIsUploading(true);
    setShowUploadMenu(false);
    try {
      await onSimulateUpload(mode);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlanGenerate = async () => {
    setIsGeneratingPlan(true);
    try {
      await onGeneratePlanTask();
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSavePoints = async () => {
    await onUpdateRewardPoints(tempPoints);
    setIsEditingPoints(false);
  };

  const currentPoints = task.customRewardPoints ?? task.defaultRewardPoints;

  const getStatusBadge = () => {
    switch (task.status) {
      case 'pending_print':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warn-bg text-warn text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" />
            待打印练习纸
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info-bg text-info text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            纸笔作答进行中
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger-bg text-danger text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            待家长核对笔迹
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ok-bg text-ok text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            批改完成 · 积分已入账
          </span>
        );
      default:
        return null;
    }
  };

  // 极简工坊唯一横幅：结构固定，颜色交给 token
  const banner = {
    container: 'bg-accent-panel text-accent-panel-ink border border-line shadow-tok',
    badgeText: 'text-accent-panel-ink/75',
    title: '一年级数学认知工坊 · 纸墨本源深度思考',
    titleFont: 'font-bold tracking-tight',
    subtitle: '真实物理世界专注白纸黑字独立作答与逻辑求证；智能中枢负责学情诊断与进阶规划。落笔有声，厚积薄发。',
    subText: 'text-accent-panel-ink/70',
    statsBg: 'bg-accent-panel-ink/10 border border-accent-panel-ink/25 text-accent-panel-ink',
    streakIcon: 'text-accent-panel-ink/80',
    pointsIcon: 'text-accent-panel-ink/80',
    pointsLabel: '可用成长积分',
    pointsUnit: '分'
  };

  const cardBorderClass = 'bg-surface border border-line rounded-xl shadow-tok text-ink';

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. 儿童成长问候横幅（依据 UI 风格切换） */}
      <div className={`relative overflow-hidden rounded-xl p-6 sm:p-8 transition-all ${banner.container}`}>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-xs sm:text-sm ${banner.badgeText}`}>
              <span className="text-2xl">{profile.avatar}</span>
              <span>早上好，{profile.name}同学！</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl ${banner.titleFont}`}>
              {banner.title}
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${banner.subText}`}>
              {banner.subtitle}
            </p>
          </div>

          <div className={`flex items-center gap-4 backdrop-blur-md px-6 py-3.5 rounded-lg shrink-0 transition-colors ${banner.statsBg}`}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-medium opacity-90">
                <Flame className={`w-4 h-4 ${banner.streakIcon}`} />
                连续坚持
              </div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{profile.streakDays} 天</div>
            </div>
            <div className="w-px h-10 bg-current opacity-20" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-medium opacity-90">
                <Coins className={`w-4 h-4 ${banner.pointsIcon}`} />
                {banner.pointsLabel}
              </div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums">{profile.pointsBalance} {banner.pointsUnit}</div>
            </div>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-surface/10 pointer-events-none blur-2xl" />
      </div>

      {/* 2. 双模式生成工具栏与纸笔合并主工作区（宽屏自适应两栏架构） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左侧主视窗：当前任务与 A4 试卷详情 (8 Cols on Large Screen) */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`${cardBorderClass} p-6 sm:p-8 space-y-6`}>
            {/* 任务头部 */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line`}>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {getStatusBadge()}
                  <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-surface-3 text-ink-2 border border-line`}>
                    {task.generationMode === 'plan' ? '📅 教学星图计划卷' : '⚡ 临时定制卷'}
                  </span>
                  <span className={`text-xs font-mono text-ink-3`}>
                    试卷编号: <code>{task.material.worksheetId}</code>
                  </span>
                </div>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight text-ink`}>
                  {task.title}
                </h2>
              </div>

              {/* 双生成逻辑切换按钮 */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePlanGenerate}
                  disabled={isGeneratingPlan}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-warn-bg hover:bg-warn-bg/70 text-warn border border-warn-line/80 transition-colors flex items-center gap-1.5"
                  title="根据知识点掌握状态自动生成今日教学计划卷"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                  <span>按计划刷新</span>
                </button>

                <button
                  onClick={onOpenCustomModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-3 text-ink transition-colors flex items-center gap-1.5 shadow-tok"
                  title="家长按临时需求自定义题型、题量与难度生成试卷"
                >
                  <Sliders className="w-3.5 h-3.5 text-warn" />
                  <span>按需定制试卷</span>
                </button>
              </div>
            </div>

            {/* 试卷结构指标条 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-2/80 rounded-lg p-3.5 border border-line space-y-1">
                <div className="text-[12px] text-ink-3">试卷题量</div>
                <div className="font-bold text-ink text-base">
                  {task.material.questions.length} 道大题
                </div>
                <div className="text-[12px] text-ink-3">满分 {task.material.questions.reduce((s, q) => s + q.points, 0)} 分</div>
              </div>

              <div className="bg-surface-2/80 rounded-lg p-3.5 border border-line space-y-1">
                <div className="text-[12px] text-ink-3">建议用时</div>
                <div className="font-bold text-ink text-base">
                  约 {task.estimatedMinutes} 分钟
                </div>
                <div className="text-[12px] text-ink-3">控制低年级专注时长</div>
              </div>

              <div className="bg-surface-2/80 rounded-lg p-3.5 border border-line space-y-1">
                <div className="text-[12px] text-ink-3">知识点归属</div>
                <div className="font-bold text-ink text-sm truncate" title={task.knowledgePointTitle}>
                  {task.knowledgePointTitle}
                </div>
                <div className="text-[12px] text-ink-3 font-mono">
                  {task.knowledgePointId}
                </div>
              </div>

              <div className="bg-warn-bg/60 rounded-lg p-3.5 border border-warn-line/60 space-y-1 relative">
                <div className="text-[12px] text-warn flex items-center justify-between">
                  <span>本次奖励积分</span>
                  <button
                    onClick={() => setIsEditingPoints(true)}
                    className="text-warn hover:text-warn"
                    title="家长手工调整本次积分"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                {isEditingPoints ? (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <input
                      type="number"
                      value={tempPoints}
                      onChange={(e) => setTempPoints(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-surface border border-warn-line rounded text-sm font-bold text-warn"
                    />
                    <button
                      onClick={handleSavePoints}
                      className="p-1 bg-warn text-warn-on rounded hover:bg-warn-line"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="font-black text-warn text-lg flex items-center gap-1">
                    <Coins className="w-4 h-4 text-warn" />
                    <span>+{currentPoints} 积分</span>
                  </div>
                )}
                <div className="text-[12px] text-warn">
                  {task.customRewardPoints ? '（家长已微调）' : '（难易梯度默认值）'}
                </div>
              </div>
            </div>

            {/* Hermes 教学推荐理由 */}
            <div className="bg-warn-bg/50 rounded-lg p-4 border border-warn-line/50 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-warn">
                <Sparkles className="w-3.5 h-3.5 text-warn" />
                <span>Hermes 教学决策与出题理由：</span>
              </div>
              <p className="text-warn leading-relaxed text-[12px]">
                {task.recommendReason}
              </p>
            </div>

            {/* 真实试卷四大题型缩略一览 */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
                <span>试卷题目结构明细（按本次真实题目统计）</span>
                <span className="text-ink-3 font-normal">共 {totalQ} 题 · 黑白 A4 打印优化</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-surface-2 border border-line/80 space-y-1.5">
                  <div className="font-bold text-ink flex items-center justify-between">
                    <span>一、看谁算得又对又快（进位加法口算）</span>
                    <span className="text-ink-3 font-mono">{sections['addition_carry'] ?? 0} 题 · 1分/题</span>
                  </div>
                  <div className="text-[12px] text-ink-3">
                    9加几、8加几、7加几经典进位算式；凑十法算理在卷面给出梯形思考框。
                  </div>
                </div>
                {sections['comparison'] ? (
                  <div className="p-3.5 rounded-lg bg-surface-2 border border-line/80 space-y-1.5">
                    <div className="font-bold text-ink flex items-center justify-between">
                      <span>二、在 〇 里填“&gt;”、“&lt;”或“=”</span>
                      <span className="text-ink-3 font-mono">{sections['comparison']} 题 · 2分/题</span>
                    </div>
                    <div className="text-[12px] text-ink-3">算式与常数比大小，训练算理预估与数感。</div>
                  </div>
                ) : null}
                {sections['split_fill'] ? (
                  <div className="p-3.5 rounded-lg bg-surface-2 border border-line/80 space-y-1.5">
                    <div className="font-bold text-ink flex items-center justify-between">
                      <span>三、“凑十法”拆数填空</span>
                      <span className="text-ink-3 font-mono">{sections['split_fill']} 题 · 2分/题</span>
                    </div>
                    <div className="text-[12px] text-ink-3">大数想凑十、拆小数，手写拆数过程。</div>
                  </div>
                ) : null}
                {sections['word_problem'] ? (
                  <div className="p-3.5 rounded-lg bg-surface-2 border border-line/80 space-y-1.5">
                    <div className="font-bold text-ink flex items-center justify-between">
                      <span>四、解决实际问题小能手</span>
                      <span className="text-ink-3 font-mono">{sections['word_problem']} 题 · 3分/题</span>
                    </div>
                    <div className="text-[12px] text-ink-3">生活情境，书写完整列式。</div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 底部核心操作栏（合并练习纸打印） */}
            <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenPrintModal}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface hover:bg-surface-3 text-ink text-sm font-bold shadow-tok hover:shadow-md transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4 text-warn" />
                  <span>立即调出 A4 练习纸并打印 (Ctrl+P)</span>
                </button>

                {task.submission && (
                  <button
                    onClick={onGoToReview}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-ok-bg hover:bg-ok-bg/70 text-ok border border-ok-line text-sm font-bold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-ok" />
                    <span>查看批改报告与积分明细</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 上传区：本地模式走真实识别；沙箱模式保留模拟场景 */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRealFile}
                />
                {isHermesMode ? (
                  <button
                    onClick={handleRealPick}
                    disabled={isUploading}
                    className="px-4 py-3 rounded-xl bg-warn hover:bg-warn-line text-warn-on text-sm font-semibold shadow-tok transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isUploading ? '识别与批改中（最多 20 秒）...' : '上传答卷照片（真实批改）'}</span>
                  </button>
                ) : (
                <>
                <div className="flex items-center rounded-xl bg-warn hover:bg-warn-line text-warn-on text-sm font-semibold shadow-tok transition-all overflow-hidden">
                  <button
                    onClick={() => handleSimulate('perfect')}
                    disabled={isUploading}
                    className="px-4 py-3 flex items-center gap-2 hover:bg-warn-line/80 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isUploading ? '飞书多维表格批改中...' : '模拟飞书拍照上传 (全对)'}</span>
                  </button>

                  <button
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                    disabled={isUploading}
                    className="px-2.5 py-3 border-l border-warn-line/60 hover:bg-warn-bg/60 transition-colors"
                    title="选择模拟上传情境"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {showUploadMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-surface rounded-lg shadow-xl border border-line py-2 z-30 text-xs">
                    <div className="px-3 py-1.5 font-bold text-ink-3 uppercase tracking-wider text-[12px]">
                      选择模拟场景（测试分层闭环）
                    </div>
                    <button
                      onClick={() => handleSimulate('perfect')}
                      className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between text-ink"
                    >
                      <span>场景 1：全部正确 (置信度 96%)</span>
                      <span className="text-ok font-semibold">推荐</span>
                    </button>
                    <button
                      onClick={() => handleSimulate('low_confidence')}
                      className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between text-ink"
                    >
                      <span>场景 2：含字迹涂改 (置信度 68%)</span>
                      <span className="text-warn font-semibold">触发家长核对</span>
                    </button>
                    <button
                      onClick={() => handleSimulate('error')}
                      className="w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between text-ink"
                    >
                      <span>场景 3：含比大小错误</span>
                      <span className="text-danger font-semibold">触发错题归因</span>
                    </button>
                  </div>
                )}
                </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧控制栏：A4 纸笔印刷即时预览与执行向导 (4 Cols on Large Screen) */}
        <div className="lg:col-span-4 space-y-6">
          {/* A4 练习纸印刷微型预览卡片 */}
          <div className={`${cardBorderClass} p-6 space-y-4`}>
            <div className={`flex items-center justify-between pb-3 border-b border-line`}>
              <div className="flex items-center gap-2">
                <BookOpen className={`w-4 h-4 text-info`} />
                <h3 className={`font-bold text-sm text-ink`}>
                  纸笔练习纸预览 (已合并)
                </h3>
              </div>
              <span className={`text-[12px] font-mono text-ink-3`}>A4 单页双栏</span>
            </div>

            {/* 微缩试卷框 */}
            <div
              onClick={onOpenPrintModal}
              className="border-2 border-dashed border-line-strong rounded-xl p-4 transition-colors cursor-pointer space-y-3 bg-surface-2 hover:border-accent hover:bg-surface-3"
              title="点击打开全屏高清打印预览"
            >
              <div className={`flex items-start justify-between border-b pb-2 border-line`}>
                <div>
                  <div className={`text-[12px] text-ink-3`}>小学一年级数学</div>
                  <div className={`font-bold text-xs truncate max-w-[170px] text-ink`}>
                    {task.material.title}
                  </div>
                </div>
                <div className={`w-8 h-8 rounded flex items-center justify-center text-[12px] font-mono bg-surface-3 text-ink-2`}>
                  QR
                </div>
              </div>

              <div className={`space-y-1 text-[12px] font-mono text-ink-3`}>
                <div className="flex justify-between">
                  <span>一、口算部分（进位加法）</span>
                  <span className="text-ink-2">{sections['addition_carry'] ?? totalQ} 题</span>
                </div>
                {sections['comparison'] ? (
                  <div className="flex justify-between">
                    <span>二、比大小部分</span>
                    <span className="text-ink-2">{sections['comparison']} 题</span>
                  </div>
                ) : null}
                {sections['split_fill'] ? (
                  <div className="flex justify-between">
                    <span>三、凑十拆数部分</span>
                    <span className="text-ink-2">{sections['split_fill']} 题</span>
                  </div>
                ) : null}
                {sections['word_problem'] ? (
                  <div className="flex justify-between">
                    <span>四、解决问题部分</span>
                    <span className="text-ink-2">{sections['word_problem']} 题</span>
                  </div>
                ) : null}
              </div>

              <div className={`pt-2 border-t text-center text-xs font-semibold border-line text-warn`}>
                点击展开完整 A4 试卷与答案版 ➔
              </div>
            </div>
          </div>

          {/* 学习闭环四步指导卡 */}
          <div className="rounded-xl border border-line p-6 space-y-3.5 text-xs transition-colors bg-surface-2 text-ink-2">
            <div className={`font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink`}>
              <HelpCircle className={`w-4 h-4 text-info`} />
              <span>标准纸笔四步闭环说明</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[12px] bg-surface-3 text-ink-2 border border-line`}>
                  1
                </span>
                <div>
                  <strong className="text-ink">打印 A4 练习纸：</strong>
                  黑白激光/喷墨打印，大字号保护视力。
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[12px] bg-surface-3 text-ink-2 border border-line`}>
                  2
                </span>
                <div>
                  <strong className="text-ink">脱离屏幕独立作答：</strong>
                  {profile.name}用铅笔独立计算，书写工整。
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[12px] bg-surface-3 text-ink-2 border border-line`}>
                  3
                </span>
                <div>
                  <strong className="text-ink">飞书表单拍照上传：</strong>
                  微信/飞书扫描卷首二维码直接上传。
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[12px] bg-surface-3 text-ink-2 border border-line`}>
                  4
                </span>
                <div>
                  <strong className="text-ink">线下积分兑换：</strong>
                  答对赚取成长积分，在现实世界兑现奖励。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};