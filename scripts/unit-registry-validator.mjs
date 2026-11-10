import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UNIT_STATUSES = new Set(['candidate', 'in_review', 'approved', 'retired']);
const SUBJECTS = new Set(['mathematics', 'chinese_language', 'natural_science', 'thinking']);
const REVIEW_TYPES = new Set([
  'curriculum_alignment',
  'textbook_scope_version',
  'grade_scope_prerequisites',
  'scope_and_exclusions',
]);
const REVIEW_DECISIONS = new Set(['pending_review', 'returned', 'approved']);
const EXCEPTION_RULES = new Set([
  'curriculum_mapping_nonformal_design',
  'textbook_evidence_not_claimed',
  'no_prerequisites_required',
]);
const STATUS_TRANSITIONS = {
  candidate: new Set(['in_review', 'retired']),
  in_review: new Set(['candidate', 'approved', 'retired']),
  approved: new Set(['retired']),
  retired: new Set(),
};
const UNIT_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const positiveInt = (v) => Number.isInteger(v) && v > 0;
const isDate = (v) => typeof v === 'string' && ISO_DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const isDateTime = (v) => typeof v === 'string' && ISO_DATETIME_TZ.test(v) && !Number.isNaN(Date.parse(v));
const uniq = (values) => new Set(values).size === values.length;

function issue(errors, where, message, code = 'invalid') {
  errors.push({ path: where, code, message });
}

function idsInMap(curriculumMap) {
  const entries = [
    ...(curriculumMap?.verifiedLearningFocuses ?? []),
    ...(curriculumMap?.pendingLearningFocuses ?? []),
  ];
  const labels = curriculumMap?.crossDomainDesignLabels ?? [];
  return new Map([
    ...entries.filter(isObject).map((x) => [x.id, { ...x, _kind: 'focus' }]),
    ...labels.filter(isObject).map((x) => [x.labelId, { ...x, _kind: 'design_label' }]),
  ]);
}

function revisionExists(unit, revision) {
  if (unit.revision === revision) return true;
  return (unit.revisionHistory ?? []).some((item) => item?.revision === revision
    && isObject(item.snapshot)
    && item.snapshot.unitId === unit.unitId
    && item.snapshot.revision === revision
    && typeof item.snapshot.status === 'string'
    && Array.isArray(item.snapshot.reviewRecords)
    && Array.isArray(item.snapshot.statusHistory));
}

function checkStringArray(errors, value, where, { allowEmpty = true, unique = true } = {}) {
  if (!Array.isArray(value)) {
    issue(errors, where, '必須為陣列', 'type');
    return false;
  }
  if (!allowEmpty && value.length === 0) issue(errors, where, '不可為空陣列', 'empty');
  value.forEach((x, i) => {
    if (!nonEmpty(x)) issue(errors, `${where}[${i}]`, '必須是非空字串', 'type');
  });
  if (unique && !uniq(value)) issue(errors, where, '不可有重複值', 'duplicate');
  return true;
}

function resolveEvidenceRef(ref, unit, mapIds, where, errors) {
  if (!nonEmpty(ref)) {
    issue(errors, where, 'evidenceRefs 項目不可為空', 'evidence_ref');
    return;
  }
  const split = ref.indexOf(':');
  if (split < 1) {
    issue(errors, where, '證據引用必須使用 docs/18 定義的命名空間', 'evidence_ref');
    return;
  }
  const namespace = ref.slice(0, split);
  const target = ref.slice(split + 1);
  const prereqIds = new Set((unit.prerequisites ?? []).map((p) => p?.prerequisiteId));
  const textbookIds = new Set((unit.textbookEvidence ?? []).map((e) => e?.evidenceId));
  const exceptionIds = new Set((unit.exceptions ?? []).map((e) => e?.exceptionId));
  if (namespace === 'curriculum-map' && mapIds.has(target)) return;
  if (namespace === 'textbook-evidence' && textbookIds.has(target)) return;
  if (namespace === 'prerequisite' && prereqIds.has(target)) return;
  if (namespace === 'exception' && exceptionIds.has(target)) return;
  if (namespace === 'scope') {
    const match = /^(.+)@(\d+)$/.exec(target);
    if (match && match[1] === unit.unitId && revisionExists(unit, Number(match[2]))) return;
  }
  issue(errors, where, `證據引用無效或不存在：${ref}`, 'foreign_key');
}

