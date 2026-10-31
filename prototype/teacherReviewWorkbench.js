import {
  TEACHER_REVIEW_ACTIVITIES_WITH_SCOPE as TEACHER_REVIEW_ACTIVITIES,
  TEACHER_REVIEW_ACTIVITY_IDS,
  TEACHER_REVIEW_PREREQUISITE_IDS,
  TEACHER_REVIEW_QUESTION_IDS,
} from './data/teacherReviewCatalog.js';
import { mergeAcceptanceEvidenceReports, validateAcceptanceEvidenceReport } from './acceptanceEvidence.js';
import {
  TEACHER_DECISIONS, REVISION_FIELDS, loadRevisionDataset,
  saveRevisionDataset, mergeRevisionDatasets, serializeRevisionDataset,
} from './teacherReviewRevisions.js';
export { TEACHER_DECISIONS };

export const TEACHER_REVIEW_STORAGE_KEY = 'taiwan-ai-academy:teacher-review-workbench:v1';
export const TEACHER_REVIEW_DATASET_ID = 'math-candidate-review-records';
export const TEACHER_REVIEW_SCHEMA_VERSION = 1;
export const REVIEW_DECISIONS = Object.freeze(['unreviewed', 'accepted', 'needs_revision', 'defer']);
export const PREREQUISITE_DECISIONS = Object.freeze(['pending', 'confirmed', 'not_confirmed']);
export const REVIEW_CRITERIA = Object.freeze([
  { id: 'answer_and_explanation', label: '正解與解析正確' },
  { id: 'prompt_and_options', label: '題幹與選項清楚，沒有多重合理答案' },
  { id: 'target_alignment', label: '題目確實測量所宣稱的能力' },
  { id: 'prerequisite_and_difficulty', label: '先備能力與難度符合預定學生' },
  { id: 'hints_non_disclosing', label: '提示不會直接洩漏答案' },
  { id: 'feedback_alignment', label: '錯答回饋符合可能的錯誤原因' },
  { id: 'curriculum_evidence', label: '課綱對照有可追溯依據' },
  { id: 'sequence_and_timing', label: '題目順序及教學使用時機適當' },
  { id: 'remediation_available', label: '補強活動是否真正連結且可用' },
]);
export const REVIEW_CRITERION_STATUSES = Object.freeze(['unreviewed', 'passed', 'needs_revision', 'not_applicable']);
export const PILOT_DECISIONS = Object.freeze(['pending', 'approved_for_pilot', 'defer']);
export const EVIDENCE_TYPES = Object.freeze(['automated_test', 'browser_acceptance', 'curriculum_source_check', 'teacher_review', 'other']);
export const EVIDENCE_RESULTS = Object.freeze(['passed', 'failed', 'partial', 'not_run', 'pending_verification']);
export const REQUIRED_BROWSER_VIEWPORTS = Object.freeze(['1366x768', '390x844', '340x740']);

const activityById = new Map(TEACHER_REVIEW_ACTIVITIES.map((activity) => [activity.activityId, activity]));
const decisionLabels = Object.freeze({
  unreviewed: '尚未審查',
  accepted: '通過內容審查（不代表課程核准或發布）',
  needs_revision: '需修改',
  defer: '暫不採用',
});
const teacherDecisionLabels = Object.freeze({
  unreviewed: '尚未審查',
  accept_suggestions: '接受修改建議（不代表核准）',
  request_changes: '要求修改',
  defer_review: '暫緩審查',
  recommend_pilot_evaluation: '建議進入試用評估（不代表准予試用）',
});
const statusLabels = Object.freeze({
  official_source_and_map_entry_recorded: '官方來源與地圖參照已登錄；題目對應仍待審',
  official_reference_recorded_item_alignment_pending: '官方參照已記錄；逐題對應待確認',
  pending_verification: '課綱參照待核對',
  grade_content_in_official_map_annual_schedule_pending: '年級內容見專案地圖；年度／班級進度待確認',
  grade_content_reference_recorded_annual_schedule_and_class_progress_pending: '年級內容參照已記錄；年度／班級進度待確認',
  grade_content_reference_recorded_annual_allocation_and_class_progress_pending: '年級內容參照已記錄；年度配置／班級進度待確認',
  grade_content_in_official_map_annual_allocation_and_class_progress_pending: '年級內容見專案地圖；年度配置／班級進度待確認',
  pending_review: '待教師確認',
});
const textbookKeys = Object.freeze(['publisher', 'schoolYear', 'edition', 'grade', 'semester', 'volume', 'unit', 'pages']);
const maxTextLength = 4000;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isTimestamp = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value)) && value.includes('T');
const hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
const clone = (value) => JSON.parse(JSON.stringify(value));
const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};

export function createEmptyTeacherReviewDataset() {
  return {
    schemaVersion: TEACHER_REVIEW_SCHEMA_VERSION,
    datasetId: TEACHER_REVIEW_DATASET_ID,
    updatedAt: null,
    activityReviews: {},
    questionReviews: {},
    evidenceRecords: [],
  };
}

function validateActivityReview(activityId, record, errors) {
  const allowed = ['activityId', 'decision', 'textbook', 'classroomProgress', 'prerequisiteChecks', 'notes', 'pilotDecision', 'pilotNotes', 'updatedAt'];
  if (!isRecord(record) || !hasOnlyKeys(record, allowed)) {
    errors.push(`活動 ${activityId} 的審查資料格式不正確。`);
    return;
  }
  if (record.activityId !== activityId) errors.push(`活動識別碼不一致：${activityId}。`);
  if (!REVIEW_DECISIONS.includes(record.decision)) errors.push(`活動 ${activityId} 的審查狀態無效。`);
  if (!isRecord(record.textbook) || !hasOnlyKeys(record.textbook, textbookKeys) || textbookKeys.some((key) => typeof record.textbook[key] !== 'string' || record.textbook[key].length > 300)) {
    errors.push(`活動 ${activityId} 的教材欄位格式不正確。`);
  }
  if (typeof record.classroomProgress !== 'string' || record.classroomProgress.length > maxTextLength) errors.push(`活動 ${activityId} 的授課進度欄位無效。`);
  if (typeof record.notes !== 'string' || record.notes.length > maxTextLength) errors.push(`活動 ${activityId} 的審查備註欄位無效。`);
  const allowedPrerequisites = TEACHER_REVIEW_PREREQUISITE_IDS[activityId] ?? [];
  if (!isRecord(record.prerequisiteChecks) || !hasOnlyKeys(record.prerequisiteChecks, allowedPrerequisites)
    || Object.values(record.prerequisiteChecks).some((value) => !PREREQUISITE_DECISIONS.includes(value))) {
    errors.push(`活動 ${activityId} 的先備能力確認欄位無效。`);
  }
  if (!isTimestamp(record.updatedAt)) errors.push(`活動 ${activityId} 缺少有效的最後更新時間。`);
  if (record.pilotDecision !== undefined && !PILOT_DECISIONS.includes(record.pilotDecision)) errors.push(`活動 ${activityId} 的試用決定無效。`);
  if (record.pilotNotes !== undefined && (typeof record.pilotNotes !== 'string' || record.pilotNotes.length > maxTextLength)) errors.push(`活動 ${activityId} 的試用備註欄位無效。`);
}

function validateQuestionReview(activityId, questionId, record, errors) {
  const allowed = ['questionId', 'decision', 'revisionReason', 'notes', 'criteriaReviews', 'updatedAt', 'teacherDecision', 'teacherReason', 'proposedChanges', 'evidenceNeeded', 'prerequisiteProgress', 'nextReviewNotes'];
  if (!isRecord(record) || !hasOnlyKeys(record, allowed)) {
    errors.push(`題目 ${questionId} 的審查資料格式不正確。`);
    return;
  }
  if (record.questionId !== questionId) errors.push(`題目識別碼不一致：${questionId}。`);
  if (!REVIEW_DECISIONS.includes(record.decision)) errors.push(`題目 ${questionId} 的審查狀態無效。`);
  if (typeof record.revisionReason !== 'string' || record.revisionReason.length > maxTextLength) errors.push(`題目 ${questionId} 的修改理由欄位無效。`);
  if (typeof record.notes !== 'string' || record.notes.length > maxTextLength) errors.push(`題目 ${questionId} 的審查備註欄位無效。`);
  if (record.teacherDecision !== undefined && !TEACHER_DECISIONS.includes(record.teacherDecision)) errors.push(`題目 ${questionId} 的教師工作流程決定無效。`);
  for (const key of ['teacherReason', 'proposedChanges', 'evidenceNeeded', 'prerequisiteProgress', 'nextReviewNotes']) {
    if (record[key] !== undefined && (typeof record[key] !== 'string' || record[key].length > maxTextLength)) errors.push(`題目 ${questionId} 的 ${key} 欄位無效。`);
  }
  if (!isTimestamp(record.updatedAt)) errors.push(`題目 ${questionId} 缺少有效的最後更新時間。`);
  if (record.criteriaReviews !== undefined) {
    if (!isRecord(record.criteriaReviews) || !hasOnlyKeys(record.criteriaReviews, REVIEW_CRITERIA.map((criterion) => criterion.id))) {
      errors.push(`題目 ${questionId} 的逐項審查清單格式無效。`);
    } else {
      for (const [criterionId, review] of Object.entries(record.criteriaReviews)) {
        if (!isRecord(review) || !hasOnlyKeys(review, ['status', 'comment'])
          || !REVIEW_CRITERION_STATUSES.includes(review.status)
          || typeof review.comment !== 'string' || review.comment.length > maxTextLength) {
          errors.push(`題目 ${questionId} 的審查項目 ${criterionId} 格式無效。`);
          continue;
        }
        if (['not_applicable', 'needs_revision'].includes(review.status) && !review.comment.trim()) {
          errors.push(`題目 ${questionId} 的審查項目「${criterionId}」需填寫理由或修正建議。`);
        }
      }
    }
  }
}

