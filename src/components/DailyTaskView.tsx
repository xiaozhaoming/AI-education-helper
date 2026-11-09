/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { ChildProfile, LearningTask, UIStyleTheme } from '../types';

interface DailyTaskViewProps {
  profile: ChildProfile;
  task: LearningTask;
  activeTheme?: UIStyleTheme;
  onOpenPrintModal: () => void;
  onGoToReview: () => void;
  onSimulateUpload: (mode: 'perfect' | 'low_confidence' | 'error') => Promise<void>;
  onGeneratePlanTask: () => Promise<void>;
  onOpenCustomModal: () => void;
  onUpdateRewardPoints: (newPoints: number) => Promise<void>;
}

export const DailyTaskView: React.FC<DailyTaskViewProps> = ({
  profile,
  task,
  activeTheme = 'playful_warm',
  onOpenPrintModal,
  onGoToReview,
  onSimulateUpload,
  onGeneratePlanTask,
  onOpenCustomModal,
  onUpdateRewardPoints
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [tempPoints, setTempPoints] = useState(task.customRewardPoints ?? task.defaultRewardPoints);

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" />
            待打印练习纸
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            纸笔作答进行中
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            待家长核对笔迹
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            批改完成 · 积分已入账
          </span>
        );
      default:
        return null;
    }
  };

  const getBannerConfig = () => {
    switch (activeTheme) {
      case 'modern_editorial':
        return {
          container: 'bg-[#0F172A] border border-slate-800 text-white shadow-sm',
          badgeText: 'text-slate-400 font-mono tracking-wider uppercase text-[11px]',
          title: '一年级数学认知工坊 · 纸墨本源深度思考',
          titleFont: 'font-sans font-bold tracking-tight text-white',
          subtitle: '真实物理世界专注白纸黑字独立作答与逻辑求证；智能中枢负责学情诊断与进阶规划。落笔有声，厚积薄发。',
          subText: 'text-slate-400',
          statsBg: 'bg-slate-800/90 border border-slate-700 text-white',
          streakIcon: 'text-slate-300 fill-slate-300',
          pointsIcon: 'text-amber-400 fill-amber-400',
          pointsLabel: '可用成长积分',
          pointsUnit: '分',
          tag: '📐 风格 2：现代极简工坊风 (Modern Editorial)',
        };
      case 'cosmic_explorer':
        return {
          container: 'bg-gradient-to-r from-slate-950 via-[#0c1f38] to-slate-950 border border-sky-500/40 text-white shadow-xl shadow-sky-950/40',
          badgeText: 'text-cyan-300 font-mono tracking-wide text-xs',
          title: '🚀 嘟嘟号空间站已就绪 · 今日数学能量充能',
          titleFont: 'font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-cyan-300',
          subtitle: '每一次纸笔演算都是为思维航天飞船注入关键能量！完成 24 道题目，充能探索更遥远的数学星系。',
          subText: 'text-sky-200/80',
          statsBg: 'bg-slate-900/90 border border-sky-500/40 text-sky-100 shadow-inner',
          streakIcon: 'text-amber-400 fill-amber-400',
          pointsIcon: 'text-cyan-400 fill-cyan-400',
          pointsLabel: '可用思维能量',
          pointsUnit: '能量',
          tag: '🚀 风格 3：太空探索空间站 (Cosmic Explorer)',
        };
      default: // playful_warm
        return {
          container: 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white shadow-lg shadow-amber-500/20',
          badgeText: 'text-amber-100 font-semibold',
          title: '今天的小宇宙充满能量，纸笔书写点亮思维火花！',
          titleFont: 'font-extrabold tracking-tight',
          subtitle: '真实世界负责手写思考，数字系统负责诊断激励。认真完成每一道算式，积分可以在现实世界兑换心仪奖励！',
          subText: 'text-amber-100',
          statsBg: 'bg-white/20 border border-white/30 text-white',
          streakIcon: 'text-amber-300 fill-amber-300',
          pointsIcon: 'text-amber-200 fill-amber-300',
          pointsLabel: '可用成长积分',
          pointsUnit: '分',
          tag: '🌻 风格 1：温暖童趣绘本风 (Playful Warm)',
        };
    }
  };

  const banner = getBannerConfig();
  const isCosmic = activeTheme === 'cosmic_explorer';
  const isEditorial = activeTheme === 'modern_editorial';

  const cardBorderClass = 
    isCosmic 
      ? 'bg-slate-900/95 border-slate-800 text-slate-100 rounded-3xl shadow-lg' 
      : isEditorial
      ? 'bg-white border-slate-200 rounded-2xl shadow-xs text-slate-900'
      : 'bg-white border-slate-200/80 rounded-3xl shadow-xs text-slate-900';

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 风格提示标签与快捷体验条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">当前演示 UI 风格：</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-medium text-slate-800">
            {banner.tag}
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">
            右上角导航可随时一键试穿这 3 种风格，按需切换心仪配色
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          状态：已适配大屏 (1920) 与笔记本 (1366)
        </div>
      </div>

      {/* 1. 儿童成长问候横幅（依据 UI 风格切换） */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all ${banner.container}`}>
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

          <div className={`flex items-center gap-4 backdrop-blur-md px-6 py-3.5 rounded-2xl shrink-0 transition-colors ${banner.statsBg}`}>
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

        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none blur-2xl" />
      </div>

      {/* 2. 双模式生成工具栏与纸笔合并主工作区（宽屏自适应两栏架构） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左侧主视窗：当前任务与 A4 试卷详情 (8 Cols on Large Screen) */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`${cardBorderClass} p-6 sm:p-8 space-y-6`}>
            {/* 任务头部 */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${isCosmic ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {getStatusBadge()}
                  <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium ${
                    isCosmic ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {task.generationMode === 'plan' ? '📅 教学星图计划卷' : '⚡ 临时定制卷'}
                  </span>
                  <span className={`text-xs font-mono ${isCosmic ? 'text-slate-400' : 'text-slate-500'}`}>
                    试卷编号: <code>{task.material.worksheetId}</code>
                  </span>
                </div>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isCosmic ? 'text-white' : 'text-slate-900'}`}>
                  {task.title}
                </h2>
              </div>

              {/* 双生成逻辑切换按钮 */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePlanGenerate}
                  disabled={isGeneratingPlan}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors flex items-center gap-1.5"
                  title="根据知识点掌握状态自动生成今日教学计划卷"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                  <span>按计划刷新</span>
                </button>

                <button
                  onClick={onOpenCustomModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  title="家长按临时需求自定义题型、题量与难度生成试卷"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>按需定制试卷</span>
                </button>
              </div>
            </div>

            {/* 试卷结构指标条 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 space-y-1">
                <div className="text-[11px] text-slate-500">试卷题量</div>
                <div className="font-bold text-slate-900 text-base">
                  {task.material.questions.length} 道大题
                </div>
                <div className="text-[10px] text-slate-400">满分 100 分</div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 space-y-1">
                <div className="text-[11px] text-slate-500">建议用时</div>
                <div className="font-bold text-slate-900 text-base">
                  约 {task.estimatedMinutes} 分钟
                </div>
                <div className="text-[10px] text-slate-400">控制低年级专注时长</div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 space-y-1">
                <div className="text-[11px] text-slate-500">知识点归属</div>
                <div className="font-bold text-slate-900 text-sm truncate" title={task.knowledgePointTitle}>
                  {task.knowledgePointTitle}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {task.knowledgePointId}
                </div>
              </div>

              <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-200/60 space-y-1 relative">
                <div className="text-[11px] text-amber-800 flex items-center justify-between">
                  <span>本次奖励积分</span>
                  <button
                    onClick={() => setIsEditingPoints(true)}
                    className="text-amber-600 hover:text-amber-800"
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
                      className="w-16 px-1.5 py-0.5 bg-white border border-amber-400 rounded text-sm font-bold text-amber-900"
                    />
                    <button
                      onClick={handleSavePoints}
                      className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="font-black text-amber-900 text-lg flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>+{currentPoints} 积分</span>
                  </div>
                )}
                <div className="text-[10px] text-amber-700">
                  {task.customRewardPoints ? '（家长已微调）' : '（难易梯度默认值）'}
                </div>
              </div>
            </div>

            {/* Hermes 教学推荐理由 */}
            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/50 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Hermes 教学决策与出题理由：</span>
              </div>
              <p className="text-amber-900/90 leading-relaxed text-[11px]">
                {task.recommendReason}
              </p>
            </div>

            {/* 真实试卷四大题型缩略一览 */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>试卷题目结构明细 (真实小学一年级四段式排版)</span>
                <span className="text-slate-400 font-normal">黑白 A4 打印优化</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>一、看谁算得又对又快 (口算速达)</span>
                    <span className="text-slate-500 font-mono">12 题 · 1分/题</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    涵盖 9加几、8加几、7加几经典进位算式，4 列等宽标准对齐。
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>二、在 〇 里填“&gt;”、“&lt;”或“=”</span>
                    <span className="text-slate-500 font-mono">6 题 · 2分/题</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    算式与常数比大小、算式互比，训练算理预估与数感。
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>三、“凑十法”拆数填空</span>
                    <span className="text-slate-500 font-mono">4 题 · 2分/题</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    大数想凑十、拆小数，引导手写拆数过程脚手架。
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>四、解决实际问题小能手</span>
                    <span className="text-slate-500 font-mono">2 题 · 3分/题</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    真实生活趣味情境（如小鸟合群、花朵采蜜），书写完整列式。
                  </div>
                </div>
              </div>
            </div>

            {/* 底部核心操作栏（合并练习纸打印） */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenPrintModal}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-98"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>立即调出 A4 练习纸并打印 (Ctrl+P)</span>
                </button>

                {task.submission && (
                  <button
                    onClick={onGoToReview}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-bold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>查看批改报告与积分明细</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 模拟飞书表单视角拍照上传 (用于体验闭环) */}
              <div className="relative">
                <div className="flex items-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-xs transition-all overflow-hidden">
                  <button
                    onClick={() => handleSimulate('perfect')}
                    disabled={isUploading}
                    className="px-4 py-3 flex items-center gap-2 hover:bg-amber-600/80 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isUploading ? '飞书多维表格批改中...' : '模拟飞书拍照上传 (全对)'}</span>
                  </button>

                  <button
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                    disabled={isUploading}
                    className="px-2.5 py-3 border-l border-amber-400/60 hover:bg-amber-600/80 transition-colors"
                    title="选择模拟上传情境"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {showUploadMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30 text-xs">
                    <div className="px-3 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      选择模拟场景（测试分层闭环）
                    </div>
                    <button
                      onClick={() => handleSimulate('perfect')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800"
                    >
                      <span>场景 1：全部正确 (置信度 96%)</span>
                      <span className="text-emerald-600 font-semibold">推荐</span>
                    </button>
                    <button
                      onClick={() => handleSimulate('low_confidence')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800"
                    >
                      <span>场景 2：含字迹涂改 (置信度 68%)</span>
                      <span className="text-amber-600 font-semibold">触发家长核对</span>
                    </button>
                    <button
                      onClick={() => handleSimulate('error')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800"
                    >
                      <span>场景 3：含比大小错误</span>
                      <span className="text-rose-600 font-semibold">触发错题归因</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧控制栏：A4 纸笔印刷即时预览与执行向导 (4 Cols on Large Screen) */}
        <div className="lg:col-span-4 space-y-6">
          {/* A4 练习纸印刷微型预览卡片 */}
          <div className={`${cardBorderClass} p-6 space-y-4`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isCosmic ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <BookOpen className={`w-4 h-4 ${isCosmic ? 'text-sky-400' : 'text-amber-600'}`} />
                <h3 className={`font-bold text-sm ${isCosmic ? 'text-white' : 'text-slate-900'}`}>
                  纸笔练习纸预览 (已合并)
                </h3>
              </div>
              <span className={`text-[10px] font-mono ${isCosmic ? 'text-slate-400' : 'text-slate-400'}`}>A4 单页双栏</span>
            </div>

            {/* 微缩试卷框 */}
            <div
              onClick={onOpenPrintModal}
              className={`border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer space-y-3 ${
                isCosmic
                  ? 'bg-slate-800/60 border-slate-700 hover:border-sky-400 hover:bg-sky-950/30 text-slate-200'
                  : 'bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-amber-50/20'
              }`}
              title="点击打开全屏高清打印预览"
            >
              <div className={`flex items-start justify-between border-b pb-2 ${isCosmic ? 'border-slate-700' : 'border-slate-200'}`}>
                <div>
                  <div className={`text-[9px] ${isCosmic ? 'text-slate-400' : 'text-slate-400'}`}>小学一年级数学</div>
                  <div className={`font-bold text-xs truncate max-w-[170px] ${isCosmic ? 'text-white' : 'text-slate-900'}`}>
                    {task.material.title}
                  </div>
                </div>
                <div className={`w-8 h-8 rounded flex items-center justify-center text-[9px] font-mono ${
                  isCosmic ? 'bg-slate-700 text-cyan-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  QR
                </div>
              </div>

              <div className={`space-y-1 text-[10px] font-mono ${isCosmic ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className="flex justify-between">
                  <span>一、口算部分</span>
                  <span className={isCosmic ? 'text-cyan-300' : 'text-slate-700'}>12 题</span>
                </div>
                <div className="flex justify-between">
                  <span>二、比大小部分</span>
                  <span className={isCosmic ? 'text-cyan-300' : 'text-slate-700'}>6 题</span>
                </div>
                <div className="flex justify-between">
                  <span>三、凑十拆数部分</span>
                  <span className={isCosmic ? 'text-cyan-300' : 'text-slate-700'}>4 题</span>
                </div>
                <div className="flex justify-between">
                  <span>四、解决问题部分</span>
                  <span className={isCosmic ? 'text-cyan-300' : 'text-slate-700'}>2 题</span>
                </div>
              </div>

              <div className={`pt-2 border-t text-center text-xs font-semibold ${
                isCosmic ? 'border-slate-700 text-cyan-400' : 'border-slate-200 text-amber-700'
              }`}>
                点击展开完整 A4 试卷与答案版 ➔
              </div>
            </div>
          </div>

          {/* 学习闭环四步指导卡 */}
          <div className={`rounded-3xl border p-6 space-y-3.5 text-xs transition-colors ${
            isCosmic
              ? 'bg-slate-900/80 border-slate-800 text-slate-300'
              : 'bg-slate-50/70 border-slate-200/70 text-slate-600'
          }`}>
            <div className={`font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider ${
              isCosmic ? 'text-white' : 'text-slate-900'
            }`}>
              <HelpCircle className={`w-4 h-4 ${isCosmic ? 'text-sky-400' : 'text-amber-500'}`} />
              <span>标准纸笔四步闭环说明</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                  isCosmic ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  1
                </span>
                <div>
                  <strong className={isCosmic ? 'text-white' : 'text-slate-800'}>打印 A4 练习纸：</strong>
                  黑白激光/喷墨打印，大字号保护视力。
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                  isCosmic ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  2
                </span>
                <div>
                  <strong className={isCosmic ? 'text-white' : 'text-slate-800'}>脱离屏幕独立作答：</strong>
                  嘟嘟用铅笔独立计算，书写工整。
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                  isCosmic ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  3
                </span>
                <div>
                  <strong className={isCosmic ? 'text-white' : 'text-slate-800'}>飞书表单拍照上传：</strong>
                  微信/飞书扫描卷首二维码直接上传。
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                  isCosmic ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  4
                </span>
                <div>
                  <strong className={isCosmic ? 'text-white' : 'text-slate-800'}>线下积分兑换：</strong>
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
