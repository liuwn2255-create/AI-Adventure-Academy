import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE1_MATH_COUNTER_STORY as activity } from '../prototype/data/grade1MathCounterStory.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { isLowGradeReadingAssistanceEnabled, renderStudentText } from '../prototype/studentTextRenderer.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const engine = await readFile(new URL('../prototype/learningTaskEngine.js', import.meta.url), 'utf8');

function assertPronunciationCoverage(text, pronunciationTokens) {
  assert.ok(Array.isArray(pronunciationTokens), `missing pronunciation metadata for: ${text}`);
  assert.equal(pronunciationTokens.map(({ text: character }) => character).join(''), text);
  for (const token of pronunciationTokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han character should remain unannotated: ${token.text}`);
  }
  assert.match(renderStudentText(text, pronunciationTokens), /zhuyin-pair/);
}

function dispatchWithoutError(session, action, payload) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${action} should be accepted`);
  assert.equal(result.changed, true, `${action} should change the session`);
  return result.session;
}

function startAtStage(stageIndex, sessionId) {
  let session = dispatchWithoutError(createLearningTaskSession(activity, sessionId), 'start');
  if (stageIndex === 1) {
    for (const tokenId of activity.stages[0].correctOptionIds) {
      session = dispatchWithoutError(session, 'add_phrase_token', { tokenId });
    }
    const firstStageSubmission = dispatchLearningTask(session, activity, 'submit');
    assert.equal(firstStageSubmission.error, undefined);
    assert.equal(firstStageSubmission.attempt?.result, 'correct');
    session = dispatchWithoutError(firstStageSubmission.session, 'next');
    assert.equal(activity.stages[session.stageIndex].stageId, 'take-away-petals');
  }
  assert.equal(session.stageIndex, stageIndex);
  assert.equal(activity.stages[session.stageIndex].stageId, activity.stages[stageIndex].stageId);
  return session;
}

test('花片故事劇場保留活動、關卡、詞卡與算式答案 contract', () => {
  assert.equal(activity.activityId, 'ACT-G1-MATH-COUNTER-STORY-CANDIDATE');
  assert.deepEqual(activity.stages.map(({ stageId }) => stageId), ['join-two-groups', 'take-away-petals']);
  assert.deepEqual(activity.stages.map(({ interaction }) => interaction), ['assemble_response', 'assemble_response']);
  assert.deepEqual(activity.stages.map(({ requiredSelectionCount }) => requiredSelectionCount), [5, 5]);
  assert.deepEqual(activity.stages.map(({ tokens }) => tokens.map(({ id, text }) => [id, text])), [
    [['add-3', '3'], ['add-sign', '+'], ['add-2', '2'], ['add-equals', '='], ['add-5', '5']],
    [['take-7', '7'], ['take-minus', '−'], ['take-3', '3'], ['take-equals', '='], ['take-4', '4']],
  ]);
  assert.deepEqual(activity.stages.map(({ correctOptionIds }) => correctOptionIds), [
    ['add-3', 'add-sign', 'add-2', 'add-equals', 'add-5'],
    ['take-7', 'take-minus', 'take-3', 'take-equals', 'take-4'],
  ]);
  assert.deepEqual(validateLearningTask(activity).filter((error) => error.startsWith('invalid_required_selection_count:')), []);
  assert.match(engine, /interaction === 'assemble_response'\) correct = response\.length === stage\.correctOptionIds\.length && response\.every\(\(id, index\) => id === stage\.correctOptionIds\[index\]\)/);
});

