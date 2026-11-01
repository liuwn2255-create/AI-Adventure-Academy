const VALID_DEVELOPMENT_STATUSES = new Set(['prototype_exists', 'pending_development', 'approved']);
const VALID_REVIEW_STATUSES = new Set(['not_started', 'pending_teacher_review', 'approved_for_pilot', 'approved_for_publication']);
const VALID_CHALLENGE_MODES = new Set(['basic_practice', 'sequential_challenge', 'advanced_challenge']);

function allChapters(learningMap) {
  const found = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.chapterId === 'string') found.push(value);
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  };
  visit(learningMap?.grades ?? learningMap);
  return found;
}

function allLearningObjectives(objectives, learningMap) {
  const canonical = (objectives?.learningUnits ?? []).flatMap((unit) =>
    (unit.observableOutcomes?.candidateObjectives ?? []).map((objective) => ({ unit, objective })));
  const canonicalIds = new Set(canonical.map(({ objective }) => objective.objectiveId));
  const fallbackIds = new Set();
  const learningMapCandidates = (learningMap?.learningObjectiveTaskCrosswalk ?? []).flatMap((relation) =>
    (relation.objectiveDefinitions ?? [])
      .filter((objective) => objective?.objectiveId && !canonicalIds.has(objective.objectiveId)
        && !fallbackIds.has(objective.objectiveId)
        && objective.status === 'candidate_pending_teacher_review'
        && typeof objective.statement === 'string' && objective.statement.trim().length > 0
        && Array.isArray(objective.curriculumMapIds) && objective.curriculumMapIds.length > 0)
      .map((objective) => {
        fallbackIds.add(objective.objectiveId);
        return { unit: { gradeId: relation.gradeId, subjectId: relation.subjectId }, objective };
      }));
  return [...canonical, ...learningMapCandidates];
}

function unique(values) {
  return new Set(values).size === values.length;
}

function normalizeSubjectId(subjectId) {
  return subjectId === 'natural_science' ? 'natural-science' : subjectId;
}

function isStageLevelFocus(mapEntry) {
  return mapEntry?.gradeRange === null
    && typeof mapEntry.learningStage === 'string'
    && mapEntry.learningStage.includes('學習階段');
}

