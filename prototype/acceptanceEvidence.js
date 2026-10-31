import { TEACHER_REVIEW_ACTIVITY_IDS } from './data/teacherReviewCatalog.js';

export const ACCEPTANCE_EVIDENCE_SCHEMA_VERSION = 1;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateAcceptanceEvidenceReport(report) {
  const errors = [];
  if (!isRecord(report)) return { ok: false, errors: ['報告根節點必須是物件。'] };
  if (report.schemaVersion !== ACCEPTANCE_EVIDENCE_SCHEMA_VERSION) errors.push('不支援的工程證據 schema 版本。');
  if (typeof report.reportId !== 'string' || !report.reportId.trim()) errors.push('缺少報告識別碼。');
  if (!report.generatedAt || !Number.isFinite(Date.parse(report.generatedAt))) errors.push('缺少有效產生時間。');
  if (!Array.isArray(report.coveredActivities) || report.coveredActivities.some((id) => !TEACHER_REVIEW_ACTIVITY_IDS.includes(id))) errors.push('涵蓋活動識別碼無效。');
  if (Array.isArray(report.coveredActivities) && new Set(report.coveredActivities).size !== report.coveredActivities.length) errors.push('涵蓋活動識別碼不可重複。');
  if (!Array.isArray(report.limitations) || report.limitations.some((item) => typeof item !== 'string' || !item.trim())) errors.push('報告限制必須是非空文字清單。');
  if (!Array.isArray(report.records)) errors.push('證據紀錄必須是清單。');
  const ids = new Set();
  for (const record of Array.isArray(report.records) ? report.records : []) {
    const required = ['evidenceId', 'evidenceType', 'command', 'status', 'exitCode', 'startedAt', 'finishedAt', 'durationMs', 'summary', 'coverage', 'source', 'limitations'];
    if (!isRecord(record) || required.some((key) => !(key in record))) { errors.push('工程證據紀錄缺少必要欄位。'); continue; }
    if (typeof record.evidenceId !== 'string' || !record.evidenceId.trim()) errors.push('工程證據識別碼無效。');
    if (ids.has(record.evidenceId)) errors.push(`工程證據 ID 重複：${record.evidenceId}。`);
    ids.add(record.evidenceId);
    if (!['automated_test', 'mapping_validation', 'browser_acceptance', 'question_data_audit'].includes(record.evidenceType)) errors.push(`證據 ${record.evidenceId} 類型無效。`);
    if (!['passed', 'failed', 'not_run', 'not_applicable'].includes(record.status)) errors.push(`證據 ${record.evidenceId} 狀態無效。`);
    if (typeof record.command !== 'string' || !record.command.trim() || typeof record.summary !== 'string' || !record.summary.trim()) errors.push(`證據 ${record.evidenceId} 缺少命令或結果摘要。`);
    if (record.status === 'passed' && (record.exitCode !== 0 || typeof record.command !== 'string' || !record.command.trim() || typeof record.summary !== 'string' || !record.summary.trim())) errors.push(`通過證據 ${record.evidenceId} 缺少成功執行證據。`);
    if (record.status === 'not_run' && record.exitCode !== null) errors.push(`未執行證據 ${record.evidenceId} 不應有退出碼。`);
    if (!Array.isArray(record.coverage) || record.coverage.some((id) => !TEACHER_REVIEW_ACTIVITY_IDS.includes(id))) errors.push(`證據 ${record.evidenceId} 涵蓋範圍無效。`);
    if (typeof record.durationMs !== 'number' || record.durationMs < 0) errors.push(`證據 ${record.evidenceId} 執行時間無效。`);
    if (!Number.isFinite(Date.parse(record.startedAt)) || !Number.isFinite(Date.parse(record.finishedAt))) errors.push(`證據 ${record.evidenceId} 缺少有效執行時間。`);
    if (typeof record.source !== 'string' || !record.source.trim() || typeof record.limitations !== 'string' || !record.limitations.trim()) errors.push(`證據 ${record.evidenceId} 缺少來源或限制。`);
    if (record.evidenceType === 'browser_acceptance') {
      if (!['1366x768', '390x844', '340x740'].includes(record.viewport)) errors.push(`瀏覽器證據 ${record.evidenceId} 缺少有效 viewport。`);
      if (record.status === 'passed' && (record.exitCode !== 0 || typeof record.browserVersion !== 'string' || !record.browserVersion.trim()
        || !Array.isArray(record.steps) || record.steps.length === 0 || record.steps.some((step) => typeof step !== 'string' || !step.trim())
        || typeof record.screenshotPath !== 'string' || !record.screenshotPath.trim())) {
        errors.push(`通過的瀏覽器證據 ${record.evidenceId} 必須具備瀏覽器版本、步驟與截圖來源。`);
      }
    }
    if (record.evidenceType === 'question_data_audit') {
      if (!TEACHER_REVIEW_ACTIVITY_IDS.includes(record.activityId) || typeof record.questionId !== 'string' || !record.questionId.trim()) errors.push(`題目資料核驗 ${record.evidenceId} 缺少有效活動／題目識別碼。`);
      if (!['answerable_candidate', 'read_only_preview', 'disabled'].includes(record.itemKind)) errors.push(`題目資料核驗 ${record.evidenceId} 項目類型無效。`);
      if (!record.answerAudit || !['passed', 'failed', 'not_applicable'].includes(record.answerAudit.answerStatus)
        || !Array.isArray(record.answerAudit.issues) || typeof record.answerAudit.derivation !== 'string') errors.push(`題目資料核驗 ${record.evidenceId} 缺少可複核的答案推導欄位。`);
      if (record.status === 'not_applicable' && (record.itemKind !== 'disabled' || record.answerAudit?.answerStatus !== 'not_applicable')) errors.push(`僅停用項目可使用不適用狀態：${record.evidenceId}。`);
      if (record.status === 'passed' && (record.answerAudit?.answerStatus !== 'passed' || record.answerAudit?.manualChecks?.stemUniqueness !== 'manual_review_required')) errors.push(`題目資料核驗 ${record.evidenceId} 通過狀態不符合核驗邊界。`);
      if (record.teacherReviewStatus !== 'unreviewed' || 'teacherReviewStatus' in (record.answerAudit ?? {})) errors.push(`題目資料核驗 ${record.evidenceId} 必須獨立保留未審查狀態，不可代填教師審查結論。`);
    }
    if (record.evidenceType === 'automated_test' && record.status === 'passed'
      && (!record.parsedTest || record.parsedTest.failed !== 0 || record.parsedTest.passed !== record.parsedTest.tests
        || !Number.isInteger(record.parsedTest.tests) || record.parsedTest.tests <= 0)) {
      errors.push(`通過測試證據 ${record.evidenceId} 沒有完整且可解析的測試摘要。`);
    }
    if (record.status === 'passed' && record.evidenceType === 'mapping_validation') {
      const expected = record.command.includes('learning-map.mjs')
        ? /PASS learning map: \d+ grades, \d+ semester slots, \d+ subjects per term, \d+ grade 3 scope entries\./
        : /Learning activity mapping is valid; full-unit prototype responses remain non-formal evidence, not mastery decisions\./;
      if (!expected.test(record.summary)) errors.push(`通過映射證據 ${record.evidenceId} 缺少可辨識的檢查摘要。`);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], value: structuredClone(report) };
}

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};

export function mergeAcceptanceEvidenceReports(current, incoming) {
  const currentResult = validateAcceptanceEvidenceReport(current);
  const incomingResult = validateAcceptanceEvidenceReport(incoming);
  if (!currentResult.ok) return { ok: false, error: `目前報告無效：${currentResult.errors.join(' ')}` };
  if (!incomingResult.ok) return { ok: false, error: incomingResult.errors.join(' ') };
  const records = [...currentResult.value.records];
  for (const next of incomingResult.value.records) {
    const existing = records.find((item) => item.evidenceId === next.evidenceId);
    if (existing && stableStringify(existing) !== stableStringify(next)) return { ok: false, error: `工程證據 ${next.evidenceId} 內容衝突；整份匯入已拒絕。` };
    if (!existing) records.push(next);
  }
  const merged = { ...currentResult.value, records, generatedAt: [currentResult.value.generatedAt, incomingResult.value.generatedAt].sort().at(-1) };
  return { ok: true, report: merged, changed: records.length !== currentResult.value.records.length };
}
