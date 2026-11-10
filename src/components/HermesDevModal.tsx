/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Database,
  FileCode,
  Copy,
  Check,
  RefreshCcw,
  CheckCircle2,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { HermesConnectionConfig } from '../services/apiClient';

interface HermesDevModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HermesConnectionConfig;
  onUpdateConfig: (newConfig: Partial<HermesConnectionConfig>) => void;
  onResetDemo: () => void;
}

export const HermesDevModal: React.FC<HermesDevModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetDemo
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState(config.hermesBaseUrl);

  if (!isOpen) return null;

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const samplePromptForHermes = `# Hermes 调度执行指令：接入 AI 家庭学习系统

你正在作为本地调度中枢对接前端 Web 学习中心。
请严格根据工作区中的《HERMES_INTEGRATION_SPEC.md》执行：

1. 检查飞书多维表格中的 7 张核心业务表（tb_child_profile, tb_knowledge_point, tb_mastery_state, tb_learning_task, tb_learning_material, tb_submission, tb_learning_event）。
2. 在本地 8000 端口启动轻量服务（如 FastAPI / Express），提供前端所需的 GET /api/tasks/today 与 POST /api/submissions/upload 接口。
3. 监听飞书表单拍照上传事件，提取 Worksheet ID，执行分层识别与确定性数学批改。
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--c-overlay)] backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-surface rounded-xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-warn" />
            <h2 className="font-bold text-ink text-base">
              Hermes 调度中枢通信与移交配置
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-3 hover:text-ink-2 hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-ink-2">
          {/* 模式选择 */}
          <div className="bg-warn-bg/60 border border-warn-line/80 rounded-lg p-4 space-y-3">
            <div className="font-bold text-warn flex items-center justify-between">
              <span className="text-sm">当前运行模式</span>
              <span className="font-mono text-[12px] text-warn">
                {config.mode === 'mock' ? '沙箱演示模式' : '本地 Hermes 联调模式'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateConfig({ mode: 'mock' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.mode === 'mock'
                    ? 'bg-surface border-warn-line shadow-tok ring-2 ring-warn/20 text-ink'
                    : 'bg-surface/60 border-line text-ink-3 hover:bg-surface'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  {config.mode === 'mock' && <CheckCircle2 className="w-4 h-4 text-warn" />}
                  沙箱演示模式 (推荐当前体验)
                </div>
                <div className="text-[12px] text-ink-3 mt-1 leading-relaxed">
                  内置完整一年级加法数据、A4打印、分层批改与模拟上传，无需额外配置即可体验全部流程。
                </div>
              </button>

              <button
                onClick={() => onUpdateConfig({ mode: 'hermes_local' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.mode === 'hermes_local'
                    ? 'bg-surface border-warn-line shadow-tok ring-2 ring-warn/20 text-ink'
                    : 'bg-surface/60 border-line text-ink-3 hover:bg-surface'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  {config.mode === 'hermes_local' && <CheckCircle2 className="w-4 h-4 text-warn" />}
                  本地 Hermes 联调模式
                </div>
                <div className="text-[12px] text-ink-3 mt-1 leading-relaxed">
                  前端直接向本地 Hermes 发送请求，读取飞书与 Obsidian 真实数据。
                </div>
              </button>
            </div>

            {config.mode === 'hermes_local' && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-ink-2 font-semibold shrink-0">本地 Hermes API 地址:</span>
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  onBlur={() => onUpdateConfig({ hermesBaseUrl: localUrl })}
                  className="flex-1 px-3 py-1.5 bg-surface border border-line-strong rounded-lg font-mono text-xs focus:ring-2 focus:ring-warn"
                  placeholder="http://localhost:8000"
                />
                <button
                  onClick={() => onUpdateConfig({ hermesBaseUrl: localUrl })}
                  className="px-3 py-1.5 bg-surface text-ink rounded-lg font-semibold hover:bg-surface-3"
                >
                  保存
                </button>
              </div>
            )}
          </div>

          {/* 飞书多维表格与 Obsidian 对接规范 */}
          <div className="space-y-3">
            <div className="font-bold text-ink text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-ok" />
              <span>给 Hermes 的飞书与 Obsidian 对接规范已生成</span>
            </div>
            <p className="text-ink-3 text-xs">
              在工程根目录下，已为您生成了标准的 <strong>HERMES_INTEGRATION_SPEC.md</strong> 文件。它包含飞书多维表格 7 张表的完整字段定义、表单视角配置说明，以及 Obsidian 知识卡片标准。
            </p>

            <div className="bg-surface text-ink-2 rounded-lg p-4 font-mono text-[12px] space-y-2 relative">
              <div className="flex items-center justify-between text-ink-3 pb-2 border-b border-line">
                <span className="flex items-center gap-1.5 text-xs">
                  <Terminal className="w-3.5 h-3.5 text-warn" />
                  可以直接复制给本地 Hermes 的委托 Prompt
                </span>
                <button
                  onClick={() => copyToClipboard('prompt', samplePromptForHermes)}
                  className="flex items-center gap-1 text-[12px] text-warn hover:text-warn"
                >
                  {copiedKey === 'prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'prompt' ? '已复制' : '复制 Prompt'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-ink-2">
                {samplePromptForHermes}
              </pre>
            </div>
          </div>

          {/* 数据重置 */}
          <div className="pt-4 border-t border-line flex items-center justify-between">
            <div>
              <div className="font-bold text-ink">重置沙箱测试数据</div>
              <div className="text-ink-3 text-[12px]">
                清空当前的模拟作答或修改，恢复为最初的“待打印”演示状态。
              </div>
            </div>
            <button
              onClick={() => {
                onResetDemo();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-xl border border-line text-ink-2 hover:bg-surface-3 flex items-center gap-1.5 font-medium transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>重置数据</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
