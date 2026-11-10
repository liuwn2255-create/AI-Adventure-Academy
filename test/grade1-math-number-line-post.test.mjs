import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OFFICIAL_GAP_CANDIDATE_TASKS } from '../prototype/data/officialGapCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';
import { isLowGradeReadingAssistanceEnabled, renderStudentText } from '../prototype/studentTextRenderer.js';

const activity = OFFICIAL_GAP_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G1-MATH-NUMBER-LINE-POST-CANDIDATE');
const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const engine = await readFile(new URL('../prototype/learningTaskEngine.js', import.meta.url), 'utf8');
const rendererStart = app.indexOf('function renderReusableCandidateTask(');
const rendererEnd = app.indexOf('\nfunction renderCandidateRoutes(', rendererStart);
const renderer = app.slice(rendererStart, rendererEnd);

function dispatchOk(session, action, payload = {}) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${action} should succeed`);
  assert.equal(result.changed, true, `${action} should change session`);
  return result.session;
}

function assertReviewedText(text, tokens) {
  assert.ok(Array.isArray(tokens), `pronunciation metadata required: ${text}`);
  assert.equal(tokens.map(({ text: character }) => character).join(''), text, `pronunciation tokens align: ${text}`);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing human-reviewed reading for ${token.text}`);
    else assert.equal(token.reading, undefined, `digits and punctuation stay unannotated: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/u);
}

function stageSource(from, to) {
  const start = renderer.indexOf(from);
  assert.notEqual(start, -1, `source boundary exists: ${from}`);
  const end = renderer.indexOf(to, start);
  assert.notEqual(end, -1, `source boundary exists: ${to}`);
  return renderer.slice(start, end);
}

test('數字郵局保留活動、關卡、數線範圍與鄰數答案 contract', () => {
  assert.ok(activity);
  assert.equal(activity.activityId, 'ACT-G1-MATH-NUMBER-LINE-POST-CANDIDATE');
  assert.equal(activity.gradeId, 'grade-1');
  assert.equal(activity.subjectId, 'mathematics');
  assert.deepEqual(activity.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['deliver-number-42', 'place_number_line_marker'],
    ['choose-neighbor-check', 'choose_response'],
  ]);
  const line = activity.stages[0].numberLine;
  assert.equal(line.valueFormat, 'integer');
  assert.deepEqual([line.start, line.end, line.tickCount, line.targetTick], [0, 50, 50, 42]);
  assert.deepEqual(activity.stages[1].options, [{ id: '43', text: '43' }, { id: '41', text: '41' }, { id: '52', text: '52' }]);
  assert.deepEqual(activity.stages[1].correctOptionIds, ['43']);
  assert.equal(activity.stages[1].options.some((option) => option.pronunciationTokens), false, 'number-only options do not get fake pronunciation tokens');
  assert.match(engine, /interaction === 'place_number_line_marker'[\s\S]*?correct = response === stage\.numberLine\.targetTick/u);
});

test('兩關主要學生中文皆有對齊的人工注音，數字與標點保持原樣', () => {
  const [first, second] = activity.stages;
  assert.equal(first.prompt, '把信送到數線上的 42。');
  assert.deepEqual(first.hints.map(({ text }) => text), ['先找到 40，再往右數。', '從 40 往右數 2 格，就是 42。']);
  assert.equal(first.correctFeedback, '答對了！你把信送到 42 了。');
  assert.equal(first.incorrectFeedback, '再找一次 40，從 40 往右數 2 格。');
  assert.equal(first.teacherLimitationNote, '單次數線定位不代表學生已完整掌握一百以內的數。');
  assert.doesNotMatch(first.correctFeedback, /不代表|完整掌握/u);
  assert.equal(second.prompt, '信在 42。右邊下一格是哪個數？');
  assert.deepEqual(second.hints.map(({ text }) => text), ['往右一格，數字會多 1。', '42 再往後數一個數。']);
  assert.equal(second.correctFeedback, '答對了！42 的右邊下一格是 43。');
  assert.equal(second.incorrectFeedback, '再想一想：往右一格，數字會多 1。');
  assert.equal(second.teacherLimitationNote, '本活動不代表已完整評量學生的數序與位值能力。');
  assert.doesNotMatch(second.correctFeedback, /不代表|完整評量|位值/u);
  for (const stage of [first, second]) {
    assertReviewedText(stage.prompt, stage.promptPronunciationTokens);
    for (const hint of stage.hints) assertReviewedText(hint.text, hint.pronunciationTokens);
    assertReviewedText(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
    assertReviewedText(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
  }
  assertReviewedText(first.studentOperationGuidance, first.studentOperationGuidancePronunciationTokens);
  assertReviewedText(first.numberLine.studentInstruction, first.numberLine.studentInstructionPronunciationTokens);
  for (const value of ['0', '1', '2', '10', '20', '30', '40', '41', '42', '43', '50', '52']) {
    assert.doesNotMatch(renderStudentText(value, [{ text: value }]), /zhuyin-pair/u);
  }
});

test('數線 response 仍是刻度 index，滑桿有效範圍與 targetTick scoring 不變', () => {
  let session = dispatchOk(createLearningTaskSession(activity, 'number-line-post-stage-one'), 'start');
  assert.equal(session.numberLineTick, null);
  session = dispatchOk(session, 'set_number_line_tick', { tick: 41 });
  assert.equal(session.numberLineTick, 41);
  const wrong = dispatchLearningTask(session, activity, 'submit', { submissionId: 'number-line-wrong' });
  assert.equal(wrong.error, undefined);
  assert.equal(wrong.attempt?.response, 41);
  assert.equal(wrong.attempt?.result, 'incorrect');
  session = dispatchOk(wrong.session, 'retry');
  session = dispatchOk(session, 'set_number_line_tick', { tick: 42 });
  const correct = dispatchLearningTask(session, activity, 'submit', { submissionId: 'number-line-correct' });
  assert.equal(correct.error, undefined);
  assert.equal(correct.attempt?.response, 42);
  assert.equal(correct.attempt?.result, 'correct');
  assert.equal(dispatchLearningTask(session, activity, 'set_number_line_tick', { tick: 51 }).error, 'invalid_number_line_tick');
});

test('Stage 2 鄰數題仍單選並以 43 判定正確', () => {
  let session = dispatchOk(createLearningTaskSession(activity, 'number-line-post-stage-two'), 'start');
  session = dispatchOk(session, 'set_number_line_tick', { tick: 42 });
  const first = dispatchLearningTask(session, activity, 'submit', { submissionId: 'number-line-to-stage-two' });
  assert.equal(first.attempt?.result, 'correct');
  session = dispatchOk(first.session, 'next');
  assert.equal(activity.stages[session.stageIndex].stageId, 'choose-neighbor-check');
  assert.equal(dispatchLearningTask(session, activity, 'submit').error, 'response_required');
  session = dispatchOk(session, 'select_option', { optionId: '41' });
  const wrong = dispatchLearningTask(session, activity, 'submit', { submissionId: 'neighbor-wrong' });
  assert.equal(wrong.attempt?.result, 'incorrect');
  session = dispatchOk(wrong.session, 'retry');
  session = dispatchOk(session, 'select_option', { optionId: '43' });
  const correct = dispatchLearningTask(session, activity, 'submit', { submissionId: 'neighbor-correct' });
  assert.equal(correct.attempt?.result, 'correct');
});

test('低年級數線 presentation 使用人工注音、主要刻度標籤與既有 slider/readiness contract', () => {
  assert.match(app, /const NUMBER_LINE_UI_PRONUNCIATION = Object\.freeze\(/u);
  const guidance = stageSource("const lowGradeNumberLine = stage.interaction === 'place_number_line_marker'", 'const classificationProgress =');
  assert.match(guidance, /stage\.interaction === 'place_number_line_marker'[\s\S]*?lowGradeNumberLine[\s\S]*?找到數字的位置/u);
  assert.match(guidance, /appendNumberLineUiText\(responseGuidanceNode/u);
  assert.match(guidance, /Grade|isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)/u);
  assert.match(guidance, /const lowGradeNumberLine = stage\.interaction === 'place_number_line_marker' && isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)/u);
  assert.deepEqual(['grade-1', 'grade-2'].map(isLowGradeReadingAssistanceEnabled), [true, true]);
  assert.deepEqual(['grade-3', 'grade-6'].map(isLowGradeReadingAssistanceEnabled), [false, false]);

  const instruction = stageSource("const isIntegerNumberLine = stage.numberLine.valueFormat === 'integer';", "const scale = element('div', 'decimal-number-line-scale');");
  assert.match(instruction, /stage\.numberLine\.studentInstructionPronunciationTokens/u);
  assert.match(instruction, /appendNumberLineUiText\(instructionNode/u);
  assert.match(instruction, /移動滑桿，把標記放到正確的數字。/u);
  assert.match(instruction, /移動標記，在數線上放置指定數字。/u, 'existing non-low-grade integer instruction remains');
  assert.match(instruction, /拖動標記，在數線上放置小數點。/u, 'decimal instruction remains distinct');

  const numberLine = stageSource("if (session.phase === 'active' && stage.interaction === 'place_number_line_marker')", "if (session.phase === 'active' && stage.interaction === 'compose_shape')");
  assert.match(numberLine, /majorTickInterval/u);
  assert.match(numberLine, /const value = start \+ \(end - start\) \* tick \/ tickCount/u);
  assert.match(numberLine, /isEndpoint \|\| isMajorTick \|\| isReferenceTick \? String\(value\) : ''/u);
  const dataLine = activity.stages[0].numberLine;
  const displayedMajorLabels = Array.from({ length: dataLine.tickCount + 1 }, (_, tick) => dataLine.start + (dataLine.end - dataLine.start) * tick / dataLine.tickCount)
    .filter((value, tick) => tick === 0 || tick === dataLine.tickCount || (Number.isInteger(value) && (value - dataLine.start) % dataLine.majorTickInterval === 0));
  assert.deepEqual(displayedMajorLabels, [0, 10, 20, 30, 40, 50]);
  assert.match(numberLine, /slider\.type = 'range'; slider\.min = '0'; slider\.max = String\(tickCount\); slider\.step = '1'/u);
  assert.match(numberLine, /dispatch\('set_number_line_tick', \{ tick: Number\(slider\.value\) \}\)/u);
  assert.match(numberLine, /marker\.style\.left = `\$\{\(session\.numberLineTick \?\? 0\) \/ tickCount \* 100\}%`/u, 'initial marker visual remains unchanged');
  assert.match(numberLine, /appendNumberLineUiText\(readout, '目前標記：'/u);
  assert.match(numberLine, /appendNumberLineUiText\(readout, '尚未放置'/u);
  assert.match(numberLine, /String\(markerValue\) : markerValue\.toFixed\(1\)/u, 'numeric readout stays plain while decimal format is preserved');

  assert.match(renderer, /stage\.interaction === 'place_number_line_marker'\s*\?\s*Number\.isInteger\(session\.numberLineTick\)/u);
  assert.match(renderer, /const hasLowGradeNumberLineReadiness = lowGradeNumberLine;/u);
  assert.match(renderer, /if \(hasLowGradeNumberLineReadiness\) readinessText = hasResponse \? '可以檢查答案了。' : '還沒放好。';/u);
  assert.match(renderer, /hasLowGradeNumberLineReadiness \|\| hasLowGradeEvidenceReadiness[\s\S]*?&& !hasSpecificReadiness/u);
  assert.match(renderer, /appendNumberLineUiText\(readiness, readinessText, appendStudentText\)/u);

  const submit = stageSource('const submitLabel =', 'const readinessId =');
  assert.match(submit, /submit\.disabled = !hasResponse/u);
  assert.match(submit, /lowGradeNumberLine \? '檢查位置'/u);
  assert.match(submit, /appendNumberLineUiText\(submit, submitLabel/u);
  assert.match(submit, /stage\.interaction === 'choose_response'.*?'檢查答案'/u);
});
