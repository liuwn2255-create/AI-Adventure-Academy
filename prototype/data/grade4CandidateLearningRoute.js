import { CATALOG_CANDIDATE_TASKS } from './catalogCandidateTasks.js';

const ACTIVITY_ORDER = Object.freeze([
  'ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE',
  'ACT-G4-CHINESE-PARAGRAPH-ARCHITECT-CANDIDATE',
  'ACT-G4-ENGLISH-LOST-AND-FOUND-CANDIDATE',
  'ACT-G4-MATH-FRACTION-TILES-CANDIDATE',
  'ACT-G4-ARTS-VISUAL-COMPOSITION-CANDIDATE',
  'ACT-G4-SOCIAL-LOCAL-HISTORY-TIMELINE-CANDIDATE',
  'ACT-G4-HPE-COURT-SAFETY-CANDIDATE',
  'ACT-G4-INTEGRATIVE-STUDY-METHOD-CANDIDATE',
]);
const EXPERIENCE_RATIONALE = Object.freeze([
  '由直接觀察資料分類開始，先練習辨認與整理線索。',
  '整理文本事件順序，並以一句話概括內容。',
  '在日常情境中組合語句，再依對話線索回應。',
  '操作分數拼片表徵，接著比較同分母分數。',
  '組合視覺元素並完成平面構成。',
  '整理時間資料並選取支持描述的來源證據。',
  '把安全判斷原則用到另一個模擬情境。',
  '最後規劃行動步驟並轉用到新學習任務。',
]);

const taskById = new Map(CATALOG_CANDIDATE_TASKS.map((task) => [task.activityId, task]));

/**
 * A project-designed candidate experience route. Its order is not an official
 * grade/semester sequence, prerequisite assertion, or unlock rule.
 */
export const GRADE4_CANDIDATE_LEARNING_ROUTE = Object.freeze({
  routeId: 'ROUTE-G4-CROSS-SUBJECT-CANDIDATE-01',
  gradeId: 'grade-4',
  title: '四年級探險學習路線',
  status: 'candidate_pending_teacher_review',
  sequenceType: 'project_suggested_experience_order_not_official_grade_or_semester_sequence',
  unlockPolicy: 'all_stops_independently_selectable_no_formal_unlock_changes',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
  sequenceNote: '專案依任務操作與推理形式，安排從觀察／整理、語意組織與組合，逐步走向證據判斷、情境轉用及規劃的體驗順序。這不是各科知識難度或官方教學進度的判定；每站可自行選擇或重玩，未設前置鎖定。',
  evidenceNote: '完成只表示本次候選任務流程完成，不代表精熟、教學成效或教師核准。各活動的課綱參照及範圍以原活動資料為準。',
  omittedCatalogEntries: Object.freeze([
    Object.freeze({ subjectId: 'national-and-new-resident-languages', status: 'choice_or_school_offering', reason: '選修／校本開設項目；目前未取得可安全使用的語種教材與語料，暫不製作猜測性內容。' }),
    Object.freeze({ subjectId: 'living-curriculum', status: 'not_separately_listed_for_phase', reason: '總綱架構未將生活課程另列為四年級第二學習階段科目。' }),
    Object.freeze({ subjectId: 'technology', status: 'not_separately_listed_for_phase', reason: '總綱架構未將科技領域另列為四年級第二學習階段科目。' }),
  ]),
  stops: Object.freeze(ACTIVITY_ORDER.map((activityId, index) => {
    const task = taskById.get(activityId);
    if (!task) throw new Error(`Grade 4 route references missing activity: ${activityId}`);
    return Object.freeze({
      stopId: `ROUTE-G4-STOP-${String(index + 1).padStart(2, '0')}`,
      order: index + 1,
      activityId,
      subjectId: task.subjectId,
      title: task.title,
      curriculumMapId: task.curriculumMapId,
      curriculumSourceRef: `curriculum/curriculum-map.json#${task.curriculumMapId}`,
      officialSourceVerification: 'referenced_from_existing_curriculum_map_record_check_state_in_source_record',
      curriculumCodes: task.curriculumCodes,
      learningObjective: task.learningObjective.statement,
      curriculumScope: task.curriculumScope,
      taskStatus: task.status,
      interactionTypes: Object.freeze([...new Set(task.stages.map(({ interaction }) => interaction))]),
      stageCount: task.stages.length,
      routeRationale: EXPERIENCE_RATIONALE[index],
    });
  })),
});

export function validateGrade4CandidateLearningRoute(route = GRADE4_CANDIDATE_LEARNING_ROUTE) {
  const errors = [];
  if (route.gradeId !== 'grade-4') errors.push('route_grade_must_be_grade_4');
  if (route.status !== 'candidate_pending_teacher_review') errors.push('route_must_remain_candidate');
  if (route.sequenceType !== 'project_suggested_experience_order_not_official_grade_or_semester_sequence') errors.push('route_sequence_must_not_claim_official_order');
  if (route.unlockPolicy !== 'all_stops_independently_selectable_no_formal_unlock_changes') errors.push('route_must_not_change_unlocks');
  if (route.progressPersistence !== 'memory_only_no_student_records_no_localStorage') errors.push('route_progress_must_be_memory_only');
  if (new Set(route.stops.map(({ activityId }) => activityId)).size !== route.stops.length) errors.push('duplicate_route_activity');
  for (const [index, stop] of route.stops.entries()) {
    const task = taskById.get(stop.activityId);
    if (!task) { errors.push(`missing_activity:${stop.activityId}`); continue; }
    if (stop.order !== index + 1 || stop.stopId !== `ROUTE-G4-STOP-${String(index + 1).padStart(2, '0')}`) errors.push(`invalid_stop_order:${stop.activityId}`);
    if (task.gradeId !== route.gradeId || task.subjectId !== stop.subjectId) errors.push(`invalid_grade_or_subject:${stop.activityId}`);
    if (task.status !== 'candidate_pending_teacher_review') errors.push(`activity_not_candidate:${stop.activityId}`);
    if (!task.learningObjective?.statement || !task.curriculumMapId || !stop.curriculumSourceRef || !task.curriculumCodes?.length || !task.curriculumScope) errors.push(`missing_learning_or_scope_metadata:${stop.activityId}`);
    if (task.evidencePolicy?.persistence !== 'memory_only_no_student_records_no_localStorage') errors.push(`unsafe_activity_persistence:${stop.activityId}`);
    if (!task.stages?.length || task.stages.some(({ hints }) => !Array.isArray(hints) || hints.length < 2)) errors.push(`missing_playable_stage_or_hints:${stop.activityId}`);
  }
  return errors;
}
