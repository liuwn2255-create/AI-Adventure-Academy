import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MATH_CURRICULUM_GAP_TASKS } from '../prototype/data/mathCurriculumGapTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const activity = MATH_CURRICULUM_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G1-MATH-LENGTH-COMPARE-ROPE-CANDIDATE');
const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');

function dispatchOk(session, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${action} should work`);
  return result.session;
}

function reviewed(text, tokens) {
  assert.ok(Array.isArray(tokens), `missing pronunciation: ${text}`);
  assert.equal(tokens.map(({ text: glyph }) => glyph).join(''), text);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `letters/numbers/punctuation stay unannotated: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/u);
}

test('兩關保留原比較數量與分類答案', () => {
  assert.ok(activity);
  assert.deepEqual(activity.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['compare-straight-and-curved-paths', 'classify_observations'],
    ['verify-with-common-units', 'classify_observations'],
  ]);
  assert.deepEqual(activity.stages.map(({ lengthComparison }) => lengthComparison.comparisons.map(({ leftUnits, rightUnits }) => [leftUnits, rightUnits])), [
    [[5, 7], [8, 6]], [[6, 6], [4, 7]],
  ]);
  assert.deepEqual(activity.stages.map(({ correctAssignments }) => correctAssignments), [
    { 'path-pair-a': 'right-longer', 'path-pair-b': 'left-longer' },
    { 'unit-pair-a': 'same-length', 'unit-pair-b': 'right-longer' },
  ]);
});

test('A/B、觀察、類別、提示與 feedback 都有可見資料及人工注音', () => {
  for (const stage of activity.stages) {
    reviewed(stage.prompt, stage.promptPronunciationTokens);
    reviewed(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
    reviewed(`共同參照：${stage.lengthComparison.unitLabel}`, stage.lengthComparison.unitLabelPronunciationTokens);
    for (const hint of stage.hints) reviewed(hint.text, hint.pronunciationTokens);
    reviewed(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
    reviewed(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
    for (const observation of stage.observations) reviewed(observation.text, observation.pronunciationTokens);
    for (const category of stage.categories) reviewed(category.label, category.pronunciationTokens);
  }
  assert.doesNotMatch(activity.stages[0].hints[1].text, /第一組右邊長|第二組左邊長/u);
  assert.doesNotMatch(activity.stages[1].hints[1].text, /第一組兩邊都是 6 段|第二組右邊有 7 段/u);
  assert.match(app, /element\('strong', 'length-comparison-path-label', label\)/u, 'each path displays its A or B label');
  assert.match(app, /appendStudentText\(reference, `共同參照：\$\{stage\.lengthComparison\.unitLabel\}`, stage\.lengthComparison\.unitLabelPronunciationTokens\)/u);
  assert.equal(activity.stages[0].teacherLimitationNote, '這是螢幕上的路徑圖，不是實際拿繩子比較。');
  assert.equal(activity.stages[1].teacherLimitationNote, '實際量一量還要用教具。');
  assert.doesNotMatch(activity.stages[0].correctFeedback, /實際操作/u);
  assert.doesNotMatch(activity.stages[1].correctFeedback, /教具/u);
});

test('兩關依原 assignments 走正常互動並正確提交', () => {
  let session = dispatchOk(createLearningTaskSession(activity, 'length-compare-rope'), 'start');
  for (const [observationId, categoryId] of Object.entries(activity.stages[0].correctAssignments)) {
    session = dispatchOk(session, 'assign_category', { observationId, categoryId });
  }
  let result = dispatchLearningTask(session, activity, 'submit', { submissionId: 'length-direct-stage-one' });
  assert.equal(result.attempt.result, 'correct');
  session = dispatchOk(result.session, 'next');
  for (const [observationId, categoryId] of Object.entries(activity.stages[1].correctAssignments)) {
    session = dispatchOk(session, 'assign_category', { observationId, categoryId });
  }
  result = dispatchLearningTask(session, activity, 'submit', { submissionId: 'length-direct-stage-two' });
  assert.equal(result.attempt.result, 'correct');
});
