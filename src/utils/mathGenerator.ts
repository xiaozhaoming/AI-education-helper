/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question, LearningMaterial, QuestionSubmissionResult } from '../types';

/**
 * 20以内进位加法（凑十法）常见加数对池
 */
export const GRADE_1_CARRY_ADDITION_PAIRS: [number, number][] = [
  [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7], [9, 8], [9, 9],
  [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [8, 8], [8, 9],
  [7, 4], [7, 5], [7, 6], [7, 7], [7, 8], [7, 9],
  [6, 5], [6, 6], [6, 7], [6, 8], [6, 9]
];

export function calculateMakeTenSplit(numA: number, numB: number) {
  const need = 10 - numA;
  const rem = numB - need;
  return {
    need,
    rem,
    hintText: `把 ${numB} 分成 ${need} 和 ${rem}，${numA} 加 ${need} 得 10，10 加 ${rem} 得 ${numA + numB}。`
  };
}

/**
 * 生成符合中国小学一年级真实期中期末标准的综合试卷（24 题标准结构）
 * 包含四大题型模块：
 * 一、口算速算达人（看谁算得又对又快 - 12 题，每题 1 积分）
 * 二、在〇里填上“>”、“<”或“=”（6 题，每题 2 积分）
 * 三、“凑十法”拆数填空乐园（4 题，每题 2 积分）
 * 四、解决问题小能手（2 题，每题 3 积分）
 */
export function generateAuthenticGrade1Exam(
  customTitle?: string,
  paperType: 'standard_comprehensive' | 'speed_calculation' | 'concept_split' = 'standard_comprehensive'
): Question[] {
  const shuffledPairs = [...GRADE_1_CARRY_ADDITION_PAIRS].sort(() => 0.5 - Math.random());

  if (paperType === 'speed_calculation') {
    // 纯口算测试卡：32 道口算题（4 列 x 8 行，每题 1 分）
    return shuffledPairs.slice(0, 32).map((pair, idx) => ({
      questionId: `Q${idx + 1}`,
      index: idx + 1,
      section: 'speed_arithmetic',
      sectionTitle: '一、口算冲刺测试（4列排版）',
      type: 'addition_carry',
      numA: pair[0],
      numB: pair[1],
      operator: '+',
      standardAnswer: pair[0] + pair[1],
      promptText: `${pair[0]} + ${pair[1]} = `,
      points: 1,
      thinkingHint: `${pair[0]} + ${pair[1]} = ${pair[0] + pair[1]}`
    }));
  }

  const questions: Question[] = [];
  let qIndex = 1;

  // 模块一：口算达人（12 题，每题 1 积分，基础算式）
  const part1Pairs = shuffledPairs.slice(0, 12);
  part1Pairs.forEach((pair) => {
    const sum = pair[0] + pair[1];
    questions.push({
      questionId: `Q${qIndex}`,
      index: qIndex,
      section: 'speed_arithmetic',
      sectionTitle: '一、看谁算得又对又快（口算速达）',
      type: 'addition_carry',
      numA: pair[0],
      numB: pair[1],
      operator: '+',
      standardAnswer: sum,
      promptText: `${pair[0]} + ${pair[1]} = `,
      points: 1,
      thinkingHint: calculateMakeTenSplit(pair[0], pair[1]).hintText
    });
    qIndex++;
  });

  // 模块二：在〇里填上“>”、“<”或“=”（6 题，每题 2 积分，较难）
  const comparePairs = [
    { a: 9, b: 5, target: 15 }, // 14 < 15
    { a: 8, b: 6, target: 14 }, // 14 = 14
    { a: 7, b: 5, target: 11 }, // 12 > 11
    { a: 8, b: 8, target: 17 }, // 16 < 17
    { a: 9, b: 4, target: 13 }, // 13 = 13
    { a: 6, b: 7, target: 12 }  // 13 > 12
  ];

  comparePairs.forEach((item) => {
    const sum = item.a + item.b;
    let expectedSymbol = '=';
    if (sum > item.target) expectedSymbol = '>';
    if (sum < item.target) expectedSymbol = '<';

    questions.push({
      questionId: `Q${qIndex}`,
      index: qIndex,
      section: 'comparison',
      sectionTitle: '二、在 〇 里填上“>”、“<”或“=”',
      type: 'comparison',
      numA: item.a,
      numB: item.b,
      operator: '+',
      compareTarget: item.target,
      standardAnswer: expectedSymbol,
      promptText: `${item.a} + ${item.b} 〇 ${item.target}`,
      points: 2,
      thinkingHint: `${item.a} + ${item.b} = ${sum}，与 ${item.target} 比较，填“${expectedSymbol}”。`
    });
    qIndex++;
  });

  // 模块三：“凑十法”拆数填空乐园（4 题，每题 2 积分）
  const splitPairs = [
    { a: 9, b: 4 },
    { a: 8, b: 5 },
    { a: 7, b: 6 },
    { a: 6, b: 5 }
  ];

  splitPairs.forEach((item) => {
    const sum = item.a + item.b;
    const split = calculateMakeTenSplit(item.a, item.b);
    questions.push({
      questionId: `Q${qIndex}`,
      index: qIndex,
      section: 'make_ten_split',
      sectionTitle: '三、按“凑十法”算理拆数填空',
      type: 'split_fill',
      numA: item.a,
      numB: item.b,
      operator: '+',
      standardAnswer: sum,
      promptText: `${item.a} + ${item.b} = `,
      points: 2,
      thinkingHint: split.hintText
    });
    qIndex++;
  });

  // 模块四：解决实际问题小能手（2 题，每题 3 积分，最难综合题）
  const wordProblems = [
    {
      scenario: '树上原来有 8 只小鸟，又飞来了 5 只，现在一共有多少只小鸟？',
      a: 8,
      b: 5,
      ans: 13
    },
    {
      scenario: '花丛里有 9 朵红花，6 朵黄花，花丛里一共有多少朵花？',
      a: 9,
      b: 6,
      ans: 15
    }
  ];

  wordProblems.forEach((wp) => {
    questions.push({
      questionId: `Q${qIndex}`,
      index: qIndex,
      section: 'word_problem',
      sectionTitle: '四、看生活情境列式计算（解决问题）',
      type: 'word_problem',
      numA: wp.a,
      numB: wp.b,
      operator: '+',
      contextScenario: wp.scenario,
      standardAnswer: wp.ans,
      promptText: `列式：${wp.a} + ${wp.b} = `,
      points: 3,
      thinkingHint: `列式：${wp.a} + ${wp.b} = ${wp.ans}（只/朵）。`
    });
    qIndex++;
  });

  return questions;
}

export function generateWorksheetId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `WS-M1-${y}${m}${d}-${hex}`;
}