function validateUnit(unit, index, mapById, errors) {
  const base = `units[${index}]`;
  if (!isObject(unit)) {
    issue(errors, base, '單元必須為物件', 'type');
    return;
  }
  for (const field of ['unitId', 'title', 'scopeDescription']) {
    if (!nonEmpty(unit[field])) issue(errors, `${base}.${field}`, '必須為非空字串', 'required');
  }
  if (nonEmpty(unit.unitId) && !UNIT_ID.test(unit.unitId)) issue(errors, `${base}.unitId`, '格式不符合 docs/18 的 unitId 規則', 'format');
  if (!positiveInt(unit.revision)) issue(errors, `${base}.revision`, '必須為正整數', 'type');
  if (!SUBJECTS.has(unit.subject)) issue(errors, `${base}.subject`, '不是允許的領域值', 'enum');

  if (!isObject(unit.gradeScope)) issue(errors, `${base}.gradeScope`, '必須為物件', 'type');
  else {
    const grades = unit.gradeScope.grades;
    if (!Array.isArray(grades) || grades.length === 0 || grades.some((g) => !Number.isInteger(g) || g < 1 || g > 12)) {
      issue(errors, `${base}.gradeScope.grades`, '須為 1–12 的非空整數陣列', 'type');
    } else if (!uniq(grades) || grades.some((g, i) => i > 0 && grades[i - 1] >= g)) {
      issue(errors, `${base}.gradeScope.grades`, '必須遞增且不得重複', 'duplicate');
    }
    if (!['proposed_grade', 'curriculum_stage'].includes(unit.gradeScope.scopeType)) issue(errors, `${base}.gradeScope.scopeType`, '不是允許值', 'enum');
    if (typeof unit.gradeScope.notes !== 'string') issue(errors, `${base}.gradeScope.notes`, '必須為字串', 'type');
  }

  checkStringArray(errors, unit.curriculumMapIds, `${base}.curriculumMapIds`);
  if (unit.status !== 'candidate' && Array.isArray(unit.curriculumMapIds) && unit.curriculumMapIds.length === 0) {
    issue(errors, `${base}.curriculumMapIds`, '送審／核准單元必須至少引用一個學習重點 ID', 'required');
  }
  for (const [j, id] of (Array.isArray(unit.curriculumMapIds) ? unit.curriculumMapIds : []).entries()) {
    const target = mapById.get(id);
    if (!target) {
      issue(errors, `${base}.curriculumMapIds[${j}]`, `找不到課綱地圖 ID：${id}`, 'foreign_key');
      continue;
    }
    const targetSubject = target.subject;
    if (unit.subject === 'thinking') {
      if (target._kind !== 'design_label') issue(errors, `${base}.curriculumMapIds[${j}]`, 'thinking 單元只能連結明確的遊戲設計標籤', 'subject_mismatch');
    } else if (target._kind !== 'focus' || targetSubject !== unit.subject) {
      issue(errors, `${base}.curriculumMapIds[${j}]`, '課綱地圖領域或項目類型與單元不相容', 'subject_mismatch');
    }
    if (unit.status !== 'candidate' && (target.status === 'pending_review' || target.gradeApplicabilityStatus === 'pending_review')) {
      issue(errors, `${base}.curriculumMapIds[${j}]`, '待審地圖項目或年級適用性不能作為送審／核准依據', 'unverified_mapping');
    }
  }

  if (!Array.isArray(unit.exclusions)) issue(errors, `${base}.exclusions`, '必須為字串陣列', 'type');
  else {
    checkStringArray(errors, unit.exclusions, `${base}.exclusions`);
  }
  if (!Array.isArray(unit.textbookEvidence)) issue(errors, `${base}.textbookEvidence`, '必須為陣列', 'type');
  else {
    const evidenceIds = [];
    unit.textbookEvidence.forEach((e, j) => {
      const p = `${base}.textbookEvidence[${j}]`;
      if (!isObject(e)) return issue(errors, p, '教材證據必須為物件', 'type');
      for (const key of ['evidenceId', 'publisher', 'academicYear', 'edition', 'volume', 'unitTitle', 'locator', 'sourceTitle']) {
        if (!nonEmpty(e[key])) issue(errors, `${p}.${key}`, '教材證據欄位不可為空', 'required');
      }
      if (!['textbook', 'teacher_guide'].includes(e.evidenceType)) issue(errors, `${p}.evidenceType`, '不是允許值', 'enum');
      if (e.sourceUrl !== undefined && e.sourceUrl !== null && !nonEmpty(e.sourceUrl)) issue(errors, `${p}.sourceUrl`, '若提供必須為非空字串或 null', 'type');
      if (e.notes !== undefined && typeof e.notes !== 'string') issue(errors, `${p}.notes`, '若提供必須為字串', 'type');
      evidenceIds.push(e.evidenceId);
    });
    if (!uniq(evidenceIds)) issue(errors, `${base}.textbookEvidence`, 'evidenceId 不得重複', 'duplicate');
  }
  if ((unit.textbookEvidence?.length ?? 0) === 0 && !nonEmpty(unit.evidenceNote)) issue(errors, `${base}.evidenceNote`, '教材證據為空時須明確記錄缺口', 'required');

  if (!Array.isArray(unit.prerequisites)) issue(errors, `${base}.prerequisites`, '必須為陣列', 'type');
  else {
    const prerequisiteIds = [];
    unit.prerequisites.forEach((p, j) => {
      const at = `${base}.prerequisites[${j}]`;
      if (!isObject(p)) return issue(errors, at, '先備項目必須為物件', 'type');
      if (!nonEmpty(p.prerequisiteId) || !nonEmpty(p.description) || typeof p.required !== 'boolean') issue(errors, at, '先備項目需有 ID、描述及布林 required', 'required');
      prerequisiteIds.push(p.prerequisiteId);
    });
    if (!uniq(prerequisiteIds)) issue(errors, `${base}.prerequisites`, 'prerequisiteId 不得重複', 'duplicate');
  }

  if (!Array.isArray(unit.exceptions)) issue(errors, `${base}.exceptions`, '必須為陣列', 'type');
  else {
    const exceptionIds = [];
    unit.exceptions.forEach((e, j) => {
      const p = `${base}.exceptions[${j}]`;
      if (!isObject(e)) return issue(errors, p, '例外必須為物件', 'type');
      exceptionIds.push(e.exceptionId);
      if (!nonEmpty(e.exceptionId) || !EXCEPTION_RULES.has(e.ruleId) || !nonEmpty(e.reason) || !nonEmpty(e.approver) || !nonEmpty(e.approverRole)) issue(errors, p, '例外必填欄位或 ruleId 無效', 'required');
      if (!isDateTime(e.approvedAt)) issue(errors, `${p}.approvedAt`, '必須為含時區的 ISO 8601 日期時間', 'format');
      if (e.unitRevision !== unit.revision) issue(errors, `${p}.unitRevision`, '必須與本單元 revision 相同', 'revision_mismatch');
      if (!Array.isArray(e.evidenceRefs) || e.evidenceRefs.length === 0) issue(errors, `${p}.evidenceRefs`, '核准例外須有證據引用', 'required');
      else e.evidenceRefs.forEach((ref, k) => resolveEvidenceRef(ref, unit, new Set(mapById.keys()), `${p}.evidenceRefs[${k}]`, errors));
    const exceptionRoleRules = {
      curriculum_mapping_nonformal_design: ['課程專業人員'],
      textbook_evidence_not_claimed: ['教材審查者'],
      no_prerequisites_required: ['領域教師'],
    };
    if (EXCEPTION_RULES.has(e.ruleId) && !exceptionRoleRules[e.ruleId].some((role) => e.approverRole.includes(role))) {
      issue(errors, `${p}.approverRole`, '例外核准者角色不符合例外類型權責', 'reviewer_role');
    }
    });
    if (!uniq(exceptionIds)) issue(errors, `${base}.exceptions`, 'exceptionId 不得重複', 'duplicate');
  }

  if (!UNIT_STATUSES.has(unit.status)) issue(errors, `${base}.status`, '單元狀態不在允許清單中', 'enum');
  if (!Array.isArray(unit.reviewRecords)) issue(errors, `${base}.reviewRecords`, '必須為陣列', 'type');
  else {
    const reviewIds = [];
    unit.reviewRecords.forEach((r, j) => {
      const p = `${base}.reviewRecords[${j}]`;
      if (!isObject(r)) return issue(errors, p, '審查紀錄必須為物件', 'type');
      reviewIds.push(r.reviewId);
      if (!nonEmpty(r.reviewId) || !REVIEW_TYPES.has(r.reviewType) || !REVIEW_DECISIONS.has(r.decision) || !nonEmpty(r.reviewer) || !nonEmpty(r.reviewerRole) || typeof r.notes !== 'string') issue(errors, p, '審查紀錄必要欄位或列舉無效', 'required');
      if (!isDate(r.reviewDate)) issue(errors, `${p}.reviewDate`, '必須為 ISO 日期', 'format');
      if (r.unitRevision !== unit.revision) issue(errors, `${p}.unitRevision`, '必須鎖定本單元 revision', 'revision_mismatch');
      if (!Array.isArray(r.evidenceRefs)) issue(errors, `${p}.evidenceRefs`, '必須為陣列', 'type');
      else {
        if (r.decision === 'approved' && r.evidenceRefs.length === 0) issue(errors, `${p}.evidenceRefs`, '核准審查不得沒有依據', 'required');
        if (!uniq(r.evidenceRefs)) issue(errors, `${p}.evidenceRefs`, '不得重複引用', 'duplicate');
        r.evidenceRefs.forEach((ref, k) => resolveEvidenceRef(ref, unit, new Set(mapById.keys()), `${p}.evidenceRefs[${k}]`, errors));
      }
    });
    if (!uniq(reviewIds)) issue(errors, `${base}.reviewRecords`, 'reviewId 不得重複', 'duplicate');
  }

  if (!Array.isArray(unit.statusHistory) || unit.statusHistory.length === 0) issue(errors, `${base}.statusHistory`, '至少須含初始候選狀態事件', 'required');
  else {
    let prior = null;
    unit.statusHistory.forEach((event, j) => {
      const p = `${base}.statusHistory[${j}]`;
      if (!isObject(event)) return issue(errors, p, '狀態事件必須為物件', 'type');
      if (event.unitRevision !== unit.revision) issue(errors, `${p}.unitRevision`, '狀態事件必須鎖定該單元 revision', 'revision_mismatch');
      if (!isDateTime(event.changedAt) || !nonEmpty(event.actor) || !nonEmpty(event.actorRole) || !nonEmpty(event.reason)) issue(errors, p, '狀態事件須有時間、操作者、角色及理由', 'required');
      if (!Array.isArray(event.reviewRecordIds) || !uniq(event.reviewRecordIds)) issue(errors, `${p}.reviewRecordIds`, '必須為不重複的 ID 陣列', 'duplicate');
      for (const id of event.reviewRecordIds ?? []) if (!(unit.reviewRecords ?? []).some((r) => r?.reviewId === id)) issue(errors, `${p}.reviewRecordIds`, `找不到審查紀錄 ${id}`, 'foreign_key');
      if (j === 0) {
        if (event.fromStatus !== null || event.toStatus !== 'candidate') issue(errors, p, '首筆必須由 null 建立 candidate', 'transition');
      } else {
        if (event.fromStatus !== prior) issue(errors, p, '狀態鏈不連續', 'transition');
        if (!STATUS_TRANSITIONS[event.fromStatus]?.has(event.toStatus)) issue(errors, p, '違反合法狀態轉換', 'transition');
      }
      prior = event.toStatus;
    });
    if (unit.statusHistory.at(-1)?.toStatus !== unit.status) issue(errors, `${base}.statusHistory`, '最後狀態事件必須等於目前 status', 'transition');
  }

  if (!Array.isArray(unit.revisionHistory)) issue(errors, `${base}.revisionHistory`, '必須為陣列', 'type');
  else {
    const revisions = unit.revisionHistory.map((x) => x?.revision);
    if (!uniq(revisions)) issue(errors, `${base}.revisionHistory`, '歷史 revision 不得重複', 'duplicate');
    if (positiveInt(unit.revision)) {
      for (let r = 1; r < unit.revision; r++) {
        const snap = unit.revisionHistory.find((x) => x?.revision === r);
        if (!snap || !isObject(snap.snapshot) || snap.snapshot.unitId !== unit.unitId || snap.snapshot.revision !== r || 'revisionHistory' in (snap.snapshot ?? {})) {
          issue(errors, `${base}.revisionHistory`, `缺少或無效的完整 revision ${r} 快照`, 'revision_history');
        }
      }
      if (unit.supersedesRevision !== (unit.revision === 1 ? null : unit.revision - 1)) issue(errors, `${base}.supersedesRevision`, '必須指向前一 revision；revision 1 為 null', 'revision_mismatch');
    }
  }
  if (!isDateTime(unit.createdAt) || !isDateTime(unit.updatedAt) || Date.parse(unit.updatedAt) < Date.parse(unit.createdAt)) issue(errors, base, 'createdAt／updatedAt 無效或時間順序錯誤', 'format');
  if (unit.revision === 1 && unit.changeSummary !== null) issue(errors, `${base}.changeSummary`, 'revision 1 的 changeSummary 必須為 null', 'revision_mismatch');
  if (unit.revision > 1 && !nonEmpty(unit.changeSummary)) issue(errors, `${base}.changeSummary`, '後續 revision 必須摘要變更', 'required');
  if (unit.status === 'approved') validateApprovalRequirements(unit, base, errors);
}

