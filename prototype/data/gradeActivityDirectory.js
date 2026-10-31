import { CATALOG_CANDIDATE_TASKS } from './catalogCandidateTasks.js';

// These six grade-three activities have dedicated screens and launch handlers
// in app.js. They are registered in gradeCatalog but intentionally do not use
// the generic catalog-task renderer.
export const DEDICATED_GRADE_ACTIVITY_IDS = Object.freeze([
  'ACT-G3-CHINESE-READING-GARDEN-CANDIDATE',
  'ACT-G3-ENGLISH-CLASSROOM-CONVERSATION-CANDIDATE',
  'ACT-G3-MATH-DATA-TABLE-WORKSHOP-CANDIDATE',
  'ACT-G3-SOCIAL-NEIGHBORHOOD-CHANGE-CANDIDATE',
  'ACT-G3-SCIENCE-ANIMAL-FORM-OBSERVATION-CANDIDATE',
  'ACT-G3-ARTS-RHYTHM-WORKSHOP-CANDIDATE',
]);

const dedicatedIds = new Set(DEDICATED_GRADE_ACTIVITY_IDS);

/** Returns only activities that have a real UI launch handler. */
export function getSubjectLaunchableActivities(grade, subject) {
  if (!grade || !subject) return [];
  const byId = new Map();
  for (const task of CATALOG_CANDIDATE_TASKS) {
    if (task.gradeId === grade.gradeId && task.subjectId === subject.subjectId) byId.set(task.activityId, task);
  }
  for (const entry of subject.existingYearLevelContent ?? []) {
    if (dedicatedIds.has(entry.activityId) && entry.entryRoute?.directLaunch === true) byId.set(entry.activityId, entry);
  }
  return [...byId.values()];
}

export function getSubjectDirectorySummary(grade, subject) {
  const activities = getSubjectLaunchableActivities(grade, subject);
  const launchableIds = new Set(activities.map(({ activityId }) => activityId));
  const references = (subject?.existingYearLevelContent ?? []).filter((entry) => (entry.levelId || entry.activityId) && !launchableIds.has(entry.activityId));
  return Object.freeze({
    activityCount: activities.length,
    candidatePendingTeacherReviewCount: activities.filter(({ status }) => status === 'candidate_pending_teacher_review').length,
    legacyPlayableReferenceCount: references.filter(({ runtimeAvailability }) => runtimeAvailability === 'playable_prototype').length,
    gatedReferenceCount: references.filter(({ runtimeAvailability }) => runtimeAvailability === 'gated_prototype').length,
    underDevelopmentReferenceCount: references.filter(({ runtimeAvailability }) => ['under_development', 'catalog_candidate'].includes(runtimeAvailability)).length,
    directoryOnlyReferenceCount: references.filter(({ runtimeAvailability }) => runtimeAvailability === 'catalog_only').length,
    activities,
  });
}

export function getGradeAdventureSummary(grade) {
  const subjects = (grade?.subjects ?? []).map((subject) => ({ subjectId: subject.subjectId, name: subject.name, ...getSubjectDirectorySummary(grade, subject) }));
  const activityIds = subjects.flatMap(({ activities }) => activities.map(({ activityId }) => activityId));
  return Object.freeze({
    gradeId: grade?.gradeId ?? null,
    activityCount: new Set(activityIds).size,
    subjectCount: subjects.filter(({ activities }) => activities.length > 0).length,
    candidatePendingTeacherReviewCount: subjects.flatMap(({ activities }) => activities).filter(({ status }) => status === 'candidate_pending_teacher_review').length,
    subjects: Object.freeze(subjects.map((subject) => Object.freeze({ ...subject, activityCount: subject.activities.length }))),
  });
}
