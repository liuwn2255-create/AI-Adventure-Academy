import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_GAME_CATALOG, PICKER_CHALLENGE_MODES } from '../prototype/data/curriculumGameCatalog.js';
import {
  describeCurriculumPickerEmptyState,
  filterCurriculumGames,
  getCurriculumGameAvailability,
  getPickerObjectiveOptions,
  resolveCurriculumGameLaunch,
  validateCurriculumGameCatalog,
} from '../prototype/curriculumGamePicker.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { MATH_LEVEL_DIRECTORY } from '../prototype/data/mathLevelDirectory.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const learningMap = readJson('../curriculum/learning-map.json');
const curriculumMap = readJson('../curriculum/curriculum-map.json');
const learningObjectives = readJson('../curriculum/learning-objectives.json');
const activities = readJson('../curriculum/learning-activity-map.json');
const referenceData = { grades: GRADE_CATALOG, learningMap, curriculumMap, learningObjectives, activities, levelDirectory: MATH_LEVEL_DIRECTORY };
const MAGNET_OBJECTIVE_ID = 'LO-G4-SCIENCE-MAGNET-INTERACTION-01';
const MAGNET_ACTIVITY_ID = 'ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE';
const MAGNET_MAP_ID = 'science-stage2-ine-ⅱ-7-concepts';
const magnetGame = CURRICULUM_GAME_CATALOG.find(({ activityIds }) => activityIds?.includes(MAGNET_ACTIVITY_ID));

function learningMapWithMagnetRelation(mutator) {
  const copy = structuredClone(learningMap);
  const relation = copy.learningObjectiveTaskCrosswalk.find(({ learningObjectiveIds }) => learningObjectiveIds?.includes(MAGNET_OBJECTIVE_ID));
  assert.ok(relation, 'magnet objective relation exists in the Learning Map');
  mutator(relation);
  return copy;
}

test('picker catalog references resolve to existing grade, curriculum map, objectives and prototype activity', () => {
  assert.deepEqual(validateCurriculumGameCatalog(CURRICULUM_GAME_CATALOG, referenceData), []);
});

test('Learning Map candidate objective definitions are accepted as a fallback source', () => {
  assert.ok(magnetGame);
  assert.deepEqual(validateCurriculumGameCatalog([magnetGame], referenceData), []);
});

test('canonical objective definition takes precedence over a duplicate Learning Map fallback', () => {
  const objectives = structuredClone(learningObjectives);
  objectives.learningUnits.push({
    gradeId: 'grade-4',
    subjectId: 'natural-science',
    observableOutcomes: { candidateObjectives: [{
      objectiveId: MAGNET_OBJECTIVE_ID,
      statement: 'canonical sentinel',
      status: 'candidate_pending_teacher_review',
      curriculumMapIds: ['science-grade4-plant-structure-observation'],
    }] },
  });
  const errors = validateCurriculumGameCatalog([magnetGame], { ...referenceData, learningObjectives: objectives });
  assert.ok(errors.includes(`game:${magnetGame.gameId}:objective_curriculum_map_mismatch:${MAGNET_OBJECTIVE_ID}`));
});

test('objectives absent from both canonical and Learning Map sources remain invalid', () => {
  const invalid = [{ ...magnetGame, learningObjectiveIds: ['missing-objective'] }];
  const errors = validateCurriculumGameCatalog(invalid, referenceData);
  assert.ok(errors.includes(`game:${magnetGame.gameId}:missing_learning_objective:missing-objective`));
});

test('Learning Map fallback still enforces grade scope', () => {
  const map = learningMapWithMagnetRelation((relation) => { relation.gradeId = 'grade-3'; });
  const errors = validateCurriculumGameCatalog([magnetGame], { ...referenceData, learningMap: map });
  assert.ok(errors.includes(`game:${magnetGame.gameId}:objective_scope_mismatch:${MAGNET_OBJECTIVE_ID}`));
});