function validateApprovalRequirements(unit, base, errors) {
  for (const type of REVIEW_TYPES) {
    const records = (unit.reviewRecords ?? []).filter((r) => r?.reviewType === type && r.unitRevision === unit.revision)
      .sort((a, b) => `${a.reviewDate}:${a.reviewId}`.localeCompare(`${b.reviewDate}:${b.reviewId}`));
    const latest = records.at(-1);
    if (!latest || latest.decision !== 'approved') issue(errors, `${base}.reviewRecords`, `核准單元必須有最新為 approved 的 ${type} 審查`, 'approval_gate');
  }
  const scopeReviews = (unit.reviewRecords ?? []).filter((r) => r?.reviewType === 'scope_and_exclusions' && r.unitRevision === unit.revision && r.decision === 'approved');
  if (scopeReviews.length < 2 || new Set(scopeReviews.map((r) => r.reviewer)).size < 2) issue(errors, `${base}.reviewRecords`, '範圍與排除項須有兩位不同審查者的核准紀錄', 'approval_gate');
  if (scopeReviews.length >= 2 && (!scopeReviews.some((r) => r.reviewerRole.includes('課程專業人員')) || !scopeReviews.some((r) => r.reviewerRole.includes('領域教師')))) {
    issue(errors, `${base}.reviewRecords`, '範圍與排除項須分別具課程專業人員及領域教師角色', 'reviewer_role');
  }
  const roleRules = [
    ['curriculum_alignment', ['課程專業人員', '領域課綱審查者']],
    ['textbook_scope_version', ['領域教師', '教材審查者']],
    ['grade_scope_prerequisites', ['目標年級領域教師']],
  ];
  for (const [type, allowedRoles] of roleRules) {
    const latest = (unit.reviewRecords ?? []).filter((r) => r?.reviewType === type && r.unitRevision === unit.revision)
      .sort((a, b) => `${a.reviewDate}:${a.reviewId}`.localeCompare(`${b.reviewDate}:${b.reviewId}`)).at(-1);
    if (latest?.decision === 'approved' && !allowedRoles.some((role) => latest.reviewerRole.includes(role))) {
      issue(errors, `${base}.reviewRecords`, `${type} 核准者角色不符合 docs/18 權責`, 'reviewer_role');
    }
  }
  const curriculumReviewer = (unit.reviewRecords ?? []).filter((r) => r?.reviewType === 'curriculum_alignment' && r.unitRevision === unit.revision && r.decision === 'approved').at(-1)?.reviewer;
  const otherReviewers = (unit.reviewRecords ?? []).filter((r) => ['textbook_scope_version', 'grade_scope_prerequisites'].includes(r?.reviewType) && r.unitRevision === unit.revision && r.decision === 'approved');
  if (curriculumReviewer && otherReviewers.some((r) => r.reviewer === curriculumReviewer)) {
    issue(errors, `${base}.reviewRecords`, '治理者決定兼任規則前，課綱審查者不得同時簽核教材或年級適切性', 'reviewer_conflict');
  }
  if (unit.textbookEvidence.length === 0 && !(unit.exceptions ?? []).some((e) => e.ruleId === 'textbook_evidence_not_claimed' && e.unitRevision === unit.revision)) {
    issue(errors, `${base}.exceptions`, '無教材證據的核准單元須有教材不作主張的核准例外', 'approval_gate');
  }
  if (unit.prerequisites.length === 0 && !(unit.exceptions ?? []).some((e) => e.ruleId === 'no_prerequisites_required' && e.unitRevision === unit.revision)) {
    issue(errors, `${base}.exceptions`, '空先備清單不可表示無先備；核准須有教師簽核例外', 'approval_gate');
  }
}

