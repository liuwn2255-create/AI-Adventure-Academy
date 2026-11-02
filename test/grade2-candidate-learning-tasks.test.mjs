import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import {
  GRADE2_MATH_NUMBER_LINE, GRADE2_MATH_COLUMN_CALCULATION,
  GRADE2_CHINESE_TEXT_CLUE, GRADE2_CHINESE_CONTEXT_WORDS,
  GRADE2_LIVING_CHANGE_INQUIRY, GRADE2_LIVING_INQUIRY_PLAN,
} from '../prototype/data/grade2CandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { LEARNING_TASK_RELATIONS } from '../prototype/data/elementaryLearningCatalog.js';

const tasks = [GRADE2_MATH_NUMBER_LINE, GRADE2_MATH_COLUMN_CALCULATION, GRADE2_CHINESE_TEXT_CLUE, GRADE2_CHINESE_CONTEXT_WORDS, GRADE2_LIVING_CHANGE_INQUIRY, GRADE2_LIVING_INQUIRY_PLAN];
const parseMap = async () => JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));

function moveToOrder(session, activity, target) {
  let state = session;
  for (let index = 0; index < target.length; index += 1) {
    const from = state.orderedItems.indexOf(target[index]);
    if (from !== index) state = dispatchLearningTask(state, activity, 'move_ordered_item', { itemId: target[index], toIndex: index }).session;
  }
  return state;
}

function answerStage(session, task, stage, correct) {
  let state = session;
  if (stage.interaction === 'choose_response') {
    const option = stage.options.find(({ id }) => correct ? stage.correctOptionIds.includes(id) : !stage.correctOptionIds.includes(id));
    state = dispatchLearningTask(state, task, 'select_option', { optionId: option.id }).session;
  } else if (stage.interaction === 'collect_evidence') {
    const wrongOptionId = stage.options.find(({ id }) => !stage.correctOptionIds.includes(id))?.id;
    const ids = correct ? stage.correctOptionIds : Number.isInteger(stage.requiredSelectionCount)
      ? [...stage.correctOptionIds.slice(0, stage.requiredSelectionCount - 1), wrongOptionId]
      : wrongOptionId ? [wrongOptionId] : stage.correctOptionIds.slice(0, -1);
    for (const optionId of ids) state = dispatchLearningTask(state, task, 'toggle_evidence', { optionId }).session;
  } else if (stage.interaction === 'classify_observations') {
    for (const observation of stage.observations) {
      const expected = stage.correctAssignments[observation.id];
      const categoryId = correct ? expected : stage.categories.find(({ id }) => id !== expected).id;
      state = dispatchLearningTask(state, task, 'assign_category', { observationId: observation.id, categoryId }).session;
    }
  } else if (stage.interaction === 'order_items') {
    state = moveToOrder(state, task, correct ? stage.correctItemIds : [...stage.correctItemIds].reverse());
  } else if (stage.interaction === 'place_number_line_marker') {
    const tick = correct ? stage.numberLine.targetTick : (stage.numberLine.targetTick + 1) % (stage.numberLine.tickCount + 1);
    state = dispatchLearningTask(state, task, 'set_number_line_tick', { tick }).session;
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const step of stage.calculationSteps) {
      const choice = step.choices.find(({ value }) => correct ? value === step.expectedValue : value !== step.expectedValue);
      state = dispatchLearningTask(state, task, 'select_calculation_value', { stepId: step.id, value: choice.value }).session;
    }
  } else assert.fail(`Uncovered interaction in test: ${stage.interaction}`);
  return state;
}

test('二年級六項候選任務 ID、內容、課綱參照、候選狀態與目錄關聯完整', async () => {
  assert.equal(tasks.length, 6);
  assert.equal(new Set(tasks.map(({ activityId }) => activityId)).size, tasks.length);
  assert.deepEqual(tasks.map(({ subjectId }) => subjectId).sort(), ['chinese-language', 'chinese-language', 'living-curriculum', 'living-curriculum', 'mathematics', 'mathematics']);
  for (const task of tasks) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.gradeId, 'grade-2');
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.reinforcementActivityIds.length, 0);
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    assert.ok(task.stages.length >= 2);
    assert.ok(task.stages.every(({ hints }) => hints.length === 2));
    const relation = LEARNING_TASK_RELATIONS.find(({ gradeId, subjectId }) => gradeId === task.gradeId && subjectId === task.subjectId);
    assert.ok(relation.tasks.some(({ taskId, curriculumMapId }) => taskId === task.activityId && curriculumMapId === task.curriculumMapId));
  }
  const grade2 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-2');
  for (const task of tasks) assert.ok(grade2.subjects.find(({ subjectId }) => subjectId === task.subjectId).existingYearLevelContent.some(({ activityId }) => activityId === task.activityId));
  const map = await parseMap();
  for (const task of tasks) {
    const entry = [...map.verifiedLearningFocuses, ...map.supplementalVerifiedLearningFocuses, ...map.pendingLearningFocuses].find(({ id }) => id === task.curriculumMapId);
    assert.ok(entry, task.curriculumMapId);
    assert.equal(entry.officialTextReviewStatus, 'verified_against_official_text');
    assert.ok(task.curriculumCodes.every((code) => [...entry.contentCodes, ...entry.performanceCodes].includes(code)), `${task.activityId}: ${task.curriculumCodes.join(', ')} not in ${JSON.stringify(entry)}`);
  }
});