export function validateCurriculumGameCatalog(catalog, { grades, learningMap, curriculumMap, learningObjectives, activities, levelDirectory } = {}) {
  const errors = [];
  if (!Array.isArray(catalog)) return ['catalog_must_be_array'];
  const gameIds = catalog.map((game) => game?.gameId);
  if (!unique(gameIds)) errors.push('duplicate_game_id');

  const chapters = allChapters(learningMap);
  const objectives = allLearningObjectives(learningObjectives, learningMap);
  const mapEntries = [...(curriculumMap?.verifiedLearningFocuses ?? []), ...(curriculumMap?.pendingLearningFocuses ?? [])];
  const gradeIds = new Set((grades ?? []).map(({ gradeId }) => gradeId));
  const activityList = activities?.activities ?? activities ?? [];

  for (const game of catalog) {
    const prefix = `game:${game?.gameId ?? 'unknown'}`;
    if (!game?.gameId || !game?.title) errors.push(`${prefix}:identity_required`);
    if (!gradeIds.has(game?.gradeId)) errors.push(`${prefix}:unknown_grade`);
    const grade = (grades ?? []).find(({ gradeId }) => gradeId === game?.gradeId);
    if (!grade?.subjects?.some(({ subjectId }) => subjectId === game?.subjectId)) errors.push(`${prefix}:unknown_subject`);
    if (!Array.isArray(game?.curriculumItemIds) || game.curriculumItemIds.length === 0 || game.curriculumItemReferenceType !== 'curriculum_map_id') errors.push(`${prefix}:curriculum_item_refs_required`);
    else for (const id of game.curriculumItemIds) {
      const mapEntry = mapEntries.find((item) => item.id === id);
      const chapter = chapters.find((candidate) => candidate.coreLearningPoints?.curriculumMapRef === id
        || candidate.coreLearningPoints?.curriculumMapIds?.includes(id));
      if (!mapEntry || (!chapter && !isStageLevelFocus(mapEntry))) errors.push(`${prefix}:missing_curriculum_map_ref:${id}`);
      else if (normalizeSubjectId(mapEntry.subject) !== normalizeSubjectId(game.subjectId)) errors.push(`${prefix}:curriculum_scope_mismatch:${id}`);
    }
    if (!Array.isArray(game?.learningObjectiveIds) || game.learningObjectiveIds.length === 0) errors.push(`${prefix}:learning_objective_refs_required`);
    else for (const id of game.learningObjectiveIds) {
      const match = objectives.find(({ objective }) => objective.objectiveId === id);
      if (!match) errors.push(`${prefix}:missing_learning_objective:${id}`);
      else if (match.unit.gradeId !== game.gradeId || normalizeSubjectId(match.unit.subjectId) !== normalizeSubjectId(game.subjectId)) errors.push(`${prefix}:objective_scope_mismatch:${id}`);
      else if (!game.curriculumItemIds.some((mapId) => match.objective.curriculumMapIds?.includes(mapId))) errors.push(`${prefix}:objective_curriculum_map_mismatch:${id}`);
    }
    for (const mapId of game.curriculumItemIds ?? []) {
      const chapter = chapters.find((candidate) => candidate.coreLearningPoints?.curriculumMapRef === mapId
        || candidate.coreLearningPoints?.curriculumMapIds?.includes(mapId));
      if (chapter && (chapter.gradeId !== game.gradeId || chapter.subjectId !== game.subjectId)) errors.push(`${prefix}:curriculum_scope_mismatch:${mapId}`);
    }
    if (!VALID_DEVELOPMENT_STATUSES.has(game?.developmentStatus)) errors.push(`${prefix}:invalid_development_status`);
    if (!VALID_REVIEW_STATUSES.has(game?.reviewStatus)) errors.push(`${prefix}:invalid_review_status`);
    if (!VALID_CHALLENGE_MODES.size || !Array.isArray(game?.supportedChallengeModes)
      || game.supportedChallengeModes.some((mode) => !VALID_CHALLENGE_MODES.has(mode))) errors.push(`${prefix}:invalid_challenge_mode`);
    if (!Array.isArray(game?.prerequisiteIds) || !Array.isArray(game?.assessmentIds)) errors.push(`${prefix}:invalid_reference_arrays`);
    for (const codeRef of game.curriculumCodeRefs ?? []) {
      const mapItem = mapEntries.find((item) => game.curriculumItemIds.includes(item.id));
      const codes = codeRef.codeType === 'learning_content' ? mapItem?.contentCodes
        : codeRef.codeType === 'learning_performance' ? mapItem?.performanceCodes : null;
      if (!codes?.includes(codeRef.code)) errors.push(`${prefix}:missing_curriculum_code:${codeRef.code}`);
    }

    if (game?.developmentStatus === 'approved'
      && (game.reviewStatus !== 'approved_for_publication' || game.publicationStatus !== 'approved')) errors.push(`${prefix}:approval_gate_incomplete`);
    if (game?.publicationStatus === 'approved'
      && (game.reviewStatus !== 'approved_for_publication' || game.developmentStatus !== 'approved')) errors.push(`${prefix}:publication_gate_incomplete`);
    if (game?.formalUnitStatus === 'candidate' && game?.publicationStatus === 'approved') errors.push(`${prefix}:candidate_unit_cannot_be_published`);
    if (game?.developmentStatus === 'approved' && game?.formalUnitStatus !== 'approved') errors.push(`${prefix}:approved_unit_required`);

    const route = game?.entryRoute;
    if (!route || route.kind !== 'existing_map_route' || route.targetScreen !== 'select' || route.directLaunch !== false) {
      errors.push(`${prefix}:entry_must_use_existing_map_route`);
    }
    if (game?.levelId && !(levelDirectory ?? []).some(({ levelId }) => levelId === game.levelId)) errors.push(`${prefix}:unknown_level`);
    if (game?.levelId && !activityList.some((activity) => activity.runtimeReference?.levelId === game.levelId)) errors.push(`${prefix}:missing_activity_reference`);
  }
  return errors;
}

