/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMakeTenSplit,
  generateAuthenticGrade1Exam,
  evaluateAnswer,
  generateWorksheetId
} from './mathGenerator.ts';

test('calculateMakeTenSplit: 9 + 4 splits 4 into 1 and 3 correctly', () => {
  const result = calculateMakeTenSplit(9, 4);
  assert.equal(result.need, 1);
  assert.equal(result.rem, 3);
  assert.match(result.hintText, /把 4 分成 1 和 3/);
});

test('generateAuthenticGrade1Exam: generates 24 questions across 4 authentic sections', () => {
  const questions = generateAuthenticGrade1Exam();
  assert.equal(questions.length, 24, 'Comprehensive exam paper must have 24 questions');

  const speedCount = questions.filter(q => q.section === 'speed_arithmetic').length;
  const compareCount = questions.filter(q => q.section === 'comparison').length;
  const splitCount = questions.filter(q => q.section === 'make_ten_split').length;
  const wordCount = questions.filter(q => q.section === 'word_problem').length;

  assert.equal(speedCount, 12, '12 speed arithmetic problems');
  assert.equal(compareCount, 6, '6 comparison problems');
  assert.equal(splitCount, 4, '4 make-ten split problems');
  assert.equal(wordCount, 2, '2 word problems');
});

test('generateAuthenticGrade1Exam: harder questions award higher points', () => {
  const questions = generateAuthenticGrade1Exam();
  const speedQ = questions.find(q => q.section === 'speed_arithmetic');
  const compareQ = questions.find(q => q.section === 'comparison');
  const wordQ = questions.find(q => q.section === 'word_problem');

  assert.equal(speedQ?.points, 1, 'Basic speed arithmetic is 1 point');
  assert.equal(compareQ?.points, 2, 'Comparison is 2 points');
  assert.equal(wordQ?.points, 3, 'Word problem is 3 points');
});

test('evaluateAnswer: handles comparison symbol correctly', () => {
  const q = {
    questionId: 'Q13',
    index: 13,
    section: 'comparison' as const,
    sectionTitle: '比大小',
    type: 'comparison' as const,
    numA: 9,
    numB: 5,
    operator: '+' as const,
    standardAnswer: '<',
    promptText: '9 + 5 〇 15',
    points: 2
  };

  const res = evaluateAnswer(q, '<', 0.95);
  assert.equal(res.isCorrect, true);
  assert.equal(res.earnedPoints, 2);

  const resWrong = evaluateAnswer(q, '>', 0.95);
  assert.equal(resWrong.isCorrect, false);
  assert.equal(resWrong.earnedPoints, 0);
  assert.equal(resWrong.errorPatternId, 'ERR-MATH-COMPARE-CONFUSED');
});

test('generateWorksheetId: follows WS-M1-YYYYMMDD-XXXX format', () => {
  const id = generateWorksheetId();
  assert.match(id, /^WS-M1-\d{8}-[0-9A-F]{4}$/);
});