function validateClassroomUseRecord(record, i, registry, errors) {
  const base = `classroomUseRecords[${i}]`;
  if (!isObject(record)) return issue(errors, base, '班級使用紀錄必須為物件', 'type');
  for (const key of ['classroomUseRecordId', 'unitId', 'cohortId', 'schoolYear']) if (!nonEmpty(record[key])) issue(errors, `${base}.${key}`, '必須為非空字串', 'required');
  const unit = registry.units.find((u) => u.unitId === record.unitId);
  if (!unit) issue(errors, `${base}.unitId`, '班級紀錄引用不存在的單元', 'foreign_key');
  if (!positiveInt(record.unitRevision) || !unit || !revisionExists(unit, record.unitRevision)) issue(errors, `${base}.unitRevision`, '班級紀錄必須指向存在的精確單元 revision', 'revision_mismatch');
  else if (record.unitRevision === unit.revision ? unit.status !== 'approved' : unit.revisionHistory.find((x) => x?.revision === record.unitRevision)?.snapshot?.status !== 'approved') {
    issue(errors, `${base}.unitRevision`, '班級使用紀錄只能指向曾核准的精確單元版本', 'approval_gate');
  }
  if (!['not_assessed', 'not_ready', 'ready_for_class'].includes(record.status)) issue(errors, `${base}.status`, '班級使用狀態無效', 'enum');
  if (!Array.isArray(record.teachingRecords) || !Array.isArray(record.prerequisiteChecks)) issue(errors, base, 'teachingRecords 與 prerequisiteChecks 必須為陣列', 'type');
  if (!isObject(record.teacherConfirmation)) issue(errors, `${base}.teacherConfirmation`, '必須為物件', 'type');
  const lessons = Array.isArray(record.teachingRecords) ? record.teachingRecords : [];
  const lessonIds = lessons.map((lesson) => lesson?.lessonRecordId);
  if (!uniq(lessonIds)) issue(errors, `${base}.teachingRecords`, 'lessonRecordId 不得重複', 'duplicate');
  for (const [j, lesson] of lessons.entries()) {
    const p = `${base}.teachingRecords[${j}]`;
    if (!isObject(lesson)) { issue(errors, p, '授課紀錄必須為物件', 'type'); continue; }
    for (const key of ['lessonRecordId', 'sourceTitle', 'locator', 'teacherName', 'teacherRole']) if (!nonEmpty(lesson[key])) issue(errors, `${p}.${key}`, '授課紀錄必要欄位不可為空', 'required');
    if (!isDate(lesson.taughtAt)) issue(errors, `${p}.taughtAt`, '必須為 ISO 日期', 'format');
    if (lesson.teachingWeek !== null && !nonEmpty(lesson.teachingWeek)) issue(errors, `${p}.teachingWeek`, '必須為非空字串或 null', 'type');
    if (!Array.isArray(lesson.prerequisitesCovered) || !uniq(lesson.prerequisitesCovered)) issue(errors, `${p}.prerequisitesCovered`, '必須為不重複先備 ID 陣列', 'duplicate');
    else for (const id of lesson.prerequisitesCovered) if (!(unit?.prerequisites ?? []).some((prerequisite) => prerequisite?.prerequisiteId === id)) issue(errors, `${p}.prerequisitesCovered`, `先備引用無效：${id}`, 'foreign_key');
  }
  const requiredIds = (unit?.prerequisites ?? []).filter((p) => p.required).map((p) => p.prerequisiteId);
  const checks = Array.isArray(record.prerequisiteChecks) ? record.prerequisiteChecks : [];
  const checkIds = checks.map((check) => check?.prerequisiteId);
  if (!uniq(checkIds)) issue(errors, `${base}.prerequisiteChecks`, 'prerequisiteId 不得重複', 'duplicate');
  for (const [j, check] of checks.entries()) {
    const p = `${base}.prerequisiteChecks[${j}]`;
    if (!isObject(check)) { issue(errors, p, '先備確認必須為物件', 'type'); continue; }
    if (!requiredIds.includes(check.prerequisiteId)) issue(errors, `${p}.prerequisiteId`, '只能確認此單元列出的必要先備', 'foreign_key');
    if (!['not_assessed', 'not_taught', 'confirmed'].includes(check.status)) issue(errors, `${p}.status`, '先備確認狀態無效', 'enum');
    if (!Array.isArray(check.teachingRecordIds) || !uniq(check.teachingRecordIds)) issue(errors, `${p}.teachingRecordIds`, '必須為不重複授課紀錄 ID 陣列', 'duplicate');
    else for (const id of check.teachingRecordIds) if (!lessonIds.includes(id)) issue(errors, `${p}.teachingRecordIds`, `找不到授課紀錄 ${id}`, 'foreign_key');
    if (check.teacherNote !== null && typeof check.teacherNote !== 'string') issue(errors, `${p}.teacherNote`, '必須為字串或 null', 'type');
  }
  if (record.teacherConfirmation !== null && isObject(record.teacherConfirmation)) {
    const confirmation = record.teacherConfirmation;
    for (const key of ['teacherName', 'teacherRole', 'notes']) if (confirmation[key] !== null && typeof confirmation[key] !== 'string') issue(errors, `${base}.teacherConfirmation.${key}`, '必須為字串或 null', 'type');
    if (confirmation.confirmedAt !== null && !isDateTime(confirmation.confirmedAt)) issue(errors, `${base}.teacherConfirmation.confirmedAt`, '必須為具時區 ISO 日期時間或 null', 'format');
    if (confirmation.decision !== null && !['not_assessed', 'not_ready', 'ready_for_class'].includes(confirmation.decision)) issue(errors, `${base}.teacherConfirmation.decision`, '教師確認結論無效', 'enum');
  }
  if (record.status === 'ready_for_class') {
    if (!unit || unit.status !== 'approved' || record.unitRevision !== unit.revision) issue(errors, base, 'ready_for_class 只允許目前 approved 單元版本', 'approval_gate');
    if (!record.teachingRecords?.length) issue(errors, `${base}.teachingRecords`, 'ready_for_class 必須有實際授課紀錄', 'approval_gate');
    const checkedIds = checks.map((p) => p?.prerequisiteId);
    if (!uniq(checkedIds) || requiredIds.length !== checkedIds.length || requiredIds.some((id) => !checkedIds.includes(id))) issue(errors, `${base}.prerequisiteChecks`, '先備確認必須恰好涵蓋所有必要先備', 'approval_gate');
    for (const check of record.prerequisiteChecks ?? []) {
      if (check?.status !== 'confirmed' || !Array.isArray(check.teachingRecordIds) || check.teachingRecordIds.length === 0) issue(errors, `${base}.prerequisiteChecks`, 'ready_for_class 的先備須確認並連結授課紀錄', 'approval_gate');
    }
    const t = record.teacherConfirmation;
    if (!nonEmpty(t?.teacherName) || !nonEmpty(t?.teacherRole) || !isDateTime(t?.confirmedAt) || t?.decision !== 'ready_for_class') issue(errors, `${base}.teacherConfirmation`, 'ready_for_class 必須具名、具角色、日期及相符結論', 'approval_gate');
  }
}

