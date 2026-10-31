import { CATALOG_CANDIDATE_TASKS } from './catalogCandidateTasks.js';
import { MATH_DATA_TABLE_WORKSHOP } from './mathDataTableWorkshop.js';

export const GRADE3_MATH_ADVENTURE_REGIONS = Object.freeze([
  Object.freeze({ id: 'number-operations', title: '數字與運算島', icon: '🔢', description: '位值、加減、乘除、估算與多步驟問題。', matches: (codes) => codes.some((code) => /^N-3-(?:[1-8]|11)$/.test(code) || code === 'R-3-1') }),
  Object.freeze({ id: 'fractions-decimals', title: '分數與小數森林', icon: '🍰', description: '分數模型與小數數線上的數量概念。', matches: (codes) => codes.some((code) => /^N-3-(?:9|10)$/.test(code)) }),
  Object.freeze({ id: 'geometry', title: '幾何建造谷', icon: '📐', description: '角、圖形、圓、規律、拼組與展開圖。', matches: (codes) => codes.some((code) => /^S-3-/.test(code) || code === 'R-3-2') }),
  Object.freeze({ id: 'measurement', title: '測量探索港', icon: '⚖️', description: '長度、面積、容量與重量的數位模型操作。', matches: (codes) => codes.some((code) => /^N-3-(?:12|14|15|16)$/.test(code)) }),
  Object.freeze({ id: 'time', title: '時間任務站', icon: '⏰', description: '鐘面、時刻配對與經過時間。', matches: (codes) => codes.includes('N-3-17') }),
  Object.freeze({ id: 'data-reasoning', title: '資料推理村', icon: '📊', description: '資料分類、表格建造、報讀與推理。', matches: (codes) => codes.some((code) => /^D-3-/.test(code)) }),
]);

export const GRADE3_MATH_LEGACY_ENTRY_REFERENCES = Object.freeze([
  Object.freeze({ activityId: 'ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET', title: '數字與位值：既有數字島原型', status: 'existing_playable_prototype_pending_teacher_review', entry: 'legacy-number-island' }),
  Object.freeze({ activityId: 'learning-unit:chapter-scope-m3-math-number-place-value', title: '數的位值候選學習單元', status: 'candidate_pending_teacher_review', entry: 'legacy-number-directory' }),
]);

export function buildGrade3MathAdventureMap(activities = CATALOG_CANDIDATE_TASKS) {
  const registeredCatalog = activities.filter((activity) => activity.gradeId === 'grade-3' && activity.subjectId === 'mathematics');
  const registered = [
    ...registeredCatalog,
    ...(registeredCatalog.some(({ activityId }) => activityId === MATH_DATA_TABLE_WORKSHOP.activityId)
      ? []
      : [{ ...MATH_DATA_TABLE_WORKSHOP, adventureEntryKind: 'dedicated_math_data' }]),
  ];
  const assigned = new Map(GRADE3_MATH_ADVENTURE_REGIONS.map((region) => [region.id, []]));
  const unassigned = [];
  for (const activity of registered) {
    const codes = activity.curriculumCodes ?? [];
    const region = GRADE3_MATH_ADVENTURE_REGIONS.find(({ matches }) => matches(codes));
    if (!region) unassigned.push(activity.activityId);
    else assigned.get(region.id).push(activity);
  }
  return Object.freeze({
    gradeId: 'grade-3',
    subjectId: 'mathematics',
    registeredActivityCount: registered.length,
    catalogActivityCount: registeredCatalog.length,
    unassignedActivityIds: Object.freeze(unassigned),
    regions: Object.freeze(GRADE3_MATH_ADVENTURE_REGIONS.map((region) => Object.freeze({
      id: region.id,
      title: region.title,
      icon: region.icon,
      description: region.description,
      activities: Object.freeze(assigned.get(region.id)),
      activityCount: assigned.get(region.id).length,
    }))),
  });
}

export const GRADE3_MATH_ADVENTURE_MAP = buildGrade3MathAdventureMap();