test('獨立核算二年級加減中間步驟及數線數值，資料選項與正解一致', () => {
  assert.equal(GRADE2_MATH_NUMBER_LINE.stages[0].numberLine.start + (GRADE2_MATH_NUMBER_LINE.stages[0].numberLine.end - GRADE2_MATH_NUMBER_LINE.stages[0].numberLine.start) * GRADE2_MATH_NUMBER_LINE.stages[0].numberLine.targetTick / GRADE2_MATH_NUMBER_LINE.stages[0].numberLine.tickCount, 600);
  assert.ok(GRADE2_MATH_NUMBER_LINE.stages[1].options.find(({ id }) => GRADE2_MATH_NUMBER_LINE.stages[1].correctOptionIds.includes(id)).text === '680');
  assert.deepEqual(GRADE2_MATH_COLUMN_CALCULATION.stages.map((stage) => stage.calculationSteps.map(({ expectedValue }) => expectedValue)), [[13, 3, 4], [12, 4, 4, 2]]);
  assert.equal(26 + 17, 43);
  assert.equal(52 - 28, 24);
  for (const stage of GRADE2_MATH_COLUMN_CALCULATION.stages) {
    for (const step of stage.calculationSteps) assert.equal(step.choices.filter(({ value }) => value === step.expectedValue).length, 1);
  }
});

