import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG, getFrameworkGradeScope } from '../prototype/data/gradeCatalog.js';
import { NEIGHBORHOOD_CHANGE_EXPLORATION } from '../prototype/data/neighborhoodChangeExploration.js';
import { getLearningTaskRelation } from '../prototype/data/elementaryLearningCatalog.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

test('社會候選任務資料完整、唯一且保留階段範圍限制', () => {
  const task = NEIGHBORHOOD_CHANGE_EXPLORATION;
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(task.status, 'candidate_pending_teacher_review');
  assert.deepEqual(task.curriculumCodes, ['1a-Ⅱ-1', '3b-Ⅱ-2']);
  assert.match(task.curriculumScope, /第二學習階段/);
  assert.match(task.curriculumScope, /不宣稱涵蓋 Ca-Ⅱ-1/);
  assert.equal(task.reinforcementStatus, '尚無連結的補強活動');
  assert.equal(task.teacherReview.status, 'not_reviewed');
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(task.evidencePolicy.completionIsMastery, false);
});

test('社會任務可依資料操作、錯答重試、完成與重玩，候選事件只在記憶體', () => {
  const task = NEIGHBORHOOD_CHANGE_EXPLORATION;
  let state = createLearningTaskSession(task, 'isolated-social-session');
  state = dispatchLearningTask(state, task, 'start').session;

  const firstStage = task.stages[0];
  for (const observation of firstStage.observations) {
    const wrongCategory = firstStage.correctAssignments[observation.id] === 'recorded-change' ? 'recorded-same' : 'recorded-change';
    state = dispatchLearningTask(state, task, 'assign_category', { observationId: observation.id, categoryId: wrongCategory }).session;
  }
  state = dispatchLearningTask(state, task, 'submit').session;
  assert.equal(state.phase, 'feedback');
  assert.equal(state.lastFeedback.text, firstStage.incorrectFeedback);
  state = dispatchLearningTask(state, task, 'retry').session;
  state = dispatchLearningTask(state, task, 'hint').session;
  for (const [observationId, categoryId] of Object.entries(firstStage.correctAssignments)) {
    state = dispatchLearningTask(state, task, 'assign_category', { observationId, categoryId }).session;
  }
  state = dispatchLearningTask(state, task, 'submit').session;
  assert.equal(state.phase, 'success');
  assert.equal(state.attempts.length, 2);
  assert.equal(state.attempts[0].result, 'incorrect');
  assert.equal(state.attempts[1].hintUsed, true);

  state = dispatchLearningTask(state, task, 'next').session;
  const secondStage = task.stages[1];
  for (const [observationId, categoryId] of Object.entries(secondStage.correctAssignments)) {
    state = dispatchLearningTask(state, task, 'assign_category', { observationId, categoryId }).session;
  }
  state = dispatchLearningTask(state, task, 'submit').session;
  state = dispatchLearningTask(state, task, 'next').session;
  assert.equal(state.phase, 'completed');
  assert.equal(state.attempts.length, 3);
  assert.equal(state.status, 'candidate_pending_teacher_review');

  const restarted = dispatchLearningTask(state, task, 'restart').session;
  assert.equal(restarted.phase, 'intro');
  assert.equal(restarted.attempts.length, 0);
  assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
});

test('社會候選任務由三年級社會課程目錄直達且連至課程地圖，不擴展其他年級授課主張', async () => {
  const activity = NEIGHBORHOOD_CHANGE_EXPLORATION;
  const subject = GRADE_CATALOG[2].subjects.find(({ subjectId }) => subjectId === 'social-studies');
  assert.equal(subject.developmentStatus, 'playable_candidate_prototype');
  assert.equal(subject.existingYearLevelContent[0].activityId, activity.activityId);
  assert.equal(subject.existingYearLevelContent[0].entryRoute.targetScreen, 'social-quest');
  assert.equal(subject.existingYearLevelContent[0].progressPersistence, 'memory_only_no_student_records_no_localStorage');
  assert.equal(getLearningTaskRelation('grade-3', 'social-studies').tasks[0].taskId, activity.activityId);
  for (const grade of GRADE_CATALOG) {
    assert.ok(grade.subjects.every((entry) => entry.frameworkGradeScope?.label));
  }
  assert.equal(getFrameworkGradeScope(1, 'social-studies').status, 'integrated_in_life_course_phase_1');
  assert.equal(getFrameworkGradeScope(3, 'social-studies').status, 'phase_2_and_3_subject');

  const map = JSON.parse(await readFile(new URL('../curriculum/learning-map.json', import.meta.url), 'utf8'));
  const relation = map.learningObjectiveTaskCrosswalk.find(({ gradeId, tasks }) => gradeId === 'grade-3' && tasks.some(({ taskId }) => taskId === activity.activityId));
  assert.ok(relation);
  assert.equal(relation.tasks[0].status, 'playable_candidate_pending_teacher_review');
  assert.equal(relation.tasks[0].evidenceType, 'candidate_practice_response_only_memory_only');
  const officialMap = JSON.parse(await readFile(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'));
  const socialScope = officialMap.pendingLearningFocuses.find(({ id }) => id === activity.curriculumMapId);
  assert.ok(socialScope);
  assert.equal(socialScope.officialTextReviewStatus, 'verified_against_official_text');
  assert.equal(socialScope.gradeApplicabilityStatus, 'stage_2_grade_3_to_4_local_grade_schedule_pending');

  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="grade-subject-open-social"/);
  assert.match(html, /id="social-quest-screen"/);
  assert.match(app, /renderReusableCandidateTask\(NEIGHBORHOOD_CHANGE_EXPLORATION/);
});
