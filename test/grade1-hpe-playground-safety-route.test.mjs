import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE1_PLAYGROUND_SAFETY_ROUTE as task } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

function act(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.error, undefined, `${action} should be valid`);
  return result.session;
}

function assign(session, observationId, categoryId) {
  return act(session, 'assign_category', { observationId, categoryId });
}

function pressToken(session, tokenId) {
  return act(session, 'add_phrase_token', { tokenId });
}

function submit(session, submissionId) {
  return act(session, 'submit', { submissionId });
}

function assertNotReady(session, stage, submissionId) {
  const result = dispatchLearningTask(session, task, 'submit', { submissionId });
  assert.equal(result.error, 'response_required');
  assert.equal(result.session.phase, 'active');
  assert.equal(stage.stageId, task.stages[result.session.stageIndex].stageId);
}

function assertAnnotated(text, tokens) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `missing pronunciation tokens: ${text}`);
  assert.equal(tokens.map(({ text: character }) => character).join(''), text, `token order/alignment: ${text}`);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han token must not receive a reading: ${token.text}`);
  }
  const html = renderStudentText(text, tokens);
  const expectedPairs = [...text].filter((character) => /\p{Script=Han}/u.test(character)).length;
  assert.equal((html.match(/class="zhuyin-pair"/gu) ?? []).length, expectedPairs, `rendered Hanzi pair count: ${text}`);
}

function assertStagePronunciation(stage) {
  assertAnnotated(stage.prompt, stage.promptPronunciationTokens);
  if (stage.studentOperationGuidance !== undefined) {
    assertAnnotated(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
  }
  if (stage.studentSubmitLabel !== undefined) {
    assertAnnotated(stage.studentSubmitLabel, stage.studentSubmitLabelPronunciationTokens);
  }
  for (const line of stage.context ?? []) {
    assertAnnotated(line.speaker, line.speakerPronunciationTokens);
    assertAnnotated(line.text, line.pronunciationTokens);
  }
  for (const observation of stage.observations ?? []) assertAnnotated(observation.text, observation.pronunciationTokens);
  for (const category of stage.categories ?? []) assertAnnotated(category.label, category.pronunciationTokens);
  for (const token of stage.tokens ?? []) assertAnnotated(token.text, token.pronunciationTokens);
  for (const option of stage.options ?? []) {
    assertAnnotated(option.text, option.pronunciationTokens);
    assertAnnotated(option.feedback, option.feedbackPronunciationTokens);
  }
  for (const hint of stage.hints ?? []) assertAnnotated(hint.text, hint.pronunciationTokens);
  assertAnnotated(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
  assertAnnotated(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
}

function startTask(sessionId) {
  return act(createLearningTaskSession(task, sessionId), 'start');
}

function finishStage1(session) {
  const stage = task.stages[0];
  for (const [observationId, categoryId] of Object.entries(stage.correctAssignments)) {
    session = assign(session, observationId, categoryId);
  }
  return submit(session, 'hpe-stage1-correct');
}

function enterStage2(sessionId) {
  let session = finishStage1(startTask(sessionId));
  assert.equal(session.phase, 'success');
  session = act(session, 'next');
  assert.equal(task.stages[session.stageIndex].stageId, 'order-response-to-blocked-route');
  return session;
}

test('一年級 HPE 安全路線活動保留課綱、stage、interaction 與核心 ID contract', () => {
  assert.equal(task.activityId, 'ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE');
  assert.equal(task.gradeId, 'grade-1');
  assert.equal(task.subjectId, 'health-physical-education');
  assert.equal(task.curriculumMapId, 'health-pe-stage1-playground-and-school-route-safety');
  assert.deepEqual(task.curriculumCodes, ['Ba-Ⅰ-1']);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(validateLearningTask(task), []);
  assert.deepEqual(task.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['inspect-playground-and-school-route-scenes', 'classify_observations'],
    ['order-response-to-blocked-route', 'assemble_response'],
    ['transfer-to-unfamiliar-playground-scene', 'choose_response'],
  ]);

  const [classify, order, transfer] = task.stages;
  assert.deepEqual(classify.observations.map(({ id }) => id), ['use-marked-route', 'wait-at-gate', 'run-between-play', 'leave-adult']);
  assert.deepEqual(classify.categories.map(({ id }) => id), ['safer-choice', 'stop-and-get-adult']);
  assert.deepEqual(classify.categories.map(({ label }) => label), ['可以照原來做', '要停下找大人']);
  assert.deepEqual(classify.correctAssignments, {
    'use-marked-route': 'safer-choice',
    'wait-at-gate': 'stop-and-get-adult',
    'run-between-play': 'stop-and-get-adult',
    'leave-adult': 'stop-and-get-adult',
  });
  assert.equal(order.requiredSelectionCount, 4, 'the required count is explicit stage metadata');
  assert.deepEqual(order.tokens.map(({ id }) => id), ['step-stop', 'step-stay', 'step-tell', 'step-follow', 'step-run', 'step-hide']);
  assert.deepEqual(order.correctOptionIds, ['step-stop', 'step-stay', 'step-tell', 'step-follow']);
  assert.equal(transfer.correctOptionIds[0], 'transfer-stop-tell');
});

test('分類未完成時不能提交；四張分類完成才可提交，正確分類成功', () => {
  const stage = task.stages[0];
  let session = startTask('hpe-classify-flow');
  assertNotReady(session, stage, 'hpe-classify-empty');
  session = assign(session, 'use-marked-route', 'safer-choice');
  session = assign(session, 'wait-at-gate', 'stop-and-get-adult');
  session = assign(session, 'run-between-play', 'stop-and-get-adult');
  assertNotReady(session, stage, 'hpe-classify-three');
  session = assign(session, 'leave-adult', 'stop-and-get-adult');
  session = submit(session, 'hpe-classify-all-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.attempts.at(-1).result, 'correct');
});

test('排序關 1–3/4 未完成，4/4 可檢查且錯選或錯序仍由 scoring 判錯', () => {
  const stage = task.stages[1];
  let session = enterStage2('hpe-order-count');
  assertNotReady(session, stage, 'hpe-order-zero');
  for (const tokenId of stage.correctOptionIds.slice(0, 3)) {
    session = pressToken(session, tokenId);
    assertNotReady(session, stage, `hpe-order-${session.selection.length}`);
  }
  session = pressToken(session, stage.correctOptionIds[3]);
  assert.equal(session.selection.length, 4);

  let wrongSet = enterStage2('hpe-order-wrong-set');
  for (const tokenId of ['step-stop', 'step-stay', 'step-tell', 'step-run']) wrongSet = pressToken(wrongSet, tokenId);
  assert.equal(wrongSet.selection.length, 4);
  wrongSet = submit(wrongSet, 'hpe-order-wrong-set-submission');
  assert.equal(wrongSet.phase, 'feedback');
  assert.equal(wrongSet.attempts.at(-1).result, 'incorrect');

  let wrongOrder = enterStage2('hpe-order-wrong-order');
  for (const tokenId of ['step-stop', 'step-tell', 'step-stay', 'step-follow']) wrongOrder = pressToken(wrongOrder, tokenId);
  wrongOrder = submit(wrongOrder, 'hpe-order-wrong-order-submission');
  assert.equal(wrongOrder.phase, 'feedback');
  assert.equal(wrongOrder.attempts.at(-1).result, 'incorrect');
});

test('排序答錯後 retry 清除選取；四張正確卡片依序排列才成功', () => {
  const stage = task.stages[1];
  let session = enterStage2('hpe-order-retry');
  for (const tokenId of ['step-stop', 'step-stay', 'step-tell', 'step-run']) session = pressToken(session, tokenId);
  session = submit(session, 'hpe-order-retry-wrong');
  assert.equal(session.phase, 'feedback');
  session = act(session, 'retry');
  assert.equal(session.phase, 'active');
  assert.deepEqual(session.selection, []);
  for (const tokenId of stage.correctOptionIds) session = pressToken(session, tokenId);
  assert.equal(session.selection.length, 4);
  session = submit(session, 'hpe-order-retry-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.attempts.at(-1).result, 'correct');
  assert.deepEqual(session.attempts.at(-1).response, ['step-stop', 'step-stay', 'step-tell', 'step-follow']);
});

test('Stage 3 維持單選與原正答，改選後只保留一個 response', () => {
  const stage = task.stages[2];
  let session = enterStage2('hpe-transfer-flow');
  for (const tokenId of task.stages[1].correctOptionIds) session = pressToken(session, tokenId);
  session = submit(session, 'hpe-order-before-transfer');
  assert.equal(session.phase, 'success');
  session = act(session, 'next');
  assert.equal(task.stages[session.stageIndex].stageId, stage.stageId);
  session = act(session, 'select_option', { optionId: 'transfer-run' });
  session = act(session, 'select_option', { optionId: 'transfer-stop-tell' });
  assert.deepEqual(session.selection, ['transfer-stop-tell']);
  session = submit(session, 'hpe-transfer-correct');
  assert.equal(session.phase, 'success');
  assert.equal(session.attempts.at(-1).result, 'correct');
});

test('三關學生文字均有逐字人工注音；限制說明留在教師欄位，提示不直接抄出答案', () => {
  const [classify, order, transfer] = task.stages;
  for (const stage of task.stages) assertStagePronunciation(stage);
  assert.ok(task.stages.every(({ teacherLimitationNote }) => teacherLimitationNote === task.stages[0].teacherLimitationNote));
  for (const stage of task.stages) {
    assert.ok(!stage.correctFeedback.includes('不能代替'));
    assert.ok(!stage.correctFeedback.includes('不能證明'));
    assert.ok(stage.teacherLimitationNote.length > 0);
  }
  assert.ok(classify.hints.every(({ text }) => !classify.observations.some(({ text: observationText }) => text.includes(observationText))));
  assert.ok(!order.hints.some(({ text }) => task.stages[1].correctOptionIds.map((id) => order.tokens.find((token) => token.id === id).text).join('、') === text));
  assert.ok(transfer.hints.every(({ text }) => !text.includes('先不要走過去') && !text.includes('告訴大人')));
  assert.match(order.studentOperationGuidance, /選 4 個做法.*照順序排好/u);
  assert.doesNotMatch(order.studentOperationGuidance, /排成一句話/u);
  assert.equal(order.studentSubmitLabel, '檢查順序');
});
