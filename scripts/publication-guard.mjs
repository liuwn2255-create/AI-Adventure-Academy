import {
  validateRegistryBundle,
  validateNewQuestionReference,
  validateNewLevelReferences,
} from './unit-registry-validator.mjs';

const SUBJECTS = new Set(['mathematics', 'chinese_language', 'natural_science', 'thinking']);
const REVIEW_KEYS = ['curriculum', 'gradeLevelFit', 'answer', 'explanation'];
const REVIEW_STATUSES = new Set(['pending_review', 'returned', 'approved']);
const PUBLICATION_STATUSES = new Set(['draft', 'pending_review', 'returned', 'approved', 'published', 'void']);
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const positiveInt = (value) => Number.isInteger(value) && value > 0;
const unique = (items) => new Set(items).size === items.length;
const isReviewDate = (value) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const isDateTime = (value) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && !Number.isNaN(Date.parse(value));

function issue(path, code, message) {
  return { path, code, message };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.hostname.endsWith('.invalid');
  } catch {
    return false;
  }
}

function validateQuestionPublicationData(question, registryBundle, expectedStatus, { validateUnitReference = true } = {}) {
  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    return [issue('question', 'type', '題目必須為物件')];
  }
  const errors = [];
  const requiredStrings = ['id', 'unitId', 'prompt', 'explanation'];
  for (const key of requiredStrings) if (!nonEmpty(question[key])) errors.push(issue(key, 'required', `${key} 必須為非空字串`));
  if (question.schemaVersion !== 2) errors.push(issue('schemaVersion', 'schema', '發布只支援題目 schemaVersion 2'));
  if (!positiveInt(question.revision)) errors.push(issue('revision', 'type', '題目 revision 必須為正整數'));
  if (!positiveInt(question.unitRevision)) errors.push(issue('unitRevision', 'type', 'unitRevision 必須為正整數'));
  if (!SUBJECTS.has(question.subject)) errors.push(issue('subject', 'enum', 'subject 不在題目規格允許清單'));
  if (!positiveInt(question.grade)) errors.push(issue('grade', 'type', 'grade 必須為正整數'));

  const interaction = question.interaction;
  if (!interaction || typeof interaction !== 'object' || Array.isArray(interaction)) {
    errors.push(issue('interaction', 'required', 'interaction 必須為物件'));
  } else {
    if (interaction.type !== 'single_choice') errors.push(issue('interaction.type', 'enum', '目前題目規格只支援 single_choice'));
    if (!Array.isArray(interaction.options) || interaction.options.length < 2) {
      errors.push(issue('interaction.options', 'required', '單選題至少需要兩個選項'));
    } else {
      const optionIds = [];
      interaction.options.forEach((option, index) => {
        const path = `interaction.options[${index}]`;
        if (!option || typeof option !== 'object' || Array.isArray(option)) {
          errors.push(issue(path, 'type', '選項必須為物件'));
          return;
        }
        if (!nonEmpty(option.optionId)) errors.push(issue(`${path}.optionId`, 'required', 'optionId 必須為非空字串'));
        else optionIds.push(option.optionId);
        if (!nonEmpty(option.text)) errors.push(issue(`${path}.text`, 'required', '選項 text 必須為非空字串'));
      });
      if (!unique(optionIds)) errors.push(issue('interaction.options', 'duplicate', 'optionId 不得重複'));
      if (!nonEmpty(interaction.answerId) || optionIds.filter((id) => id === interaction.answerId).length !== 1) {
        errors.push(issue('interaction.answerId', 'foreign_key', 'answerId 必須精確指向同題一個有效 optionId'));
      }
    }
  }

  if (!Array.isArray(question.prerequisites)) errors.push(issue('prerequisites', 'type', 'prerequisites 必須為陣列'));
  else {
    const ids = [];
    question.prerequisites.forEach((item, index) => {
      const path = `prerequisites[${index}]`;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(issue(path, 'type', '先備項目必須為物件'));
        return;
      }
      if (!nonEmpty(item.prerequisiteId)) errors.push(issue(`${path}.prerequisiteId`, 'required', 'prerequisiteId 必須為非空字串'));
      else ids.push(item.prerequisiteId);
      if (!nonEmpty(item.description)) errors.push(issue(`${path}.description`, 'required', '先備 description 必須為非空字串'));
      if (typeof item.required !== 'boolean') errors.push(issue(`${path}.required`, 'type', '先備 required 必須為布林值'));
    });
    if (!unique(ids)) errors.push(issue('prerequisites', 'duplicate', 'prerequisiteId 不得重複'));
  }

  const sources = registryBundle?.sources?.sources;
  const sourceIds = new Set(Array.isArray(sources) ? sources.map((source) => source?.id) : []);
  if (!Array.isArray(question.curriculumMappings) || question.curriculumMappings.length === 0) {
    errors.push(issue('curriculumMappings', 'required', '發布題目至少需要一筆課綱來源 mapping'));
  } else {
    question.curriculumMappings.forEach((mapping, index) => {
      const path = `curriculumMappings[${index}]`;
      if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
        errors.push(issue(path, 'type', '課綱 mapping 必須為物件'));
        return;
      }
      if (!nonEmpty(mapping.sourceId) || !sourceIds.has(mapping.sourceId)) errors.push(issue(`${path}.sourceId`, 'foreign_key', 'sourceId 必須引用已登錄來源'));
      if (!isHttpUrl(mapping.sourceUrl)) errors.push(issue(`${path}.sourceUrl`, 'format', 'sourceUrl 必須是有效 HTTP(S) 官方來源網址'));
      for (const key of ['documentTitle', 'publicationInfo']) {
        if (!nonEmpty(mapping[key])) errors.push(issue(`${path}.${key}`, 'required', `${key} 必須為非空字串`));
      }
      if (mapping.verificationStatus !== 'verified') errors.push(issue(`${path}.verificationStatus`, 'approval_gate', '發布依據的課綱 mapping 必須已核實'));
      if (!nonEmpty(mapping.verifiedBy)) errors.push(issue(`${path}.verifiedBy`, 'required', '已核實 mapping 必須記錄核對者'));
      if (!isReviewDate(mapping.verifiedAt)) errors.push(issue(`${path}.verifiedAt`, 'format', 'verifiedAt 必須為 ISO 日期'));
      if (!Array.isArray(mapping.locations) || mapping.locations.length === 0) {
        errors.push(issue(`${path}.locations`, 'required', '已核實 mapping 必須有條文位置'));
      } else {
        mapping.locations.forEach((location, locationIndex) => {
          const locationPath = `${path}.locations[${locationIndex}]`;
          if (!location || typeof location !== 'object' || Array.isArray(location)) {
            errors.push(issue(locationPath, 'type', '條文位置必須為物件'));
            return;
          }
          for (const key of ['kind', 'code', 'pageOrSection', 'gradeScope']) {
            if (!nonEmpty(location[key])) errors.push(issue(`${locationPath}.${key}`, 'required', `${key} 必須為非空字串`));
          }
        });
      }
    });
  }

  if (!Array.isArray(question.textbookEvidence)) errors.push(issue('textbookEvidence', 'type', 'textbookEvidence 必須為陣列'));
  else {
    const evidenceIds = [];
    question.textbookEvidence.forEach((evidence, index) => {
      const path = `textbookEvidence[${index}]`;
      if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
        errors.push(issue(path, 'type', '教材證據必須為物件'));
        return;
      }
      for (const key of ['evidenceId', 'publisher', 'academicYear', 'edition', 'volume', 'unitTitle', 'locator']) {
        if (!nonEmpty(evidence[key])) errors.push(issue(`${path}.${key}`, 'required', `${key} 必須為非空字串`));
      }
      if (!['textbook', 'teacher_guide'].includes(evidence.evidenceType)) errors.push(issue(`${path}.evidenceType`, 'enum', 'evidenceType 不符合題目規格'));
      if (nonEmpty(evidence.evidenceId)) evidenceIds.push(evidence.evidenceId);
    });
    if (!unique(evidenceIds)) errors.push(issue('textbookEvidence', 'duplicate', 'evidenceId 不得重複'));
  }

  if (!question.review || typeof question.review !== 'object' || Array.isArray(question.review)) {
    errors.push(issue('review', 'required', 'review 必須包含四項審查'));
  } else {
    for (const key of REVIEW_KEYS) {
      const review = question.review[key];
      const path = `review.${key}`;
      if (!review || typeof review !== 'object' || Array.isArray(review)) {
        errors.push(issue(path, 'required', `${key} 審查紀錄必填`));
        continue;
      }
      if (!REVIEW_STATUSES.has(review.status)) errors.push(issue(`${path}.status`, 'enum', '審查狀態無效'));
      if (review.status !== 'approved') errors.push(issue(`${path}.status`, 'approval_gate', '四項題目審查均須核准才能發布'));
      if (!nonEmpty(review.reviewer)) errors.push(issue(`${path}.reviewer`, 'required', '核准審查須記錄審查者'));
      if (!nonEmpty(review.reviewerRole)) errors.push(issue(`${path}.reviewerRole`, 'required', '核准審查須記錄審查者角色'));
      if (!isReviewDate(review.reviewDate)) errors.push(issue(`${path}.reviewDate`, 'format', 'reviewDate 必須為 ISO 日期'));
      if (review.revision !== question.revision) errors.push(issue(`${path}.revision`, 'revision_mismatch', '審查必須鎖定題目 revision'));
      if (review.unitRevision !== question.unitRevision) errors.push(issue(`${path}.unitRevision`, 'revision_mismatch', '審查必須鎖定題目 unitRevision'));
    }
    if (Array.isArray(question.textbookEvidence) && question.textbookEvidence.length === 0
      && !REVIEW_KEYS.some((key) => nonEmpty(question.review[key]?.notes))) {
      errors.push(issue('textbookEvidence', 'required', '教材證據為空時，須在審查意見說明未提供教材／教學材料的原因或主張範圍'));
    }
  }

  if (!PUBLICATION_STATUSES.has(question.publicationStatus)) errors.push(issue('publicationStatus', 'enum', 'publicationStatus 無效'));
  if (question.publicationStatus !== expectedStatus) errors.push(issue('publicationStatus', 'approval_gate', `此檢查要求題目狀態為 ${expectedStatus}`));
  const record = question.publicationRecord;
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    errors.push(issue('publicationRecord', 'required', 'publicationRecord 必須為物件'));
  } else {
    if (!nonEmpty(record.publisher)) errors.push(issue('publicationRecord.publisher', 'required', '發布紀錄必須有發布者'));
    if (!isDateTime(record.publishedAt)) errors.push(issue('publicationRecord.publishedAt', 'format', 'publishedAt 必須是含時區的 ISO 日期時間'));
    if (record.revision !== question.revision) errors.push(issue('publicationRecord.revision', 'revision_mismatch', '發布紀錄 revision 必須等於題目 revision'));
    const reviewers = REVIEW_KEYS.map((key) => question.review?.[key]?.reviewer).filter(nonEmpty);
    if (nonEmpty(record.publisher) && reviewers.includes(record.publisher)) errors.push(issue('publicationRecord.publisher', 'reviewer_conflict', '發布者不得是此題目的內容審查者'));
  }

  if (validateUnitReference) errors.push(...validateNewQuestionReference(question, registryBundle?.registry));
  return errors;
}