test('兩關學生主要中文文字皆有人工注音，數字與算式符號保持原樣', () => {
  for (const stage of activity.stages) {
    assertPronunciationCoverage(stage.prompt, stage.promptPronunciationTokens);
    assertPronunciationCoverage(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
    for (const hint of stage.hints) assertPronunciationCoverage(hint.text, hint.pronunciationTokens);
    assertPronunciationCoverage(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
    assertPronunciationCoverage(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
    for (const token of stage.tokens) {
      assert.equal(token.pronunciationTokens, undefined, 'digits and math symbols in equation cards remain plain');
    }
  }
  assert.match(activity.stages[0].prompt, /3/);
  assert.match(activity.stages[0].prompt, /2/);
  assert.match(activity.stages[1].prompt, /7/);
  assert.match(activity.stages[1].prompt, /3/);
  assert.equal(activity.stages[0].hints[1].text, '先找兩個數字，再找表示合起來的符號，排成完整算式。');
  assert.doesNotMatch(activity.stages[0].hints[1].text, /×|乘法/u);
  assert.equal(activity.stages[1].teacherLimitationNote, '本活動不是正式計算熟練度評量。');
  assert.doesNotMatch(activity.stages[1].correctFeedback, /不能代表|熟練度評量/u);
});

test('五張卡才可提交，移除一張後重新等待完成，且正確順序仍可答對', () => {
  for (const [stageIndex, stage] of activity.stages.entries()) {
    assert.equal(stage.requiredSelectionCount, 5);
    let session = startAtStage(stageIndex, `counter-story-${stageIndex}`);
    assert.equal(dispatchLearningTask(session, activity, 'submit').error, 'response_required');
    for (const [index, tokenId] of stage.correctOptionIds.slice(0, 4).entries()) {
      session = dispatchWithoutError(session, 'add_phrase_token', { tokenId });
      assert.equal(session.selection.length, index + 1);
      assert.equal(dispatchLearningTask(session, activity, 'submit').error, 'response_required');
    }
    assert.equal(session.selection.length, 4);
    assert.equal(dispatchLearningTask(session, activity, 'submit').error, 'response_required');
    session = dispatchWithoutError(session, 'add_phrase_token', { tokenId: stage.correctOptionIds[4] });
    assert.equal(session.selection.length, 5);
    const completeAttempt = dispatchLearningTask(session, activity, 'submit');
    assert.equal(completeAttempt.error, undefined, 'all five selected cards make submission eligible');
    assert.equal(completeAttempt.attempt?.result, 'correct');
    session = dispatchWithoutError(session, 'remove_phrase_token', { tokenId: stage.correctOptionIds[4] });
    assert.equal(session.selection.length, 4);
    assert.equal(dispatchLearningTask(session, activity, 'submit').error, 'response_required');
    session = dispatchWithoutError(session, 'add_phrase_token', { tokenId: stage.correctOptionIds[4] });
    assert.equal(session.selection.length, 5);
    const submitted = dispatchLearningTask(session, activity, 'submit');
    assert.equal(submitted.error, undefined);
    assert.equal(submitted.attempt?.result, 'correct');
    assert.equal(submitted.session.phase, 'success');
  }
});

test('Grade 1–2 算式提示與固定 UI 使用人工注音及既有操作音效；其他年級保留共用提示', () => {
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-1'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-2'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-3'), false);
  assert.match(activity.stages[0].studentOperationGuidance, /排成完整算式/u);
  assert.doesNotMatch(activity.stages[0].studentOperationGuidance, /排成一句話/u);
  assert.match(app, /stage\.studentOperationGuidance \?\? '怎麼玩：① 點詞卡 → ② 排成一句話 → ③ 檢查答案'/);
  assert.match(app, /: '操作方式：① 看清楚題目 → ② 依順序點選內容 → ③ 檢查「我的答案」 → ④ 完成後檢查答案'/);
  for (const uiText of ['可選內容', '我的答案', '還沒選卡片。', '已選 ', ' 張', '還要選 ', ' 張。', '可以檢查答案了。', '檢查數學解法', '查看提示']) {
    assert.ok(app.includes(`'${uiText}'`), `missing manually reviewed low-grade assemble UI reading: ${uiText}`);
  }
  assert.match(app, /if \(!\/\\p\{Script=Han\}\/u\.test\(character\)\) return \{ text: character \};/);
  assert.match(app, /else emptyResponse\.textContent = '還沒有加入內容。請從「可選內容」依順序點選。'/);
  assert.match(app, /function appendAssembleUiText\(parent, text, appendStudentText\)\s*\{\s*appendStudentText\(parent, text, assembleUiPronunciationTokens\(text\)\);\s*\}/);
  assert.match(app, /playBuildArrayFeedbackTone\(isSelected \? -1 : 1\)/);
  assert.equal([...app.matchAll(/function playBuildArrayFeedbackTone\(/g)].length, 1, 'assemble reuses the existing tone helper');
  assert.match(app, /if \(result\.session\.selection\.length !== previousSelectionLength\) playBuildArrayFeedbackTone/);
  assert.match(app, /selectionProgress\.setAttribute\('role', 'status'\)/);
  assert.match(app, /selectionProgress\.setAttribute\('aria-live', 'polite'\)/);
  assert.match(app, /session\.selection\.length === stage\.requiredSelectionCount/);
  assert.match(app, /stage\.requiredSelectionCount - session\.selection\.length/);
  assert.doesNotMatch(app.match(/function (?:appendAssembleUiText|assembleUiPronunciationTokens)[\s\S]*?function playBuildArrayFeedbackTone/)?.[0] ?? '', /correctOptionIds/);
});
