/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ExternalLink,
  FileText,
  RefreshCw
} from 'lucide-react';
import { KnowledgePointNode, MasteryLevel } from '../types';

interface MasteryMapViewProps {
  knowledgePoints: KnowledgePointNode[];
  childName?: string;
}

export const MasteryMapView: React.FC<MasteryMapViewProps> = ({ knowledgePoints, childName }) => {
  // 空数组守卫：原代码 knowledgePoints[2] 在 0 条时会 undefined 崩溃
  const [selectedNode, setSelectedNode] = useState<KnowledgePointNode>(knowledgePoints[0] || ({} as KnowledgePointNode));

  if (!knowledgePoints || knowledgePoints.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="text-3xl">🗺️</div>
        <h2 className="text-lg font-bold text-ink">知识点星图为空</h2>
        <p className="text-sm text-ink-3 leading-relaxed">
          飞书 <span className="font-mono">tb_knowledge_point</span> 表里还没有知识点记录。
          <br />
          请先运行 <span className="font-mono">tools/seed_data.py</span> 灌入知识点种子数据。
        </p>
      </div>
    );
  }

  const current = selectedNode;

  const getStatusBadge = (status: MasteryLevel) => {
    switch (status) {
      case 'stable_mastery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-ok-bg text-ok text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            稳定掌握
          </span>
        );
      case 'initial_mastery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-info-bg text-info text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            初步掌握
          </span>
        );
      case 'learning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warn-bg text-warn text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            当前学习重点
          </span>
        );
      case 'reinforcing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-danger-bg text-danger text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            待巩固
          </span>
        );
      case 'needs_learning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-3 text-ink-2 text-xs font-medium">
            待开启
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-2 text-ink-3 text-xs font-medium">
            未评估
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 头部说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-warn uppercase tracking-wider">
            <Compass className="w-4 h-4 text-warn" />
            一年级数学知识图谱 · 教学大纲进阶
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
            {childName || '孩子'}的知识脉络与进阶星图
          </h1>
          <p className="text-xs text-ink-3 max-w-xl mt-1">
            系统以连续纸笔学习证据评估掌握度，每日计划试卷与本图谱深度耦合。右侧联动本地 Obsidian 教育知识库。
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-line px-4 py-2 rounded-lg text-xs text-ink-2 shadow-tok">
          <BookOpen className="w-4 h-4 text-warn" />
          <span>教材体系：人教版 一年级上册</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左侧：知识点进阶树 (7 Cols on Large Screen) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs font-bold text-ink-3 uppercase tracking-wider">
            点击知识节点查看 Obsidian 教学卡片与对应教学计划
          </div>

          <div className="space-y-3">
            {knowledgePoints.map((kp, idx) => {
              const isSelected = selectedNode?.id === kp.id;
              const isLearning = kp.status === 'learning';

              return (
                <div
                  key={kp.id}
                  onClick={() => setSelectedNode(kp)}
                  className={`p-5 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-warn-bg/70 border-warn-line shadow-tok ring-2 ring-warn-line/30'
                      : 'bg-surface border-line hover:border-line-strong hover:bg-surface-3'
                  }`}
                >
                  {isLearning && (
                    <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-warn text-warn-on text-[12px] font-bold shadow-tok flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      当前教学重点
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-ink-3">
                          0{idx + 1}.
                        </span>
                        <h3 className="font-bold text-ink text-sm">
                          {kp.title}
                        </h3>
                      </div>
                      <p className="text-xs text-ink-3 line-clamp-1">
                        {kp.description}
                      </p>
                    </div>

                    <div className="shrink-0">{getStatusBadge(kp.status)}</div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-[12px] text-ink-3">
                    <span className="font-mono">{kp.id}</span>
                    <span>支撑纸笔作答证据：{kp.evidenceCount} 次</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：Obsidian 知识卡片与教学策略透视 (5 Cols on Large Screen) */}
        <div className="lg:col-span-5">
          {selectedNode ? (
            <div className="bg-surface rounded-xl border border-line p-6 space-y-5 sticky top-24 shadow-tok">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-line">
                <div className="flex items-center gap-1.5 shrink-0">
                  <FileText className="w-4 h-4 text-warn" />
                  <span className="font-bold text-ink text-xs">
                    Obsidian 知识库关联卡片
                  </span>
                </div>
                <span className="text-[12px] font-mono text-ink-3 truncate max-w-[220px]" title={selectedNode.obsidianPath}>
                  {selectedNode.obsidianPath}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-ink">
                  {selectedNode.title}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  {getStatusBadge(selectedNode.status)}
                  <span className="text-xs text-ink-3">
                    最近评估：{selectedNode.lastTestedAt}
                  </span>
                </div>
              </div>

              {/* 核心算理介绍 */}
              <div className="bg-surface-2 rounded-lg p-4 text-xs space-y-2 border border-line">
                <div className="font-semibold text-ink">概念与核心算理：</div>
                <p className="text-ink-2 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* 前置知识依赖 */}
              {selectedNode.prerequisites.length > 0 && (
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-ink-2">先修前置依赖：</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.prerequisites.map(preId => (
                      <span
                        key={preId}
                        className="px-2.5 py-1 rounded-lg bg-surface-3 text-ink-2 font-mono text-[12px] border border-line"
                      >
                        {preId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 常见错误模式归因 (Obsidian Error Patterns) */}
              {selectedNode.errorPatterns.length > 0 && (
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-ink-2 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-warn" />
                    <span>常见易错归因卡片 (Obsidian 映射)：</span>
                  </div>
                  <div className="space-y-2">
                    {selectedNode.errorPatterns.map(err => (
                      <div
                        key={err.id}
                        className="bg-warn-bg/50 border border-warn-line/60 rounded-xl p-3 space-y-1"
                      >
                        <div className="font-bold text-warn flex items-center justify-between">
                          <span>{err.name}</span>
                          <span className="font-mono text-[12px] text-warn">{err.id}</span>
                        </div>
                        <p className="text-warn/90 text-[12px] leading-relaxed">
                          {err.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-line text-[12px] text-ink-3 flex items-center justify-between">
                <span>计划卷出题严格依据此知识点</span>
                <span className="text-warn font-medium">生成 24 题标准卷</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface-2 border border-line rounded-xl p-8 text-center text-xs text-ink-3">
              请在左侧点击知识节点
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