export function filterCurriculumGames(catalog, selection, { completedPrerequisiteIds = [] } = {}) {
  const { gradeId, subjectId, semesterId, learningObjectiveId, challengeMode } = selection ?? {};
  if (![gradeId, subjectId, semesterId, learningObjectiveId, challengeMode].every(Boolean)) return [];
  return catalog.filter((game) => game.gradeId === gradeId
    && game.subjectId === subjectId
    && (semesterId === 'all' || game.semesterIds?.includes(semesterId))
    && game.learningObjectiveIds.includes(learningObjectiveId)
    && game.supportedChallengeModes.includes(challengeMode)
    && (game.prerequisiteIds ?? []).every((id) => completedPrerequisiteIds.includes(id)));
}

export function getCurriculumGameAvailability(game, { formalGateVerified = false } = {}) {
  if (game?.developmentStatus === 'pending_development') {
    return { available: false, kind: 'pending_development', label: '待開發', reason: '這個主題尚無可操作的遊戲。' };
  }
  const candidateDemo = game?.developmentStatus === 'prototype_exists'
    && game.reviewStatus === 'pending_teacher_review'
    && game.publicationStatus === 'not_approved'
    && game.formalUnitStatus === 'candidate'
    && game.entryRoute?.kind === 'existing_map_route'
    && game.entryRoute?.directLaunch === false;
  if (candidateDemo) {
    return {
      available: true,
      kind: 'candidate_prototype',
      label: '原型完成・待教師審查',
      reason: '只可進入本機候選示範流程，不是已核准課程或正式題庫。',
      buttonLabel: '前往數字島探索',
    };
  }
  const approved = game?.developmentStatus === 'approved'
    && game.reviewStatus === 'approved_for_publication'
    && game.publicationStatus === 'approved'
    && game.formalUnitStatus === 'approved'
    && formalGateVerified === true;
  if (approved) return { available: true, kind: 'approved', label: '已核准可用', reason: '正式發布狀態與單元核准條件已確認。', buttonLabel: '開始遊戲' };
  if (game?.developmentStatus === 'approved' || game?.publicationStatus === 'approved') {
    return { available: false, kind: 'unavailable', label: '核准條件待驗證', reason: '正式入口必須先經既有發布防護及單元核准驗證。' };
  }
  return { available: false, kind: 'unavailable', label: '目前不可用', reason: '尚未完成必要的課程審查與發布條件。' };
}

export function describeCurriculumPickerEmptyState(selection, hasObjectives) {
  if (selection?.gradeId && selection?.subjectId && !hasObjectives) {
    return '此年級與科目目前尚無已登錄的可選學習目標或遊戲；開發狀態：待開發，課綱／年級範圍待核對。';
  }
  if (!selection?.gradeId || !selection?.subjectId || !selection?.semesterId || !selection?.challengeMode) {
    return '請依序完成年級、科目、學期、學習目標與挑戰方式選擇。';
  }
  if (selection.semesterId !== 'all') return '目前候選原型的上、下學期安排尚未確認，因此不會推定它屬於所選學期。';
  if (selection.challengeMode !== 'sequential_challenge') return '這個範圍目前沒有此挑戰方式的可用遊戲；其他內容待開發。';
  return '目前沒有符合所有條件的遊戲；此範圍待開發或待資料核對。';
}

export function getPickerObjectiveOptions(catalog, gradeId, subjectId) {
  const byId = new Map();
  for (const game of catalog) {
    if (game.gradeId !== gradeId || game.subjectId !== subjectId) continue;
    for (const objective of game.learningObjectiveSummaries ?? []) {
      if (!byId.has(objective.id)) byId.set(objective.id, { ...objective, topicTitle: game.topicTitle, reviewStatus: game.reviewStatus });
    }
  }
  return [...byId.values()];
}