export function validateTeacherReviewDataset(input) {
  const errors = [];
  if (!isRecord(input)) return { ok: false, errors: ['JSON 根節點必須是物件。'] };
  const rootKeys = ['schemaVersion', 'datasetId', 'updatedAt', 'activityReviews', 'questionReviews', 'evidenceRecords'];
  if (!hasOnlyKeys(input, rootKeys)) errors.push('資料包含未知欄位。');
  if (input.schemaVersion !== TEACHER_REVIEW_SCHEMA_VERSION) errors.push('不支援此資料版本。');
  if (input.datasetId !== TEACHER_REVIEW_DATASET_ID) errors.push('資料集識別碼不符。');
  if (input.updatedAt !== null && !isTimestamp(input.updatedAt)) errors.push('資料集最後更新時間格式無效。');
  if (!isRecord(input.activityReviews) || !isRecord(input.questionReviews)) errors.push('活動或題目審查資料必須是物件。');
  if (!isRecord(input.activityReviews) || !isRecord(input.questionReviews)) return { ok: false, errors };

  for (const activityId of Object.keys(input.activityReviews)) {
    if (!TEACHER_REVIEW_ACTIVITY_IDS.includes(activityId)) {
      errors.push(`未知的活動識別碼：${activityId}。`);
      continue;
    }
    validateActivityReview(activityId, input.activityReviews[activityId], errors);
  }
  for (const [activityId, questions] of Object.entries(input.questionReviews)) {
    if (!TEACHER_REVIEW_ACTIVITY_IDS.includes(activityId)) {
      errors.push(`未知的活動識別碼：${activityId}。`);
      continue;
    }
    if (!isRecord(questions)) {
      errors.push(`活動 ${activityId} 的題目審查資料必須是物件。`);
      continue;
    }
    for (const [questionId, record] of Object.entries(questions)) {
      if (!(TEACHER_REVIEW_QUESTION_IDS[activityId] ?? []).includes(questionId)) {
        errors.push(`活動 ${activityId} 中有未知題目識別碼：${questionId}。`);
        continue;
      }
      validateQuestionReview(activityId, questionId, record, errors);
    }
  }
  const evidenceRecords = input.evidenceRecords ?? [];
  if (!Array.isArray(evidenceRecords)) errors.push('驗收證據必須是清單。');
  const evidenceIds = new Set();
  for (const record of Array.isArray(evidenceRecords) ? evidenceRecords : []) {
    const allowed = ['evidenceId', 'scopeType', 'activityId', 'questionId', 'evidenceType', 'performedItems', 'result', 'executedAt', 'source', 'limitations', 'viewport'];
    if (!isRecord(record) || !hasOnlyKeys(record, allowed)) { errors.push('驗收證據欄位格式不正確。'); continue; }
    if (typeof record.evidenceId !== 'string' || !record.evidenceId.trim() || record.evidenceId.length > 160) errors.push('驗收證據缺少有效識別碼。');
    else if (evidenceIds.has(record.evidenceId)) errors.push(`驗收證據識別碼重複：${record.evidenceId}。`);
    else evidenceIds.add(record.evidenceId);
    if (!['system', 'activity', 'question'].includes(record.scopeType)) errors.push(`證據 ${record.evidenceId} 的範圍無效。`);
    if (record.scopeType === 'system' && (record.activityId !== null || record.questionId !== null)) errors.push(`系統證據 ${record.evidenceId} 不可附活動或題目識別碼。`);
    if (record.scopeType === 'activity' && (!TEACHER_REVIEW_ACTIVITY_IDS.includes(record.activityId) || record.questionId !== null)) errors.push(`活動證據 ${record.evidenceId} 的識別碼無效。`);
    if (record.scopeType === 'question' && (!TEACHER_REVIEW_ACTIVITY_IDS.includes(record.activityId) || !(TEACHER_REVIEW_QUESTION_IDS[record.activityId] ?? []).includes(record.questionId))) errors.push(`題目證據 ${record.evidenceId} 的識別碼無效。`);
    if (!EVIDENCE_TYPES.includes(record.evidenceType)) errors.push(`證據 ${record.evidenceId} 的類型無效。`);
    if (typeof record.performedItems !== 'string' || !record.performedItems.trim() || record.performedItems.length > maxTextLength) errors.push(`證據 ${record.evidenceId} 缺少實際執行項目。`);
    if (!EVIDENCE_RESULTS.includes(record.result)) errors.push(`證據 ${record.evidenceId} 的結果無效。`);
    if (record.executedAt !== null && !isTimestamp(record.executedAt)) errors.push(`證據 ${record.evidenceId} 的執行日期格式無效。`);
    if (typeof record.source !== 'string' || !record.source.trim() || record.source.length > 1000) errors.push(`證據 ${record.evidenceId} 缺少可追溯來源。`);
    if (typeof record.limitations !== 'string' || record.limitations.length > maxTextLength) errors.push(`證據 ${record.evidenceId} 的限制欄位無效。`);
    if (record.viewport !== null && (typeof record.viewport !== 'string' || !REQUIRED_BROWSER_VIEWPORTS.includes(record.viewport))) errors.push(`證據 ${record.evidenceId} 的 viewport 不在指定尺寸清單。`);
    if (record.evidenceType === 'browser_acceptance' && record.viewport === null) errors.push(`瀏覽器證據 ${record.evidenceId} 必須指出實測 viewport。`);
    if (record.result === 'passed' && (!record.executedAt || !record.source?.trim() || !record.performedItems?.trim())) errors.push(`通過證據 ${record.evidenceId} 必須有實際日期、項目及來源。`);
  }
  const value = clone(input);
  value.evidenceRecords = clone(evidenceRecords);
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], value };
}

export function loadTeacherReviewDataset(storage) {
  if (!storage) return { dataset: createEmptyTeacherReviewDataset(), persistence: 'memory', error: null, canSave: true };
  let serialized;
  try {
    serialized = storage.getItem(TEACHER_REVIEW_STORAGE_KEY);
  } catch (error) {
    return { dataset: createEmptyTeacherReviewDataset(), persistence: 'memory', error: `無法讀取本機審查資料：${error.message}`, canSave: true };
  }
  if (!serialized) return { dataset: createEmptyTeacherReviewDataset(), persistence: 'local', error: null, canSave: true };
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    return { dataset: createEmptyTeacherReviewDataset(), persistence: 'local', error: `審查資料 JSON 損壞：${error.message}`, canSave: false };
  }
  const validation = validateTeacherReviewDataset(parsed);
  if (!validation.ok) return { dataset: createEmptyTeacherReviewDataset(), persistence: 'local', error: validation.errors.join(' '), canSave: false };
  return { dataset: validation.value, persistence: 'local', error: null, canSave: true };
}

export function saveTeacherReviewDataset(storage, dataset) {
  const validation = validateTeacherReviewDataset(dataset);
  if (!validation.ok) return { ok: false, persistence: 'none', error: validation.errors.join(' ') };
  if (!storage) return { ok: true, persistence: 'memory', error: '本機儲存不可用；本次資料僅留在此頁面的記憶體。' };
  try {
    storage.setItem(TEACHER_REVIEW_STORAGE_KEY, JSON.stringify(validation.value));
    return { ok: true, persistence: 'local', error: null };
  } catch (error) {
    return { ok: true, persistence: 'memory', error: `本機儲存失敗，資料僅留在頁面記憶體：${error.message}` };
  }
}

export function resetTeacherReviewDataset(storage) {
  if (!storage) return { ok: false, error: '目前瀏覽器無法使用本機儲存。' };
  try {
    storage.removeItem(TEACHER_REVIEW_STORAGE_KEY);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: `清除工作台資料失敗：${error.message}` };
  }
}

export function mergeTeacherReviewDatasets(current, incoming) {
  const currentValidation = validateTeacherReviewDataset(current);
  const incomingValidation = validateTeacherReviewDataset(incoming);
  if (!currentValidation.ok) return { ok: false, error: `現有資料無效：${currentValidation.errors.join(' ')}` };
  if (!incomingValidation.ok) return { ok: false, error: incomingValidation.errors.join(' ') };
  const merged = clone(currentValidation.value);
  let changed = false;

  for (const collectionName of ['activityReviews', 'questionReviews']) {
    for (const [activityId, importedValue] of Object.entries(incomingValidation.value[collectionName])) {
      if (!merged[collectionName][activityId]) {
        merged[collectionName][activityId] = clone(importedValue);
        changed = true;
        continue;
      }
      const existingValue = merged[collectionName][activityId];
      const entries = collectionName === 'questionReviews' ? Object.entries(importedValue) : [[activityId, importedValue]];
      for (const [recordId, recordValue] of entries) {
        const existingRecord = collectionName === 'questionReviews' ? existingValue[recordId] : existingValue;
        if (existingRecord && stableStringify(existingRecord) !== stableStringify(recordValue)) {
          return { ok: false, changed: false, error: `匯入資料與目前的 ${recordId} 紀錄不同；為避免覆蓋，整份匯入已拒絕。` };
        }
        if (!existingRecord) {
          if (collectionName === 'questionReviews') existingValue[recordId] = clone(recordValue);
          else merged[collectionName][activityId] = clone(recordValue);
          changed = true;
        }
      }
    }
  }
  for (const record of incomingValidation.value.evidenceRecords ?? []) {
    const existing = merged.evidenceRecords.find((item) => item.evidenceId === record.evidenceId);
    if (existing && stableStringify(existing) !== stableStringify(record)) {
      return { ok: false, changed: false, error: `匯入證據 ${record.evidenceId} 與目前內容不同；為避免覆蓋，整份匯入已拒絕。` };
    }
    if (!existing) { merged.evidenceRecords.push(clone(record)); changed = true; }
  }
  if (changed) merged.updatedAt = incomingValidation.value.updatedAt ?? merged.updatedAt;
  return { ok: true, dataset: merged, changed, error: changed ? null : '資料完全相同；已保留目前紀錄，沒有覆蓋。' };
}

export function serializeTeacherReviewDataset(dataset) {
  const validation = validateTeacherReviewDataset(dataset);
  if (!validation.ok) throw new TypeError(validation.errors.join(' '));
  return JSON.stringify(validation.value, null, 2);
}

function scopedEvidence(records, activityId) {
  return records.filter((record) => record.scopeType === 'system' || record.activityId === activityId);
}

function evidenceStatus(records, type, viewport = null) {
  const selected = records.filter((record) => record.evidenceType === type && (viewport === null || record.viewport === viewport));
  const latest = selected.at(-1);
  const labels = { passed: '通過（已登錄）', failed: '有失敗紀錄', partial: '部分完成', not_run: '尚未執行', pending_verification: '待核對' };
  return { status: latest ? labels[latest.result] : '尚未驗證', records: selected, latest: latest ?? null };
}

function browserAcceptanceStatus(manualRecords, acceptanceReport, activityId, viewport) {
  const manual = manualRecords
    .filter((record) => record.evidenceType === 'browser_acceptance' && record.viewport === viewport)
    .map((record) => ({ ...record, sourceKind: 'teacher_registered', status: record.result, timestamp: record.executedAt }));
  const automatic = acceptanceReport && validateAcceptanceEvidenceReport(acceptanceReport).ok
    ? acceptanceReport.records
      .filter((record) => record.evidenceType === 'browser_acceptance' && record.viewport === viewport && record.coverage.includes(activityId))
      .map((record) => ({ ...record, sourceKind: 'generated_browser_acceptance', timestamp: record.finishedAt }))
    : [];
  const selected = [...manual, ...automatic].sort((a, b) => Date.parse(a.timestamp ?? '') - Date.parse(b.timestamp ?? ''));
  const latest = selected.at(-1);
  const labels = { passed: '通過（已登錄）', failed: '有失敗紀錄', partial: '部分完成', not_run: '尚未執行', pending_verification: '待核對' };
  return { status: latest ? labels[latest.status] ?? '尚未驗證' : '尚未驗證', records: selected, latest: latest ?? null };
}

function questionDataIntegrity(activity) {
  const errors = [];
  const ids = activity.questions.map((question) => question.questionId);
  if (new Set(ids).size !== ids.length) errors.push('題目識別碼重複');
  for (const question of activity.questions) {
    const optionIds = question.options.map((option) => option.optionId);
    const optionTexts = question.options.map((option) => option.text);
    if (question.reviewable && question.answerId && !optionIds.includes(question.answerId)) errors.push(`${question.questionId} 正解未對應選項`);
    if (new Set(optionIds).size !== optionIds.length || new Set(optionTexts).size !== optionTexts.length) errors.push(`${question.questionId} 選項重複`);
    if (question.reviewable && question.answerId && !question.explanation?.trim()) errors.push(`${question.questionId} 缺少解析`);
  }
  return { ok: errors.length === 0, errors };
}

function questionCriteriaComplete(review) {
  const checks = review?.criteriaReviews;
  if (!checks || REVIEW_CRITERIA.some(({ id }) => !checks[id])) return false;
  return REVIEW_CRITERIA.every(({ id }) => ['passed', 'not_applicable'].includes(checks[id].status));
}

/**
 * Creates a live report from the current candidate catalog and current review
 * draft. It never changes review records or course publication state.
 */
function generatedTestStatus(report, activityId) {
  const valid = report ? validateAcceptanceEvidenceReport(report) : { ok: false };
  if (!valid.ok) return { status: '尚未驗證（自動工程報告未載入或無效）', records: [] };
  const selected = valid.value.records.filter((record) => record.evidenceType === 'automated_test'
    && record.coverage.includes(activityId));
  const latest = selected.at(-1);
  const labels = { passed: '通過（自動產生）', failed: '失敗（自動產生）', not_run: '尚未執行（自動產生）' };
  return { status: latest ? labels[latest.status] : '尚未驗證（無涵蓋此活動的自動測試）', records: selected, latest: latest ?? null };
}

