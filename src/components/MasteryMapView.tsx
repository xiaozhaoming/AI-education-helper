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
  FileText
} from 'lucide-react';
import { KnowledgePointNode, MasteryLevel } from '../types';

interface MasteryMapViewProps {
  knowledgePoints: KnowledgePointNode[];
}

export const MasteryMapView: React.FC<MasteryMapViewProps> = ({ knowledgePoints }) => {
  const [selectedNode, setSelectedNode] = useState<KnowledgePointNode>(knowledgePoints[2]);

  const getStatusBadge = (status: MasteryLevel) => {
    switch (status) {
      case 'stable_mastery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            稳定掌握
          </span>
        );
      case 'initial_mastery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            初步掌握
          </span>
        );
      case 'learning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            当前学习重点
          </span>
        );
      case 'needs_learning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
            待开启
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 text-xs font-medium">
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
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
            <Compass className="w-4 h-4 text-amber-500" />
            一年级数学知识图谱 · 教学大纲进阶
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            嘟嘟的知识脉络与进阶星图
          </h1>
          <p className="text-xs text-slate-500 max-w-xl mt-1">
            系统以连续纸笔学习证据评估掌握度，每日计划试卷与本图谱深度耦合。右侧联动本地 Obsidian 教育知识库。
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl text-xs text-slate-600 shadow-xs">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>教材体系：人教版 一年级上册</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 左侧：知识点进阶树 (7 Cols on Large Screen) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
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
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {isLearning && (
                    <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      当前教学重点
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          0{idx + 1}.
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {kp.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {kp.description}
                      </p>
                    </div>

                    <div className="shrink-0">{getStatusBadge(kp.status)}</div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
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
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 sticky top-24 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 shrink-0">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-800 text-xs">
                    Obsidian 知识库关联卡片
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[220px]" title={selectedNode.obsidianPath}>
                  {selectedNode.obsidianPath}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedNode.title}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  {getStatusBadge(selectedNode.status)}
                  <span className="text-xs text-slate-500">
                    最近评估：{selectedNode.lastTestedAt}
                  </span>
                </div>
              </div>

              {/* 核心算理介绍 */}
              <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-100">
                <div className="font-semibold text-slate-800">概念与核心算理：</div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* 前置知识依赖 */}
              {selectedNode.prerequisites.length > 0 && (
                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-slate-700">先修前置依赖：</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.prerequisites.map(preId => (
                      <span
                        key={preId}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200"
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
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                    <span>常见易错归因卡片 (Obsidian 映射)：</span>
                  </div>
                  <div className="space-y-2">
                    {selectedNode.errorPatterns.map(err => (
                      <div
                        key={err.id}
                        className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 space-y-1"
                      >
                        <div className="font-bold text-amber-900 flex items-center justify-between">
                          <span>{err.name}</span>
                          <span className="font-mono text-[10px] text-amber-600">{err.id}</span>
                        </div>
                        <p className="text-amber-800/90 text-[11px] leading-relaxed">
                          {err.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>计划卷出题严格依据此知识点</span>
                <span className="text-amber-600 font-medium">生成 24 题标准卷</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-400">
              请在左侧点击知识节点
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