/**
 * 创建练习材料实体
 */
export function createWorksheetMaterial(
  taskId: string,
  childId: string,
  customQuestions?: Question[],
  customTitle?: string,
  paperType: 'standard_comprehensive' | 'speed_calculation' | 'concept_split' = 'standard_comprehensive'
): LearningMaterial {
  const wsId = generateWorksheetId();
  const questions = customQuestions || generateAuthenticGrade1Exam(customTitle, paperType);
  const totalRewardPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return {
    worksheetId: wsId,
    taskId,
    childId,
    title: customTitle || '小学一年级数学：20以内进位加法综合练习卷',
    paperType,
    subject: 'Math',
    knowledgePointId: 'MATH-G1-ADD-CARRY-001',
    version: 1,
    totalPages: 1,
    totalScore: 100,
    totalRewardPoints,
    qrCodeUrl: `aikids://ws/${wsId}?p=1`,
    createdAt: new Date().toISOString(),
    questions
  };
}

/**
 * 分层批改逻辑（支持数字得数与比较符号）
 */
export function evaluateAnswer(
  question: Question,
  recognizedText: string,
  confidence: number
): QuestionSubmissionResult {
  const trimmed = recognizedText.trim();
  let isCorrect = false;

  if (question.type === 'comparison') {
    // 比较符号判断
    isCorrect = trimmed === question.standardAnswer;
  } else {
    // 数值判断
    const parsed = parseInt(trimmed, 10);
    isCorrect = !isNaN(parsed) && parsed === Number(question.standardAnswer);
  }

  const needsConfirmation = confidence < 0.85;
  const earnedPoints = isCorrect ? question.points : 0;

  let errorPatternId: string | undefined = undefined;
  let errorExplanation: string | undefined = undefined;

  if (!isCorrect) {
    if (question.type === 'addition_carry') {
      const parsed = parseInt(trimmed, 10);
      if (parsed === Number(question.standardAnswer) - 10) {
        errorPatternId = 'ERR-MATH-CARRY-MISSED';
        errorExplanation = '个位满十未向十位进1，遗漏进位。';
      } else if (Math.abs(parsed - Number(question.standardAnswer)) === 1) {
        errorPatternId = 'ERR-MATH-MAKE10-CONFUSE';
        errorExplanation = '凑十拆数或加剩余数出现点数正负1偏差。';
      } else {
        errorPatternId = 'ERR-MATH-GENERAL-COMPUTE';
        errorExplanation = '计算偏差，建议结合小棒或十格阵直观验证。';
      }
    } else if (question.type === 'comparison') {
      errorPatternId = 'ERR-MATH-COMPARE-CONFUSED';
      errorExplanation = '大于号与小于号开口方向易混淆，或左侧和计算未算准。';
    }
  }

  return {
    questionId: question.questionId,
    recognizedText: trimmed,
    recognitionConfidence: confidence,
    isCorrect,
    needsConfirmation,
    finalCorrect: isCorrect,
    earnedPoints,
    errorPatternId,
    errorExplanation
  };
}

/**
 * 确定性 QR 码 SVG 渲染
 */
export function generateQrMatrixSvg(text: string, size: number = 72): string {
  const dim = 21;
  const grid: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));

  const drawCorner = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawCorner(0, 0);
  drawCorner(14, 0);
  drawCorner(0, 14);

  for (let i = 8; i < 13; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIndex = 0;
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= 13;
      const inBL = r >= 13 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !isTiming) {
        grid[r][c] = ((hash >> (bitIndex % 31)) & 1) === 1;
        bitIndex++;
      }
    }
  }

  const cellSize = size / dim;
  let rects = '';
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#0f172a" />`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#ffffff"/>${rects}</svg>`;
}