export function buildPrePilotReviewReport(dataset, generatedAt = new Date().toISOString(), acceptanceReport = null) {
  const validation = validateTeacherReviewDataset(dataset);
  if (!validation.ok) throw new TypeError(`無法產生報告：${validation.errors.join(' ')}`);
  const current = validation.value;
  return {
    generatedAt,
    activityCount: TEACHER_REVIEW_ACTIVITIES.length,
    activities: TEACHER_REVIEW_ACTIVITIES.map((activity) => {
      const activityReview = getActivityReview(current, activity);
      const questionReviews = current.questionReviews[activity.activityId] ?? {};
      const questions = activity.questions;
      const playableQuestions = questions.filter((question) => question.reviewable && question.answerId && !/preview|disabled/i.test(question.status ?? ''));
      const dataIntegrity = questionDataIntegrity(activity);
      const hintsPresent = questions.filter((question) => question.hints.length > 0).length;
      const feedbackPresent = questions.filter((question) => Boolean(question.wrongGuidance || Object.keys(question.errorGuidance ?? {}).length)).length;
      const linkedRemediation = questions.filter((question) => Boolean(question.remediation)).length;
      const reviewedPlayable = playableQuestions.filter((question) => {
        const review = questionReviews[question.questionId];
        return review?.decision === 'accepted' && questionCriteriaComplete(review);
      }).length;
      const criteriaCount = playableQuestions.length * REVIEW_CRITERIA.length;
      const reviewedActivity = activityReview.decision === 'accepted';
      const prerequisitesConfirmed = activity.prerequisites.length > 0
        && activity.prerequisites.every(({ id }) => activityReview.prerequisiteChecks[id] === 'confirmed');
      const textbookEvidenceProvided = ['publisher', 'schoolYear', 'edition', 'grade', 'semester', 'volume', 'unit', 'pages']
        .every((key) => activityReview.textbook[key]?.trim());
      const activityEvidence = scopedEvidence(current.evidenceRecords ?? [], activity.activityId);
      const engineeringEvidence = generatedTestStatus(acceptanceReport, activity.activityId);
      const mappingEvidence = acceptanceReport && validateAcceptanceEvidenceReport(acceptanceReport).ok
        ? acceptanceReport.records.filter((record) => record.evidenceType === 'mapping_validation') : [];
      const browserEvidence = Object.fromEntries(REQUIRED_BROWSER_VIEWPORTS.map((viewport) => [viewport, browserAcceptanceStatus(activityEvidence, acceptanceReport, activity.activityId, viewport)]));
      const curriculumEvidence = evidenceStatus(activityEvidence, 'curriculum_source_check');
      const registeredCurriculumQuestions = new Set(activityEvidence.filter((record) => record.evidenceType === 'curriculum_source_check' && record.result === 'passed' && record.scopeType === 'question').map((record) => record.questionId));
      const requiredViewportPass = Object.values(browserEvidence).every((record) => record.status.startsWith('通過'));
      const allQuestionsCurriculumTraceable = playableQuestions.every((question) => registeredCurriculumQuestions.has(question.questionId));
      const curriculumVerified = allQuestionsCurriculumTraceable;
      const noOpenRevisions = playableQuestions.every((question) => !['needs_revision', 'defer'].includes(questionReviews[question.questionId]?.decision));
      const blockers = [];
      if (!dataIntegrity.ok) blockers.push('候選題目資料一致性需修正');
      if (!engineeringEvidence.status.startsWith('通過')) blockers.push('工程驗收／測試：自動產生報告沒有本活動實際通過的完整測試證據');
      if (!requiredViewportPass) blockers.push('工程驗收：指定尺寸瀏覽器驗收證據未全部登錄');
      if (!allQuestionsCurriculumTraceable) blockers.push('缺少逐題或活動層級可追溯的官方課綱原文核對證據');
      if (!reviewedActivity || reviewedPlayable !== playableQuestions.length) blockers.push('活動或可作答題目尚未完成必要教師審查');
      if (!noOpenRevisions) blockers.push('仍有題目審查標記需修改或暫緩');
      if (!prerequisitesConfirmed) blockers.push('先備能力尚未全部由教師確認');
      if (!textbookEvidenceProvided) blockers.push('教材與班級進度證據未完整提供');
      if (playableQuestions.some((question) => !question.hints.length || (!question.wrongGuidance && !Object.keys(question.errorGuidance ?? {}).length))) blockers.push('部分題目提示或錯答回饋尚未提供，須在試用前確認其限制');
      const readiness = blockers.length ? '尚不具備試用條件／待教師判斷' : '符合提交教師決定是否試用的條件';
      const integrity = dataIntegrity.ok ? '目前目錄資料基本一致（非教學效度判定）' : dataIntegrity.errors.join('；');
      return {
        activityId: activity.activityId,
        title: activity.title,
        candidateStatus: activity.status,
        questionCount: questions.length,
        questionIds: questions.map((question) => question.questionId),
        playableQuestionCount: playableQuestions.length,
        previewOrDisabledCount: questions.length - playableQuestions.length,
        curriculumCodes: activity.curriculumCodes,
        curriculumSourceStatus: formatStatus(activity.sourceStatus),
        curriculumVerified: allQuestionsCurriculumTraceable,
        supportedCapabilities: [...new Set(questions.map((question) => question.capability).filter(Boolean))],
        uncoveredCapabilities: activity.uncoveredCapabilities,
        hintCoverage: { available: hintsPresent, total: questions.length, missing: questions.length - hintsPresent },
        wrongFeedbackCoverage: { available: feedbackPresent, total: questions.length, missing: questions.length - feedbackPresent },
        linkedRemediation: { available: linkedRemediation, total: questions.length, missing: questions.length - linkedRemediation },
        reviewProgress: {
          activityDecision: activityReview.decision,
          questionDecisions: Object.fromEntries(REVIEW_DECISIONS.map((decision) => [decision, playableQuestions.filter((question) => questionReviews[question.questionId]?.decision === decision).length])),
          criteriaPassed: playableQuestions.reduce((sum, question) => {
            const review = questionReviews[question.questionId];
            return sum + Object.values(review?.criteriaReviews ?? {}).filter((item) => item.status === 'passed').length;
          }, 0),
          criteriaTotal: criteriaCount,
          playableQuestionsComplete: `${reviewedPlayable}/${playableQuestions.length}`,
          prerequisitesConfirmed,
          curriculumConfirmed: curriculumVerified,
        },
        engineering: {
          catalogIntegrity: integrity,
          trackedAutomatedTestFiles: activity.engineeringTestFiles,
          testEvidence: engineeringEvidence,
          mappingEvidence,
          browserEvidence,
          browserAcceptance: requiredViewportPass ? '指定三種 viewport 均有通過證據登錄。' : '指定 viewport 驗收尚未全部有可追溯的通過紀錄。',
          testEvidenceIds: engineeringEvidence.records.map((record) => record.evidenceId),
          browserEvidenceIds: Object.fromEntries(Object.entries(browserEvidence).map(([viewport, item]) => [viewport, item.records.map((record) => record.evidenceId)])),
        },
        curriculumEvidence,
        curriculumEvidenceIds: curriculumEvidence.records.map((record) => record.evidenceId),
        questionCurriculumEvidenceIds: activityEvidence.filter((record) => record.evidenceType === 'curriculum_source_check' && record.result === 'passed' && record.scopeType === 'question').map((record) => record.evidenceId),
        teacherReviewEvidence: evidenceStatus(activityEvidence, 'teacher_review'),
        teacherReviewEvidenceIds: evidenceStatus(activityEvidence, 'teacher_review').records.map((record) => record.evidenceId),
        questionCurriculumEvidenceComplete: allQuestionsCurriculumTraceable,
        openRevisionsResolved: noOpenRevisions,
        disclosedLimitations: [...activity.uncoveredCapabilities, ...(linkedRemediation < questions.length ? ['部分題目尚無連結補強活動。'] : [])],
        pilotDecision: activityReview.pilotDecision ?? 'pending',
        pilotReadiness: readiness,
        blockers,
      };
    }),
  };
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (className) node.className = className;
  return node;
}

function appendLabelledInput(parent, labelText, name, value, attrs = {}) {
  const label = element('label', undefined, 'review-form-field');
  label.append(element('span', labelText));
  const input = document.createElement(attrs.multiline ? 'textarea' : 'input');
  input.name = name;
  input.value = value ?? '';
  input.dataset.field = name;
  if (attrs.multiline) input.rows = attrs.rows ?? 3;
  else input.type = 'text';
  if (attrs.placeholder) input.placeholder = attrs.placeholder;
  label.append(input);
  parent.append(label);
}

function appendSelect(parent, labelText, name, value, options, dataset = {}) {
  const label = element('label', undefined, 'review-form-field');
  label.append(element('span', labelText));
  const select = document.createElement('select');
  select.name = name;
  select.dataset.field = name;
  for (const [key, val] of Object.entries(dataset)) select.dataset[key] = val;
  for (const optionData of options) {
    const option = document.createElement('option');
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.append(option);
  }
  select.value = value;
  label.append(select);
  parent.append(label);
}

function appendEvidenceForm(parent) {
  const form = element('form', undefined, 'review-form evidence-entry-form');
  form.dataset.action = 'add-evidence';
  appendSelect(form, '證據類型', 'evidenceType', 'automated_test', [
    { value: 'automated_test', label: '人工登錄測試紀錄（不作自動測試判定）' },
    { value: 'browser_acceptance', label: '瀏覽器驗收' },
    { value: 'curriculum_source_check', label: '課綱原文核對' },
    { value: 'teacher_review', label: '教師審查' },
    { value: 'other', label: '其他' },
  ]);
  appendSelect(form, '證據範圍', 'scopeType', 'system', [
    { value: 'system', label: '整體系統' }, { value: 'activity', label: '活動' }, { value: 'question', label: '題目' },
  ]);
  appendSelect(form, '活動', 'activityId', TEACHER_REVIEW_ACTIVITIES[0].activityId,
    TEACHER_REVIEW_ACTIVITIES.map((activity) => ({ value: activity.activityId, label: activity.title })));
  const allQuestions = TEACHER_REVIEW_ACTIVITIES.flatMap((activity) => activity.questions.map((question) => ({
    value: `${activity.activityId}::${question.questionId}`, label: `${activity.title}｜${question.questionId}`,
  })));
  appendSelect(form, '題目（選填；題目範圍時必填）', 'questionRef', '', [{ value: '', label: '不指定題目' }, ...allQuestions]);
  appendSelect(form, '實測 viewport（瀏覽器驗收必填）', 'viewport', '', [
    { value: '', label: '不適用／未指定' }, ...REQUIRED_BROWSER_VIEWPORTS.map((value) => ({ value, label: value })),
  ]);
  appendSelect(form, '結果', 'result', 'pending_verification', EVIDENCE_RESULTS.map((value) => ({
    value, label: ({ passed: '通過', failed: '失敗', partial: '部分完成', not_run: '尚未執行', pending_verification: '待核對' })[value],
  })));
  appendLabelledInput(form, '實際執行／核對項目', 'performedItems', '', { multiline: true, rows: 2, placeholder: '只記錄確實已執行或核對的事項' });
  appendLabelledInput(form, '執行日期時間（未能確認請留空；通過必填 ISO 時間）', 'executedAt', '', { placeholder: '例如 2026-10-22T09:30:00+08:00' });
  appendLabelledInput(form, '證據來源（測試名稱／檔案／官方文件與頁面／實測紀錄）', 'source', '', { multiline: true, rows: 2, placeholder: '「有測試檔」或「目錄有代碼」不能作為通過證據' });
  appendLabelledInput(form, '未完成事項與限制', 'limitations', '', { multiline: true, rows: 2, placeholder: '尚無限制可留空；未知事項應明確寫出' });
  const submit = element('button', '登錄證據', 'button button-primary');
  submit.type = 'submit';
  form.append(submit);
  parent.append(element('p', '證據登錄需由操作人根據實際執行填寫；不得把測試檔存在、課綱代碼存在或空白欄位當成通過。工作台不會自動填入日期或核准。', 'review-boundary-note'), form);
}