test('六項候選任務均可提示、錯答重試、答對完成及重玩，紀錄只在記憶體', () => {
  for (const task of tasks) {
    let session = createLearningTaskSession(task, `isolated-${task.activityId}`);
    session = dispatchLearningTask(session, task, 'start').session;
    for (const [index, stage] of task.stages.entries()) {
      if (index) session = dispatchLearningTask(session, task, 'next').session;
      session = dispatchLearningTask(session, task, 'hint').session;
      session = dispatchLearningTask(session, task, 'hint').session;
      session = answerStage(session, task, stage, false);
      session = dispatchLearningTask(session, task, 'submit').session;
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId} wrong answer`);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      assert.ok(session.lastFeedback.text);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = answerStage(session, task, stage, true);
      session = dispatchLearningTask(session, task, 'submit').session;
      assert.equal(session.phase, 'success', `${task.activityId}/${stage.stageId} correct retry`);
      assert.equal(session.attempts.at(-1).result, 'correct');
    }
    session = dispatchLearningTask(session, task, 'next').session;
    assert.equal(session.phase, 'completed', task.activityId);
    assert.equal(session.attempts.length, task.stages.length * 2);
    assert.equal(session.status, 'candidate_pending_teacher_review');
    const restarted = dispatchLearningTask(session, task, 'restart', { sessionId: `isolated-restart-${task.activityId}` }).session;
    assert.equal(restarted.phase, 'intro');
    assert.equal(restarted.attempts.length, 0);
  }
});

test('雨傘故事題以公開的兩項要求收集天氣與同學未帶傘兩個原因線索', () => {
  const stage = GRADE2_CHINESE_TEXT_CLUE.stages.find(({ stageId }) => stageId === 'collect-rain-shelter-clues');
  const passage = '放學時，天空飄起雨絲。小晴看見同學沒有帶傘，便回教室拿了兩把雨傘。她把一把借給同學，兩人一起走到等候區。';

  assert.equal(stage.interaction, 'collect_evidence');
  assert.equal(stage.requiredSelectionCount, 2);
  assert.equal(stage.prompt, `小晴為什麼回教室拿雨傘？請選出 2 個故事裡的重要線索。短文：${passage}`);
  assert.deepEqual(stage.options, [
    { id: 'rain-started', text: '放學時，天空飄起雨絲。' },
    { id: 'friend-no-umbrella', text: '小晴看見同學沒有帶傘。' },
    { id: 'waiting-area', text: '兩人一起走到等候區。' },
    { id: 'school-gate', text: '小晴走到校門口。' },
  ]);
  assert.equal(stage.options.some(({ id }) => id === 'two-umbrellas'), false);
  assert.deepEqual(stage.correctOptionIds, ['rain-started', 'friend-no-umbrella']);
  assert.match(stage.correctFeedback, /正在下雨.*同學沒有帶傘.*回教室拿雨傘/);
  assert.match(stage.incorrectFeedback, /天氣怎麼了.*同學少了什麼/);
  assert.match(stage.hints[0], /天氣發生了什麼變化/);
  assert.match(stage.hints[1], /同學少了什麼東西/);
  const studentWording = [stage.prompt, stage.incorrectFeedback, stage.correctFeedback, ...stage.hints].join(' ');
  assert.doesNotMatch(studentWording, /支持答案|文本線索|推論|證據/);

  let session = dispatchLearningTask(createLearningTaskSession(GRADE2_CHINESE_TEXT_CLUE, 'umbrella-clues-count'), GRADE2_CHINESE_TEXT_CLUE, 'start').session;
  session = dispatchLearningTask(session, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'rain-started' }).session;
  const oneSelectionSubmit = dispatchLearningTask(session, GRADE2_CHINESE_TEXT_CLUE, 'submit', { submissionId: 'umbrella-one' });
  assert.equal(oneSelectionSubmit.changed, false);
  assert.equal(oneSelectionSubmit.error, 'response_required');

  session = dispatchLearningTask(session, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'friend-no-umbrella' }).session;
  assert.equal(session.selection.length, 2);
  const thirdSelection = dispatchLearningTask(session, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'waiting-area' });
  assert.equal(thirdSelection.changed, false);
  assert.equal(thirdSelection.error, 'required_selection_count_reached');
  const correctSubmit = dispatchLearningTask(session, GRADE2_CHINESE_TEXT_CLUE, 'submit', { submissionId: 'umbrella-correct' });
  assert.equal(correctSubmit.session.phase, 'success');
  assert.equal(correctSubmit.attempt.result, 'correct');

  let wrongSession = dispatchLearningTask(createLearningTaskSession(GRADE2_CHINESE_TEXT_CLUE, 'umbrella-clues-wrong'), GRADE2_CHINESE_TEXT_CLUE, 'start').session;
  wrongSession = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'rain-started' }).session;
  wrongSession = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'waiting-area' }).session;
  const wrongSubmit = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'submit', { submissionId: 'umbrella-wrong' });
  assert.equal(wrongSubmit.session.phase, 'feedback');
  assert.equal(wrongSubmit.attempt.result, 'incorrect');

  wrongSession = dispatchLearningTask(wrongSubmit.session, GRADE2_CHINESE_TEXT_CLUE, 'retry').session;
  wrongSession = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'rain-started' }).session;
  wrongSession = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'waiting-area' }).session;
  wrongSession = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'waiting-area' }).session;
  wrongSession = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'toggle_evidence', { optionId: 'friend-no-umbrella' }).session;
  assert.deepEqual(wrongSession.selection, ['rain-started', 'friend-no-umbrella']);
  const replacedSubmit = dispatchLearningTask(wrongSession, GRADE2_CHINESE_TEXT_CLUE, 'submit', { submissionId: 'umbrella-replaced-correct' });
  assert.equal(replacedSubmit.session.phase, 'success');
  assert.equal(replacedSubmit.attempt.result, 'correct');
});

test('二年級官方對照明列學習階段或年級表，不冒稱學期與教科書進度', async () => {
  const map = await parseMap();
  for (const id of ['math-grade2-count-place-value', 'math-grade2-place-value-add-sub']) {
    const entry = map.verifiedLearningFocuses.find(({ id: entryId }) => entryId === id);
    assert.match(entry.pageOrSection, /官方 PDF 頁序第22頁/);
    assert.equal(entry.officialTextReviewStatus, 'verified_against_official_text');
    assert.equal(entry.gradeApplicabilityStatus, 'grade_2_content_code_local_schedule_pending');
  }
  for (const id of ['living-curriculum-stage1-change-inquiry', 'living-curriculum-stage1-observation-inquiry']) {
    const entry = map.verifiedLearningFocuses.find(({ id: entryId }) => entryId === id);
    assert.match(entry.pageOrSection, /第一學習階段|第一|第15頁/);
    assert.equal(entry.gradeApplicabilityStatus.includes('schedule_pending') || entry.localGradeScheduleStatus?.includes('pending'), true);
  }
});
