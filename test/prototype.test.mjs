import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { demoQuestionSet } from '../prototype/data/demoQuestions.js';
import { createGameState, submitAnswer, advanceQuestion } from '../prototype/gameFlow.js';

const prototypeRoot = fileURLToPath(new URL('../prototype/', import.meta.url));

test('原型 HTML 明確使用同一 SVG favicon，避免瀏覽器請求缺少的 /favicon.ico', () => {
  assert.ok(existsSync(path.join(prototypeRoot, 'favicon.svg')));
  for (const page of ['index.html', 'teacher-review.html', 'character-preview.html']) {
    const html = readFileSync(path.join(prototypeRoot, page), 'utf8');
    assert.match(html, /rel="icon"\s+type="image\/svg\+xml"\s+href="\.\/favicon\.svg"/);
  }
});

test('原型題組只使用本機示範資料，題目與選項識別碼唯一且答案有效', () => {
  assert.equal(demoQuestionSet.datasetStatus, 'prototype_demo_only');
  assert.equal(demoQuestionSet.questions.length, 5);
  const questionIds = demoQuestionSet.questions.map((question) => question.prototypeQuestionId);
  assert.equal(new Set(questionIds).size, questionIds.length);
  for (const question of demoQuestionSet.questions) {
    const optionIds = question.options.map((option) => option.optionId);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(optionIds).size, optionIds.length);
    assert.ok(optionIds.includes(question.answerId));
    assert.ok(question.explanation.length > 0);
    assert.ok(question.hint?.trim(), `${question.prototypeQuestionId} should provide a hint`);
    const answerText = question.options.find(({ optionId }) => optionId === question.answerId).text;
    assert.equal(question.hint.includes(answerText), false, `${question.prototypeQuestionId} hint should not reveal the answer option`);
  }
});

test('答對得一顆星，答錯不加星，單題不能重複計分', () => {
  const question = demoQuestionSet.questions[0];
  const initial = createGameState(demoQuestionSet.questions.length);
  const correct = submitAnswer(initial, question, question.answerId);
  assert.equal(correct.isCorrect, true);
  assert.equal(correct.state.score, 1);
  const repeated = submitAnswer(correct.state, question, question.options[1].optionId);
  assert.equal(repeated.changed, false);
  assert.equal(repeated.state.score, 1);

  const wrong = submitAnswer(initial, question, question.options[1].optionId);
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.state.score, 0);
});

test('下一題保留分數，最後一題完成關卡，重新挑戰重設狀態', () => {
  let state = createGameState(demoQuestionSet.questions.length);
  for (const question of demoQuestionSet.questions) {
    state = submitAnswer(state, question, question.answerId).state;
    state = advanceQuestion(state, demoQuestionSet.questions.length);
  }
  assert.equal(state.complete, true);
  assert.equal(state.score, 5);
  assert.equal(advanceQuestion(state, 5), state);

  const retry = createGameState(demoQuestionSet.questions.length);
  assert.deepEqual(retry, { questionIndex: 0, score: 0, answered: false, lastAnswerCorrect: null, complete: false });
});

test('未作答前不能跳題，題目計分狀態使用固定規則', () => {
  const state = createGameState(5);
  assert.equal(advanceQuestion(state, 5), state);
  const wrong = submitAnswer(state, demoQuestionSet.questions[0], 'unknown-option');
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.state.score, 0);
  assert.equal(wrong.state.answered, true);
});
