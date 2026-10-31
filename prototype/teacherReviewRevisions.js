import { TEACHER_REVIEW_ACTIVITY_IDS, TEACHER_REVIEW_QUESTION_IDS } from './data/teacherReviewCatalog.js';

export const TEACHER_REVIEW_REVISIONS_STORAGE_KEY = 'taiwan-ai-academy:teacher-review-candidate-revisions:v1';
export const TEACHER_REVIEW_REVISIONS_SCHEMA_VERSION = 1;
export const TEACHER_DECISIONS = Object.freeze([
  'unreviewed', 'accept_suggestions', 'request_changes', 'defer_review', 'recommend_pilot_evaluation',
]);
export const REVISION_FIELDS = Object.freeze([
  'prompt', 'options', 'answerId', 'explanation', 'hints', 'wrongFeedback', 'remediation',
]);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isTimestamp = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value)) && value.includes('T');
const clone = (value) => JSON.parse(JSON.stringify(value));

export function createEmptyRevisionDataset() {
  return { schemaVersion: TEACHER_REVIEW_REVISIONS_SCHEMA_VERSION, datasetId: 'math-candidate-question-revisions', updatedAt: null, revisions: [] };
}

export function validateRevisionDataset(input) {
  const errors = [];
  if (!isRecord(input)) return { ok: false, errors: ['修訂 JSON 根節點必須是物件。'] };
  if (Object.keys(input).some((key) => !['schemaVersion', 'datasetId', 'updatedAt', 'revisions'].includes(key))) errors.push('修訂資料含未知欄位。');
  if (input.schemaVersion !== TEACHER_REVIEW_REVISIONS_SCHEMA_VERSION) errors.push('不支援的修訂資料版本。');
  if (input.datasetId !== 'math-candidate-question-revisions') errors.push('修訂資料集識別碼不符。');
  if (input.updatedAt !== null && !isTimestamp(input.updatedAt)) errors.push('修訂資料集更新時間格式無效。');
  if (!Array.isArray(input.revisions)) return { ok: false, errors: [...errors, 'revisions 必須是清單。'] };
  const ids = new Set();
  for (const item of input.revisions) {
    if (!isRecord(item)) { errors.push('候選修訂項目必須是物件。'); continue; }
    const allowed = ['revisionId', 'activityId', 'questionId', 'createdAt', 'updatedAt', 'reason', 'fields'];
    if (Object.keys(item).some((key) => !allowed.includes(key))) errors.push('候選修訂含未知欄位。');
    if (typeof item.revisionId !== 'string' || !/^REV-[A-Za-z0-9-]{8,120}$/.test(item.revisionId)) errors.push('候選修訂識別碼無效。');
    else if (ids.has(item.revisionId)) errors.push(`候選修訂識別碼重複：${item.revisionId}。`);
    else ids.add(item.revisionId);
    if (!TEACHER_REVIEW_ACTIVITY_IDS.includes(item.activityId)) errors.push(`未知活動識別碼：${item.activityId}。`);
    if (!(TEACHER_REVIEW_QUESTION_IDS[item.activityId] ?? []).includes(item.questionId)) errors.push(`活動 ${item.activityId} 中有未知題目識別碼：${item.questionId}。`);
    if (!isTimestamp(item.createdAt) || !isTimestamp(item.updatedAt)) errors.push(`修訂 ${item.revisionId} 的時間欄位無效。`);
    if (typeof item.reason !== 'string' || !item.reason.trim() || item.reason.length > 4000) errors.push(`修訂 ${item.revisionId} 必須有修改理由。`);
    if (!isRecord(item.fields) || Object.keys(item.fields).some((key) => !REVISION_FIELDS.includes(key))) errors.push(`修訂 ${item.revisionId} 的 fields 格式無效。`);
    else {
      for (const key of ['prompt', 'answerId', 'explanation', 'wrongFeedback', 'remediation']) {
        if (item.fields[key] !== undefined && (typeof item.fields[key] !== 'string' || item.fields[key].length > 4000)) errors.push(`修訂 ${item.revisionId} 的 ${key} 欄位無效。`);
      }
      for (const key of ['options', 'hints']) {
        if (item.fields[key] !== undefined && !Array.isArray(item.fields[key])) errors.push(`修訂 ${item.revisionId} 的 ${key} 必須是陣列。`);
      }
      if (Array.isArray(item.fields.options)) {
        const optionIds = new Set();
        for (const option of item.fields.options) {
          if (!isRecord(option) || typeof option.optionId !== 'string' || !option.optionId || typeof option.text !== 'string') {
            errors.push(`修訂 ${item.revisionId} 的選項必須包含 optionId 與 text。`);
            continue;
          }
          if (optionIds.has(option.optionId)) errors.push(`修訂 ${item.revisionId} 有重複選項 ID ${option.optionId}。`);
          optionIds.add(option.optionId);
        }
        if (item.fields.answerId && !optionIds.has(item.fields.answerId)) errors.push(`修訂 ${item.revisionId} 的正解 ID 不在選項內。`);
      }
      if (Array.isArray(item.fields.hints) && item.fields.hints.some((hint) => typeof hint !== 'string' || hint.length > 4000)) errors.push(`修訂 ${item.revisionId} 的提示必須是文字清單。`);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], value: clone(input) };
}

