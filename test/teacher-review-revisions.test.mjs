import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEACHER_REVIEW_REVISIONS_STORAGE_KEY, createEmptyRevisionDataset, validateRevisionDataset,
  loadRevisionDataset, saveRevisionDataset, mergeRevisionDatasets, serializeRevisionDataset,
} from '../prototype/teacherReviewRevisions.js';
import {
  TEACHER_REVIEW_ACTIVITIES, TEACHER_REVIEW_ACTIVITY_IDS,
} from '../prototype/data/teacherReviewCatalog.js';
import { TEACHER_DECISIONS, validateTeacherReviewDataset, createEmptyTeacherReviewDataset } from '../prototype/teacherReviewWorkbench.js';

const timestamp = '2026-10-22T09:00:00.000Z';
const activity = TEACHER_REVIEW_ACTIVITIES[0];
const question = activity.questions.find((item) => item.reviewable && item.answerId && item.options.length);
function revision(revisionId = 'REV-12345678') {
  return {
    revisionId, activityId: activity.activityId, questionId: question.questionId,
    createdAt: timestamp, updatedAt: timestamp, reason: '測試用候選修訂理由',
    fields: {
      prompt: question.prompt, options: structuredClone(question.options), answerId: question.answerId,
      explanation: question.explanation, hints: structuredClone(question.hints ?? []),
      wrongFeedback: question.wrongGuidance ?? '', remediation: question.remediation ?? '',
    },
  };
}

test('候選修訂資料使用獨立 schema 與儲存鍵，schema v1 空資料可序列化及載入', () => {
  const empty = createEmptyRevisionDataset();
  assert.equal(empty.schemaVersion, 1);
  assert.notEqual(TEACHER_REVIEW_REVISIONS_STORAGE_KEY, 'taiwan-ai-academy:teacher-review-workbench:v1');
  assert.notEqual(TEACHER_REVIEW_REVISIONS_STORAGE_KEY, 'taiwan-ai-adventure.prototype-progress.v1');
  assert.equal(validateRevisionDataset(JSON.parse(serializeRevisionDataset(empty))).ok, true);
  const map = new Map();
  const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  assert.equal(saveRevisionDataset(storage, empty).ok, true);
  assert.deepEqual(loadRevisionDataset(storage).dataset, empty);
});

test('新建、編輯時保留來源題目關聯與穩定修訂 ID；取消可由純資料操作移除', () => {
  const initial = createEmptyRevisionDataset();
  initial.revisions.push(revision());
  assert.equal(validateRevisionDataset(initial).ok, true);
  const edited = structuredClone(initial);
  edited.revisions[0].fields.prompt = '候選修訂題幹';
  edited.revisions[0].updatedAt = '2026-10-22T10:00:00.000Z';
  assert.equal(validateRevisionDataset(edited).ok, true);
  assert.equal(edited.revisions[0].revisionId, initial.revisions[0].revisionId);
  assert.equal(edited.revisions[0].questionId, question.questionId);
  assert.equal(initial.revisions[0].fields.prompt, question.prompt, '原始題目資料未被引用式修改');
  edited.revisions = edited.revisions.filter((item) => item.revisionId !== edited.revisions[0].revisionId);
  assert.equal(edited.revisions.length, 0);
});

test('候選修訂 schema 拒絕未知 ID、缺理由、重複選項及不存在的正解參照', () => {
  const data = createEmptyRevisionDataset(); data.revisions.push(revision());
  const badReason = structuredClone(data); badReason.revisions[0].reason = ' ';
  assert.equal(validateRevisionDataset(badReason).ok, false);
  const badQuestion = structuredClone(data); badQuestion.revisions[0].questionId = 'UNKNOWN';
  assert.equal(validateRevisionDataset(badQuestion).ok, false);
  const duplicateOption = structuredClone(data); duplicateOption.revisions[0].fields.options.push(structuredClone(question.options[0]));
  assert.equal(validateRevisionDataset(duplicateOption).ok, false);
  const wrongAnswerRef = structuredClone(data); wrongAnswerRef.revisions[0].fields.answerId = 'NOT-AN-OPTION';
  assert.equal(validateRevisionDataset(wrongAnswerRef).ok, false);
  const unknownField = structuredClone(data); unknownField.revisions[0].fields.injected = 'x';
  assert.equal(validateRevisionDataset(unknownField).ok, false);
});

test('候選修訂匯入遇到 ID 重複或衝突時整份拒絕，不改變目前資料', () => {
  const current = createEmptyRevisionDataset(); current.revisions.push(revision());
  const snapshot = JSON.stringify(current);
  const conflict = createEmptyRevisionDataset(); conflict.revisions.push({ ...revision(), reason: '不同內容' });
  const result = mergeRevisionDatasets(current, conflict);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(current), snapshot);
  const malformed = mergeRevisionDatasets(current, { schemaVersion: 99 });
  assert.equal(malformed.ok, false);
  assert.equal(JSON.stringify(current), snapshot);
});

test('教師決定選項不會由候選修訂或 AI 狀態預填，推薦試用評估不等於試用核准', () => {
  assert.deepEqual(TEACHER_DECISIONS, ['unreviewed', 'accept_suggestions', 'request_changes', 'defer_review', 'recommend_pilot_evaluation']);
  const dataset = createEmptyTeacherReviewDataset();
  dataset.questionReviews[activity.activityId] = {
    [question.questionId]: {
      questionId: question.questionId, decision: 'unreviewed', teacherDecision: 'recommend_pilot_evaluation',
      revisionReason: '', notes: '', teacherReason: '教師明確輸入的測試意見', proposedChanges: '', evidenceNeeded: '',
      prerequisiteProgress: '', nextReviewNotes: '', criteriaReviews: {}, updatedAt: timestamp,
    },
  };
  assert.equal(validateTeacherReviewDataset(dataset).ok, true);
  assert.equal(dataset.questionReviews[activity.activityId][question.questionId].decision, 'unreviewed');
  const invalid = structuredClone(dataset);
  invalid.questionReviews[activity.activityId][question.questionId].teacherDecision = 'approved_for_publication';
  assert.equal(validateTeacherReviewDataset(invalid).ok, false);
  assert.equal(TEACHER_REVIEW_ACTIVITY_IDS.includes(activity.activityId), true);
});
