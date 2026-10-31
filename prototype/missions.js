export const MISSION_EVENTS = Object.freeze({
  ENTER_NUMBER_ISLAND: 'enter_number_island',
  COMPLETE_PLACE_VALUE: 'complete_place_value',
  EARN_STAR: 'earn_star',
  FIND_NUMBER_OBELISK: 'find_number_obelisk',
  COMPLETE_NUMBER_SECRET: 'complete_number_secret',
});

export const MISSION_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'task-enter-number-island',
    title: '登上數字島',
    description: '第一次進入數字島的示範關卡。',
    event: MISSION_EVENTS.ENTER_NUMBER_ISLAND,
    rewardBadges: 1,
  }),
  Object.freeze({
    id: 'task-finish-place-value',
    title: '完成位值探險',
    description: '完成一次「數字與位值」五題關卡。',
    event: MISSION_EVENTS.COMPLETE_PLACE_VALUE,
    rewardBadges: 1,
  }),
  Object.freeze({
    id: 'task-earn-first-star',
    title: '找到第一顆星',
    description: '在數字與位值關卡答對至少一題。',
    event: MISSION_EVENTS.EARN_STAR,
    rewardBadges: 1,
  }),
  Object.freeze({
    id: 'task-find-number-obelisk',
    title: '找到數字石碑',
    description: '走到石碑旁並按下互動，讀一讀上面的數字線索。',
    event: MISSION_EVENTS.FIND_NUMBER_OBELISK,
    rewardBadges: 1,
  }),
  Object.freeze({
    id: 'task-complete-number-secret',
    title: '解開千位數的秘密',
    description: '找到石碑並完成三題示範挑戰，打開島上的寶箱。',
    event: MISSION_EVENTS.COMPLETE_NUMBER_SECRET,
    rewardBadges: 1,
  }),
]);

const validMissionIds = new Set(MISSION_DEFINITIONS.map((mission) => mission.id));

export function sanitizeCompletedMissionIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => validMissionIds.has(id)))];
}

export function awardMissionsForEvent(completedMissionIds, event, evidence = {}) {
  const completed = sanitizeCompletedMissionIds(completedMissionIds);
  const completedSet = new Set(completed);
  const conditionMet = event === MISSION_EVENTS.ENTER_NUMBER_ISLAND
    ? evidence.entered === true
    : event === MISSION_EVENTS.COMPLETE_PLACE_VALUE
      ? evidence.levelComplete === true
      : event === MISSION_EVENTS.EARN_STAR
        ? Number.isInteger(evidence.starsEarned) && evidence.starsEarned >= 1
        : event === MISSION_EVENTS.FIND_NUMBER_OBELISK
          ? evidence.objectId === 'number-obelisk' && evidence.nearby === true
          : event === MISSION_EVENTS.COMPLETE_NUMBER_SECRET
            ? evidence.questId === 'thousands-secret' && evidence.challengeComplete === true
        : false;
  if (!conditionMet) {
    return { completedMissionIds: completed, newlyCompleted: [], awardedBadges: 0 };
  }
  const newlyCompleted = MISSION_DEFINITIONS.filter((mission) => (
    mission.event === event && !completedSet.has(mission.id)
  ));
  return {
    completedMissionIds: [...completed, ...newlyCompleted.map((mission) => mission.id)],
    newlyCompleted,
    awardedBadges: newlyCompleted.reduce((sum, mission) => sum + mission.rewardBadges, 0),
  };
}

export function getMissionBadgeTotal(completedMissionIds) {
  const completed = new Set(sanitizeCompletedMissionIds(completedMissionIds));
  return MISSION_DEFINITIONS.reduce((sum, mission) => (
    sum + (completed.has(mission.id) ? mission.rewardBadges : 0)
  ), 0);
}