test('Learning Map fallback still enforces subject scope', () => {
  const map = learningMapWithMagnetRelation((relation) => { relation.subjectId = 'mathematics'; });
  const errors = validateCurriculumGameCatalog([magnetGame], { ...referenceData, learningMap: map });
  assert.ok(errors.includes(`game:${magnetGame.gameId}:objective_scope_mismatch:${MAGNET_OBJECTIVE_ID}`));
});

test('Learning Map fallback still enforces curriculum map relation', () => {
  const map = learningMapWithMagnetRelation((relation) => {
    const definition = relation.objectiveDefinitions.find(({ objectiveId }) => objectiveId === MAGNET_OBJECTIVE_ID);
    relation.subjectId = 'natural-science';
    definition.curriculumMapIds = ['science-grade4-plant-structure-observation'];
  });
  const errors = validateCurriculumGameCatalog([magnetGame], { ...referenceData, learningMap: map });
  assert.ok(errors.includes(`game:${magnetGame.gameId}:objective_curriculum_map_mismatch:${MAGNET_OBJECTIVE_ID}`));
});

test('grade 4 natural science lists the magnet objective and all-semester sequential selection returns its activity', () => {
  const options = getPickerObjectiveOptions(CURRICULUM_GAME_CATALOG, 'grade-4', 'natural-science');
  assert.ok(options.some(({ id }) => id === MAGNET_OBJECTIVE_ID));
  const selected = filterCurriculumGames(CURRICULUM_GAME_CATALOG, {
    gradeId: 'grade-4', subjectId: 'natural-science', semesterId: 'all',
    learningObjectiveId: MAGNET_OBJECTIVE_ID, challengeMode: 'sequential_challenge',
  });
  assert.equal(selected.length, 1);
  assert.deepEqual(selected[0].curriculumItemIds, [MAGNET_MAP_ID]);
  assert.deepEqual(selected[0].activityIds, [MAGNET_ACTIVITY_ID]);
});

test('magnet projection resolves its catalog candidate route from activityIds and uses the magnet CTA', () => {
  assert.equal(magnetGame.entryRoute.kind, 'catalog_candidate_activity');
  assert.equal(magnetGame.entryRoute.directLaunch, true);
  assert.deepEqual(resolveCurriculumGameLaunch(magnetGame), {
    kind: 'catalog_candidate_activity', activityId: MAGNET_ACTIVITY_ID,
  });
  assert.equal(getCurriculumGameAvailability(magnetGame).buttonLabel, '開始磁力探險');
  assert.equal(magnetGame.formalUnitId, undefined);
});

test('catalog candidate route rejects activity targets absent from the candidate activity registry', () => {
  const invalid = { ...magnetGame, activityIds: ['ACT-NOT-REGISTERED'] };
  const errors = validateCurriculumGameCatalog([invalid], referenceData);
  assert.ok(errors.includes(`game:${magnetGame.gameId}:invalid_catalog_candidate_activity_route`));
  assert.ok(errors.includes(`game:${magnetGame.gameId}:unknown_catalog_candidate_activity:ACT-NOT-REGISTERED`));
});

