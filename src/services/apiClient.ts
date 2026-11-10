/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChildProfile,
  LearningTask,
  LearningMaterial,
  Question,
  KnowledgePointNode,
  Submission,
  QuestionSubmissionResult,
  PointTransaction,
  CustomTaskRequest
} from '../types';
import {
  INITIAL_CHILD_PROFILE,
  INITIAL_LEARNING_TASK,
  INITIAL_KNOWLEDGE_POINTS,
  INITIAL_POINT_TRANSACTIONS
} from '../data/mockData';
import {
  createWorksheetMaterial,
  generateAuthenticGrade1Exam,
  evaluateAnswer
} from '../utils/mathGenerator';

export interface HermesConnectionConfig {
  mode: 'mock' | 'hermes_local';
  hermesBaseUrl: string;
  feishuAppId?: string;
  obsidianVaultPath?: string;
}

const STORAGE_KEY_CONFIG = 'ai_kids_hermes_config_v2';
const STORAGE_KEY_TASK = 'ai_kids_current_task_v2';
const STORAGE_KEY_PROFILE = 'ai_kids_child_profile_v2';
const STORAGE_KEY_TRANSACTIONS = 'ai_kids_transactions_v2';

/** 飞书任务状态（中文）→ 前端 TaskStatus */
function mapTaskStatus(s: string): LearningTask['status'] {
  if (s.includes('待开始') || s.includes('草拟') || s.includes('待审核')) return 'pending_print';
  if (s.includes('进行中')) return 'in_progress';
  if (s.includes('待批改')) return 'submitted';
  if (s.includes('待确认')) return 'needs_review';
  if (s.includes('已完成')) return 'completed';
  if (s.includes('已取消')) return 'archived';
  return 'pending_print';
}

/** 后端不可达时的明确错误，避免静默 fallback 到假数据 */
export class HermesUnavailableError extends Error {
  constructor(path: string, detail: string) {
    super(`Hermes 本地服务不可用（${path}）：${detail}`);
    this.name = 'HermesUnavailableError';
  }
}

class ApiService {
  private config: HermesConnectionConfig = {
    mode: 'mock',
    hermesBaseUrl: 'http://localhost:8000',
    feishuAppId: 'cli_a1b2c3d4e5',
    obsidianVaultPath: '~/Documents/Child-Learning-Vault'
  };

