import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNING_SUBITEM_EXPANSION_TASKS } from '../prototype/data/learningSubitemExpansionTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const activity = LEARNING_SUBITEM_EXPANSION_TASKS.find(({ activityId }) => activityId === 'ACT-G1-MATH-ZERO-PLACEHOLDER-EXPLORER-CANDIDATE');

function checked(session, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${action} should work`);
  return result.session;
}

function reviewed(text, tokens) {
  assert.ok(Array.isArray(tokens), `missing pronunciation: ${text}`);
  assert.equal(tokens.map(({ text: glyph }) => glyph).join(''), text);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han data must stay unannotated: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/u);
}

test('0 的位置線索保留活動與兩關 scoring/data IDs', () => {
  assert.ok(activity);
  assert.deepEqual(activity.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['sort-zero-ones-cards', 'classify_observations'],
    ['explain-twenty-versus-two', 'choose_response'],
  ]);
  assert.deepEqual(activity.stages[0].correctAssignments, { n10: 'no-ones', n12: 'has-ones', n20: 'no-ones', n21: 'has-ones' });
  assert.deepEqual(activity.stages[0].categories.map(({ id, label }) => [id, label]), [
    ['no-ones', '個位是 0'], ['has-ones', '個位不是 0'],
  ]);
  assert.deepEqual(activity.stages[1].correctOptionIds, ['two-tens']);
  assert.deepEqual(activity.stages[1].options.map(({ id }) => id), ['two-tens', 'same-number', 'zero-adds-one']);
});

test('兩關主要中文皆有逐字注音，數字與標點沒有假讀音', () => {
  const [sort, explain] = activity.stages;
  assert.equal(sort.prompt, '看卡片，把個位是 0 的放一類，個位不是 0 的放另一類。');
  assert.equal(sort.categories[0].label, '個位是 0');
  assert.equal(sort.categories[1].label, '個位不是 0');
  assert.equal(explain.prompt, '20 和 2 有什麼不同？選出正確說法。');
  assert.equal(explain.correctFeedback, '答對了！20 有 2 個十，2 有 2 個一。');
  for (const stage of [sort, explain]) {
    reviewed(stage.prompt, stage.promptPronunciationTokens);
    for (const hint of stage.hints) reviewed(hint.text, hint.pronunciationTokens);
    reviewed(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
    reviewed(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
    for (const option of stage.options ?? []) {
      reviewed(option.text, option.pronunciationTokens);
      reviewed(option.feedback, option.feedbackPronunciationTokens);
    }
    for (const observation of stage.observations ?? []) reviewed(observation.text, observation.pronunciationTokens);
    for (const category of stage.categories ?? []) reviewed(category.label, category.pronunciationTokens);
    if (stage.studentOperationGuidance) reviewed(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
  }
  assert.ok(explain.teacherLimitationNote);
  assert.doesNotMatch(explain.correctFeedback, /不足以證明|教師|不代表/u);
});

test('兩關依原分類與單選答案完成，數學概念答案不變', () => {
  let session = checked(createLearningTaskSession(activity, 'zero-placeholder-regression'), 'start');
  for (const [observationId, categoryId] of Object.entries(activity.stages[0].correctAssignments)) {
    session = checked(session, 'assign_category', { observationId, categoryId });
  }
  let result = dispatchLearningTask(session, activity, 'submit', { submissionId: 'zero-stage-one' });
  assert.equal(result.attempt?.result, 'correct');
  session = checked(result.session, 'next');
  session = checked(session, 'select_option', { optionId: 'two-tens' });
  result = dispatchLearningTask(session, activity, 'submit', { submissionId: 'zero-stage-two' });
  assert.equal(result.attempt?.result, 'correct');
});
