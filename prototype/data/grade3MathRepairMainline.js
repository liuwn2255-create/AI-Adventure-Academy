import { CATALOG_CANDIDATE_TASK_BY_ID } from './catalogCandidateTasks.js';

const MAINLINE_STOPS = Object.freeze([
  ['ACT-G3-MATH-PLACE-VALUE-EXCHANGE-CANDIDATE', '重啟位值塔', '讀懂千、百、十、個位的數量，交換位值積木並核對同一個數的不同表示。', '先修復數字電源，讓後續計算有穩定的數量表徵。'],
  ['ACT-G3-MATH-VERTICAL-REGROUPING-CANDIDATE', '修好進退位橋', '逐欄操作加減直式的進位或退位，檢查中間步驟。', '由位值表徵轉到位值運算，逐欄確認數量如何交換。'],
  ['ACT-G3-MATH-MULTIPLICATION-ARRAY-CANDIDATE', '啟動乘法種子陣列', '用等列等行的陣列組合表示乘法數量。', '將位值計算延伸到等組與陣列表徵。'],
  ['ACT-G3-MATH-DIVISION-SHARING-CANDIDATE', '修復公平分配港', '操作等量分組並檢查每組數量與總數關係。', '先建立平均分配的操作經驗，再進入兩步驟補給任務。'],
  ['ACT-G3-MATH-ESTIMATION-ADVENTURE-CANDIDATE', '校準估算雷達', '調整估計範圍並比較估計與計算結果。', '在精算之外練習判斷數量是否合理；估計不是精確測量。'],
  ['ACT-G3-MATH-FRACTION-MODEL-EXPLORATION-CANDIDATE', '拼回分數水閘', '操作等分拼片，建立、比較及合併同分母分數模型。', '以整體與部分的模型補足數字島修復所需的數量表徵。'],
  ['ACT-G3-MATH-DECIMAL-NUMBER-LINE-CANDIDATE', '校正十分位航標', '在數線上定位十分位小數並比較位置。', '把分數單位表徵延伸到十分位數線；不宣稱涵蓋其他小數位。'],
  ['ACT-G3-MATH-LENGTH-MEASUREMENT-ADVENTURE-CANDIDATE', '搭建測量索橋', '操作數位尺的零點、刻度與長度比較。', '把數量判斷應用到長度模型；螢幕操作不能取代實物測量。'],
  ['ACT-G3-MATH-CROSS-TABLE-BUILDER-CANDIDATE', '整理村落補給紀錄', '將模擬調查卡依兩項線索分類並建立交叉表。', '使用資料整理決定補給去向；資料是模擬紀錄，不是真實調查。'],
  ['ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE', '啟動數字島核心（綜合任務）', '先計算新增補給總數，再使用前一步結果進行平均分裝。', '綜合前面建立的位值／加法與平均分配概念。此活動只含一種加法後除法情境，不代表所有兩步驟題型。'],
]);

const taskById = CATALOG_CANDIDATE_TASK_BY_ID;

/** Candidate experience order only; not an official grade/semester sequence or unlock rule. */
export const GRADE3_MATH_REPAIR_MAINLINE = Object.freeze({
  routeId: 'ROUTE-G3-MATH-NUMBER-ISLAND-REPAIR-CANDIDATE-01',
  gradeId: 'grade-3',
  subjectId: 'mathematics',
  title: '數字島修復任務：三年級數學候選主線',
  status: 'candidate_pending_teacher_review',
  sequenceType: 'project_suggested_experience_order_not_official_grade_or_semester_sequence',
  unlockPolicy: 'candidate_route_sequence_only_no_formal_unlock_changes',
  progressPersistence: 'memory_only_no_student_records_no_localStorage',
  sequenceNote: '依候選任務的操作先備與故事情境安排體驗順序，不代表官方年級／學期進度；不寫入正式解鎖。地圖仍保留各站獨立入口。',
  evidenceNote: '每站沿用原活動與其課綱範圍。完成只代表本次候選流程完成，不代表精熟、教學成效或教師核准。',
  finaleScope: '最後以既有兩步驟補給任務串聯加法總數與平均分配；其涵蓋範圍有限，其他領域關卡仍可由地圖獨立探索。',
  stops: Object.freeze(MAINLINE_STOPS.map(([activityId, missionTitle, missionGoal, routeRationale], index) => {
    const task = taskById.get(activityId);
    if (!task) throw new Error(`Grade 3 mainline references missing catalog activity: ${activityId}`);
    return Object.freeze({
      stopId: `ROUTE-G3-MATH-STOP-${String(index + 1).padStart(2, '0')}`,
      order: index + 1,
      activityId,
      title: task.title,
      missionTitle,
      missionGoal,
      routeRationale,
      curriculumCodes: task.curriculumCodes,
      curriculumMapId: task.curriculumMapId,
      taskStatus: task.status,
      storyAfterCompletion: index === MAINLINE_STOPS.length - 1
        ? '數字島核心重新亮起，補給依序完成計算與平均分裝。這是本次候選主線的故事結尾，不是數學精熟證明。'
        : `修復進度 ${index + 1}/${MAINLINE_STOPS.length}：${missionTitle}的設施已恢復。新的線索指向「${MAINLINE_STOPS[index + 1][1]}」。`,
    });
  })),
});

export function validateGrade3MathRepairMainline(route = GRADE3_MATH_REPAIR_MAINLINE) {
  const errors = [];
  if (route.gradeId !== 'grade-3' || route.subjectId !== 'mathematics') errors.push('route_must_be_grade3_math');
  if (route.status !== 'candidate_pending_teacher_review') errors.push('route_must_remain_candidate_pending_review');
  if (route.sequenceType !== 'project_suggested_experience_order_not_official_grade_or_semester_sequence') errors.push('route_order_must_not_claim_official_schedule');
  if (route.unlockPolicy !== 'candidate_route_sequence_only_no_formal_unlock_changes') errors.push('route_must_not_change_formal_unlocks');
  if (route.progressPersistence !== 'memory_only_no_student_records_no_localStorage') errors.push('route_progress_must_be_memory_only');
  if (new Set(route.stops.map(({ activityId }) => activityId)).size !== route.stops.length) errors.push('duplicate_mainline_activity');
  for (const [index, stop] of route.stops.entries()) {
    const task = taskById.get(stop.activityId);
    if (!task) { errors.push(`missing_activity:${stop.activityId}`); continue; }
    if (stop.order !== index + 1 || stop.stopId !== `ROUTE-G3-MATH-STOP-${String(index + 1).padStart(2, '0')}`) errors.push(`invalid_stop_order:${stop.activityId}`);
    if (task.gradeId !== 'grade-3' || task.subjectId !== 'mathematics') errors.push(`wrong_grade_or_subject:${stop.activityId}`);
    if (task.status !== 'candidate_pending_teacher_review') errors.push(`activity_not_candidate:${stop.activityId}`);
    if (!stop.missionGoal || !stop.routeRationale || !task.curriculumMapId || !task.curriculumCodes?.length || !task.learningObjective?.statement || !task.stages?.length) errors.push(`missing_goal_or_task_evidence:${stop.activityId}`);
    if (task.evidencePolicy?.persistence !== 'memory_only_no_student_records_no_localStorage') errors.push(`unsafe_task_persistence:${stop.activityId}`);
  }
  if (route.stops.at(-1)?.activityId !== 'ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE') errors.push('integrated_finale_must_reuse_two_step_supply');
  return errors;
}
