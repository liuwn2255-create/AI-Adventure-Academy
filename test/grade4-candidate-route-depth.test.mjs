import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE4_CANDIDATE_LEARNING_ROUTE } from '../prototype/data/grade4CandidateLearningRoute.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';

const byId = (id) => CATALOG_CANDIDATE_TASKS.find((task) => task.activityId === id);

test('八站新增的深化互動都保留在原候選路線並有操作與解釋', () => {
  assert.equal(GRADE4_CANDIDATE_LEARNING_ROUTE.stops.length, 8);
  const requiredStages = {
    'ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE': 'compare-repeat-observations',
    'ACT-G4-CHINESE-PARAGRAPH-ARCHITECT-CANDIDATE': 'locate-paragraph-evidence',
    'ACT-G4-ENGLISH-LOST-AND-FOUND-CANDIDATE': 'assemble-location-detail',
    'ACT-G4-MATH-FRACTION-TILES-CANDIDATE': 'build-four-fifths-transfer',
    'ACT-G4-ARTS-VISUAL-COMPOSITION-CANDIDATE': 'compose-alternating-window',
    'ACT-G4-SOCIAL-LOCAL-HISTORY-TIMELINE-CANDIDATE': 'limit-history-conclusion',
    'ACT-G4-HPE-COURT-SAFETY-CANDIDATE': 'transfer-to-equipment-area',
    'ACT-G4-INTEGRATIVE-STUDY-METHOD-CANDIDATE': 'review-map-practice-record',
  };
  for (const stop of GRADE4_CANDIDATE_LEARNING_ROUTE.stops) {
    const task = byId(stop.activityId);
    assert.ok(task, stop.activityId);
    assert.equal(task.status, 'candidate_pending_teacher_review');
    assert.deepEqual(validateLearningTask(task), [], stop.activityId);
    const stage = task.stages.find(({ stageId }) => stageId === requiredStages[task.activityId]);
    assert.ok(stage, `${task.activityId} has its deeper transfer/evidence stage`);
    assert.equal(stage.hints.length >= 2, true);
    assert.ok(stage.incorrectFeedback);
    assert.ok(stage.correctFeedback);
    assert.equal(task.evidencePolicy.persistence, 'memory_only_no_student_records_no_localStorage');
  }
  const english = byId('ACT-G4-ENGLISH-LOST-AND-FOUND-CANDIDATE');
  assert.match(english.curriculumScope, /沒有音訊/);
  const science = byId('ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE');
  assert.match(science.curriculumScope, /模擬/);
  const social = byId('ACT-G4-SOCIAL-LOCAL-HISTORY-TIMELINE-CANDIDATE');
  assert.match(social.curriculumScope, /虛構/);
});

test('藝術拼貼檢查位置規則，正確圖形組合若放錯格仍會得到針對性錯誤回饋', () => {
  const task = byId('ACT-G4-ARTS-VISUAL-COMPOSITION-CANDIDATE');
  const stageIndex = task.stages.findIndex(({ stageId }) => stageId === 'compose-alternating-window');
  const stage = task.stages[stageIndex];
  assert.deepEqual(stage.shapeRules.correctPieceOrder, stage.shapeRules.correctPieceIds);

  let session = createLearningTaskSession(task, 'test-art-position-rule');
  session.phase = 'active';
  session.stageIndex = stageIndex;
  const wrongOrder = [stage.shapeRules.correctPieceOrder[0], stage.shapeRules.correctPieceOrder[2], stage.shapeRules.correctPieceOrder[1], stage.shapeRules.correctPieceOrder[3]];
  for (const pieceId of wrongOrder) session = dispatchLearningTask(session, task, 'toggle_shape_piece', { pieceId }).session;
  const wrong = dispatchLearningTask(session, task, 'submit', { submissionId: 'test-art-position-wrong' });
  assert.equal(wrong.changed, true);
  assert.equal(wrong.session.phase, 'feedback');
  assert.match(wrong.session.lastFeedback.text, /位置/);

  session = dispatchLearningTask(wrong.session, task, 'retry').session;
  for (const pieceId of stage.shapeRules.correctPieceOrder) session = dispatchLearningTask(session, task, 'toggle_shape_piece', { pieceId }).session;
  const correct = dispatchLearningTask(session, task, 'submit', { submissionId: 'test-art-position-correct' });
  assert.equal(correct.changed, true);
  assert.equal(correct.session.phase, 'success');
});

test('分數拼片可在五等分板上選取四份並保留一個空格', () => {
  const task = byId('ACT-G4-MATH-FRACTION-TILES-CANDIDATE');
  const transfer = task.stages.find(({ stageId }) => stageId === 'build-four-fifths-transfer');
  assert.equal(task.stages.filter(({ stageId }) => stageId === 'build-four-fifths-transfer').length, 1);
  assert.deepEqual(validateLearningTask(task), []);
  assert.equal(transfer.shapeRules.rows * transfer.shapeRules.columns, 5);
  assert.equal(transfer.shapeRules.selectionCount, 4);
  assert.equal(transfer.shapeRules.correctPieceIds.length, 4);

  const fresh = createLearningTaskSession(task, 'test-four-fifths');
  fresh.stageIndex = task.stages.indexOf(transfer);
  let session = dispatchLearningTask(fresh, task, 'start').session;
  for (const pieceId of transfer.shapeRules.correctPieceIds) {
    session = dispatchLearningTask(session, task, 'toggle_shape_piece', { pieceId }).session;
  }
  const submitted = dispatchLearningTask(session, task, 'submit', { submissionId: 'test-four-fifths-correct' });
  assert.equal(submitted.changed, true);
  assert.equal(submitted.session.phase, 'success');
  assert.equal(submitted.session.attempts[0].response.length, 4);
});