export function loadRevisionDataset(storage) {
  const empty = createEmptyRevisionDataset();
  if (!storage) return { dataset: empty, canSave: true, persistence: 'memory', error: null };
  try {
    const text = storage.getItem(TEACHER_REVIEW_REVISIONS_STORAGE_KEY);
    if (!text) return { dataset: empty, canSave: true, persistence: 'local', error: null };
    const parsed = JSON.parse(text);
    const checked = validateRevisionDataset(parsed);
    return checked.ok
      ? { dataset: checked.value, canSave: true, persistence: 'local', error: null }
      : { dataset: empty, canSave: false, persistence: 'local', error: checked.errors.join(' ') };
  } catch (error) {
    return { dataset: empty, canSave: false, persistence: 'local', error: `候選修訂資料無法讀取：${error.message}` };
  }
}

export function saveRevisionDataset(storage, dataset) {
  const checked = validateRevisionDataset(dataset);
  if (!checked.ok) return { ok: false, error: checked.errors.join(' '), persistence: 'none' };
  if (!storage) return { ok: true, error: '本次修訂只保存在頁面記憶體，離開後不保留。', persistence: 'memory' };
  try {
    storage.setItem(TEACHER_REVIEW_REVISIONS_STORAGE_KEY, JSON.stringify(checked.value));
    return { ok: true, error: null, persistence: 'local' };
  } catch (error) { return { ok: false, error: `候選修訂儲存失敗：${error.message}`, persistence: 'none' }; }
}

export function mergeRevisionDatasets(current, incoming) {
  const left = validateRevisionDataset(current);
  const right = validateRevisionDataset(incoming);
  if (!left.ok) return { ok: false, error: `現有候選修訂無效：${left.errors.join(' ')}` };
  if (!right.ok) return { ok: false, error: right.errors.join(' ') };
  const ids = new Set(left.value.revisions.map((item) => item.revisionId));
  const collision = right.value.revisions.find((item) => ids.has(item.revisionId));
  if (collision) return { ok: false, error: `候選修訂 ID ${collision.revisionId} 已存在；為避免覆寫，整份匯入已拒絕。` };
  return { ok: true, dataset: { ...left.value, revisions: [...left.value.revisions, ...clone(right.value.revisions)], updatedAt: right.value.updatedAt ?? left.value.updatedAt } };
}

export function serializeRevisionDataset(dataset) {
  const checked = validateRevisionDataset(dataset);
  if (!checked.ok) throw new TypeError(checked.errors.join(' '));
  return JSON.stringify(checked.value, null, 2);
}