function registryErrors(registryBundle) {
  if (!registryBundle || typeof registryBundle !== 'object') {
    return [{ path: 'registryBundle', code: 'registry_required', message: '發布檢查需要完整單元登錄、ID 歷史、來源及課程地圖資料。' }];
  }
  return validateRegistryBundle(registryBundle).map((error) => ({ ...error, path: `registry.${error.path}` }));
}

/**
 * Shared fail-closed preflight for a new question publication.
 * It returns structured errors and never mutates the question or registry.
 * The caller must refuse publication when errors is non-empty.
 */
export function validateQuestionPublication({ question, registryBundle }) {
  return [
    ...registryErrors(registryBundle),
    ...validateQuestionPublicationData(question, registryBundle, 'approved').map((error) => ({
      ...error,
      path: `question.${error.path}`,
    })),
  ];
}

/**
 * Shared fail-closed preflight for a new level publication.
 * Level references must resolve to published exact question revisions, and
 * each referenced question must point to the currently approved unit revision.
 * The caller must refuse publication when errors is non-empty.
 */
export function validateLevelPublication({ level, questions, registryBundle }) {
  const errors = [
    ...registryErrors(registryBundle),
    ...validateNewLevelReferences(level, questions, registryBundle?.registry).map((error) => ({
      ...error,
      path: `level.${error.path}`,
    })),
  ];
  if (!level || !Array.isArray(level.interactions)) return errors;

  const questionByKey = new Map();
  for (const question of questions ?? []) {
    const id = question?.id ?? question?.questionId;
    if (nonEmpty(id) && positiveInt(question?.revision)) {
      const key = `${id}@${question.revision}`;
      if (!questionByKey.has(key)) questionByKey.set(key, question);
    }
  }
  for (const [interactionIndex, interaction] of level.interactions.entries()) {
    if (!Array.isArray(interaction?.questionRefs)) continue;
    for (const [referenceIndex, reference] of interaction.questionRefs.entries()) {
      if (!nonEmpty(reference?.questionId) || !positiveInt(reference?.revision)) continue;
      const key = `${reference.questionId}@${reference.revision}`;
      const question = questionByKey.get(key);
      if (!question) continue;
      errors.push(...validateQuestionPublicationData(question, registryBundle, 'published', { validateUnitReference: false }).map((error) => ({
        ...error,
        path: `level.interactions[${interactionIndex}].questionRefs[${referenceIndex}].${error.path}`,
      })));
    }
  }
  return errors;
}