test('magnet result card dispatches through the existing catalog launcher and omits the unrelated M3 unit', () => {
  const appSource = readFileSync(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(appSource, /startCatalogCandidateTask\(launch\.activityId\)/);
  assert.match(appSource, /const unitStatus = gameEntry\.formalUnitId \?/);
  assert.match(appSource, /gameEntry\.entryRoute\?\.kind === 'catalog_candidate_activity'[\s\S]*?availability\.reason/);
});

test('grade catalog exposes all six grades and the indexed elementary courses for the picker', () => {
  assert.deepEqual(GRADE_CATALOG.map(({ gradeId }) => gradeId), ['grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6']);
  assert.ok(GRADE_CATALOG[2].subjects.some(({ subjectId }) => subjectId === 'chinese-language'));
  assert.ok(GRADE_CATALOG[2].subjects.some(({ subjectId }) => subjectId === 'mathematics'));
  assert.ok(GRADE_CATALOG[2].subjects.some(({ subjectId }) => subjectId === 'natural-science'));
});

test('grade 3 math, all semesters, place-value objective and sequential mode returns only the existing candidate', () => {
  const games = filterCurriculumGames(CURRICULUM_GAME_CATALOG, {
    gradeId: 'grade-3', subjectId: 'mathematics', semesterId: 'all',
    learningObjectiveId: 'LO-M3-NUM-PLACE-VALUE-01', challengeMode: 'sequential_challenge',
  });
  assert.deepEqual(games.map(({ levelId }) => levelId), ['number-secret-challenge']);
});

test('unconfirmed semester placement is not assigned to either semester', () => {
  for (const semesterId of ['semester-1', 'semester-2']) {
    assert.deepEqual(filterCurriculumGames(CURRICULUM_GAME_CATALOG, {
      gradeId: 'grade-3', subjectId: 'mathematics', semesterId,
      learningObjectiveId: 'LO-M3-NUM-PLACE-VALUE-01', challengeMode: 'sequential_challenge',
    }), []);
  }
  assert.match(describeCurriculumPickerEmptyState({ gradeId: 'grade-3', subjectId: 'mathematics', semesterId: 'semester-1', challengeMode: 'sequential_challenge' }, true), /學期安排尚未確認/);
});

test('candidate prototype stays pending and links only back to the existing map route', () => {
  const game = CURRICULUM_GAME_CATALOG[0];
  const availability = getCurriculumGameAvailability(game);
  assert.equal(availability.kind, 'candidate_prototype');
  assert.equal(availability.buttonLabel, '前往數字島探索');
  assert.equal(game.reviewStatus, 'pending_teacher_review');
  assert.equal(game.publicationStatus, 'not_approved');
  assert.equal(game.formalUnitStatus, 'candidate');
  assert.equal(game.entryRoute.targetScreen, 'select');
  assert.equal(game.entryRoute.directLaunch, false);
  assert.equal(game.entryRoute.unlockMissionId, 'task-find-number-obelisk');
  assert.deepEqual(resolveCurriculumGameLaunch(game), { kind: 'existing_map_route', targetScreen: 'select' });
});

test('planning placeholder is not launchable as a game', () => {
  const availability = getCurriculumGameAvailability({ developmentStatus: 'pending_development' });
  assert.equal(availability.available, false);
  assert.equal(availability.kind, 'pending_development');
});

test('empty results explain missing planning content instead of producing a blank list', () => {
  assert.match(describeCurriculumPickerEmptyState({
    gradeId: 'grade-1', subjectId: 'mathematics', semesterId: 'all', challengeMode: 'sequential_challenge',
  }, false), /尚無已登錄的可選學習目標或遊戲.*待開發/);
  assert.match(describeCurriculumPickerEmptyState({ gradeId: 'grade-1', subjectId: 'mathematics' }, false), /待開發/);
  assert.match(describeCurriculumPickerEmptyState({
    gradeId: 'grade-3', subjectId: 'mathematics', semesterId: 'all', challengeMode: 'advanced_challenge',
  }, true), /沒有此挑戰方式/);
});

test('missing curriculum map and objective references are reported as data errors', () => {
  const invalid = [{ ...CURRICULUM_GAME_CATALOG[0], curriculumItemIds: ['missing-map'], learningObjectiveIds: ['missing-objective'] }];
  const errors = validateCurriculumGameCatalog(invalid, referenceData);
  assert.ok(errors.some((error) => error.includes('missing_curriculum_map_ref:missing-map')));
  assert.ok(errors.some((error) => error.includes('missing_learning_objective:missing-objective')));
});

test('course-code references must exist in the referenced curriculum map item', () => {
  const invalid = [{ ...CURRICULUM_GAME_CATALOG[0], curriculumCodeRefs: [{ code: 'N-3-999', codeType: 'learning_content' }] }];
  const errors = validateCurriculumGameCatalog(invalid, referenceData);
  assert.ok(errors.some((error) => error.includes('missing_curriculum_code:N-3-999')));
});

test('candidate unit cannot be marked published without all formal gates', () => {
  const invalid = [{ ...CURRICULUM_GAME_CATALOG[0], publicationStatus: 'approved' }];
  const errors = validateCurriculumGameCatalog(invalid, referenceData);
  assert.ok(errors.some((error) => error.endsWith('publication_gate_incomplete')));
  assert.ok(errors.some((error) => error.endsWith('candidate_unit_cannot_be_published')));
});

test('an approved label alone cannot bypass the formal publication guard', () => {
  const approvedLookingGame = {
    developmentStatus: 'approved', reviewStatus: 'approved_for_publication',
    publicationStatus: 'approved', formalUnitStatus: 'approved',
  };
  assert.equal(getCurriculumGameAvailability(approvedLookingGame).available, false);
  assert.equal(getCurriculumGameAvailability(approvedLookingGame, { formalGateVerified: true }).available, true);
});

test('picker challenge modes are explicit and only sequential challenge is connected', () => {
  assert.deepEqual(PICKER_CHALLENGE_MODES.map(({ id }) => id), ['basic_practice', 'sequential_challenge', 'advanced_challenge']);
  assert.deepEqual(CURRICULUM_GAME_CATALOG[0].supportedChallengeModes, ['sequential_challenge']);
  assert.deepEqual(filterCurriculumGames(CURRICULUM_GAME_CATALOG, {
    gradeId: 'grade-3', subjectId: 'mathematics', semesterId: 'all',
    learningObjectiveId: 'LO-M3-NUM-PLACE-VALUE-01', challengeMode: 'basic_practice',
  }), []);
});

test('future games with unmet learning prerequisites are filtered from sequential challenges', () => {
  const dependent = { ...CURRICULUM_GAME_CATALOG[0], prerequisiteIds: ['LO-PREREQUISITE'] };
  const selection = {
    gradeId: 'grade-3', subjectId: 'mathematics', semesterId: 'all',
    learningObjectiveId: 'LO-M3-NUM-PLACE-VALUE-01', challengeMode: 'sequential_challenge',
  };
  assert.deepEqual(filterCurriculumGames([dependent], selection), []);
  assert.equal(filterCurriculumGames([dependent], selection, { completedPrerequisiteIds: ['LO-PREREQUISITE'] }).length, 1);
});

test('objective options are sourced from existing candidate objective IDs', () => {
  const options = getPickerObjectiveOptions(CURRICULUM_GAME_CATALOG, 'grade-3', 'mathematics');
  assert.deepEqual(options.map(({ id }) => id), [
    'LO-M3-NUM-PLACE-VALUE-01', 'LO-M3-NUM-PLACE-VALUE-02', 'LO-M3-NUM-PLACE-VALUE-03',
  ]);
  const source = learningObjectives.learningUnits.find(({ learningUnitId }) => learningUnitId === 'learning-unit:chapter-scope-m3-math-number-place-value');
  for (const option of options) {
    const official = source.observableOutcomes.candidateObjectives.find(({ objectiveId }) => objectiveId === option.id);
    assert.equal(official.statement, option.text);
  }
});

test('selected learning objective has an accessible full-text summary outside the native select', () => {
  const markup = readFileSync(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const appSource = readFileSync(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(markup, /id="picker-objective-summary"[^>]*aria-live="polite"/);
  assert.match(appSource, /getElementById\('picker-objective-summary'\)/);
  assert.match(appSource, /已選目標：\$\{selectedObjective\.text\}/);
});