function formatStatus(value) {
  return statusLabels[value] ?? `待核對（${value ?? '尚無狀態資料'}）`;
}

function addVisualization(parent, visualization) {
  if (!visualization) return;
  const figure = element('figure', undefined, 'review-visual');
  const heading = element('figcaption', '題目視覺／刻度資料（供教師檢視）');
  figure.append(heading);
  if (visualization.type === 'fraction_strips' && Array.isArray(visualization.models)) {
    for (const model of visualization.models) {
      const modelFigure = element('div', undefined, 'review-fraction-model');
      const strip = element('div', undefined, 'review-fraction-strip');
      strip.style.setProperty('--fraction-parts', String(model.denominator));
      for (const shaded of model.parts ?? []) {
        const part = element('span', shaded ? '▨' : '□', `review-fraction-part${shaded ? ' is-shaded' : ''}`);
        part.setAttribute('aria-hidden', 'true');
        strip.append(part);
      }
      modelFigure.append(strip, element('p', `${model.label}；同一完整整體分成等大的部分。`));
      figure.append(modelFigure);
    }
  } else if (Array.isArray(visualization.columns) && Array.isArray(visualization.digits)) {
    const table = document.createElement('table');
    table.className = 'review-place-table';
    const caption = document.createElement('caption');
    caption.textContent = visualization.caption ?? '位值表預覽';
    table.append(caption);
    const head = document.createElement('tr');
    const body = document.createElement('tr');
    visualization.columns.forEach((column, index) => {
      head.append(element('th', column));
      body.append(element('td', visualization.digits[index]));
    });
    table.append(head, body);
    figure.append(table);
  } else if (Array.isArray(visualization.groups)) {
    const groups = element('div', undefined, 'review-block-groups');
    for (const group of visualization.groups) {
      const card = element('div', undefined, `review-block-group shape-${group.shape ?? 'unit'}`);
      card.append(element('strong', `${group.label ?? group.place ?? '位值'}：${group.quantity} ${group.unitLabel ?? '個'}`));
      const units = element('div', undefined, 'review-block-units');
      for (let index = 0; index < Math.min(group.quantity ?? 0, 10); index += 1) units.append(element('span', '', 'review-block-unit'));
      card.append(units);
      groups.append(card);
    }
    figure.append(groups);
    if (visualization.table?.columns && visualization.table?.digits) {
      const table = document.createElement('table');
      table.className = 'review-place-table';
      const caption = document.createElement('caption');
      caption.textContent = `${visualization.table.status === 'teaching_scaffold_not_independent_check' ? '教學支架' : '位值表'}：${visualization.table.status}`;
      table.append(caption);
      const head = document.createElement('tr');
      const body = document.createElement('tr');
      visualization.table.columns.forEach((column, index) => {
        head.append(element('th', column));
        body.append(element('td', visualization.table.digits[index]));
      });
      table.append(head, body);
      figure.append(table);
      if (visualization.table.providesAnswerDigits) figure.append(element('p', '注意：此表直接提供數字，屬於教學支架，不是獨立檢核。', 'review-boundary-note'));
    }
  } else if (Number.isFinite(visualization.waterMl)) {
    const max = visualization.capacityMl ?? 1000;
    const scale = element('div', undefined, 'review-capacity-scale');
    const vessel = element('div', undefined, 'review-capacity-vessel');
    const water = element('span', undefined, 'review-capacity-water');
    water.style.height = `${Math.max(0, Math.min(100, visualization.waterMl / max * 100))}%`;
    vessel.append(water);
    scale.append(vessel);
    const labels = element('div', undefined, 'review-capacity-labels');
    for (let value = max; value >= 0; value -= visualization.stepMl ?? 100) labels.append(element('span', `${value} 毫升`));
    scale.append(labels);
    figure.append(scale, element('p', `容量 ${max} 毫升；刻度間距 ${visualization.stepMl ?? '待查'} 毫升；題面水量 ${visualization.waterMl} 毫升。`));
  } else if (visualization.type === 'grid' || visualization.type === 'comparison' || Array.isArray(visualization.rows)) {
    const figures = visualization.type === 'comparison' ? visualization.figures : [visualization.rows];
    const comparison = element('div', undefined, 'review-grid-comparison');
    for (const [figureIndex, rows] of figures.entries()) {
      const table = document.createElement('table');
      table.className = 'review-area-grid';
      table.setAttribute('aria-label', `${visualization.type === 'comparison' ? ['甲圖形', '乙圖形'][figureIndex] ?? `圖形 ${figureIndex + 1}` : '單位方格圖'}，每格邊長 ${visualization.unitSideCm ?? '待核對'} 公分`);
      for (const row of rows ?? []) {
        const tr = document.createElement('tr');
        for (const filled of row) {
          const td = document.createElement('td');
          td.className = filled ? 'is-covered' : 'is-empty';
          td.textContent = filled ? '■' : '□';
          td.setAttribute('aria-label', filled ? '一個方格' : '空格');
          tr.append(td);
        }
        table.append(tr);
      }
      const gridFigure = element('div', undefined, 'review-grid-figure');
      gridFigure.append(table);
      comparison.append(gridFigure);
    }
    figure.append(comparison, element('p', `每格資料標示邊長 ${visualization.unitSideCm ?? '待核對'} 公分；此圖呈現目錄中的方格資料，仍須教師核對題面適切性。`, 'review-boundary-note'));
  } else if (Array.isArray(visualization.points) && Number.isFinite(visualization.start) && Number.isFinite(visualization.end)) {
    const step = visualization.minorStep;
    const count = step > 0 ? Math.floor((visualization.end - visualization.start) / step) : 0;
    const line = element('div', undefined, 'review-number-line');
    line.style.setProperty('--review-tick-count', String(Math.max(1, count)));
    line.style.gridTemplateColumns = `repeat(${count + 1}, minmax(0, 1fr))`;
    for (let index = 0; index <= count; index += 1) {
      const value = visualization.start + index * step;
      const slot = element('div', undefined, 'review-number-line-slot');
      const mark = visualization.points.find((point) => point.value === value);
      if (mark) slot.append(element('strong', mark.label, 'review-number-line-marker'));
      slot.append(element('span', '', 'review-number-line-tick'));
      if ((visualization.majorTicks ?? []).includes(value)) slot.append(element('small', value));
      line.append(slot);
    }
    figure.append(line, element('p', `數線範圍 ${visualization.start} 至 ${visualization.end}；每小格 ${step}。圖中標記依資料座標呈現。`));
  } else if (Number.isFinite(visualization.markMm) && Number.isFinite(visualization.startMm) && Number.isFinite(visualization.endMm)) {
    const span = visualization.endMm - visualization.startMm;
    const minor = visualization.minorStepMm;
    const count = minor > 0 ? Math.floor(span / minor) : 0;
    const ruler = element('div', undefined, 'review-ruler-model');
    ruler.setAttribute('role', 'img');
    ruler.setAttribute('aria-label', `毫米刻度尺，起點 ${visualization.startMm}，端點標記 ${visualization.markMm}，終點 ${visualization.endMm}`);
    ruler.style.gridTemplateColumns = `repeat(${count + 1}, minmax(0, 1fr))`;
    for (let index = 0; index <= count; index += 1) {
      const value = visualization.startMm + index * minor;
      const tick = element('div', undefined, `review-ruler-tick${(value - visualization.startMm) % (visualization.majorStepMm ?? 10) === 0 ? ' is-major' : ''}${value === visualization.markMm ? ' is-marked' : ''}`);
      if ((value - visualization.startMm) % (visualization.majorStepMm ?? 10) === 0) tick.append(element('small', value));
      ruler.append(tick);
    }
    figure.append(ruler, element('p', `尺面範圍 ${visualization.startMm}–${visualization.endMm} mm；端點標記 ${visualization.markMm} mm；小刻度 ${minor} mm。`));
  } else if (visualization.points || Number.isFinite(visualization.markMm)) {
    const details = element('ul', undefined, 'review-visual-data');
    for (const [key, value] of Object.entries(visualization)) {
      if (key === 'points' && Array.isArray(value)) {
        for (const point of value) details.append(element('li', `${point.label ?? '標記'}：${point.value}`));
      } else if (Array.isArray(value)) details.append(element('li', `${key}：${value.join('、')}`));
      else details.append(element('li', `${key}：${value}`));
    }
    figure.append(details);
  }
  parent.append(figure);
}

function getActivityReview(dataset, activity) {
  return dataset.activityReviews[activity.activityId] ?? {
    activityId: activity.activityId,
    decision: 'unreviewed',
    textbook: Object.fromEntries(textbookKeys.map((key) => [key, ''])),
    classroomProgress: '',
    prerequisiteChecks: Object.fromEntries(activity.prerequisites.map((item) => [item.id, 'pending'])),
    notes: '',
    pilotDecision: 'pending',
    pilotNotes: '',
    updatedAt: null,
  };
}

function getQuestionReview(dataset, activityId, questionId) {
  return dataset.questionReviews[activityId]?.[questionId] ?? {
    questionId,
    decision: 'unreviewed',
    teacherDecision: 'unreviewed',
    revisionReason: '',
    notes: '',
    teacherReason: '',
    proposedChanges: '',
    evidenceNeeded: '',
    prerequisiteProgress: '',
    nextReviewNotes: '',
    criteriaReviews: {},
    updatedAt: null,
  };
}

