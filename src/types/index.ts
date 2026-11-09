/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Subject = 'Math' | 'English' | 'Chinese';
export type GradeLevel = 'G1' | 'G2' | 'G3';

export type UIStyleTheme = 
  | 'playful_warm'       // 风格 1：温暖童趣绘本风（自然护眼、亲和力强）
  | 'modern_editorial'   // 风格 2：现代极简工坊风（北欧克制、印刷品本源）
  | 'cosmic_explorer';   // 风格 3：太空探索空间站（趣味任务、科技充能感）

export type UIThemeStyle = UIStyleTheme;

export type TaskStatus = 
  | 'pending_print'    // 待打印
  | 'in_progress'      // 练习中
  | 'submitted'        // 已上传待批改
  | 'needs_review'     // 待家长人工核对
  | 'completed'        // 已完成
  | 'archived';        // 已归档

export type MasteryLevel = 
  | 'unassessed'       // 未评估
  | 'needs_learning'   // 待学习
  | 'learning'         // 学习中
  | 'reinforcing'      // 待巩固
  | 'initial_mastery'  // 初步掌握
  | 'stable_mastery';  // 稳定掌握

export interface ChildProfile {
  childId: string;
  name: string;        // 嘟嘟
  avatar: string;
  grade: string;       // 一年级
  curriculum: string;
  pointsBalance: number;   // 积分余额（支持线下兑换扣减）
  streakDays: number;
}

export type QuestionSection = 
  | 'speed_arithmetic'  // 一、口算速算达人（看谁算得又对又快）
  | 'comparison'        // 二、在〇里填上“>”、“<”或“=”
  | 'make_ten_split'    // 三、“凑十法”拆数填空乐园
  | 'word_problem';     // 四、解决实际问题小能手

export interface Question {
  questionId: string;
  index: number;
  section: QuestionSection;
  sectionTitle: string;
  type: 'addition_carry' | 'comparison' | 'split_fill' | 'word_problem';
  numA: number;
  numB: number;
  operator: '+' | '-';
  standardAnswer: number | string;  // 数字或比较符号 ">" | "<" | "="
  promptText: string;
  points: number;                   // 该题积分分值（难的题目积分高）
  thinkingHint?: string;            // 算理解析
  compareTarget?: number;           // 比大小的目标数值，如 9 + 5 ○ 13
  contextScenario?: string;         // 解决问题情境描述
}

export interface LearningMaterial {
  worksheetId: string;
  taskId: string;
  childId: string;
  title: string;
  paperType: 'standard_comprehensive' | 'speed_calculation' | 'concept_split';
  subject: Subject;
  knowledgePointId: string;
  version: number;
  totalPages: number;
  totalScore: number;               // 试卷卷面满分（如 100 分）
  totalRewardPoints: number;        // 本卷对应成长积分（难的题目积分高）
  qrCodeUrl: string;
  createdAt: string;
  questions: Question[];
}

export interface QuestionSubmissionResult {
  questionId: string;
  recognizedText: string;
  recognitionConfidence: number;    // 0.0 ~ 1.0
  isCorrect: boolean;
  needsConfirmation: boolean;
  parentCorrectedAnswer?: string;
  finalCorrect: boolean;
  earnedPoints: number;             // 本题实际获得积分
  errorPatternId?: string;         // 关联 Obsidian 中的错误模式 ID
  errorExplanation?: string;       // 诊断依据
}

export interface Submission {
  submissionId: string;
  worksheetId: string;
  taskId: string;
  childId: string;
  submittedAt: string;
  photoUrl: string;
  isMatched: boolean;
  status: 'processing' | 'needs_review' | 'graded';
  results: QuestionSubmissionResult[];
}

export interface LearningTask {
  taskId: string;
  childId: string;
  title: string;
  subject: Subject;
  generationMode: 'plan' | 'custom'; // 按计划生成 vs 临时定制生成
  knowledgePointId: string;
  knowledgePointTitle: string;
  taskType: 'paper_pencil' | 'interactive' | 'voice';
  status: TaskStatus;
  assignedDate: string;
  estimatedMinutes: number;
  recommendReason: string;
  defaultRewardPoints: number;      // 算法建议积分
  customRewardPoints?: number;      // 家长手工调整后的积分
  material: LearningMaterial;
  submission?: Submission;
}

export interface PointTransaction {
  id: string;
  timestamp: string;
  type: 'earned' | 'spent' | 'manual_adjust';
  amount: number;                   // 正数增加，负数扣除
  title: string;
  reason: string;
  balanceAfter: number;
}

export interface KnowledgePointNode {
  id: string;
  subject: Subject;
  grade: GradeLevel;
  title: string;
  description: string;
  status: MasteryLevel;
  evidenceCount: number;
  lastTestedAt: string;
  obsidianPath: string;
  prerequisites: string[];
  errorPatterns: {
    id: string;
    name: string;
    description: string;
    obsidianRef: string;
  }[];
}

export interface CustomTaskRequest {
  title: string;
  knowledgePointId: string;
  paperType: 'standard_comprehensive' | 'speed_calculation' | 'concept_split';
  difficulty: 'normal' | 'advanced' | 'challenge';
  pointsMultiplier: number;
}
