/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChildProfile,
  LearningTask,
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

  public updateConfig(newConfig: Partial<HermesConnectionConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
  }

  public async getChildProfile(): Promise<ChildProfile> {
    return { ...this.profile };
  }

  public async getTodayTask(): Promise<LearningTask> {
    return { ...this.currentTask };
  }

  public async getKnowledgePoints(): Promise<KnowledgePointNode[]> {
    return [...this.knowledgePoints];
  }

  public async getPointTransactions(): Promise<PointTransaction[]> {
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
   * 模拟飞书表单视角拍照上传与分层批改
   */
  public async submitPhotoSimulation(
    options: {
      hasLowConfidence?: boolean;
      hasError?: boolean;
    } = {}
  ): Promise<LearningTask> {
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
