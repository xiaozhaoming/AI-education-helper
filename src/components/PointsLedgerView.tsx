/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Coins,
  MinusCircle,
  PlusCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  Award,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ChildProfile, PointTransaction, UIStyleTheme } from '../types';

interface PointsLedgerViewProps {
  profile: ChildProfile;
  transactions: PointTransaction[];
  onSpendPoints: (amount: number, reason: string) => Promise<void>;
  onAddPoints: (amount: number, reason: string) => Promise<void>;
}

export const PointsLedgerView: React.FC<PointsLedgerViewProps> = ({
  profile,
  transactions,
  onSpendPoints,
  onAddPoints
}) => {
  const [deductAmount, setDeductAmount] = useState(20);
  const [deductReason, setDeductReason] = useState('兑换看动画片 30 分钟');
  const [isDeducting, setIsDeducting] = useState(false);
  const [customAddAmount, setCustomAddAmount] = useState(10);
  const [customAddReason, setCustomAddReason] = useState('主动检查作答字迹工整加分');
  const [isAdding, setIsAdding] = useState(false);
  const [activeAction, setActiveAction] = useState<'deduct' | 'add'>('deduct');

  const PRESET_REWARDS = [
    { title: '观看益智动画片 30 分钟', cost: 20, icon: '📺' },
    { title: '兑换心仪乐高/拼装玩具一套', cost: 50, icon: '🧩' },
    { title: '挑选一本喜欢的科普绘本书', cost: 30, icon: '📖' },
    { title: '周末前往水族馆/动物园游玩', cost: 60, icon: '🐬' },
    { title: '自选周末户外运动或露营一次', cost: 40, icon: '⛺' }
  ];

  const handleExecuteDeduct = async (amount: number, reason: string) => {
    setIsDeducting(true);
    try {
      await onSpendPoints(amount, reason);
    } finally {
      setIsDeducting(false);
    }
  };

  const handleExecuteAdd = async () => {
    setIsAdding(true);
    try {
      await onAddPoints(customAddAmount, customAddReason);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. 顶部总积分看板 */}
      <div className={`bg-accent-panel text-accent-panel-ink border border-line shadow-tok-lg rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent-panel-ink/70 text-xs font-semibold">
            <Coins className="w-4 h-4 fill-warn text-accent-panel-ink/70" />
            <span>成长积分激励中心 · {profile.name}的专属积分钱包</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-serif`}>
            纸笔努力转化为成长能量，支持线下实体兑换
          </h1>
          <p className="text-accent-panel-ink/70 text-xs max-w-xl leading-relaxed">
            越难的题目积分越高，越容易的题目积分越低。在现实世界中兑换玩具、户外活动或奖励时，家长可随时在此手工扣减核销。
          </p>
        </div>

        <div className="flex items-center gap-6 bg-surface/15 backdrop-blur-md px-6 py-4 rounded-xl border border-line/20 shrink-0">
          <div className="text-center">
            <div className="text-accent-panel-ink/70 text-xs">当前可用成长积分</div>
            <div className="text-3xl sm:text-4xl font-black tabular-nums text-accent-panel-ink flex items-center justify-center gap-2">
              <Coins className="w-7 h-7 text-warn fill-warn/25" />
              <span>{profile.pointsBalance}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-surface/20" />
          <div className="text-center">
            <div className="text-accent-panel-ink/70 text-xs">连续学习打卡</div>
            <div className="text-2xl font-black tabular-nums">{profile.streakDays} 天</div>
          </div>
        </div>
      </div>

      {/* 2. 核心操作区（左右分栏或大屏幕自适应网格） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左侧：线下兑换手工扣减 & 快捷兑换选项 (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface rounded-xl border border-line p-6 shadow-tok space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-warn" />
                <h2 className="font-bold text-ink text-sm">
                  线下物理世界奖励核销
                </h2>
              </div>
              <div className="flex rounded-xl bg-surface-3 p-0.5 text-[12px] font-medium">
                <button
                  onClick={() => setActiveAction('deduct')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    activeAction === 'deduct' ? 'bg-surface text-ink shadow-tok' : 'text-ink-2'
                  }`}
                >
                  扣减积分 (兑换)
                </button>
                <button
                  onClick={() => setActiveAction('add')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    activeAction === 'add' ? 'bg-surface text-ink shadow-tok' : 'text-ink-2'
                  }`}
                >
                  手工加分 (奖励)
                </button>
              </div>
            </div>

            {activeAction === 'deduct' ? (
              <div className="space-y-4 text-xs">
                {/* 快捷线下奖励模板 */}
                <div className="space-y-2">
                  <div className="text-[12px] font-semibold text-ink-3 uppercase tracking-wider">
                    点击一键扣减预设奖励：
                  </div>
                  <div className="space-y-2">
                    {PRESET_REWARDS.map((rew, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg border border-line hover:border-warn-line hover:bg-warn-bg/30 transition-all cursor-pointer"
                        onClick={() => {
                          setDeductAmount(rew.cost);
                          setDeductReason(rew.title);
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{rew.icon}</span>
                          <span className="font-semibold text-ink">{rew.title}</span>
                        </div>
                        <span className="font-bold text-danger font-mono text-xs">
                          -{rew.cost} 积分
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 手工自定义扣减表单 */}
                <div className="pt-3 border-t border-line space-y-3">
                  <div className="font-semibold text-ink text-xs flex items-center justify-between">
                    <span>自定义核销原因与数值</span>
                    <span className="text-[12px] text-ink-3">线下消耗</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={profile.pointsBalance}
                      value={deductAmount}
                      onChange={(e) => setDeductAmount(Number(e.target.value))}
                      className="w-24 px-3 py-2 bg-surface-2 border border-line rounded-xl text-center font-bold text-danger focus:bg-surface"
                      placeholder="分值"
                    />
                    <input
                      type="text"
                      value={deductReason}
                      onChange={(e) => setDeductReason(e.target.value)}
                      className="flex-1 px-3 py-2 bg-surface-2 border border-line rounded-xl focus:bg-surface"
                      placeholder="兑换项目描述，如：兑换乐高一盒"
                    />
                  </div>

                  <button
                    disabled={isDeducting || profile.pointsBalance < deductAmount}
                    onClick={() => handleExecuteDeduct(deductAmount, deductReason)}
                    className="w-full py-2.5 rounded-xl bg-danger hover:opacity-90 disabled:bg-surface-3 disabled:text-ink-3 text-danger-on font-bold transition-colors flex items-center justify-center gap-1.5 shadow-tok"
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>
                      {profile.pointsBalance < deductAmount
                        ? '积分不足以兑换'
                        : `确认手工扣减 -${deductAmount} 积分`}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="font-semibold text-ink text-xs">
                    家长手工奖励增补积分
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={customAddAmount}
                      onChange={(e) => setCustomAddAmount(Number(e.target.value))}
                      className="w-24 px-3 py-2 bg-surface-2 border border-line rounded-xl text-center font-bold text-ok focus:bg-surface"
                      placeholder="加分"
                    />
                    <input
                      type="text"
                      value={customAddReason}
                      onChange={(e) => setCustomAddReason(e.target.value)}
                      className="flex-1 px-3 py-2 bg-surface-2 border border-line rounded-xl focus:bg-surface"
                      placeholder="加分原因，如：主动整理桌面"
                    />
                  </div>

                  <button
                    disabled={isAdding}
                    onClick={handleExecuteAdd}
                    className="w-full py-2.5 rounded-xl bg-ok hover:bg-ok-line text-ok-on font-bold transition-colors flex items-center justify-center gap-1.5 shadow-tok"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>确认发放 +{customAddAmount} 奖励积分</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：积分变动流水台账 (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface rounded-xl border border-line p-6 shadow-tok space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-3" />
                <h2 className="font-bold text-ink text-sm">
                  积分收支流水台账（实时记录）
                </h2>
              </div>
              <span className="text-xs text-ink-3">共 {transactions.length} 条记录</span>
            </div>

            <div className="space-y-2.5">
              {transactions.map((tx) => {
                const isEarned = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-surface-2 border border-line hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isEarned
                            ? 'bg-ok-bg text-ok'
                            : 'bg-danger-bg text-danger'
                        }`}
                      >
                        {isEarned ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-ink text-xs">{tx.title}</div>
                        <div className="text-[12px] text-ink-3">{tx.reason}</div>
                        <div className="text-[12px] text-ink-3 font-mono">{tx.timestamp}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-sm tabular-nums font-mono ${
                          isEarned ? 'text-ok' : 'text-danger'
                        }`}
                      >
                        {isEarned ? `+${tx.amount}` : tx.amount}
                      </div>
                      <div className="text-[12px] text-ink-3">
                        余额: <span className="font-semibold text-ink-2">{tx.balanceAfter}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
