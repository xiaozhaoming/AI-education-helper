/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Printer, CheckCircle2, ShieldAlert } from 'lucide-react';
import { LearningMaterial, ChildProfile } from '../types';
import { generateQrMatrixSvg } from '../utils/mathGenerator';

interface PrintWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: LearningMaterial;
  profile: ChildProfile;
  onPrinted: () => void;
}

export const PrintWorksheetModal: React.FC<PrintWorksheetModalProps> = ({
  isOpen,
  onClose,
  material,
  profile,
  onPrinted
}) => {
  const [activeTab, setActiveTab] = useState<'worksheet' | 'answerKey'>('worksheet');

  if (!isOpen) return null;

  const handlePrint = () => {
    onPrinted();
    window.print();
  };

  const qrSvgHtml = generateQrMatrixSvg(material.qrCodeUrl, 68);

  // 分题型组织各模块
  const speedQuestions = material.questions.filter(q => q.section === 'speed_arithmetic');
  const compareQuestions = material.questions.filter(q => q.section === 'comparison');
  const splitQuestions = material.questions.filter(q => q.section === 'make_ten_split');
  const wordQuestions = material.questions.filter(q => q.section === 'word_problem');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* 顶部控制栏 (打印时自动隐藏) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-sm">
              真实试卷标准排版预览（共 {material.questions.length} 题）
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('worksheet')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'worksheet'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                学生试卷作答版 (打印此页)
              </button>
              <button
                onClick={() => setActiveTab('answerKey')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'answerKey'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                家长独立答案与评分版
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>调起系统打印 (Ctrl/Cmd+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 滚动预览区 */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/50 print:bg-white print:p-0">
          {activeTab === 'worksheet' ? (
            /* 标准 A4 真实试卷布局 */
            <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 sm:p-10 shadow-md border border-slate-200/80 print:shadow-none print:border-none print:p-6 print:m-0 space-y-5 text-slate-900 font-sans">
              {/* 页眉与二维码防伪标识 */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    AI 家庭学习系统 · 小学一年级数学期中/单元同步标准卷
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {material.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700 pt-1">
                    <span>姓名：<strong className="underline underline-offset-4">{profile.name}</strong></span>
                    <span>年级：<strong>{profile.grade}</strong></span>
                    <span>答题时间：<strong>40分钟</strong></span>
                    <span>满分：<strong>100分</strong></span>
                    <span>实得分：________</span>
                  </div>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-16 h-16 border border-slate-300 p-1 rounded-sm bg-white"
                    dangerouslySetInnerHTML={{ __html: qrSvgHtml }}
                  />
                  <div className="text-[9px] font-mono font-bold text-slate-700 mt-1">
                    {material.worksheetId}
                  </div>
                  <div className="text-[8px] text-slate-400">Page 1 / 1</div>
                </div>
              </div>

              {/* 模块一：看谁算得又对又快（口算速达 - 4 列排版） */}
              {speedQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border-l-3 border-amber-500">
                    一、看谁算得又对又快（口算达人，每题 1 分，共 {speedQuestions.length} 分）
                  </div>
                  <div className="grid grid-cols-4 gap-x-4 gap-y-3 pt-1 px-1">
                    {speedQuestions.map((q) => (
                      <div
                        key={q.questionId}
                        className="flex items-center justify-between text-sm sm:text-base font-bold font-mono py-1 px-2 border-b border-dashed border-slate-300"
                      >
                        <span className="text-slate-800">
                          {q.promptText}
                        </span>
                        <span className="text-slate-300 font-normal text-xs">（   ）</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 模块二：在 〇 里填上“>”、“<”或“=”（2 列排版） */}
              {compareQuestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border-l-3 border-amber-500">
                    二、在 〇 里填上“&gt;”、“&lt;”或“=”（每题 2 分，共 {compareQuestions.length * 2} 分）
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-1 px-1">
                    {compareQuestions.map((q) => (
                      <div
                        key={q.questionId}
                        className="flex items-center justify-between text-sm sm:text-base font-bold font-mono py-1.5 px-3 bg-slate-50/60 rounded-lg border border-slate-200"
                      >
                        <span className="text-slate-800">{q.numA} + {q.numB}</span>
                        <div className="w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-xs text-slate-300 font-normal">
                          〇
                        </div>
                        <span className="text-slate-800">{q.compareTarget}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 模块三：“凑十法”拆数填空乐园 */}
              {splitQuestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border-l-3 border-amber-500">
                    三、按“凑十法”算理拆数填空（每题 2 分，共 {splitQuestions.length * 2} 分）
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1 px-1">
                    {splitQuestions.map((q) => (
                      <div
                        key={q.questionId}
                        className="p-3 rounded-xl border border-slate-200 bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black font-mono text-slate-900">
                            {q.numA} + {q.numB} = <span className="inline-block w-10 border-b-2 border-slate-700" />
                          </span>
                          <span className="text-[10px] text-slate-400">大数想凑十</span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2 pt-1 border-t border-dashed border-slate-200">
                          <span>想：把 {q.numB} 分成</span>
                          <span className="inline-block w-6 h-5 border border-slate-400 rounded text-center text-slate-300"> </span>
                          <span>和</span>
                          <span className="inline-block w-6 h-5 border border-slate-400 rounded text-center text-slate-300"> </span>
                          <span>，凑成十再加剩数。</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 模块四：解决实际问题小能手 */}
              {wordQuestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border-l-3 border-amber-500">
                    四、看图与生活情境列式计算（解决问题，每题 3 分，共 {wordQuestions.length * 3} 分）
                  </div>
                  <div className="space-y-3 pt-1 px-1">
                    {wordQuestions.map((q, idx) => (
                      <div
                        key={q.questionId}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                      >
                        <div className="font-semibold text-slate-800 leading-relaxed">
                          {idx + 1}. {q.contextScenario}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-bold text-slate-900 text-sm font-mono">
                            列式计算：______________________________
                          </span>
                          <span className="text-slate-400 text-[11px]">答：（   ）</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 页脚说明 */}
              <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-400">
                <div>
                  作答完成后，请家长使用<strong>飞书表单拍照上传</strong>。数字系统负责智能批改与学情统计。
                </div>
                <div>纸笔独立作答 · 工整书写</div>
              </div>
            </div>
          ) : (
            /* 家长独立标准答案版 */
            <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-10 shadow-md border border-slate-200 rounded-2xl space-y-6 text-slate-900">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <div className="text-xs font-bold text-emerald-600 uppercase">
                    家长备查答案与诊断标准
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {material.title} · 标准答案与评分点
                  </h2>
                  <div className="text-xs text-slate-500">
                    练习编号：{material.worksheetId} · 满分 100 分 · 对应成长积分 {material.totalRewardPoints} 分
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  已通过程序化双重校验
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>防泄漏说明：</strong>
                  本答案版仅供家长快速核对或在系统异常时代为查验，请勿直接展示给孩子，培养孩子独立验算习惯。
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">一、口算部分标准答案：</h3>
                  <div className="grid grid-cols-4 gap-2 font-mono">
                    {speedQuestions.map(q => (
                      <div key={q.questionId} className="p-2 bg-slate-50 rounded border">
                        {q.numA} + {q.numB} = <strong className="text-emerald-600">{q.standardAnswer}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-2">二、比大小标准答案：</h3>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    {compareQuestions.map(q => (
                      <div key={q.questionId} className="p-2 bg-slate-50 rounded border">
                        {q.numA}+{q.numB} <strong className="text-emerald-600 text-sm">[{q.standardAnswer}]</strong> {q.compareTarget}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-2">三、凑十拆数与四、应用题解析：</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {splitQuestions.concat(wordQuestions).map(q => (
                      <div key={q.questionId} className="p-2.5 bg-slate-50 rounded-xl border space-y-1">
                        <div className="font-bold text-slate-800">
                          {q.questionId}: {q.promptText} <span className="text-emerald-600">{q.standardAnswer}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{q.thinkingHint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
