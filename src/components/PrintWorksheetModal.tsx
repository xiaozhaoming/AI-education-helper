/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import { LearningMaterial, ChildProfile, Question } from '../types';
import { generateQrMatrixSvg } from '../utils/mathGenerator';

type PreviewQuestion = Omit<Question, 'type'> & {
  type: Question['type'] | 'fill_blank';
  qtype?: 'direct' | 'fill_blank';
};

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
  const [previewQuestions, setPreviewQuestions] = useState<PreviewQuestion[]>(
    material.questions
  );
  const [activeWorksheetId, setActiveWorksheetId] = useState<string>(material.worksheetId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewQuestions(material.questions);
      setActiveWorksheetId(material.worksheetId);   // 重开弹窗回到原卷
    }
  }, [isOpen, material.questions]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:8000/api/worksheet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: material.childId,
          knowledge_point_id: material.knowledgePointId,
          seed: null,
          avoid_last_n: 3
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setToastMessage(data?.message || `换题失败：HTTP ${res.status}`);
        return;
      }
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        setToastMessage('换题失败：后端未返回题目');
        return;
      }
      setPreviewQuestions(data.questions.map((q: any, i: number): PreviewQuestion => {
        const isFillBlank = q.qtype === 'fill_blank';
        const a = Number(isFillBlank ? q.known_addend : q.num_a);
        const b = Number(isFillBlank ? q.unknown_addend : q.num_b);
        return {
          questionId: String(q.question_id || `Q${String(i + 1).padStart(2, '0')}`),
          index: Number(q.index ?? i + 1),
          section: 'speed_arithmetic',
          sectionTitle: '一、口算速算达人',
          type: isFillBlank ? 'fill_blank' : 'addition_carry',
          qtype: isFillBlank ? 'fill_blank' : 'direct',
          numA: a,
          numB: b,
          operator: '+',
          standardAnswer: Number(q.expected),
          promptText: isFillBlank ? String(q.prompt) : `${a} + ${b} = `,
          points: 1
        };
      }));
      if (data.worksheet_id) setActiveWorksheetId(String(data.worksheet_id));
      setActiveTab('worksheet');
      setToastMessage(`已换一批题 · seed ${data.seed}${data.worksheet_id ? '' : '（卷号未返回）'}`);
    } catch (e) {
      setToastMessage((e as Error).message || '换题失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    onPrinted();
    window.print();
  };

  const qrSvgHtml = generateQrMatrixSvg(material.qrCodeUrl, 68);

  // 分题型组织各模块
  const speedQuestions = previewQuestions.filter(q => q.section === 'speed_arithmetic');
  const compareQuestions = previewQuestions.filter(q => q.section === 'comparison');
  const splitQuestions = previewQuestions.filter(q => q.section === 'make_ten_split');
  const wordQuestions = previewQuestions.filter(q => q.section === 'word_problem');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-surface/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-surface print:static">
      <div className="relative w-full max-w-5xl bg-surface rounded-xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* 顶部控制栏 (打印时自动隐藏) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-ink text-sm">
              真实试卷标准排版预览（共 {previewQuestions.length} 题）
            </span>
            <div className="flex items-center gap-1 p-1 bg-surface-3/80 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('worksheet')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'worksheet'
                    ? 'bg-surface text-ink shadow-tok'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                学生试卷作答版 (打印此页)
              </button>
              <button
                onClick={() => setActiveTab('answerKey')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'answerKey'
                    ? 'bg-surface text-ink shadow-tok'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                家长独立答案与评分版
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-line-strong bg-surface text-ink hover:bg-surface-3 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? '生成中…' : '换一批题'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-warn hover:bg-warn-line text-warn-on text-xs font-bold shadow-tok transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>调起系统打印 (Ctrl/Cmd+P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-ink-3 hover:text-ink-2 hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 滚动预览区 */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-surface-3/50 print:bg-surface print:p-0">
          {activeTab === 'worksheet' ? (
            /* 标准 A4 真实试卷布局 */
            <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-surface p-8 sm:p-10 shadow-md border border-line/80 print:shadow-none print:border-none print:p-6 print:m-0 space-y-5 text-ink font-sans">
              {/* 页眉与二维码防伪标识 */}
              <div className="flex items-start justify-between border-b-2 border-black pb-3">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-ink-3 uppercase tracking-widest">
                    AI 家庭学习系统 · 小学一年级数学期中/单元同步标准卷
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                    {material.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-5 text-xs text-ink-2 pt-1">
                    <span>姓名：<strong className="underline underline-offset-4">{profile.name}</strong></span>
                    <span>年级：<strong>{profile.grade}</strong></span>
                    <span>答题时间：<strong>40分钟</strong></span>
                    <span>满分：<strong>100分</strong></span>
                    <span>实得分：________</span>
                  </div>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-16 h-16 border border-line-strong p-1 rounded-sm bg-surface"
                    dangerouslySetInnerHTML={{ __html: qrSvgHtml }}
                  />
                  <div className="text-[9px] font-mono font-bold text-ink-2 mt-1">
                    {activeWorksheetId}
                  </div>
                  <div className="text-[8px] text-ink-3">Page 1 / 1</div>
                </div>
              </div>

              {/* 模块一：看谁算得又对又快（口算速达 - 4 列排版） */}
              {speedQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-ink bg-surface-2 px-2.5 py-1 rounded border-l-3 border-warn-line">
                    一、看谁算得又对又快（口算达人，每题 1 分，共 {speedQuestions.length} 分）
                  </div>
                  <div className="grid grid-cols-4 gap-x-4 gap-y-3 pt-1 px-1">
                    {speedQuestions.map((q) => (
                      <div
                        key={q.questionId}
                        className="flex items-center justify-between text-sm sm:text-base font-bold font-mono py-1 px-2 border-b border-dashed border-line-strong"
                      >
                        <span className="text-ink">
                          {q.promptText}
                        </span>
                        <span className="text-ink-2 font-normal text-xs">（   ）</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 模块二：在 〇 里填上“>”、“<”或“=”（2 列排版） */}
              {compareQuestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-ink bg-surface-2 px-2.5 py-1 rounded border-l-3 border-warn-line">
                    二、在 〇 里填上“&gt;”、“&lt;”或“=”（每题 2 分，共 {compareQuestions.length * 2} 分）
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-1 px-1">
                    {compareQuestions.map((q) => (
                      <div
                        key={q.questionId}
                        className="flex items-center justify-between text-sm sm:text-base font-bold font-mono py-1.5 px-3 bg-surface-2/60 rounded-lg border border-line"
                      >
                        <span className="text-ink">{q.numA} + {q.numB}</span>
                        <div className="w-6 h-6 rounded-full border border-black/40 flex items-center justify-center text-xs text-ink-2 font-normal">
                          〇
                        </div>
                        <span className="text-ink">{q.compareTarget}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 模块三：“凑十法”拆数填空乐园 */}
              {splitQuestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-ink bg-surface-2 px-2.5 py-1 rounded border-l-3 border-warn-line">
                    三、按“凑十法”算理拆数填空（每题 2 分，共 {splitQuestions.length * 2} 分）
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1 px-1">
                    {splitQuestions.map((q) => (
                      <div
                        key={q.questionId}
                        className="p-3 rounded-xl border border-line bg-surface space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black font-mono text-ink">
                            {q.numA} + {q.numB} = <span className="inline-block w-10 border-b-2 border-line" />
                          </span>
                          <span className="text-[10px] text-ink-3">大数想凑十</span>
                        </div>
                        <div className="text-xs text-ink-2 flex items-center gap-2 pt-1 border-t border-dashed border-line">
                          <span>想：把 {q.numB} 分成</span>
                          <span className="inline-block w-6 h-5 border border-black/40 rounded text-center text-ink-2"> </span>
                          <span>和</span>
                          <span className="inline-block w-6 h-5 border border-black/40 rounded text-center text-ink-2"> </span>
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
                  <div className="text-xs font-bold text-ink bg-surface-2 px-2.5 py-1 rounded border-l-3 border-warn-line">
                    四、看图与生活情境列式计算（解决问题，每题 3 分，共 {wordQuestions.length * 3} 分）
                  </div>
                  <div className="space-y-3 pt-1 px-1">
                    {wordQuestions.map((q, idx) => (
                      <div
                        key={q.questionId}
                        className="p-3.5 rounded-xl border border-line bg-surface space-y-2 text-xs"
                      >
                        <div className="font-semibold text-ink leading-relaxed">
                          {idx + 1}. {q.contextScenario}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-bold text-ink text-sm font-mono">
                            列式计算：______________________________
                          </span>
                          <span className="text-ink-3 text-[11px]">答：（   ）</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 页脚说明 */}
              <div className="pt-4 border-t border-line-strong flex items-center justify-between text-[10px] text-ink-3">
                <div>
                  作答完成后，请家长使用<strong>飞书表单拍照上传</strong>。数字系统负责智能批改与学情统计。
                </div>
                <div>纸笔独立作答 · 工整书写</div>
              </div>
            </div>
          ) : (
            /* 家长独立标准答案版 */
            <div className="max-w-[210mm] mx-auto bg-surface p-8 sm:p-10 shadow-md border border-line rounded-lg space-y-6 text-ink">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <div className="text-xs font-bold text-ok uppercase">
                    家长备查答案与诊断标准
                  </div>
                  <h2 className="text-xl font-bold text-ink">
                    {material.title} · 标准答案与评分点
                  </h2>
                  <div className="text-xs text-ink-3">
                    练习编号：{activeWorksheetId} · 满分 100 分 · 对应成长积分 {material.totalRewardPoints} 分
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-ok-bg text-ok text-xs font-semibold flex items-center gap-1.5 border border-ok-line">
                  <CheckCircle2 className="w-4 h-4 text-ok" />
                  已通过程序化双重校验
                </div>
              </div>

              <div className="bg-warn-bg border border-warn-line p-4 rounded-xl text-xs text-warn flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-warn shrink-0 mt-0.5" />
                <div>
                  <strong>防泄漏说明：</strong>
                  本答案版仅供家长快速核对或在系统异常时代为查验，请勿直接展示给孩子，培养孩子独立验算习惯。
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-ink mb-2">一、口算部分标准答案：</h3>
                  <div className="grid grid-cols-4 gap-2 font-mono">
                    {speedQuestions.map(q => (
                      <div key={q.questionId} className="p-2 bg-surface-2 rounded border">
                        {q.type === 'fill_blank' ? (
                          <> {q.numA} + □ = {q.numA + (q.numB ?? 0)} <strong className="text-ok">→ {q.standardAnswer}</strong> </>
                        ) : (
                          <> {q.numA} + {q.numB} = <strong className="text-ok">{q.standardAnswer}</strong> </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-ink mb-2">二、比大小标准答案：</h3>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    {compareQuestions.map(q => (
                      <div key={q.questionId} className="p-2 bg-surface-2 rounded border">
                        {q.numA}+{q.numB} <strong className="text-ok text-sm">[{q.standardAnswer}]</strong> {q.compareTarget}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-ink mb-2">三、凑十拆数与四、应用题解析：</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {splitQuestions.concat(wordQuestions).map(q => (
                      <div key={q.questionId} className="p-2.5 bg-surface-2 rounded-xl border space-y-1">
                        <div className="font-bold text-ink">
                          {q.questionId}: {q.promptText} <span className="text-ok">{q.standardAnswer}</span>
                        </div>
                        <div className="text-ink-3 text-[11px]">{q.thinkingHint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] bg-surface text-ink px-5 py-3.5 rounded-lg shadow-xl text-xs font-medium max-w-md border border-line print:hidden">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