  private profile: ChildProfile = { ...INITIAL_CHILD_PROFILE };
  private currentTask: LearningTask = { ...INITIAL_LEARNING_TASK };
  private knowledgePoints: KnowledgePointNode[] = [...INITIAL_KNOWLEDGE_POINTS];
  private transactions: PointTransaction[] = [...INITIAL_POINT_TRANSACTIONS];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) this.config = JSON.parse(savedConfig);

      const savedTask = localStorage.getItem(STORAGE_KEY_TASK);
      if (savedTask) this.currentTask = JSON.parse(savedTask);

      const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (savedProfile) this.profile = JSON.parse(savedProfile);

      const savedTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (savedTx) this.transactions = JSON.parse(savedTx);
    } catch {
      // LocalStorage error fallback
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      localStorage.setItem(STORAGE_KEY_TASK, JSON.stringify(this.currentTask));
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(this.profile));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(this.transactions));
    } catch {
      // LocalStorage error fallback
    }
  }

  public getConfig(): HermesConnectionConfig {
    return { ...this.config };
  }

  public isHermesMode(): boolean {
    return this.config.mode === 'hermes_local';
  }

  /** 底层 HTTP：只走本机 8000，超时即报错，不静默降级 */
  private async http<T>(path: string, init?: RequestInit): Promise<T> {
    const base = this.config.hermesBaseUrl.replace(/\/$/, '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(`${base}${path}`, {
        ...init,
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {})
        }
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new HermesUnavailableError(path, `HTTP ${res.status} ${body.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof HermesUnavailableError) throw e;
      throw new HermesUnavailableError(path, (e as Error).message || '网络请求失败');
    } finally {
      clearTimeout(timer);
    }
  }

  /** 后端 profile → 前端 ChildProfile（字段名与类型都不同，必须显式映射） */
  private mapProfile(raw: any): ChildProfile {
    return {
      childId: String(raw.child_id ?? ''),
      name: String(raw.name ?? ''),
      avatar: '',
      grade: String(raw.grade ?? '一年级'),
      curriculum: String(raw.textbook ?? '人教版'),
      pointsBalance: Number(raw.stars ?? 0),
      streakDays: Number(raw.streak_days ?? 0)
    };
  }

  /**
   * 后端 worksheet(questions_frontend) → 前端 LearningMaterial
   * 注意：后端题目只有加法题，这里统一归到 speed_arithmetic 段。
   */
  private mapMaterial(ws: any, taskId: string, childId: string, title: string): LearningMaterial {
    const src: any[] = ws?.questions_frontend || [];
    const questions: Question[] = src.map((q, i) => ({
      questionId: q.questionId,
      index: Number(q.index ?? i + 1),
      section: (q.section || 'speed_arithmetic') as Question['section'],
      sectionTitle: q.sectionTitle || '一、口算速算达人',
      type: (q.type || 'addition_carry') as Question['type'],
      numA: Number(q.numA),
      numB: Number(q.numB),
      operator: '+',
      standardAnswer: Number(q.standardAnswer),
      promptText: q.promptText || `${q.numA} + ${q.numB} = `,
      points: Number(q.points ?? 1),
      thinkingHint: q.thinkingHint
    }));

    const totalRewardPoints = questions.reduce((s, q) => s + q.points, 0);
    return {
      worksheetId: String(ws.worksheet_id ?? ''),
      taskId,
      childId,
      title,
      paperType: 'standard_comprehensive',
      subject: 'Math',
      knowledgePointId: 'MATH-G1-ADD-CARRY-001',
      version: 1,
      totalPages: 1,
      totalScore: 100,
      totalRewardPoints,
      qrCodeUrl: `aikids://ws/${ws.worksheet_id}`,
      createdAt: new Date().toISOString(),
      questions
    };
  }

  /** 后端 knowledge_points → 前端 KnowledgePointNode[] */
  private mapKnowledgePoints(list: any[]): KnowledgePointNode[] {
    return (list || []).map((k) => ({
      id: String(k.id ?? ''),
      subject: (k.subject || 'Math') as KnowledgePointNode['subject'],
      grade: 'G1' as KnowledgePointNode['grade'],
      title: String(k.title ?? ''),
      description: String(k.description ?? ''),
      status: (k.status || 'unassessed') as KnowledgePointNode['status'],
      evidenceCount: Number(k.evidenceCount ?? 0),
      lastTestedAt: String(k.lastTestedAt ?? ''),
      obsidianPath: String(k.obsidianPath ?? ''),
      prerequisites: Array.isArray(k.prerequisites) ? k.prerequisites : [],
      errorPatterns: Array.isArray(k.errorPatterns)
        ? k.errorPatterns.map((e: any) => ({
            id: String(e.id ?? ''),
            name: String(e.name ?? ''),
            description: String(e.description ?? ''),
            obsidianRef: String(e.obsidianRef ?? '')
          }))
        : []
    }));
  }

  public updateConfig(newConfig: Partial<HermesConnectionConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
  }

  public async getChildProfile(): Promise<ChildProfile> {
    if (this.isHermesMode()) {
      const r = await this.http<{ ok: boolean; profile: any }>('/api/child/profile');
      this.profile = this.mapProfile(r.profile);
      this.saveState();
      return { ...this.profile };
    }
    return { ...this.profile };
  }

  public async getTodayTask(): Promise<LearningTask> {
    if (this.isHermesMode()) {
      const r = await this.http<{ ok: boolean; tasks: any[] }>('/api/tasks/today');
      const t = (r.tasks || [])[0];
      if (!t) {
        throw new HermesUnavailableError('/api/tasks/today', '飞书中没有今日任务，请先发布今日练习卷');
      }
      const mat = (t.materials || [])[0];
      if (!mat?.worksheet_id) {
        throw new HermesUnavailableError('/api/tasks/today', '今日任务缺少练习材料');
      }
      const ws = await this.http<any>(`/api/worksheet/${encodeURIComponent(mat.worksheet_id)}`);
      const material = this.mapMaterial(
        { ...ws, worksheet_id: mat.worksheet_id },
        String(t.task_id),
        String(t.child_id),
        String(t.goal || '今日练习')
      );
      this.currentTask = {
        taskId: String(t.task_id),
        childId: String(t.child_id),
        title: String(t.goal || '今日练习'),
        subject: 'Math',
        generationMode: 'plan',
        knowledgePointId: String(t.knowledge_point_id || 'MATH-G1-ADD-CARRY-001'),
        knowledgePointTitle: '20 以内进位加法（凑十法）',
        taskType: 'paper_pencil',
        status: mapTaskStatus(String(t.status || '')),
        assignedDate: String(t.date || new Date().toISOString().slice(0, 10)),
        estimatedMinutes: Number(t.est_minutes || 10),
        recommendReason: String(t.description || ''),
        defaultRewardPoints: material.totalRewardPoints,
        customRewardPoints: material.totalRewardPoints,
        material
      };

      // 把后端带回的最近一次批改明细接进任务，否则复核页拿不到真实结果（会显示空白）
      const ls = t.latest_submission;
      if (ls && Array.isArray(ls.items) && ls.items.length) {
        const lsResults: QuestionSubmissionResult[] = ls.items.map((it: any) => {
          const q = material.questions.find((x) => x.questionId === it.question_id);
          const correct = String(it.result || '') === '正确';
          const conf = Number(it.confidence ?? 0);
          return {
            questionId: String(it.question_id || ''),
            recognizedText:
              it.child_answer === null || it.child_answer === undefined
                ? ''
                : String(it.child_answer),
            recognitionConfidence: conf,
            isCorrect: correct,
            // 无法判定 / 置信度不足 → 必须家长核对（与后端门禁口径一致）
            needsConfirmation: String(it.result || '') === '无法判定' || conf < 0.85,
            finalCorrect: correct,
            earnedPoints: correct ? (q?.points ?? 0) : 0,
            errorPatternId: it.err_pattern_id || undefined,
            errorExplanation: it.err_note || undefined
          };
        });

        this.currentTask.submission = {
          submissionId: String(ls.submission_id || ls.record_id || ''),
          worksheetId: String(ls.worksheet_id || mat.worksheet_id),
          taskId: String(t.task_id),
          childId: String(t.child_id),
          submittedAt: ls.uploaded_at ? new Date(Number(ls.uploaded_at)).toISOString() : '',
          photoUrl: '',
          isMatched: true,
          status: lsResults.some((r) => r.needsConfirmation) ? 'needs_review' : 'graded',
          results: lsResults
        };
      }

      this.saveState();
      return { ...this.currentTask };
    }
    return { ...this.currentTask };
  }

  public async getKnowledgePoints(query?: string): Promise<KnowledgePointNode[]> {
    if (this.isHermesMode()) {
      const r = await this.http<{ ok: boolean; knowledge_points: any[] }>(`/api/knowledge/points${query || ''}`);
      this.knowledgePoints = this.mapKnowledgePoints(r.knowledge_points);
      return [...this.knowledgePoints];
    }
    return [...this.knowledgePoints];
  }

  public async getPointTransactions(): Promise<PointTransaction[]> {
    if (this.isHermesMode()) {
      const r = await this.http<{ ok: boolean; transactions: any[] }>('/api/points/transactions');
      this.transactions = (r.transactions || []).map((t: any) => ({
        id: String(t.id ?? t.record_id ?? ''),
        timestamp: String(t.timestamp ?? ''),
        type: (t.type || 'earned') as PointTransaction['type'],
        amount: Number(t.amount ?? 0),
        title: String(t.title ?? ''),
        reason: String(t.reason ?? ''),
        balanceAfter: Number(t.balanceAfter ?? 0)
      }));
      return [...this.transactions];
    }
    return [...this.transactions];
  }

  /**
   * 家长手工调整本次任务的奖励积分
   */
  public async updateTaskRewardPoints(newPoints: number): Promise<LearningTask> {
    this.currentTask.customRewardPoints = newPoints;
    this.saveState();
    return { ...this.currentTask };
  }

  /**
   * 家长在线下物理世界奖励孩子消耗积分（手工扣减积分）
   */
  public async spendPoints(amount: number, reason: string): Promise<ChildProfile> {
    if (this.isHermesMode()) {
      await this.http('/api/points/adjust', {
        method: 'POST',
        body: JSON.stringify({ amount: -Math.abs(amount), reason, kind: 'spend' })
      });
      return this.getChildProfile();
    }
    const deductAmount = Math.abs(amount);
    this.profile.pointsBalance = Math.max(0, this.profile.pointsBalance - deductAmount);

    const tx: PointTransaction = {
      id: `TX-${Date.now().toString().slice(-8)}`,
      timestamp: new Date().toLocaleString(),
      type: 'spent',
      amount: -deductAmount,
      title: '线下物理奖励兑换',
      reason: reason || '家长手工核销扣减',
      balanceAfter: this.profile.pointsBalance
    };

    this.transactions.unshift(tx);
    this.saveState();
    return { ...this.profile };
  }

  /**
   * 家长手工给孩子增加或补偿积分
   */
  public async addPoints(amount: number, reason: string): Promise<ChildProfile> {
    if (this.isHermesMode()) {
      await this.http('/api/points/adjust', {
        method: 'POST',
        body: JSON.stringify({ amount: Math.abs(amount), reason, kind: 'manual' })
      });
      return this.getChildProfile();
    }
    const addAmount = Math.abs(amount);
    this.profile.pointsBalance += addAmount;

    const tx: PointTransaction = {
      id: `TX-${Date.now().toString().slice(-8)}`,
      timestamp: new Date().toLocaleString(),
      type: 'manual_adjust',
      amount: addAmount,
      title: '家长手工奖励加分',
      reason: reason || '优秀表现手工加分',
      balanceAfter: this.profile.pointsBalance
    };

    this.transactions.unshift(tx);
    this.saveState();
    return { ...this.profile };
  }

  public async markTaskInProgress(): Promise<LearningTask> {
    if (this.currentTask.status === 'pending_print') {
      this.currentTask.status = 'in_progress';
      this.saveState();
    }
    return { ...this.currentTask };
  }

  /**
   * 真实上传：照片 → 后端识别+确定性批改+门禁+归因+回写飞书
   * 替代原来的纯模拟路径。返回 {task, backend} 让 UI 能如实展示门禁原因。
   */
  public async submitPhotoReal(file: File): Promise<{ task: LearningTask; backend: any }> {
    const task = this.currentTask;
    const form = new FormData();
    form.append('file', file);
    form.append('worksheet_id', task.material.worksheetId);
    form.append('child_id', task.childId);

    const base = this.config.hermesBaseUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/api/submissions/ingest`, { method: 'POST', body: form });
    const body = await res.json().catch(() => ({ ok: false, error: '响应非 JSON' }));
    if (!res.ok || !body.ok) {
      throw new HermesUnavailableError(
        '/api/submissions/ingest',
        body?.error || body?.hint || `HTTP ${res.status}`
      );
    }

    // 后端 graded.items → 前端 QuestionSubmissionResult[]
    const items: any[] = body.graded?.items || [];
    const results: QuestionSubmissionResult[] = items.map((it: any) => {
      const q = task.material.questions.find((x) => x.questionId === it.question_id);
      const correct = it.result === '正确';
      return {
        questionId: it.question_id,
        recognizedText:
          it.child_answer === null || it.child_answer === undefined
            ? ''
            : String(it.child_answer),
        recognitionConfidence: Number(it.confidence ?? 0),
        isCorrect: correct,
        needsConfirmation: it.gate === 'human',
        finalCorrect: correct,
        earnedPoints: correct ? (q?.points ?? 0) : 0,
        errorPatternId: it.err_pattern_hint || undefined,
        errorExplanation: it.err_note || undefined
      };
    });

    const needsReview = results.some((r) => r.needsConfirmation);
    const submission: Submission = {
      submissionId: body.submission?.record_id || `SUB-${Date.now()}`,
      worksheetId: task.material.worksheetId,
      taskId: task.taskId,
      childId: task.childId,
      submittedAt: new Date().toISOString(),
      photoUrl: body.local_file || '',
      isMatched: true,
      status: needsReview ? 'needs_review' : 'graded',
      results
    };

    task.submission = submission;
    (task as any).backendSummary = body.graded?.summary;
    (task as any).backendReasons = body.graded?.reason_codes;
    (task as any).mastery = body.mastery;
    task.status = needsReview ? 'needs_review' : 'completed';

    this.saveState();
    return { task: { ...task }, backend: body };
  }

  /**
   * 模拟飞书表单视角拍照上传与分层批改（仅 mock 模式使用）
   */
  public async submitPhotoSimulation(
    options: {
      hasLowConfidence?: boolean;
      hasError?: boolean;
    } = {}
  ): Promise<LearningTask> {
    if (this.isHermesMode()) {
      throw new HermesUnavailableError(
        '/api/submissions/ingest',
        '本地模式不接受模拟上传，请用「上传答卷照片」走真实识别'
      );
    }
    const task = this.currentTask;
    const questions = task.material.questions;

    const results: QuestionSubmissionResult[] = questions.map((q, idx) => {
      let simAnswer = String(q.standardAnswer);
      let confidence = 0.96;

      // 模拟 Q2 低置信度（字迹涂改，如 8+5=13，置信度 0.68）
      if (options.hasLowConfidence && idx === 1) {
        simAnswer = String(q.standardAnswer);
        confidence = 0.68;
      }

      // 模拟 Q13 比大小错误
      if (options.hasError && q.type === 'comparison' && idx === 12) {
        simAnswer = q.standardAnswer === '>' ? '<' : '>';
        confidence = 0.94;
      }

      return evaluateAnswer(q, simAnswer, confidence);
    });

    const hasAnyNeedsConfirm = results.some(r => r.needsConfirmation);
    const earnedPointsTotal = results.reduce((sum, r) => sum + r.earnedPoints, 0);

    const submission: Submission = {
      submissionId: `SUB-${Date.now().toString().slice(-6)}`,
      worksheetId: task.material.worksheetId,
      taskId: task.taskId,
      childId: task.childId,
      submittedAt: new Date().toISOString(),
      photoUrl: 'simulated_photo_worksheet.jpg',
      isMatched: true,
      status: hasAnyNeedsConfirm ? 'needs_review' : 'graded',
      results
    };

    task.submission = submission;
    task.status = hasAnyNeedsConfirm ? 'needs_review' : 'completed';

    // 如果全部批改无歧义完成，发放积分入账
    if (task.status === 'completed') {
      const awardPoints = task.customRewardPoints ?? task.defaultRewardPoints;
      this.profile.pointsBalance += awardPoints;

      this.transactions.unshift({
        id: `TX-${Date.now().toString().slice(-8)}`,
        timestamp: new Date().toLocaleString(),
        type: 'earned',
        amount: awardPoints,
        title: `完成练习卷：《${task.title}》`,
        reason: `系统分层批改完成，共答对 ${results.filter(r => r.finalCorrect).length}/${results.length} 题`,
        balanceAfter: this.profile.pointsBalance
      });
    }

    this.saveState();
    return { ...this.currentTask };
  }

  /**
   * 家长在复核界面修正/确认
   */
  public async confirmParentReview(
    questionId: string,
    correctedAnswer: string,
    confirmedCorrect: boolean
  ): Promise<LearningTask> {
    if (this.isHermesMode()) {
      const task = this.currentTask;
      const sub = task.submission;
      if (!sub) throw new HermesUnavailableError('/api/submissions/review', '当前任务没有提交记录');
      const q = task.material.questions.find((x) => x.questionId === questionId);
      // 修正后的判定仍走确定性校验：int(答案) === numA + numB，绝不信 UI 传来的布尔
      const parsed = parseInt(String(correctedAnswer).trim(), 10);
      const detCorrect =
        !isNaN(parsed) && q ? parsed === Number(q.standardAnswer) : confirmedCorrect;

      await this.http('/api/submissions/review', {
        method: 'POST',
        body: JSON.stringify({
          submission_record_id: sub.submissionId,
          worksheet_id: sub.worksheetId,
          child_id: sub.childId,
          reviewer: '家长',
          items: [
            {
              question_id: questionId,
              result: detCorrect ? '正确' : '错误',
              child_answer: String(correctedAnswer),
              note: detCorrect ? '' : '家长核对修正'
            }
          ]
        })
      });

      // 本地视图同步
      const item = sub.results.find((r) => r.questionId === questionId);
      if (item) {
        item.needsConfirmation = false;
        item.parentCorrectedAnswer = correctedAnswer;
        item.finalCorrect = detCorrect;
        item.earnedPoints = detCorrect && q ? q.points : 0;
      }
      if (!sub.results.some((r) => r.needsConfirmation)) {
        sub.status = 'graded';
        task.status = 'completed';
      }
      this.saveState();
      return { ...task };
    }
    if (!this.currentTask.submission) return this.currentTask;

    const item = this.currentTask.submission.results.find(r => r.questionId === questionId);
    if (item) {
      item.needsConfirmation = false;
      item.parentCorrectedAnswer = correctedAnswer;
      item.finalCorrect = confirmedCorrect;
      const question = this.currentTask.material.questions.find(q => q.questionId === questionId);
      item.earnedPoints = confirmedCorrect && question ? question.points : 0;
    }

    const stillNeedsConfirm = this.currentTask.submission.results.some(r => r.needsConfirmation);
    if (!stillNeedsConfirm) {
      this.currentTask.submission.status = 'graded';
      this.currentTask.status = 'completed';

      const awardPoints = this.currentTask.customRewardPoints ?? this.currentTask.defaultRewardPoints;
      this.profile.pointsBalance += awardPoints;

      this.transactions.unshift({
        id: `TX-${Date.now().toString().slice(-8)}`,
        timestamp: new Date().toLocaleString(),
        type: 'earned',
        amount: awardPoints,
        title: `家长核实确认：《${this.currentTask.title}》`,
        reason: '家长完成笔迹复核，正式结题并发放积分',
        balanceAfter: this.profile.pointsBalance
      });
    }

    this.saveState();
    return { ...this.currentTask };
  }

  /**
   * 生成模式 1：按计划生成（与知识点星图耦合）
   */
  public async generatePlanTask(): Promise<LearningTask> {
    const newQuestions = generateAuthenticGrade1Exam(undefined, 'standard_comprehensive');
    const newTaskId = `TASK-PLAN-${Date.now().toString().slice(-6)}`;
    const newMaterial = createWorksheetMaterial(newTaskId, this.profile.childId, newQuestions, '一年级数学教学计划卷：20以内进位加法综合测试');
    const defaultPts = newMaterial.totalRewardPoints;

    this.currentTask = {
      taskId: newTaskId,
      childId: this.profile.childId,
      title: '一年级数学每日计划卷：20以内进位加法综合测试',
      subject: 'Math',
      generationMode: 'plan',
      knowledgePointId: 'MATH-G1-ADD-CARRY-001',
      knowledgePointTitle: '20以内进位加法（凑十法）',
      taskType: 'paper_pencil',
      status: 'pending_print',
      assignedDate: new Date().toISOString().split('T')[0],
      estimatedMinutes: 15,
      recommendReason: 'Hermes 结合星图学情：当前处于 20 以内进位加法巩固期，按计划生成 24 题综合练习卷（口算、比大小、凑十拆数与应用题）。',
      defaultRewardPoints: defaultPts,
      customRewardPoints: defaultPts,
      material: newMaterial
    };

    this.saveState();
    return { ...this.currentTask };
  }

  /**
   * 生成模式 2：临时定制需求生成（按家长定制需求生成试卷）
   */
  public async generateCustomTask(req: CustomTaskRequest): Promise<LearningTask> {
    const newQuestions = generateAuthenticGrade1Exam(req.title, req.paperType);
    const newTaskId = `TASK-CUSTOM-${Date.now().toString().slice(-6)}`;
    const newMaterial = createWorksheetMaterial(newTaskId, this.profile.childId, newQuestions, req.title, req.paperType);

    const basePts = newMaterial.totalRewardPoints;
    const finalPts = Math.round(basePts * req.pointsMultiplier);

    this.currentTask = {
      taskId: newTaskId,
      childId: this.profile.childId,
      title: req.title,
      subject: 'Math',
      generationMode: 'custom',
      knowledgePointId: req.knowledgePointId,
      knowledgePointTitle: '定制需求专项练习',
      taskType: 'paper_pencil',
      status: 'pending_print',
      assignedDate: new Date().toISOString().split('T')[0],
      estimatedMinutes: req.paperType === 'speed_calculation' ? 10 : 15,
      recommendReason: `家长临时定制模式：难度 [${req.difficulty === 'challenge' ? '高挑战' : req.difficulty === 'advanced' ? '进阶' : '标准'}]，共 ${newQuestions.length} 道题。`,
      defaultRewardPoints: finalPts,
      customRewardPoints: finalPts,
      material: newMaterial
    };

    this.saveState();
    return { ...this.currentTask };
  }

  public resetToDefaultDemo() {
    localStorage.removeItem(STORAGE_KEY_TASK);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
    this.profile = { ...INITIAL_CHILD_PROFILE };
    this.currentTask = { ...INITIAL_LEARNING_TASK };
    this.transactions = [...INITIAL_POINT_TRANSACTIONS];
    this.saveState();
  }
}

export const apiClient = new ApiService();