export function initTeacherReviewWorkbench(root = document.getElementById('teacher-review-root'), options = {}) {
  if (!root) throw new Error('找不到教師審查工作台根節點。');
  let storage = null;
  try { storage = window.localStorage; } catch { /* Persistence availability is announced below. */ }
  const loaded = loadTeacherReviewDataset(storage);
  let dataset = loaded.dataset;
  let canSave = loaded.canSave;
  const revisionLoaded = loadRevisionDataset(storage);
  let revisionDataset = revisionLoaded.dataset;
  let revisionCanSave = revisionLoaded.canSave;
  let editingRevisionId = null;
  let activeActivityId = TEACHER_REVIEW_ACTIVITIES[0]?.activityId;
  let transientPersistence = loaded.persistence;
  let reportVisible = false;
  let acceptanceReport = null;
  let acceptanceReportStatus = '尚未載入自動工程驗收報告。';

  const layout = element('div', undefined, 'teacher-review-layout');
  const sidebar = element('nav', undefined, 'teacher-review-nav');
  sidebar.setAttribute('aria-label', `${TEACHER_REVIEW_ACTIVITIES.length} 項數學候選活動`);
  const main = element('section', undefined, 'teacher-review-main');
  main.setAttribute('aria-live', 'polite');
  const message = element('p', undefined, 'teacher-review-message');
  message.setAttribute('role', 'status');
  const storageNote = element('p', undefined, 'teacher-review-storage-note');
  storageNote.textContent = loaded.persistence === 'local'
    ? '審查紀錄只保存在目前瀏覽器的專用工作台資料鍵；不會上傳，也不讀寫遊戲進度。'
    : '此瀏覽器無法提供本機儲存；審查資料目前只在此頁面記憶體中，離開頁面後不會保留。';
  if (loaded.error) message.textContent = `儲存資料提醒：${loaded.error}${loaded.canSave ? '' : '目前為保護既有資料模式，請先匯出可用備份或明確重設工作台。'}`;
  if (!loaded.canSave) message.classList.add('is-error');
  const toolbar = element('div', undefined, 'teacher-review-toolbar');
  const exportButton = element('button', '匯出 JSON', 'button button-primary');
  exportButton.type = 'button';
  exportButton.dataset.action = 'export';
  const importLabel = element('label', '匯入／合併 JSON', 'button button-secondary review-import-label');
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json,.json';
  importInput.dataset.action = 'import';
  importInput.setAttribute('aria-label', '選擇教師審查 JSON 檔');
  importLabel.append(importInput);
  const resetButton = element('button', '清除審查草稿（不清修訂）', 'button button-secondary');
  resetButton.type = 'button';
  resetButton.dataset.action = 'reset';
  const reportButton = element('button', '產生／更新試用前檢查報告', 'button button-secondary');
  reportButton.type = 'button';
  reportButton.dataset.action = 'pilot-report';
  toolbar.append(exportButton, importLabel, resetButton, reportButton);
  const revisionExportButton = element('button', '匯出候選修訂 JSON', 'button button-secondary');
  revisionExportButton.type = 'button';
  revisionExportButton.dataset.action = 'export-revisions';
  const revisionImportLabel = element('label', '匯入候選修訂 JSON', 'button button-secondary review-import-label');
  const revisionImportInput = document.createElement('input');
  revisionImportInput.type = 'file'; revisionImportInput.accept = 'application/json,.json'; revisionImportInput.dataset.action = 'import-revisions';
  revisionImportInput.setAttribute('aria-label', '選擇候選修訂 JSON 檔');
  revisionImportLabel.append(revisionImportInput);
  toolbar.append(revisionExportButton, revisionImportLabel);
  const revisionStorageNote = element('p', revisionLoaded.error
    ? `候選修訂資料提醒：${revisionLoaded.error}（保護模式，未寫入）`
    : revisionLoaded.persistence === 'local'
      ? '候選修訂另存於目前瀏覽器的獨立本機資料鍵；不與審查證據或正式題目同步。'
      : '候選修訂僅在頁面記憶體中，離開頁面後不保留。', 'teacher-review-storage-note');
  if (!revisionCanSave) revisionStorageNote.classList.add('is-error');
  const reportPanel = element('section', undefined, 'review-section pilot-readiness-report');
  reportPanel.hidden = true;
  reportPanel.setAttribute('aria-live', 'polite');
  root.replaceChildren(storageNote, revisionStorageNote, toolbar, message, reportPanel, layout);
  layout.append(sidebar, main);

  const updateMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  };
  const markDatasetUpdated = (next, timestamp) => ({ ...next, updatedAt: timestamp });
  const persist = (next) => {
    if (!canSave) {
      updateMessage('資料格式損壞或不支援；未寫入任何內容。請先匯出可用資料或使用明確重設。', true);
      return false;
    }
    const result = saveTeacherReviewDataset(storage, next);
    if (!result.ok) {
      updateMessage(result.error, true);
      return false;
    }
    dataset = next;
    transientPersistence = result.persistence;
    storageNote.textContent = result.persistence === 'local'
      ? '審查紀錄只保存在目前瀏覽器的專用工作台資料鍵；不會上傳，也不讀寫遊戲進度。'
      : '本機儲存不可用；審查資料目前只在此頁面記憶體中，離開頁面後不會保留。';
    updateMessage(result.error ?? '審查資料已儲存。正向審查結論不會核准或發布任何單元。');
    render();
    return true;
  };
  const persistRevisions = (next) => {
    if (!revisionCanSave) { updateMessage('候選修訂資料格式錯誤，已進入保護模式；未寫入任何內容。', true); return false; }
    const result = saveRevisionDataset(storage, next);
    if (!result.ok) { updateMessage(result.error, true); return false; }
    revisionDataset = next;
    revisionStorageNote.textContent = result.persistence === 'local'
      ? '候選修訂另存於目前瀏覽器的獨立本機資料鍵；不與審查證據或正式題目同步。'
      : '候選修訂僅在頁面記憶體中，離開頁面後不保留。';
    updateMessage(result.error ?? '候選修訂已儲存；原始題目、教師決定與學生資料未變更。');
    render();
    return true;
  };

  const renderSidebar = () => {
    sidebar.replaceChildren(element('h2', '數學候選活動'));
    for (const activity of TEACHER_REVIEW_ACTIVITIES) {
      const button = element('button', undefined, 'teacher-review-nav-item');
      button.type = 'button';
      button.dataset.activityId = activity.activityId;
      button.setAttribute('aria-current', String(activity.activityId === activeActivityId));
      button.append(element('strong', activity.title), element('small', `${activity.questions.length} 項題目／預覽`));
      sidebar.append(button);
    }
  };

  const renderActivity = () => {
    const activity = activityById.get(activeActivityId);
    if (!activity) return;
    main.replaceChildren();
    const title = element('h1', activity.title);
    const subtitle = element('p', `${activity.gradeLabel}・${activity.subjectLabel}・候選內容，尚未核准`,'teacher-review-subtitle');
    main.append(title, subtitle);
    const meta = element('dl', undefined, 'teacher-review-meta');
    const metaRows = [
      ['活動識別碼', activity.activityId],
      ['學習單元識別碼', activity.learningUnitId],
      ['關卡參照', activity.levelIds.join('、')],
      ['學習主題', activity.topic],
      ['正式課綱代碼參照', activity.curriculumCodes.length ? activity.curriculumCodes.join('、') : '尚無可確認的代碼參照'],
      ['課綱地圖參照', activity.curriculumMapIds.length ? activity.curriculumMapIds.join('、') : '未登錄／待核對'],
      ['課綱來源狀態', formatStatus(activity.sourceStatus)],
      ['年級適用性', formatStatus(activity.gradeStatus)],
      ['學期進度', formatStatus(activity.semesterStatus)],
      ['教師審查狀態', formatStatus(activity.reviewStatus)],
      ['開發狀態', activity.developmentStatus],
    ];
    for (const [term, description] of metaRows) {
      meta.append(element('dt', term), element('dd', description));
    }
    main.append(meta, element('p', '以上是專案資料目前登錄的參照狀態，不代表本工作台重新核實官方原文、教材或目標班級進度。', 'review-boundary-note'));

    const evidence = element('section', undefined, 'review-section');
    evidence.append(element('h2', '教材與班級授課證據'));
    const textbook = activity.textbookEvidence;
    evidence.append(element('p', textbook?.status === 'provided'
      ? '目錄已有教材證據；請教師核對並補充實際使用版本。'
      : '教材版本、學期、冊別、單元及頁碼：待教師填寫。目錄未提供資料，不代表沒有教材。'));
    const activityReview = getActivityReview(dataset, activity);
    const activityForm = element('form', undefined, 'review-form activity-review-form');
    activityForm.dataset.activityId = activity.activityId;
    const publisherLabel = appendLabelledInput.bind(null, activityForm);
    publisherLabel('出版社', 'publisher', activityReview.textbook.publisher, { placeholder: '待教師填寫' });
    publisherLabel('學年度', 'schoolYear', activityReview.textbook.schoolYear, { placeholder: '待教師填寫' });
    publisherLabel('版次／印次', 'edition', activityReview.textbook.edition, { placeholder: '待教師填寫' });
    publisherLabel('年級', 'grade', activityReview.textbook.grade, { placeholder: '待教師填寫' });
    publisherLabel('學期', 'semester', activityReview.textbook.semester, { placeholder: '待教師填寫' });
    publisherLabel('冊別', 'volume', activityReview.textbook.volume, { placeholder: '待教師填寫' });
    publisherLabel('單元', 'unit', activityReview.textbook.unit, { placeholder: '待教師填寫' });
    publisherLabel('頁碼', 'pages', activityReview.textbook.pages, { placeholder: '待教師填寫' });
    publisherLabel('班級實際授課進度／日期與證據位置', 'classroomProgress', activityReview.classroomProgress, { multiline: true, rows: 3, placeholder: '尚未提供；請由教師填寫，不要推測。' });
    const prerequisiteList = element('fieldset', undefined, 'review-prerequisites');
    prerequisiteList.append(element('legend', '先備能力確認（未填寫即維持待確認）'));
    for (const prerequisite of activity.prerequisites) {
      const current = activityReview.prerequisiteChecks[prerequisite.id] ?? 'pending';
      appendSelect(prerequisiteList, prerequisite.label, prerequisite.id, current, [
        { value: 'pending', label: '待教師確認' },
        { value: 'confirmed', label: '教師確認已教／已具備' },
        { value: 'not_confirmed', label: '未建立／尚未教' },
      ], { prerequisiteId: prerequisite.id });
    }
    activityForm.append(prerequisiteList);
    appendSelect(activityForm, '活動內容審查決定', 'activityDecision', activityReview.decision, REVIEW_DECISIONS.map((value) => ({ value, label: decisionLabels[value] })));
    appendSelect(activityForm, '小規模試用決定（不等於正式發布）', 'pilotDecision', activityReview.pilotDecision ?? 'pending', [
      { value: 'pending', label: '待教師決定' },
      { value: 'approved_for_pilot', label: '教師核准小規模試用' },
      { value: 'defer', label: '暫緩試用' },
    ]);
    publisherLabel('試用決定依據／安全安排', 'pilotNotes', activityReview.pilotNotes ?? '', { multiline: true, rows: 3, placeholder: '未填寫即維持待教師決定。核准試用不代表正式發布。' });
    publisherLabel('活動層級審查備註', 'activityNotes', activityReview.notes, { multiline: true, rows: 3, placeholder: '記錄依據、適切性與尚待處理事項。' });
    const saveActivity = element('button', '儲存活動資料與先備確認', 'button button-primary');
    saveActivity.type = 'submit';
    activityForm.append(saveActivity);
    evidence.append(activityForm);
    main.append(evidence);

    const goals = element('section', undefined, 'review-section');
    goals.append(element('h2', '學習目標（候選資料）'));
    const goalList = element('ul');
    for (const goal of activity.learningGoals) goalList.append(element('li', goal));
    goals.append(goalList, element('p', '目標文字來自現有單元資料，不代表教師已核准或確認年級進度。', 'review-boundary-note'));
    main.append(goals);

    const questions = element('section', undefined, 'review-section');
    questions.append(element('h2', `逐題審查（${activity.questions.length} 項）`));
    questions.append(element('p', '各題審查結論只描述內容審查，不會更動題庫、學習單元核准狀態或正式可玩清單。單次作答選項不是迷思診斷。', 'review-boundary-note'));
    for (const question of activity.questions) questions.append(renderQuestion(activity, question));
    main.append(questions);
  };

  const renderPilotReport = () => {
    const report = buildPrePilotReviewReport(dataset, new Date().toISOString(), acceptanceReport);
    reportPanel.hidden = false;
    reportPanel.replaceChildren(
      element('h2', '試用前檢查報告'),
      element('p', `依目前候選目錄與工作台審查草稿即時產生；產生時間：${report.generatedAt}`),
      element('p', '工程測試、課綱核對、教師審查與試用決定彼此獨立。此報告不核准課程、不發布活動，也不代表學生學習成效。', 'review-boundary-note'),
    );
    const evidenceSection = element('section', undefined, 'review-section evidence-registry');
    evidenceSection.append(element('h3', '自動工程驗收證據（唯讀、與教師審查分離）'), element('p', `報告來源：prototype/data/acceptance-evidence.json；${acceptanceReportStatus} ${acceptanceReport?.generatedAt ? `最近產生：${acceptanceReport.generatedAt}` : ''}`));
    if (acceptanceReport) {
      const autoList = element('ul', undefined, 'evidence-record-list automated-evidence-list');
      for (const record of acceptanceReport.records) {
        const browserDetails = record.evidenceType === 'browser_acceptance'
          ? `｜瀏覽器：${record.browserVersion || '未啟動／未記錄'}｜視窗：${record.viewport}｜步驟：${(record.steps ?? []).join('、') || '尚未執行'}｜截圖：${record.screenshotPath || '未提供'}`
          : '';
        const questionDetails = record.evidenceType === 'question_data_audit'
          ? `｜題目：${record.questionId}｜獨立推導：${record.answerAudit?.derivation ?? '未提供'}｜核驗限制：${record.answerAudit?.manualChecks?.stemUniqueness ?? '待人工核驗'}`
          : '';
        autoList.append(element('li', `${record.evidenceId}｜${record.evidenceType}｜${record.status}｜${record.command}｜退出碼：${record.exitCode ?? '未執行'}｜${record.durationMs}ms｜${record.summary}｜範圍：${record.coverage.length} 個活動｜來源：${record.source}｜限制：${record.limitations}${browserDetails}${questionDetails}`));
      }
      evidenceSection.append(autoList);
    }
    const autoImportLabel = element('label', '載入工程驗收報告 JSON（只更新本頁記憶體，不儲存至教師審查紀錄）', 'button button-secondary review-import-label');
    const autoImport = document.createElement('input');
    autoImport.type = 'file'; autoImport.accept = 'application/json,.json'; autoImport.dataset.action = 'import-acceptance';
    autoImport.setAttribute('aria-label', '載入工程驗收報告 JSON'); autoImportLabel.append(autoImport);
    evidenceSection.append(autoImportLabel);
    evidenceSection.append(element('h3', '教師手動登錄的獨立證據'), element('p', `目前 ${dataset.evidenceRecords.length} 筆；只保存在教師審查專用資料鍵。這些手動紀錄不會替代上方的自動測試報告。`));
    appendEvidenceForm(evidenceSection);
    if (dataset.evidenceRecords.length) {
      const list = element('ul', undefined, 'evidence-record-list');
      for (const record of dataset.evidenceRecords) {
        const scope = record.scopeType === 'system' ? '整體系統' : `${activityById.get(record.activityId)?.title ?? record.activityId}${record.questionId ? `｜${record.questionId}` : ''}`;
        const label = record.evidenceType === 'automated_test' ? 'manual_automated_test_record (不作自動測試判定)' : record.evidenceType;
        list.append(element('li', `${record.evidenceId}｜${scope}｜${label}｜${record.result}${record.viewport ? `｜${record.viewport}` : ''}｜日期：${record.executedAt ?? '未提供'}｜來源：${record.source}｜限制：${record.limitations || '未填'}`));
      }
      evidenceSection.append(list);
    }
    reportPanel.append(evidenceSection);
    for (const item of report.activities) {
      const card = element('article', undefined, 'pilot-report-activity');
      card.append(element('h3', item.title), element('code', item.activityId));
      card.append(element('p', `候選狀態：${item.candidateStatus}；題目／預覽 ${item.questionCount} 項（可作答候選 ${item.playableQuestionCount}、唯讀／停用 ${item.previewOrDisabledCount}）。`));
      card.append(element('p', `題目 ID：${item.questionIds.join('、') || '尚未提供'}`));
      card.append(element('p', `課綱參照：${item.curriculumCodes.join('、') || '待核對'}；目錄狀態（非本輪原文核對證據）：${item.curriculumSourceStatus}；本工作台登錄的原文證據：${item.curriculumEvidence.status}（${item.curriculumEvidenceIds.join('、') || '尚無證據 ID'}）；逐題對照證據：${item.curriculumVerified ? item.questionCurriculumEvidenceIds.join('、') : '尚未驗證，需逐題登錄'}`));
      card.append(element('p', `題目資料可支持的能力：${item.supportedCapabilities.join('；') || '尚未提供'}。未涵蓋／限制：${item.uncoveredCapabilities.join('；')}`));
      card.append(element('p', `提示：${item.hintCoverage.available}/${item.hintCoverage.total}；錯答回饋：${item.wrongFeedbackCoverage.available}/${item.wrongFeedbackCoverage.total}；已連結補強：${item.linkedRemediation.available}/${item.linkedRemediation.total}${item.linkedRemediation.available === 0 ? '（尚無連結的補強活動）' : ''}`));
      card.append(element('p', `教師審查：活動「${decisionLabels[item.reviewProgress.activityDecision] ?? '尚未審查'}」；可作答題目檢核完成 ${item.reviewProgress.playableQuestionsComplete}；逐項通過 ${item.reviewProgress.criteriaPassed}/${item.reviewProgress.criteriaTotal}；先備確認：${item.reviewProgress.prerequisitesConfirmed ? '全部確認' : '尚未全部確認'}。`));
      card.append(element('p', `工程目錄資料檢查（不是測試執行）：${item.engineering.catalogIntegrity}。參考測試檔案：${item.engineering.trackedAutomatedTestFiles.join('、') || '尚未登錄'}。自動測試：${item.engineering.testEvidence.status}。`));
      for (const record of item.engineering.testEvidence.records) card.append(element('p', `測試命令：${record.command}；${record.summary}；退出碼 ${record.exitCode}；耗時 ${record.durationMs} ms；來源 ${record.source}；限制 ${record.limitations}`));
      for (const record of item.engineering.mappingEvidence) card.append(element('p', `映射檢查（不等同官方原文核對）：${record.command}；${record.status}；${record.summary}；耗時 ${record.durationMs} ms；來源 ${record.source}；限制 ${record.limitations}`));
      const browserList = Object.entries(item.engineering.browserEvidence).map(([viewport, evidence]) => {
        const latest = evidence.latest;
        const detail = latest?.sourceKind === 'generated_browser_acceptance'
          ? `；證據 ${latest.evidenceId}；${latest.browserVersion}；${latest.summary}；截圖：${latest.screenshotPath ?? '未提供'}；來源：${latest.source}；限制：${latest.limitations}`
          : '';
        return `${viewport}：${evidence.status}（${item.engineering.browserEvidenceIds[viewport].join('、') || '尚無證據 ID'}）${detail}`;
      }).join('；');
      card.append(element('p', `指定尺寸瀏覽器驗收：${browserList}。`));
      card.append(element('p', `教師逐題審查紀錄：${item.reviewProgress.playableQuestionsComplete}；教師證據類型紀錄：${item.teacherReviewEvidence.status}（${item.teacherReviewEvidenceIds.join('、') || '尚無證據 ID'}）。`));
      card.append(element('p', `試用前揭露限制：${item.disclosedLimitations.join('；') || '目前目錄未列出其他限制，仍須由教師核實。'}`));
      card.append(element('p', `試用判斷：${item.pilotReadiness}；此判斷不會自動核准。教師試用決定：${item.pilotDecision === 'approved_for_pilot' ? '工作台已記錄明確選擇（仍不代表正式發布）' : item.pilotDecision === 'defer' ? '教師選擇暫緩' : '待教師決定'}。`,'review-item-status is-warning'));
      const blockers = element('ul');
      for (const blocker of item.blockers) blockers.append(element('li', blocker));
      card.append(element('strong', '待處理項目'), blockers);
      reportPanel.append(card);
    }
  };

  const revisionFieldsFromQuestion = (question) => ({
    prompt: question.prompt ?? '', options: clone(question.options ?? []), answerId: question.answerId ?? '',
    explanation: question.explanation ?? '', hints: clone(question.hints ?? []),
    wrongFeedback: question.wrongGuidance ?? '', remediation: question.remediation ?? '',
  });
  const renderRevisionForm = (activity, question, revision) => {
    const isNew = !revision;
    const fields = revision?.fields ?? revisionFieldsFromQuestion(question);
    const form = element('form', undefined, 'review-form candidate-revision-form');
    form.dataset.action = isNew ? 'create-revision' : 'update-revision';
    form.dataset.activityId = activity.activityId;
    form.dataset.questionId = question.questionId;
    if (revision) form.dataset.revisionId = revision.revisionId;
    const title = isNew ? '新增候選修訂草稿' : `候選版本 ${revision.revisionId}｜建立：${revision.createdAt}｜更新：${revision.updatedAt}`;
    form.append(element('strong', title));
    const original = element('details', undefined, 'revision-original');
    original.append(element('summary', '檢視唯讀原始題目（不會被修改）'));
    const originalFields = revisionFieldsFromQuestion(question);
    original.append(element('pre', JSON.stringify(originalFields, null, 2)));
    form.append(original);
    const comparison = element('details', undefined, 'revision-comparison');
    comparison.append(element('summary', '原始／候選版本逐欄比較'));
    const comparisonFields = element('dl', undefined, 'revision-diff-list');
    for (const key of REVISION_FIELDS) {
      const originalValue = JSON.stringify(originalFields[key] ?? '', null, 0);
      const candidateValue = JSON.stringify(fields[key] ?? '', null, 0);
      comparisonFields.append(element('dt', key), element('dd', `原始：${originalValue}\n候選：${candidateValue}`));
    }
    comparison.append(comparisonFields);
    form.append(comparison);
    appendLabelledInput(form, '候選題幹', 'revision-prompt', fields.prompt ?? '', { multiline: true, rows: 2 });
    appendLabelledInput(form, '候選選項（JSON 陣列）', 'revision-options', JSON.stringify(fields.options ?? [], null, 2), { multiline: true, rows: 5 });
    appendLabelledInput(form, '候選正解 ID', 'revision-answerId', fields.answerId ?? '');
    appendLabelledInput(form, '候選解析', 'revision-explanation', fields.explanation ?? '', { multiline: true, rows: 2 });
    appendLabelledInput(form, '候選提示（JSON 陣列）', 'revision-hints', JSON.stringify(fields.hints ?? [], null, 2), { multiline: true, rows: 3 });
    appendLabelledInput(form, '候選錯答回饋', 'revision-wrongFeedback', fields.wrongFeedback ?? '', { multiline: true, rows: 2 });
    appendLabelledInput(form, '候選補強內容／狀態', 'revision-remediation', fields.remediation ?? '', { multiline: true, rows: 2 });
    appendLabelledInput(form, '修改理由（必填）', 'revision-reason', revision?.reason ?? '', { multiline: true, rows: 2, placeholder: '說明修改原因；不會自動套用。' });
    const actions = element('div', undefined, 'candidate-revision-actions');
    const save = element('button', isNew ? '保存為獨立候選版本' : '保存此候選版本', 'button button-primary');
    save.type = 'submit';
    const cancel = element('button', isNew ? '取消建立' : '取消此候選版本', 'button button-secondary');
    cancel.type = 'button'; cancel.dataset.action = isNew ? 'cancel-new-revision' : 'cancel-revision';
    cancel.dataset.activityId = activity.activityId; cancel.dataset.questionId = question.questionId;
    if (revision) cancel.dataset.revisionId = revision.revisionId;
    actions.append(save, cancel); form.append(actions);
    form.append(element('p', '比較方式：展開原始題目並與本表候選欄位逐項比對。此版本只是教師候選草稿，不能被遊戲載入。', 'review-boundary-note'));
    return form;
  };

  const renderQuestion = (activity, question) => {
    const review = getQuestionReview(dataset, activity.activityId, question.questionId);
    const card = element('article', undefined, `teacher-review-question${question.reviewable ? '' : ' is-disabled'}`);
    card.dataset.questionId = question.questionId;
    const heading = element('div', undefined, 'teacher-review-question-heading');
    heading.append(element('span', question.group, 'review-question-group'), element('code', question.questionId));
    card.append(heading, element('h3', question.prompt));
    if (question.visualization) addVisualization(card, question.visualization);
    if (question.options.length) {
      const list = element('ol', undefined, 'review-option-list');
      list.type = 'A';
      for (const option of question.options) {
        const item = element('li', `${option.text}${option.optionId === question.answerId ? '　｜資料所列正解' : ''}`);
        if (option.optionId === question.answerId) item.classList.add('is-answer');
        if (option.errorType) item.append(element('small', `可能錯答分類（待驗證）：${option.errorType}`));
        list.append(item);
      }
      card.append(list);
    }
    card.append(element('p', question.answerId ? `正解識別碼：${question.answerId}` : '正解：尚未提供可作答題面。', 'review-answer-id'));
    card.append(element('p', question.explanation ? `解析：${question.explanation}` : '解析：待提供。'));
    card.append(element('p', `目前檢視能力：${question.capability}`));
    card.append(element('p', `可能混合的能力／答錯原因疑點：${question.mixedConcern}`));
    card.append(element('p', `先備確認：${question.prerequisiteNote}`));
    if (question.hints?.length) {
      card.append(element('p', `分層提示：${question.hints.map((hint, index) => `第 ${index + 1} 層：${hint}`).join('；')}`));
    } else card.append(element('p', '提示：此題未提供提示。'));
    const hasErrorGuidance = Object.keys(question.errorGuidance ?? {}).length > 0;
    card.append(element('p', `答錯後引導：${question.wrongGuidance ?? (hasErrorGuidance ? '依資料定義的錯答類型提供說明；僅為候選線索。' : '尚未提供題目層級引導。')}`));
    if (!question.wrongGuidance && Object.keys(question.errorGuidance ?? {}).length) {
      card.append(element('p', `依錯答類型提供的說明（僅當作線索）：${Object.values(question.errorGuidance).join('；')}`));
    }
    card.append(element('p', `補強：${question.remediation ?? '此題組未提供題目層級補強活動。'}`));
    const audit = question.qualityAudit;
    if (audit) {
      const auditSection = element('section', undefined, 'question-quality-audit');
      auditSection.append(element('h4', '候選內容稽核（AI／資料檢查；不是教師審查結論）'));
      const sourceLine = element('p', `官方來源登錄：${audit.curriculum.officialSourceId ?? '待核對'}；`);
      if (audit.curriculum.officialSourceUrl) {
        const sourceLink = element('a', '國家教育研究院數學領域課綱 PDF');
        sourceLink.href = audit.curriculum.officialSourceUrl;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener noreferrer';
        sourceLine.append(sourceLink);
      } else sourceLine.append(document.createTextNode('尚無官方來源連結。'));
      auditSection.append(sourceLine);
      auditSection.append(element('p', `課綱參照：${audit.curriculum.codes.join('、') || '待核對'}；官方原文${audit.curriculum.officialTextChecked ? '已核對代碼及條文位置（摘要非逐字引文）' : '尚未核對'}；定位：${audit.curriculum.officialLocation}`));
      auditSection.append(element('p', `條文範圍摘要：${audit.curriculum.officialContentSummary}`));
      auditSection.append(element('p', `相關學習表現參照：${audit.curriculum.relatedPerformanceCodes.join('、') || '尚無直接對應資料'}（如為 II 階段指標，不代表三年級學期進度）。逐題對應：${audit.curriculum.itemAlignmentStatus}。年級適切性：${audit.curriculum.gradeApplicability}。${audit.curriculum.semesterAndTextbook}`));
      auditSection.append(element('p', `題目角色：${audit.role.usage}（資料狀態 ${audit.role.dataStatus}）。資料一致性：答案參照 ${audit.dataChecks.answerReference}；選項 ID／文字唯一 ${audit.dataChecks.optionIdUniqueness}/${audit.dataChecks.optionTextUniqueness}；解析存在 ${audit.dataChecks.explanationPresent}。`));
      const mathEvidence = acceptanceReport?.records?.find((record) => record.evidenceType === 'question_data_audit'
        && record.activityId === activity.activityId && record.questionId === question.questionId);
      auditSection.append(element('p', `數學／圖表資料核驗：${mathEvidence
        ? `${mathEvidence.status}；獨立推導：${mathEvidence.answerAudit?.derivation ?? mathEvidence.summary}；資料正解：${mathEvidence.answerAudit?.declaredAnswer ?? '未提供'}；實際圖像、語句唯一性、教學適切性仍需人工確認。`
        : '尚未執行逐題獨立核驗。'} 稽核重點：${audit.dataChecks.questionSpecificFinding}`));
      auditSection.append(element('p', `測量概念：${audit.learningScope.measuredConcept}；先備：${audit.learningScope.prerequisite}；認知負荷疑點：${audit.learningScope.cognitiveLoadConcern}`));
      auditSection.append(element('p', `能力限制：${audit.learningScope.uncoveredCapabilities.join('；')} ${audit.learningScope.judgmentLimit}`));
      auditSection.append(element('p', `提示（${audit.supports.hints.count} 層）：${audit.supports.hints.status}；${audit.supports.hints.teacherCheck}`));
      auditSection.append(element('p', `錯答回饋：${audit.supports.wrongFeedback.status}；${audit.supports.wrongFeedback.text || '尚未提供。'} ${audit.supports.wrongFeedback.boundary}`));
      auditSection.append(element('p', `補救活動：${audit.supports.remediation.status}；${audit.supports.remediation.description} ${audit.supports.remediation.executionBoundary}`));
      auditSection.append(element('p', `建議：${audit.recommendations.join(' ')}`));
      auditSection.append(element('p', `教師逐題決定：${teacherDecisionLabels[review.teacherDecision ?? 'unreviewed']}；相容舊版內容審查狀態：${decisionLabels[review.decision] ?? '尚未審查'}；最近更新：${review.updatedAt ?? '尚無紀錄'}；教師理由：${review.teacherReason?.trim() || '尚未填寫'}。此為教師自行操作的欄位，AI／資料稽核不會代填。`, 'review-item-status is-warning'));
      card.append(auditSection);
    }
    card.append(element('p', `資料狀態：${question.status}${question.reviewable ? '；候選可作答題目' : '；唯讀預覽或停用項目不可作答／計分，但可供教師審查題面資料'}`, question.reviewable ? 'review-item-status' : 'review-item-status is-warning'));

    const form = element('form', undefined, 'review-form question-review-form');
    form.dataset.activityId = activity.activityId;
    form.dataset.questionId = question.questionId;
    const criteriaFieldset = element('fieldset', undefined, 'review-criteria-list');
    criteriaFieldset.append(element('legend', '逐項品質檢核（未填項目維持尚未審查）'));
    for (const criterion of REVIEW_CRITERIA) {
      const saved = review.criteriaReviews?.[criterion.id] ?? { status: 'unreviewed', comment: '' };
      const item = element('div', undefined, 'review-criterion');
      item.append(element('strong', criterion.label));
      appendSelect(item, '審查狀態', `criterion-status-${criterion.id}`, saved.status, [
        { value: 'unreviewed', label: '尚未審查' },
        { value: 'passed', label: '通過' },
        { value: 'needs_revision', label: '需修改' },
        { value: 'not_applicable', label: '不適用' },
      ], { criterionId: criterion.id });
      appendLabelledInput(item, '意見／理由（需修改或不適用時必填）', `criterion-comment-${criterion.id}`, saved.comment, { multiline: true, rows: 2, placeholder: '尚未填寫' });
      criteriaFieldset.append(item);
    }
    form.append(criteriaFieldset);
    appendSelect(form, '教師逐題工作流程決定', 'teacherDecision', review.teacherDecision ?? 'unreviewed', TEACHER_DECISIONS.map((value) => ({ value, label: teacherDecisionLabels[value] })));
    appendLabelledInput(form, '審查理由', 'teacherReason', review.teacherReason ?? '', { multiline: true, rows: 2, placeholder: '由教師填寫；預設空白。' });
    appendLabelledInput(form, '要修改的內容', 'proposedChanges', review.proposedChanges ?? '', { multiline: true, rows: 2, placeholder: '由教師填寫；預設空白。' });
    appendLabelledInput(form, '需要補充的證據', 'evidenceNeeded', review.evidenceNeeded ?? '', { multiline: true, rows: 2, placeholder: '由教師填寫；預設空白。' });
    appendLabelledInput(form, '先備能力／授課進度確認事項', 'prerequisiteProgress', review.prerequisiteProgress ?? '', { multiline: true, rows: 2, placeholder: '由教師填寫；預設空白。' });
    appendLabelledInput(form, '下次審查備註', 'nextReviewNotes', review.nextReviewNotes ?? '', { multiline: true, rows: 2, placeholder: '由教師填寫；預設空白。' });
    appendLabelledInput(form, '舊版審查備註（相容保留）', 'notes', review.notes ?? '', { multiline: true, rows: 2, placeholder: '舊版 schema v1 資料相容欄位。' });
    appendLabelledInput(form, '舊版修改理由（相容保留）', 'revisionReason', review.revisionReason ?? '', { multiline: true, rows: 2, placeholder: '舊版 schema v1 資料相容欄位。' });
    const saveQuestion = element('button', '儲存本題審查', 'button button-primary');
    saveQuestion.type = 'submit';
    form.append(saveQuestion);
    const updated = element('small', review.updatedAt ? `本題最後更新：${review.updatedAt}` : '本題尚未記錄審查。', 'review-updated-at');
    form.append(updated);
    card.append(form);

    const revisions = revisionDataset.revisions.filter((item) => item.activityId === activity.activityId && item.questionId === question.questionId);
    const revisionSection = element('section', undefined, 'candidate-revision-workspace');
    revisionSection.append(element('h4', `候選修訂版本（${revisions.length}）`), element('p', '修訂只保存在獨立的候選修訂儲存區，不會套用到遊戲；保存修訂不會改變教師審查決定。資料只在目前瀏覽器，不跨裝置同步。'));
    const newRevisionButton = element('button', '建立候選修訂', 'button button-secondary');
    newRevisionButton.type = 'button'; newRevisionButton.dataset.action = 'new-revision';
    newRevisionButton.dataset.activityId = activity.activityId; newRevisionButton.dataset.questionId = question.questionId;
    revisionSection.append(newRevisionButton);
    if (editingRevisionId === `new:${activity.activityId}:${question.questionId}`) {
      revisionSection.append(renderRevisionForm(activity, question, null));
    }
    for (const revision of revisions) revisionSection.append(renderRevisionForm(activity, question, revision));
    card.append(revisionSection);
    return card;
  };

  const render = () => {
    renderSidebar();
    renderActivity();
    if (transientPersistence === 'memory') storageNote.textContent = '審查紀錄僅在目前頁面記憶體中；離開頁面後會消失。不會上傳，也不讀寫遊戲進度。';
    if (reportVisible) renderPilotReport();
  };

  const collectActivityForm = (form) => {
    const textbook = Object.fromEntries(textbookKeys.map((key) => [key, form.elements.namedItem(key).value.trim()]));
    const prerequisiteChecks = Object.fromEntries([...form.querySelectorAll('[data-prerequisite-id]')].map((select) => [select.dataset.prerequisiteId, select.value]));
    return {
      activityId: form.dataset.activityId,
      decision: form.elements.namedItem('activityDecision').value,
      textbook,
      classroomProgress: form.elements.namedItem('classroomProgress').value.trim(),
      prerequisiteChecks,
      notes: form.elements.namedItem('activityNotes').value.trim(),
      pilotDecision: form.elements.namedItem('pilotDecision').value,
      pilotNotes: form.elements.namedItem('pilotNotes').value.trim(),
      updatedAt: new Date().toISOString(),
    };
  };
  const collectQuestionForm = (form) => {
    const criteriaReviews = Object.fromEntries(REVIEW_CRITERIA.map(({ id }) => {
      const select = form.querySelector(`[data-criterion-id="${id}"]`);
      const comment = form.elements.namedItem(`criterion-comment-${id}`).value.trim();
      return [id, { status: select.value, comment }];
    }));
    const previous = getQuestionReview(dataset, form.dataset.activityId, form.dataset.questionId);
    return {
      ...previous,
      questionId: form.dataset.questionId,
      decision: ({ accept_suggestions: 'accepted', request_changes: 'needs_revision', defer_review: 'defer' })[form.elements.namedItem('teacherDecision').value] ?? 'unreviewed',
      teacherDecision: form.elements.namedItem('teacherDecision').value,
      teacherReason: form.elements.namedItem('teacherReason').value.trim(),
      proposedChanges: form.elements.namedItem('proposedChanges').value.trim(),
      evidenceNeeded: form.elements.namedItem('evidenceNeeded').value.trim(),
      prerequisiteProgress: form.elements.namedItem('prerequisiteProgress').value.trim(),
      nextReviewNotes: form.elements.namedItem('nextReviewNotes').value.trim(),
      revisionReason: form.elements.namedItem('revisionReason').value.trim(),
      notes: form.elements.namedItem('notes').value.trim(),
      criteriaReviews,
      updatedAt: new Date().toISOString(),
    };
  };
  const collectRevisionFields = (form) => {
    const parseList = (name) => {
      const value = JSON.parse(form.elements.namedItem(name).value);
      if (!Array.isArray(value)) throw new TypeError(`${name} 必須是 JSON 陣列。`);
      return value;
    };
    return {
      prompt: form.elements.namedItem('revision-prompt').value,
      options: parseList('revision-options'),
      answerId: form.elements.namedItem('revision-answerId').value,
      explanation: form.elements.namedItem('revision-explanation').value,
      hints: parseList('revision-hints'),
      wrongFeedback: form.elements.namedItem('revision-wrongFeedback').value,
      remediation: form.elements.namedItem('revision-remediation').value,
    };
  };

  root.addEventListener('click', (event) => {
    const activityButton = event.target.closest('[data-activity-id]');
    if (activityButton && activityButton.classList.contains('teacher-review-nav-item')) {
      activeActivityId = activityButton.dataset.activityId;
      updateMessage('目前只切換檢視活動，尚未變更審查紀錄。');
      render();
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'pilot-report') {
      reportVisible = true;
      renderPilotReport();
    } else if (action === 'new-revision') {
      const button = event.target.closest('[data-action="new-revision"]');
      editingRevisionId = `new:${button.dataset.activityId}:${button.dataset.questionId}`;
      render();
    } else if (action === 'cancel-new-revision') {
      editingRevisionId = null;
      render();
    } else if (action === 'cancel-revision') {
      const button = event.target.closest('[data-action="cancel-revision"]');
      const revisionId = button.dataset.revisionId;
      const next = { ...revisionDataset, updatedAt: new Date().toISOString(), revisions: revisionDataset.revisions.filter((item) => item.revisionId !== revisionId) };
      if (persistRevisions(next)) editingRevisionId = null;
      render();
    } else if (action === 'export') {
      try {
        const blob = new Blob([serializeTeacherReviewDataset(dataset)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `math-candidate-review-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        updateMessage('已匯出目前工作台審查資料 JSON。');
      } catch (error) { updateMessage(`匯出失敗：${error.message}`, true); }
    } else if (action === 'export-revisions') {
      try {
        const blob = new Blob([serializeRevisionDataset(revisionDataset)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url;
        link.download = `math-candidate-revisions-${new Date().toISOString().slice(0, 10)}.json`;
        link.click(); URL.revokeObjectURL(url);
        updateMessage('已匯出獨立候選修訂 JSON；不含審查證據或正式資料。');
      } catch (error) { updateMessage(`候選修訂匯出失敗：${error.message}`, true); }
    } else if (action === 'reset') {
      if (!window.confirm('只清除目前瀏覽器中的教師審查資料？候選修訂草稿會保留；正式遊戲進度不會變更。')) return;
      const result = resetTeacherReviewDataset(storage);
      if (!result.ok) { updateMessage(result.error, true); return; }
      dataset = createEmptyTeacherReviewDataset();
      canSave = true;
      transientPersistence = storage ? 'local' : 'memory';
      updateMessage('工作台審查資料已清除；正式遊戲進度未變更。');
      render();
    }
  });

  root.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.matches('form[data-action="create-revision"], form[data-action="update-revision"]')) {
      event.preventDefault();
      try {
        const reason = form.elements.namedItem('revision-reason').value.trim();
        if (!reason) throw new TypeError('請填寫修改理由。');
        const fields = collectRevisionFields(form);
        const timestamp = new Date().toISOString();
        const existing = form.dataset.revisionId ? revisionDataset.revisions.find((item) => item.revisionId === form.dataset.revisionId) : null;
        const generatedId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
        const revision = {
          revisionId: existing?.revisionId ?? `REV-${generatedId}`,
          activityId: form.dataset.activityId, questionId: form.dataset.questionId,
          createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp, reason, fields,
        };
        const revisions = existing
          ? revisionDataset.revisions.map((item) => item.revisionId === existing.revisionId ? revision : item)
          : [...revisionDataset.revisions, revision];
        if (persistRevisions({ ...revisionDataset, updatedAt: timestamp, revisions })) {
          editingRevisionId = null;
          render();
        }
      } catch (error) { updateMessage(`候選修訂未儲存：${error.message}`, true); }
      return;
    }
    if (form.matches('form[data-action="add-evidence"]')) {
      event.preventDefault();
      const scopeType = form.elements.namedItem('scopeType').value;
      const activityId = form.elements.namedItem('activityId').value;
      const questionRef = form.elements.namedItem('questionRef').value;
      const [questionActivityId, questionId] = questionRef ? questionRef.split('::') : [null, null];
      if (scopeType === 'question' && (!questionId || questionActivityId !== activityId)) {
        updateMessage('題目範圍必須選擇同一活動中的題目。', true);
        return;
      }
      const viewport = form.elements.namedItem('viewport').value || null;
      const evidenceType = form.elements.namedItem('evidenceType').value;
      if (evidenceType === 'browser_acceptance' && !viewport) {
        updateMessage('瀏覽器驗收證據必須指定實際 viewport。', true);
        return;
      }
      const rawDate = form.elements.namedItem('executedAt').value.trim();
      const record = {
        evidenceId: `EV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        scopeType,
        activityId: scopeType === 'system' ? null : activityId,
        questionId: scopeType === 'question' ? questionId : null,
        evidenceType,
        performedItems: form.elements.namedItem('performedItems').value.trim(),
        result: form.elements.namedItem('result').value,
        executedAt: rawDate || null,
        source: form.elements.namedItem('source').value.trim(),
        limitations: form.elements.namedItem('limitations').value.trim(),
        viewport: evidenceType === 'browser_acceptance' ? viewport : null,
      };
      const next = markDatasetUpdated({
        ...dataset,
        evidenceRecords: [...dataset.evidenceRecords, record],
      }, new Date().toISOString());
      if (persist(next)) updateMessage('驗收證據已登錄。報告已依新證據及目前審查草稿重算；登錄本身不代表證據真實性由系統驗證或活動獲得核准。');
      return;
    }
    if (!form.matches('form[data-activity-id], form[data-question-id]')) return;
    event.preventDefault();
    if (form.matches('.activity-review-form')) {
      const record = collectActivityForm(form);
      const next = markDatasetUpdated({
        ...dataset,
        activityReviews: { ...dataset.activityReviews, [record.activityId]: record },
      }, record.updatedAt);
      persist(next);
    } else {
      const activityId = form.dataset.activityId;
      const record = collectQuestionForm(form);
      const missingReason = REVIEW_CRITERIA.find(({ id }) => ['needs_revision', 'not_applicable'].includes(record.criteriaReviews[id].status) && !record.criteriaReviews[id].comment);
      if (missingReason) {
        updateMessage(`「${REVIEW_CRITERIA.find(({ id }) => id === missingReason.id).label}」選為需修改或不適用時，請填寫具體理由。`, true);
        form.elements.namedItem(`criterion-comment-${missingReason.id}`).focus();
        return;
      }
      const currentActivityReviews = dataset.questionReviews[activityId] ?? {};
      const next = markDatasetUpdated({
        ...dataset,
        questionReviews: { ...dataset.questionReviews, [activityId]: { ...currentActivityReviews, [record.questionId]: record } },
      }, record.updatedAt);
      persist(next);
    }
  });

  root.addEventListener('change', async (event) => {
    if (event.target.dataset.action === 'import-acceptance' && event.target.files?.[0]) {
      try {
        const incoming = JSON.parse(await event.target.files[0].text());
        if (!validateAcceptanceEvidenceReport(incoming).ok) throw new TypeError(validateAcceptanceEvidenceReport(incoming).errors.join(' '));
        if (acceptanceReport) {
          const merged = mergeAcceptanceEvidenceReports(acceptanceReport, incoming);
          if (!merged.ok) throw new TypeError(merged.error);
          acceptanceReport = merged.report;
        } else acceptanceReport = incoming;
        acceptanceReportStatus = '工程報告已驗證並載入記憶體；未寫入教師審查資料或正式學習資料。';
        updateMessage('工程驗收報告已驗證並載入本頁；未變更教師審查草稿。');
        if (reportVisible) renderPilotReport();
      } catch (error) { updateMessage(`工程報告未載入，資料未變更：${error.message}`, true); }
      event.target.value = '';
      return;
    }
    if (event.target.dataset.action === 'import-revisions' && event.target.files?.[0]) {
      try {
        const incoming = JSON.parse(await event.target.files[0].text());
        const merged = mergeRevisionDatasets(revisionDataset, incoming);
        if (!merged.ok) throw new TypeError(merged.error);
        if (persistRevisions(merged.dataset)) updateMessage('候選修訂 JSON 已完整驗證並匯入；原始題目與教師決定未變更。');
      } catch (error) { updateMessage(`候選修訂匯入遭拒，資料未變更：${error.message}`, true); }
      event.target.value = '';
      return;
    }
    if (event.target.dataset.action !== 'import' || !event.target.files?.[0]) return;
    const file = event.target.files[0];
    try {
      const incoming = JSON.parse(await file.text());
      const merged = mergeTeacherReviewDatasets(dataset, incoming);
      if (!merged.ok) { updateMessage(`匯入未完成：${merged.error}`, true); event.target.value = ''; return; }
      if (!merged.changed) { updateMessage(merged.error); event.target.value = ''; return; }
      if (persist(merged.dataset)) updateMessage('JSON 已驗證並合併；既有相同紀錄未被覆蓋。');
    } catch (error) { updateMessage(`匯入失敗，資料未變更：${error.message}`, true); }
    event.target.value = '';
  });

  render();
  const fetchEvidence = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchEvidence === 'function') {
    fetchEvidence(options.acceptanceReportUrl ?? './data/acceptance-evidence.json', { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then((candidate) => {
        const checked = validateAcceptanceEvidenceReport(candidate);
        if (!checked.ok) throw new TypeError(checked.errors.join(' '));
        acceptanceReport = checked.value;
        acceptanceReportStatus = '已讀取並驗證；唯讀工程證據，不代表教學／課綱核准。';
        if (reportVisible) renderPilotReport();
      })
      .catch((error) => {
        acceptanceReportStatus = `自動工程報告無法載入：${error.message}`;
        if (reportVisible) renderPilotReport();
      });
  }
  return Object.freeze({ getDataset: () => clone(dataset), getPersistence: () => transientPersistence });
}

