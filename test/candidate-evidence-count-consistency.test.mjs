import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE2_DATA_CLASSIFICATION_WORKSHOP } from '../prototype/data/grade2DataClassificationWorkshop.js';
import { LEARNING_SUBITEM_GAP_TASKS } from '../prototype/data/learningSubitemGapTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';

const animalActivity = LEARNING_SUBITEM_GAP_TASKS.find(({ activityId }) => activityId === 'ACT-G3-SCIENCE-ANIMAL-EVIDENCE-ATLAS-CANDIDATE');
const geometryActivity = GRADE2_DATA_CLASSIFICATION_WORKSHOP;

test('animal evidence prompt asks for the single record that directly mentions fins', () => {
  const stage = animalActivity.stages.find(({ stageId }) => stageId === 'choose-record-evidence');

  assert.equal(stage.interaction, 'collect_evidence');
  assert.equal(stage.prompt, '哪一張紀錄卡直接寫到魚的鰭？');
  assert.deepEqual(stage.evidenceRecords, [
    { title: '紀錄 A', text: '常見動物：頭、軀幹、肢。' },
    { title: '紀錄 B', text: '魚類：頭、軀幹、鰭。' },
    { title: '紀錄 C', text: '昆蟲：頭、胸、腹、附肢。' },
  ]);
  assert.deepEqual(stage.options.map(({ id, text }) => ({ id, text })), [
    { id: 'a', text: '紀錄 A：頭、軀幹、肢' },
    { id: 'b', text: '紀錄 B：頭、軀幹、鰭' },
    { id: 'c', text: '紀錄 C：頭、胸、腹、附肢' },
  ]);
  assert.deepEqual(stage.correctOptionIds, ['b']);
  assert.equal(stage.requiredSelectionCount, undefined);

  let session = dispatchLearningTask(createLearningTaskSession(animalActivity, 'animal-fins-evidence'), animalActivity, 'start').session;
  assert.equal(animalActivity.stages[session.stageIndex].stageId, 'compare-shared-and-variable-features');
  const comparison = animalActivity.stages[session.stageIndex];
  for (const observation of comparison.observations) {
    session = dispatchLearningTask(session, animalActivity, 'assign_category', {
      observationId: observation.id,
      categoryId: comparison.correctAssignments[observation.id],
    }).session;
  }
  session = dispatchLearningTask(session, animalActivity, 'submit', { submissionId: 'animal-feature-comparison' }).session;
  assert.equal(session.phase, 'success');
  session = dispatchLearningTask(session, animalActivity, 'next').session;
  assert.equal(animalActivity.stages[session.stageIndex].stageId, 'choose-record-evidence');
  session = dispatchLearningTask(session, animalActivity, 'toggle_evidence', { optionId: 'b' }).session;
  const submitted = dispatchLearningTask(session, animalActivity, 'submit', { submissionId: 'animal-fins-correct' });
  assert.equal(submitted.session.phase, 'success');
  assert.equal(submitted.attempt.result, 'correct');
  const next = dispatchLearningTask(submitted.session, animalActivity, 'next');
  assert.equal(next.session.stageIndex, 2);
  assert.equal(animalActivity.stages[next.session.stageIndex].stageId, 'transfer-new-record');
});

test('all six visible flat geometry cards are required before collection can be submitted', () => {
  const stage = geometryActivity.stages.find(({ stageId }) => stageId === 'collect-geometric-object-cards');
  const expectedFlatCardIds = ['red-circle', 'blue-triangle', 'red-square', 'green-rectangle', 'red-triangle', 'yellow-circle'];

  assert.equal(stage.interaction, 'collect_evidence');
  assert.equal(stage.prompt, '觀察桌上混合的生活物件卡，收集所有「平面幾何形體」卡，先把資料找齊。');
  assert.deepEqual(stage.options.map(({ id }) => id), [
    'red-circle', 'blue-triangle', 'red-square', 'green-rectangle', 'toy-car', 'red-triangle', 'blue-cube', 'yellow-circle',
  ]);
  assert.deepEqual(expectedFlatCardIds, ['red-circle', 'blue-triangle', 'red-square', 'green-rectangle', 'red-triangle', 'yellow-circle']);
  assert.equal(stage.requiredSelectionCount, 6);

  let session = dispatchLearningTask(createLearningTaskSession(geometryActivity, 'geometry-collect-all'), geometryActivity, 'start').session;
  for (const optionId of expectedFlatCardIds.slice(0, 5)) {
    session = dispatchLearningTask(session, geometryActivity, 'toggle_evidence', { optionId }).session;
  }
  const incompleteSubmit = dispatchLearningTask(session, geometryActivity, 'submit', { submissionId: 'geometry-incomplete' });
  assert.equal(incompleteSubmit.changed, false);
  assert.equal(incompleteSubmit.error, 'response_required');

  session = dispatchLearningTask(session, geometryActivity, 'toggle_evidence', { optionId: expectedFlatCardIds[5] }).session;
  assert.equal(session.selection.length, 6);
  const seventhSelection = dispatchLearningTask(session, geometryActivity, 'toggle_evidence', { optionId: 'toy-car' });
  assert.equal(seventhSelection.changed, false);
  assert.equal(seventhSelection.error, 'required_selection_count_reached');

  session = dispatchLearningTask(session, geometryActivity, 'toggle_evidence', { optionId: expectedFlatCardIds[0] }).session;
  assert.equal(session.selection.length, 5);
  session = dispatchLearningTask(session, geometryActivity, 'toggle_evidence', { optionId: 'blue-cube' }).session;
  assert.ok(session.selection.includes('blue-cube'), 'cancelling one selection allows a replacement');
  session = dispatchLearningTask(session, geometryActivity, 'toggle_evidence', { optionId: 'blue-cube' }).session;
  session = dispatchLearningTask(session, geometryActivity, 'toggle_evidence', { optionId: expectedFlatCardIds[0] }).session;
  const completeSubmit = dispatchLearningTask(session, geometryActivity, 'submit', { submissionId: 'geometry-complete' });
  assert.equal(completeSubmit.session.phase, 'success');
  assert.equal(completeSubmit.attempt.result, 'correct');
});
