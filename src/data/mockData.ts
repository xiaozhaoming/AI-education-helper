/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChildProfile, LearningTask, KnowledgePointNode, PointTransaction } from '../types';
import { createWorksheetMaterial } from '../utils/mathGenerator';

export const INITIAL_CHILD_PROFILE: ChildProfile = {
  childId: 'CHILD_001',
  name: '嘟嘟',
  avatar: '🚀',
  grade: '一年级',
  curriculum: '人教版',
  pointsBalance: 125, // 当前可用总积分
  streakDays: 6
};

export const INITIAL_POINT_TRANSACTIONS: PointTransaction[] = [
  {
    id: 'TX-20261108-01',
    timestamp: '2026-11-08 19:30',
    type: 'earned',
    amount: 38,
    title: '完成数学综合练习卷',
    reason: '按计划完成 24 道 20 以内进位加法综合题，准确率高',
    balanceAfter: 125
  },
  {
    id: 'TX-20261107-02',
    timestamp: '2026-11-07 16:45',
    type: 'spent',
    amount: -50,
    title: '线下物理奖励兑换',
    reason: '周末兑换拼搭乐高机械飞船一套（家长手工扣减）',
    balanceAfter: 87
  },
  {
    id: 'TX-20261106-01',
    timestamp: '2026-11-06 20:10',
    type: 'earned',
    amount: 32,
    title: '完成口算速练卡',
    reason: '32 题进位口算达标测试获得',
    balanceAfter: 137
  },
  {
    id: 'TX-20261105-02',
    timestamp: '2026-11-05 18:20',
    type: 'spent',
    amount: -25,
    title: '线下物理奖励兑换',
    reason: '兑换家庭观影看纪录片 40 分钟（家长手工扣减）',
    balanceAfter: 105
  },
  {
    id: 'TX-20261101-01',
    timestamp: '2026-11-01 09:00',
    type: 'earned',
    amount: 50,
    title: '系统初始成长基金',
    reason: '嘟嘟加入 AI 家庭学习系统初始赠送',
    balanceAfter: 130
  }
];

export const INITIAL_LEARNING_TASK: LearningTask = {
  taskId: 'TASK-20261109-001',
  childId: 'CHILD_001',
  title: '一年级数学每日计划卷：20以内进位加法综合测试',
  subject: 'Math',
  generationMode: 'plan', // 按计划生成
  knowledgePointId: 'MATH-G1-ADD-CARRY-001',
  knowledgePointTitle: '20以内进位加法（凑十法）',
  taskType: 'paper_pencil',
  status: 'pending_print',
  assignedDate: '2026-11-09',
  estimatedMinutes: 15,
  recommendReason: 'Hermes 结合星图学情：嘟嘟已熟练掌握 10 以内加法，当前处于 20 以内进位加法巩固期，按教学大纲规划 24 题综合测试卷（含口算、比大小、凑十拆数与应用题）。',
  defaultRewardPoints: 38,
  customRewardPoints: 38,
  material: createWorksheetMaterial('TASK-20261109-001', 'CHILD_001', undefined, '小学一年级数学：20以内进位加法综合练习卷')
};

export const INITIAL_KNOWLEDGE_POINTS: KnowledgePointNode[] = [
  {
    id: 'MATH-G1-NUM-001',
    subject: 'Math',
    grade: 'G1',
    title: '1~10 的认识与数的分与合',
    description: '数字顺序、大小比对及 10 的组成（凑十的基础）。',
    status: 'stable_mastery',
    evidenceCount: 16,
    lastTestedAt: '2026-11-05',
    obsidianPath: '02_Concepts/Math/MATH-G1-NUM-001.md',
    prerequisites: [],
    errorPatterns: []
  },
  {
    id: 'MATH-G1-ADD-001',
    subject: 'Math',
    grade: 'G1',
    title: '10 以内加法与不进位加法',
    description: '理解加法含义与合起来的计数过程。',
    status: 'stable_mastery',
    evidenceCount: 20,
    lastTestedAt: '2026-11-06',
    obsidianPath: '02_Concepts/Math/MATH-G1-ADD-001.md',
    prerequisites: ['MATH-G1-NUM-001'],
    errorPatterns: []
  },
  {
    id: 'MATH-G1-ADD-CARRY-001',
    subject: 'Math',
    grade: 'G1',
    title: '20 以内进位加法（凑十法）',
    description: '小学一年级第一座计算高峰，看大数、拆小数、凑成十、加剩数。',
    status: 'learning', // 当前教学重点
    evidenceCount: 8,
    lastTestedAt: '2026-11-08',
    obsidianPath: '02_Concepts/Math/MATH-G1-ADD-CARRY-001.md',
    prerequisites: ['MATH-G1-NUM-001', 'MATH-G1-ADD-001'],
    errorPatterns: [
      {
        id: 'ERR-MATH-CARRY-MISSED',
        name: '进位遗漏',
        description: '个位满十未进1，仅写个位数。',
        obsidianRef: '03_Error-Patterns/Math/ERR-MATH-CARRY-MISSED.md'
      },
      {
        id: 'ERR-MATH-MAKE10-CONFUSE',
        name: '拆数点数偏差',
        description: '凑十拆数时产生正负1的微小计数误差。',
        obsidianRef: '03_Error-Patterns/Math/ERR-MATH-MAKE10-CONFUSE.md'
      }
    ]
  },
  {
    id: 'MATH-G1-SUB-BORROW-001',
    subject: 'Math',
    grade: 'G1',
    title: '20 以内退位减法（破十法）',
    description: '十几减几退位减法算理，下一阶段核心学习目标。',
    status: 'needs_learning',
    evidenceCount: 0,
    lastTestedAt: '-',
    obsidianPath: '02_Concepts/Math/MATH-G1-SUB-BORROW-001.md',
    prerequisites: ['MATH-G1-ADD-CARRY-001'],
    errorPatterns: []
  },
  {
    id: 'MATH-G1-CLOCK-001',
    subject: 'Math',
    grade: 'G1',
    title: '认识钟表（整时与半时）',
    description: '分针、时针的运转观察与现实作息时间对应。',
    status: 'unassessed',
    evidenceCount: 0,
    lastTestedAt: '-',
    obsidianPath: '02_Concepts/Math/MATH-G1-CLOCK-001.md',
    prerequisites: ['MATH-G1-NUM-001'],
    errorPatterns: []
  }
];