export function validateRegistryBundle({ registry, idHistory, sources, curriculumMap }) {
  const errors = [];
  if (!isObject(registry) || registry.schemaVersion !== 1 || registry.registryId !== 'project-units' || !positiveInt(registry.registryRevision)) {
    issue(errors, 'registry', '單元登錄頂層 schemaVersion、registryId 或 registryRevision 無效', 'schema');
    return errors;
  }
  if (!Array.isArray(registry.units) || !Array.isArray(registry.classroomUseRecords)) issue(errors, 'registry', 'units 與 classroomUseRecords 必須為陣列', 'type');
  if (!isObject(idHistory) || idHistory.schemaVersion !== 1 || idHistory.registryId !== 'project-unit-id-history' || !positiveInt(idHistory.historyRevision) || !Array.isArray(idHistory.reservedUnitIds)) {
    issue(errors, 'idHistory', '永久 ID 歷史缺失或結構無效', 'schema');
    return errors;
  }
  const sourceIds = new Set(sources?.sources?.map((s) => s?.id).filter(nonEmpty) ?? []);
  const mapById = idsInMap(curriculumMap);
  if (!sourceIds.size) issue(errors, 'sources.sources', '來源登錄缺失或沒有有效來源 ID', 'foreign_key');
  if (!mapById.size) issue(errors, 'curriculumMap', '課綱地圖缺失或沒有有效 ID', 'foreign_key');
  for (const [id, focus] of mapById) {
    if (focus._kind === 'focus' && nonEmpty(focus.sourceId) && !sourceIds.has(focus.sourceId)) {
      issue(errors, `curriculumMap.${id}.sourceId`, `課綱地圖項目引用不存在來源 ${focus.sourceId}`, 'foreign_key');
    }
  }

  const units = Array.isArray(registry.units) ? registry.units : [];
  const unitIds = units.map((u) => u?.unitId);
  if (!uniq(unitIds)) issue(errors, 'registry.units', 'unitId 不得重複', 'duplicate');
  const histories = idHistory.reservedUnitIds;
  const historyIds = histories.map((x) => x?.unitId);
  if (!uniq(historyIds)) issue(errors, 'idHistory.reservedUnitIds', '永久 ID 歷史不得重複 unitId', 'duplicate');
  const historyById = new Map(histories.map((h) => [h?.unitId, h]));
  for (const [i, h] of histories.entries()) {
    const p = `idHistory.reservedUnitIds[${i}]`;
    if (!isObject(h) || !nonEmpty(h.unitId) || !UNIT_ID.test(h.unitId) || !isDateTime(h.firstReservedAt) || !nonEmpty(h.reason) || !UNIT_STATUSES.has(h.lastKnownStatus)) issue(errors, p, '永久 ID 項目必要欄位無效', 'required');
    if (h?.lastKnownStatus === 'retired' && !isDateTime(h.retiredAt)) issue(errors, `${p}.retiredAt`, '退休 ID 必須保留退休日期', 'required');
    if (h?.lastKnownStatus !== 'retired' && h?.retiredAt !== null) issue(errors, `${p}.retiredAt`, '非退休 ID 的 retiredAt 必須為 null', 'state');
  }

  units.forEach((unit, i) => {
    validateUnit(unit, i, mapById, errors);
    if (!unit || !nonEmpty(unit.unitId)) return;
    const history = historyById.get(unit.unitId);
    if (!history) issue(errors, `units[${i}].unitId`, '目前單元 ID 未保留於永久 ID 歷史', 'foreign_key');
    else if (history.lastKnownStatus !== unit.status) issue(errors, `units[${i}].status`, 'ID 歷史 lastKnownStatus 必須與目前登錄狀態一致', 'state');
    for (const id of unit.curriculumMapIds ?? []) {
      const m = mapById.get(id);
      if (m && m.sourceId && !sourceIds.has(m.sourceId)) issue(errors, `units[${i}].curriculumMapIds`, `課綱地圖項目引用不存在來源 ${m.sourceId}`, 'foreign_key');
    }
  });
  for (const h of histories) {
    if (!h || !UNIT_ID.test(h.unitId ?? '')) continue;
    if (!unitIds.includes(h.unitId)) issue(errors, 'idHistory.reservedUnitIds', `已保留 ID ${h.unitId} 必須保留其單元歷史紀錄（包含 retired 單元）`, 'history');
    if (h.replacementUnitId !== null && (!historyById.has(h.replacementUnitId) || h.replacementUnitId === h.unitId)) issue(errors, `idHistory.${h.unitId}.replacementUnitId`, '替代 ID 必須是另一個已保留 ID', 'foreign_key');
  }
  const useRecords = Array.isArray(registry.classroomUseRecords) ? registry.classroomUseRecords : [];
  const recordIds = useRecords.map((r) => r?.classroomUseRecordId);
  if (!uniq(recordIds)) issue(errors, 'classroomUseRecords', 'classroomUseRecordId 不得重複', 'duplicate');
  const cohortKeys = useRecords.map((r) => `${r?.unitId}|${r?.unitRevision}|${r?.cohortId}|${r?.schoolYear}`);
  if (!uniq(cohortKeys)) issue(errors, 'classroomUseRecords', '相同 cohort／學年度／單元版本不得重複且不留修訂說明', 'duplicate');
  useRecords.forEach((r, i) => validateClassroomUseRecord(r, i, registry, errors));
  return errors;
}

