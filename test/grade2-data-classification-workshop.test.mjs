import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE2_DATA_CLASSIFICATION_WORKSHOP as task } from '../prototype/data/grade2DataClassificationWorkshop.js';
import { CATALOG_CANDIDATE_TASK_BY_ID, getCatalogCandidateTasksForSubject } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { buildOfficialLearningItemCrosswalk } from '../scripts/official-learning-item-activity-crosswalk.mjs';
import { readFileSync } from 'node:fs';

const byId = 'ACT-G2-MATH-DATA-CLASSIFICATION-NESTED-GROUPS-CANDIDATE';
const curriculumMap = JSON.parse(readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
const definitions = JSON.parse(readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'));

test('D-2-1 classification task is unique, candidate-only and connected to the grade directory and traceable subitem', () => {
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.activityId, byId);
  assert.equal(CATALOG_CANDIDATE_TASK_BY_ID.get(byId), task);
  assert.equal(getCatalogCandidateTasksForSubject('grade-2', 'mathematics').filter(({ activityId }) => activityId === byId).length, 1);
  const directory = getGradeById('grade-2').subjects.find(({ subjectId }) => subjectId === 'mathematics').existingYearLevelContent;
  assert.ok(directory.some(({ activityId, status }) => activityId === byId && status === 'candidate_pending_teacher_review'));
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.deepEqual(task.curriculumCodes, ['D-2-1', 'd-I-1']);
  const focus = curriculumMap.supplementalVerifiedLearningFocuses.find(({ id }) => id === task.curriculumMapId);
  assert.equal(focus.officialTextReviewStatus, 'verified_against_official_pdf_this_run');
  assert.deepEqual(focus.contentCodes, ['D-2-1']);
  const subitem = definitions.definitions.find(({ subitemId }) => subitemId === task.learningSubitemClaims[0]);
  assert.deepEqual(subitem.evidenceStageIds, task.stages.map(({ stageId }) => stageId));
  assert.match(subitem.projectSubitem, /專案分析/);
  assert.match(subitem.projectSubitem, /不教正式表格或統計圖表/);
});

test('learners collect, classify and subdivide simulated shape cards, receive feedback, retry and complete', () => {
  let session = createLearningTaskSession(task, `${byId}:test`);
  session = apply(session, 'start');
  const collection = task.stages[0];
  const distractor = collection.options.find(({ id }) => !collection.correctOptionIds.includes(id));
  session = apply(session, 'toggle_evidence', { optionId: distractor.id });
  session = submit(session, 'collect-wrong');
  assert.equal(session.phase, 'feedback');
  assert.equal(session.lastFeedback.correct, false);
  session = apply(session, 'retry');
  session = apply(session, 'hint');
  for (const optionId of collection.correctOptionIds) session = apply(session, 'toggle_evidence', { optionId });
  session = submit(session, 'collect-correct');
  assert.equal(session.phase, 'success');
  session = apply(session, 'next');

  const byColor = task.stages[1];
  for (const item of byColor.observations) {
    const correct = byColor.correctAssignments[item.id];
    session = apply(session, 'assign_category', { observationId: item.id, categoryId: item === byColor.observations[0] ? 'blue' : correct });
  }
  session = submit(session, 'color-wrong');
  assert.equal(session.lastFeedback.correct, false);
  assert.match(session.lastFeedback.text, /分組盤/);
  session = apply(session, 'retry');
  session = apply(session, 'hint');
  for (const item of byColor.observations) session = apply(session, 'assign_category', { observationId: item.id, categoryId: byColor.correctAssignments[item.id] });
  session = submit(session, 'color-correct');
  assert.equal(session.phase, 'success');
  session = apply(session, 'next');

  const refine = task.stages[2];
  for (const item of refine.observations) session = apply(session, 'assign_category', { observationId: item.id, categoryId: refine.correctAssignments[item.id] });
  session = submit(session, 'refine-correct');
  assert.equal(session.phase, 'success');
  session = apply(session, 'next');
  assert.equal(session.phase, 'completed');
  assert.equal(session.attempts.length, 5);
  assert.equal(session.attempts.some(({ hintUsed }) => hintUsed), true);
});

test('official D-2-1 gains only partial interaction evidence; official denominator stays unknown', () => {
  const report = buildOfficialLearningItemCrosswalk();
  const row = report.mathOfficialLearningContentItems.find(({ officialCode }) => officialCode === 'D-2-1');
  assert.equal(row.coverageStatus, 'partial');
  assert.deepEqual(row.activityIds, [byId]);
  assert.deepEqual(row.activityEvidence.map(({ stageId }) => stageId), task.stages.map(({ stageId }) => stageId));
  assert.equal(report.scope.officialElementaryItemTotal, null);
  assert.equal(report.scope.nationalCoverageRate, null);
});

function apply(session, action, payload = {}) {
  const result = dispatchLearningTask(session, task, action, payload);
  assert.equal(result.changed, true, `${action} failed: ${result.error ?? 'no state change'}`);
  return result.session;
}

function submit(session, submissionId) {
  return apply(session, 'submit', { submissionId });
}
