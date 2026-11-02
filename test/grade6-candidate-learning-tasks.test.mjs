import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRADE6_CANDIDATE_TASKS } from '../prototype/data/grade6CandidateTasks.js';
import { CATALOG_CANDIDATE_TASKS, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const focusById = new Map([
  ...curriculum.verifiedLearningFocuses,
  ...curriculum.supplementalVerifiedLearningFocuses,
  ...curriculum.pendingLearningFocuses,
].map((focus) => [focus.id, focus]));

function operate(session, task, stage, correct) {
  if (stage.interaction === 'classify_observations' || stage.interaction === 'build_frequency_table') {
    for (const observation of stage.observations) {
      const expected = stage.correctAssignments[observation.id];
      const categoryId = correct ? expected : stage.categories.find(({ id }) => id !== expected).id;
      session = dispatchLearningTask(session, task, 'assign_category', { observationId: observation.id, categoryId }).session;
    }
  } else if (stage.interaction === 'assemble_response') {
    const ids = [...stage.correctOptionIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (const tokenId of ids) session = dispatchLearningTask(session, task, 'add_phrase_token', { tokenId }).session;
  } else if (stage.interaction === 'complete_calculation_steps') {
    for (const step of stage.calculationSteps) {
      const value = correct ? step.expectedValue : step.choices.find(({ value: choice }) => choice !== step.expectedValue).value;
      session = dispatchLearningTask(session, task, 'select_calculation_value', { stepId: step.id, value }).session;
    }
  } else if (stage.interaction === 'order_items') {
    const ids = [...stage.correctItemIds];
    if (!correct) [ids[0], ids[1]] = [ids[1], ids[0]];
    for (let targetIndex = 0; targetIndex < ids.length; targetIndex += 1) {
      const fromIndex = session.orderedItems.indexOf(ids[targetIndex]);
      if (fromIndex !== targetIndex) session = dispatchLearningTask(session, task, 'move_ordered_item', { itemId: ids[targetIndex], toIndex: targetIndex }).session;
    }
  } else if (stage.interaction === 'collect_evidence') {
    const ids = correct ? stage.correctOptionIds : [stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id];
    for (const optionId of ids) session = dispatchLearningTask(session, task, 'toggle_evidence', { optionId }).session;
  } else if (stage.interaction === 'choose_response') {
    const optionId = correct ? stage.correctOptionIds[0] : stage.options.find(({ id }) => !stage.correctOptionIds.includes(id)).id;
    session = dispatchLearningTask(session, task, 'select_option', { optionId }).session;
  } else assert.fail(`Unhandled interaction: ${stage.interaction}`);
  return session;
}

function submit(session, task, stage, correct, suffix) {
  session = operate(session, task, stage, correct);
  return dispatchLearningTask(session, task, 'submit', { submissionId: `${session.sessionId}:${stage.stageId}:${suffix}` }).session;
}

test('八項六年級候選活動具唯一 ID、官方課綱參照與科目入口關聯', () => {
  assert.equal(GRADE6_CANDIDATE_TASKS.length, 8);
  assert.deepEqual(Object.fromEntries(['mathematics', 'chinese-language', 'natural-science', 'english-language'].map((subjectId) => [subjectId, GRADE6_CANDIDATE_TASKS.filter((task) => task.subjectId === subjectId).length])), {
    mathematics: 4, 'chinese-language': 2, 'natural-science': 1, 'english-language': 1,
  });
  assert.equal(new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId)).size, CATALOG_CANDIDATE_TASKS.length);
  const grade6 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-6');
  assert.equal(grade6.developmentStatus, 'in_development_partial');
  assert.equal(grade6.curriculumApplicabilityStatus, 'partial_official_scope_recorded_local_schedule_pending');
  for (const task of GRADE6_CANDIDATE_TASKS) {
    assert.deepEqual(validateLearningTask(task), [], task.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.equal(task.teacherReview.status, 'not_reviewed');
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
    assert.equal(task.evidencePolicy.completionIsMastery, false);
    assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
    const focus = focusById.get(task.curriculumMapId);
    assert.ok(focus, `${task.activityId} has official curriculum map entry`);
    assert.equal(focus.sourceId, task.sourceId);
    assert.ok(['verified_against_official_text', 'verified_against_official_text_this_run', 'verified_against_official_pdf_this_run'].includes(focus.officialTextReviewStatus));
    assert.ok(task.curriculumCodes.every((code) => [...(focus.contentCodes ?? []), ...(focus.performanceCodes ?? [])].includes(code)), task.activityId);
    const subject = grade6.subjects.find(({ subjectId }) => subjectId === task.subjectId);
    assert.ok(subject.existingYearLevelContent.some((entry) => entry.activityId === task.activityId && entry.status === 'candidate_pending_teacher_review' && entry.entryRoute.targetScreen === 'catalog-task'));
    assert.ok(getCatalogCandidateTasksForSubject('grade-6', task.subjectId).some(({ activityId }) => activityId === task.activityId));
    const relation = getLearningTaskRelation('grade-6', task.subjectId);
    assert.ok(relation?.curriculumMapIds.includes(task.curriculumMapId));
    assert.ok(relation?.learningObjectiveTaskLinks.some(({ learningObjectiveId, taskIds }) => learningObjectiveId === task.learningObjective.objectiveId && taskIds.includes(task.activityId)));
    assert.ok(task.stages.every(({ hints }) => hints.length >= 2));
    assert.match(task.curriculumScope, /部分/);
  }
});

test('六年級英語畫畫對話的干擾選項文法自然且不搶走最佳回應', () => {
  const matching = GRADE6_CANDIDATE_TASKS.flatMap((task) => task.stages
    .filter(({ stageId }) => stageId === 'choose-friendly-response')
    .map((stage) => ({ task, stage })));
  assert.equal(matching.length, 1);
  const { task, stage } = matching[0];
  assert.equal(task.activityId, 'ACT-G6-ENGLISH-INTRODUCTION-CARDS-CANDIDATE');
  assert.equal(task.gradeId, 'grade-6');
  assert.equal(task.subjectId, 'english-language');
  assert.equal(stage.prompt, '同學說「I like drawing, too.」選擇一個與交流情境相關且友善的回應。');
  assert.equal(stage.interaction, 'choose_response');
  assert.deepEqual(stage.context, [{ speaker: '同學', text: 'I like drawing, too.' }]);
  assert.deepEqual(stage.options, [
    { id: 'ask-picture', text: 'What do you like to draw?' },
    { id: 'ask-sport', text: 'What sport do you like?' },
    { id: 'ask-food', text: 'What food do you like?' },
  ]);
  assert.deepEqual(stage.correctOptionIds, ['ask-picture']);
  assert.ok(stage.options.every(({ text }) => /^[A-Z][A-Za-z' ]+\?$/.test(text)), 'all options are complete, grammatical English questions');
  assert.ok(stage.options.filter(({ id }) => id !== 'ask-picture').every(({ text }) => !/draw|drawing|art/i.test(text)));
  assert.equal(stage.options.some(({ text }) => text === 'It is raining yesterday.' || text === 'Where is the blue elephant?'), false);
  assert.equal(stage.options.some((option) => Object.hasOwn(option, 'feedback')), false, 'this stage has no per-option feedback');
  assert.match(stage.incorrectFeedback, /同學正在談什麼.*接著這個話題.*自然繼續/);
  assert.match(stage.correctFeedback, /接著聊畫畫.*自然繼續/);
  assert.deepEqual(stage.hints, [
    '回應要接續共同興趣，而不是突然改談無關事情。',
    '可以接著詢問對方畫畫的喜好；保持簡短並與對話相關。',
  ]);
});

test('八項六年級活動逐階段提示、錯答回饋、重試、正答、完成與重玩', () => {
  for (const task of GRADE6_CANDIDATE_TASKS) {
    let session = dispatchLearningTask(createLearningTaskSession(task, `grade6-flow-${task.activityId}`), task, 'start').session;
    for (const [index, stage] of task.stages.entries()) {
      if (index) session = dispatchLearningTask(session, task, 'next').session;
      for (let layer = 0; layer < 2; layer += 1) {
        const hinted = dispatchLearningTask(session, task, 'hint');
        assert.equal(hinted.changed, true, `${task.activityId}/${stage.stageId}/hint-${layer + 1}`);
        assert.ok(hinted.hint);
        session = hinted.session;
      }
      session = submit(session, task, stage, false, 'wrong');
      assert.equal(session.phase, 'feedback', `${task.activityId}/${stage.stageId} incorrect response accepted`);
      assert.equal(session.attempts.at(-1).result, 'incorrect');
      assert.equal(session.attempts.at(-1).hintUsed, true);
      assert.ok(session.lastFeedback.text);
      session = dispatchLearningTask(session, task, 'retry').session;
      session = submit(session, task, stage, true, 'correct');
      assert.equal(session.phase, 'success');
      assert.equal(session.attempts.at(-1).result, 'correct');
      assert.equal(session.attempts.at(-1).attemptNumber, 2);
      assert.equal(new Set(session.attempts.map(({ eventId }) => eventId)).size, session.attempts.length);
    }
    session = dispatchLearningTask(session, task, 'next').session;
    assert.equal(session.phase, 'completed');
    assert.equal(session.attempts.length, task.stages.length * 2);
    const replay = dispatchLearningTask(session, task, 'restart').session;
    assert.equal(replay.phase, 'intro');
    assert.equal(replay.attempts.length, 0);
  }
});

test('六年級題目答案可核算且正式資料狀態未改變', () => {
  const primeFactors = [2, 3, 3];
  assert.equal(primeFactors.reduce((product, factor) => product * factor, 1), 18);
  const calc = GRADE6_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G6-MATH-MULTI-STEP-REASONING-CANDIDATE').stages[0].calculationSteps;
  assert.deepEqual(calc.map(({ expectedValue }) => expectedValue), [3 * 24, 2 * 18, (3 * 24) + (2 * 18), ((3 * 24) + (2 * 18)) - 15]);
  const registry = JSON.parse(fs.readFileSync(new URL('../curriculum/unit-registry.json', import.meta.url), 'utf8'));
  const learningMap = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));
  assert.equal(registry.units.find(({ unitId }) => unitId === 'M3-NUM-01')?.status, 'candidate');
  assert.equal(learningMap.designBoundary.stage0Status, 'not_passed');
  for (const task of GRADE6_CANDIDATE_TASKS) assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
});