export function validateNewQuestionReference(question, registry) {
  const errors = [];
  if (!isObject(question)) return [{ path: 'question', code: 'type', message: '題目必須為物件' }];
  if (!positiveInt(question.revision)) issue(errors, 'question.revision', '題目自身 revision 必須為正整數', 'type');
  if (!nonEmpty(question.unitId)) issue(errors, 'question.unitId', '新題目必須記錄 unitId', 'required');
  if (!positiveInt(question.unitRevision)) issue(errors, 'question.unitRevision', '新題目必須記錄正整數 unitRevision', 'required');
  const unit = registry?.units?.find((u) => u.unitId === question.unitId);
  if (!unit) return [...errors, { path: 'question.unitId', code: 'foreign_key', message: `找不到單元 ${question.unitId}` }];
  if (!revisionExists(unit, question.unitRevision)) issue(errors, 'question.unitRevision', '引用的單元 revision 不存在或快照無效', 'revision_mismatch');
  if (question.unitRevision !== unit.revision) issue(errors, 'question.unitRevision', '新題目發布只能引用目前單元 revision；歷史題目不得自動改綁', 'stale_unit_revision');
  if (unit.status !== 'approved') issue(errors, 'question.unitId', `單元狀態 ${unit.status} 不允許新題目發布`, 'approval_gate');
  if (question.subject && question.subject !== unit.subject) issue(errors, 'question.subject', '題目領域與所引用單元不相容', 'subject_mismatch');
  return errors;
}

