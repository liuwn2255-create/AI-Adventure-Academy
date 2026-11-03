import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LEARNING_SUBITEM_EXPANSION_TASKS } from '../prototype/data/learningSubitemExpansionTasks.js';
import { OFFICIAL_GAP_CANDIDATE_TASKS } from '../prototype/data/officialGapCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const activity = LEARNING_SUBITEM_EXPANSION_TASKS.find(({ activityId }) => activityId === 'ACT-G1-MATH-COMPARISON-DIFFERENCE-NUMBER-LINE-CANDIDATE');
const postal = OFFICIAL_GAP_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G1-MATH-NUMBER-LINE-POST-CANDIDATE');
const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');

function checked(session, task, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.error, undefined, `${action} should work`);
  return result.session;
}

function reviewed(text, tokens) {
  assert.ok(Array.isArray(tokens), `missing pronunciation: ${text}`);
  assert.equal(tokens.map(({ text: glyph }) => glyph).join(''), text);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `numerals/symbols/punctuation stay unannotated: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/u);
}

test('比較差數線保留 0–10、十個間隔、target tick 3 與 Stage 2 算式答案', () => {
  assert.ok(activity);
  const [first, second] = activity.stages;
  assert.deepEqual(activity.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['place-sticker-difference', 'place_number_line_marker'],
    ['choose-comparison-equation', 'choose_response'],
  ]);
  assert.equal(first.numberLine.start, 0);
  assert.equal(first.numberLine.end, 10);
  assert.equal(first.numberLine.tickCount, 10);
  assert.equal(first.numberLine.targetTick, 3);
  assert.equal(first.numberLine.valueFormat, 'integer');
  assert.ok(first.numberLine.referenceTicks.includes(5));
  assert.ok(first.numberLine.referenceTicks.includes(8));
  assert.equal(first.numberLine.studentInstruction, '移動滑桿，把標記放到「多幾張」的答案。');
  assert.ok(Array.isArray(first.numberLine.studentInstructionPronunciationTokens));
  assert.equal(first.numberLine.studentInstructionPronunciationTokens.map(({ text }) => text).join(''), first.numberLine.studentInstruction);
  for (const token of first.numberLine.studentInstructionPronunciationTokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading);
    else assert.equal(token.reading, undefined);
  }
  assert.match(app, /slider\.type = 'range'; slider\.min = '0'; slider\.max = String\(tickCount\); slider\.step = '1'/u, 'reference labels must not change selectable ticks');
  assert.deepEqual(second.options.map(({ id, text }) => [id, text]), [
    ['difference-8-5', '8 − 5 = 3'], ['sum-8-5', '8 + 5 = 13'], ['reverse-5-8', '5 − 8 = 3'],
  ]);
  assert.deepEqual(second.correctOptionIds, ['difference-8-5']);
  assert.equal(first.numberLine.studentInstruction, '移動滑桿，把標記放到「多幾張」的答案。');
  assert.notEqual(first.numberLine.studentInstruction, postal.stages[0].numberLine.studentInstruction, '#7 keeps task-specific difference guidance');
  assert.doesNotMatch(first.numberLine.studentInstruction, /把信/u, '#7 must not use #5 postal wording');
  assert.equal(postal.stages[0].numberLine.studentInstruction, '移動滑桿，把信放到正確的數字。', '#5 keeps its existing postal instruction');
  reviewed(postal.stages[0].numberLine.studentInstruction, postal.stages[0].numberLine.studentInstructionPronunciationTokens);
  assert.match(app, /stage\.numberLine\.studentInstruction\s*\?\?/u, 'shared renderer reads per-stage number-line guidance');
  assert.deepEqual(postal.stages[0].numberLine.referenceTicks, undefined, '#5 receives no extra reference labels');
  assert.match(app, /stage\.numberLine\.referenceTicks\.includes\(value\)/u);
  assert.match(app, /slider\.type = 'range'; slider\.min = '0'; slider\.max = String\(tickCount\); slider\.step = '1'/u);
});

test('兩關學生主要文字有人工注音，算式符號與數字維持原樣', () => {
  const [first, second] = activity.stages;
  for (const stage of [first, second]) {
    reviewed(stage.prompt, stage.promptPronunciationTokens);
    for (const hint of stage.hints) reviewed(hint.text, hint.pronunciationTokens);
    reviewed(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
    reviewed(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
  }
  reviewed(first.numberLine.studentInstruction, first.numberLine.studentInstructionPronunciationTokens);
  for (const option of second.options) {
    for (const token of option.pronunciationTokens ?? []) {
      if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading);
      else if (/[0-9]/u.test(token.text) || /[+−=]/u.test(token.text)) assert.equal(token.reading, undefined);
    }
  }
  assert.equal(first.prompt, '8 張比 5 張多幾張？把標記放到答案。每格是 1。');
  assert.equal(second.prompt, '哪個算式表示「8 張比 5 張多 3 張」？');
});

test('response 仍儲存刻度 index，readiness/submit 由有無 response 決定而非正解', () => {
  const [first, second] = activity.stages;
  let session = checked(createLearningTaskSession(activity, 'comparison-difference-line'), activity, 'start');
  assert.equal(session.numberLineTick, null);
  const blocked = dispatchLearningTask(session, activity, 'submit', { submissionId: 'difference-empty' });
  assert.equal(blocked.error, 'response_required');
  session = checked(session, activity, 'set_number_line_tick', { tick: 4 });
  assert.equal(session.numberLineTick, 4);
  const wrongPosition = dispatchLearningTask(session, activity, 'submit', { submissionId: 'difference-wrong-tick' });
  assert.equal(wrongPosition.error, undefined);
  assert.equal(wrongPosition.attempt.response, 4);
  assert.equal(wrongPosition.attempt.result, 'incorrect');
  session = checked(wrongPosition.session, activity, 'retry');
  session = checked(session, activity, 'set_number_line_tick', { tick: 3 });
  const correctPosition = dispatchLearningTask(session, activity, 'submit', { submissionId: 'difference-correct-tick' });
  assert.equal(correctPosition.attempt.response, 3);
  assert.equal(correctPosition.attempt.result, 'correct');
  session = checked(correctPosition.session, activity, 'next');
  assert.equal(activity.stages[session.stageIndex], second);
  session = checked(session, activity, 'select_option', { optionId: 'difference-8-5' });
  const equation = dispatchLearningTask(session, activity, 'submit', { submissionId: 'difference-equation' });
  assert.equal(equation.attempt.result, 'correct');
  assert.equal(first.numberLine.targetTick, 3);
});