export function validateNewLevelReferences(level, questions, registry) {
  const errors = [];
  if (!isObject(level) || !Array.isArray(level.interactions)) return [{ path: 'level.interactions', code: 'required', message: '關卡必須有 interactions 陣列' }];
  const byQuestionKey = new Map();
  for (const [index, q] of (questions ?? []).entries()) {
    const id = q?.id ?? q?.questionId;
    if (!nonEmpty(id) || !positiveInt(q?.revision)) continue;
    const key = `${id}@${q.revision}`;
    if (byQuestionKey.has(key)) issue(errors, `questions[${index}]`, `題目集合含重複的精確版本 ${key}`, 'duplicate');
    else byQuestionKey.set(key, q);
  }
  const referencedKeys = new Set();
  for (const [i, interaction] of level.interactions.entries()) {
    if (!Array.isArray(interaction?.questionRefs)) continue;
    for (const [j, ref] of interaction.questionRefs.entries()) {
      const p = `level.interactions[${i}].questionRefs[${j}]`;
      if (!nonEmpty(ref?.questionId) || !positiveInt(ref?.revision)) {
        issue(errors, p, '題目引用必須有 questionId 與正整數 revision', 'required');
        continue;
      }
      const key = `${ref.questionId}@${ref.revision}`;
      if (referencedKeys.has(key)) issue(errors, p, `關卡不得重複引用精確題目版本 ${key}`, 'duplicate');
      referencedKeys.add(key);
      const q = byQuestionKey.get(key);
      if (!q) {
        issue(errors, p, '關卡引用的題目或精確 revision 不存在', 'foreign_key');
        continue;
      }
      if (q.publicationStatus !== 'published') issue(errors, p, '新關卡只能引用已發布題目', 'approval_gate');
      errors.push(...validateNewQuestionReference(q, registry).map((e) => ({ ...e, path: `${p}.${e.path}` })));
    }
  }
  return errors;
}

function loadJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    const errors = validateRegistryBundle({
      registry: loadJson(path.join(root, 'curriculum/unit-registry.json')),
      idHistory: loadJson(path.join(root, 'curriculum/unit-id-history.json')),
      sources: loadJson(path.join(root, 'curriculum/sources.json')),
      curriculumMap: loadJson(path.join(root, 'curriculum/curriculum-map.json')),
    });
    if (errors.length) {
      for (const error of errors) console.error(`${error.code} ${error.path}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    const registry = loadJson(path.join(root, 'curriculum/unit-registry.json'));
    const counts = Object.fromEntries([...UNIT_STATUSES].map((s) => [s, registry.units.filter((u) => u.status === s).length]));
    console.log(`Unit registry valid: ${registry.units.length} unit(s); status counts ${JSON.stringify(counts)}; ${registry.classroomUseRecords.length} classroom-use record(s).`);
    console.log('No question or level publication workflow is integrated by this standalone validation.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
