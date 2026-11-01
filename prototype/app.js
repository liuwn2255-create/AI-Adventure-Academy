import { NUMBER_COMPARISON_LEVEL, NUMBER_SECRET_LEVEL, PLACE_VALUE_LEVEL } from './data/levelCatalog.js';
import { MATH_LEVEL_DIRECTORY } from './data/mathLevelDirectory.js';
import { numberSecretChallenge } from './data/numberSecretQuestions.js';
import { createGameState, submitAnswer, advanceQuestion } from './gameFlow.js';
import { isLevelUnlocked, retryLevelQuestion, validateLevel } from './levelEngine.js';
import { collectDemoStar, DEMO_LEVEL_ID, DEMO_LEVEL_MAX_STARS, isProgressStorageReadable, readProgress, recordDemoCompletion, recordLevelCompletion, recordNumberSecretCompletion, writeProgress } from './mapProgress.js';
import { awardMissionsForEvent as resolveMissionsForEvent, getMissionBadgeTotal, MISSION_DEFINITIONS, MISSION_EVENTS } from './missions.js';
import { createExplorerPosition, getNearbyObject, interactWithObject, ISLAND_OBJECTS, moveExplorer } from './islandExploration.js';
import { canStartNumberSecret, isNumberSecretTreasureUnlocked, NUMBER_SECRET_QUEST_ID } from './numberSecretFlow.js';
import { CAPACITY_MISSION_CONFIG, CAPACITY_OBSERVATION_SCENARIOS, createCapacityMission, createCapacityObservationSession, createCapacityOnboarding } from './capacityMission.js';
import { GRADE_CATALOG, getGradeById } from './data/gradeCatalog.js';
import { CURRICULUM_FRAMEWORK_SOURCE, ELEMENTARY_CURRICULUM_AREAS, SUBJECT_DEFINITIONS, getLearningTaskRelation } from './data/elementaryLearningCatalog.js';
import { MOVEMENT_KEYS, createMovementHoldController } from './movementControls.js';
import { NUMBER_SECRET_LEARNING_UNIT, NUMBER_SECRET_V2_CANDIDATE_SET } from './data/numberSecretLearningUnit.js';
import { NUMBER_COMPARISON_LEARNING_UNIT } from './data/numberComparisonLearningUnit.js';
import { CAPACITY_READING_LEARNING_UNIT } from './data/capacityReadingLearningUnit.js';
import { INTEGER_NUMBER_LINE_LEARNING_UNIT } from './data/integerNumberLineLearningUnit.js';
import { MILLIMETER_RULER_LEARNING_UNIT } from './data/millimeterRulerLearningUnit.js';
import { WEIGHT_KG_G_LEARNING_UNIT } from './data/weightKgGLearningUnit.js';
import { SQUARE_CENTIMETER_AREA_LEARNING_UNIT } from './data/squareCentimeterAreaLearningUnit.js';
import { FRACTION_TREASURE_LEARNING_UNIT } from './data/fractionTreasureLearningUnit.js';
import { ADDITION_SUBTRACTION_LEARNING_UNIT } from './data/additionSubtractionLearningUnit.js';
import { createNumberSecretLearningSession, dispatchLearningUnit, summarizeNumberSecretLearningSession } from './learningUnitFlow.js';
import { createNumberSecretV2CandidateSession, createNumberSecretV2TeacherExport, dispatchNumberSecretV2Candidate, summarizeNumberSecretV2CandidateSession } from './numberSecretV2CandidateFlow.js';
import { createCandidateUnitSession, dispatchCandidateUnit, getCandidateQuestionAttempts, summarizeCandidateUnit } from './learningUnitEngine.js';
import { CURRICULUM_GAME_CATALOG, PICKER_CHALLENGE_MODES } from './data/curriculumGameCatalog.js';
import { describeCurriculumPickerEmptyState, filterCurriculumGames, getCurriculumGameAvailability, getPickerObjectiveOptions, resolveCurriculumGameLaunch } from './curriculumGamePicker.js';
import { STORY_FOREST_READING_QUEST } from './data/storyForestReadingQuest.js';
import { ENGLISH_SCENARIO_ADVENTURE } from './data/englishScenarioAdventure.js';
import { ANIMAL_OBSERVATION_EXPLORATION } from './data/animalObservationExploration.js';
import { NEIGHBORHOOD_CHANGE_EXPLORATION } from './data/neighborhoodChangeExploration.js';
import { MATH_DATA_TABLE_WORKSHOP } from './data/mathDataTableWorkshop.js';
import { ARTS_RHYTHM_WORKSHOP } from './data/artsRhythmWorkshop.js';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from './data/catalogCandidateTasks.js';
import { GRADE3_MATH_ADVENTURE_MAP, GRADE3_MATH_LEGACY_ENTRY_REFERENCES } from './data/grade3MathAdventureMap.js';
import { GRADE3_MATH_REPAIR_MAINLINE } from './data/grade3MathRepairMainline.js';
import { getGradeAdventureSummary, getSubjectDirectorySummary, getSubjectLaunchableActivities } from './data/gradeActivityDirectory.js';
import { createLearningTaskSession, dispatchLearningTask } from './learningTaskEngine.js';
import { isSpeechEnabled, setSpeechEnabled, speak } from './speechService.js';

const screens = Object.fromEntries(['home', 'curriculum-game', 'select', 'reading-quest', 'english-quest', 'science-quest', 'social-quest', 'math-data-quest', 'arts-quest', 'catalog-task', 'explore', 'game', 'complete', 'capacity'].map((id) => [id, document.getElementById(`${id}-screen`)]));
const optionsHost = document.getElementById('answer-options');
const feedback = document.getElementById('answer-feedback');
const questionHintButton = document.getElementById('question-hint-button');
const questionHint = document.getElementById('question-hint');
const progress = document.querySelector('.progress-track');
const speechToggle = document.createElement('button');
speechToggle.type = 'button';
speechToggle.className = 'speech-preference-toggle';
speechToggle.addEventListener('click', () => {
  setSpeechEnabled(!isSpeechEnabled());
  renderSpeechToggle();
});
document.querySelector('.topbar')?.append(speechToggle);
function renderSpeechToggle() {
  const enabled = isSpeechEnabled();
  speechToggle.textContent = enabled ? '🔊 語音提示：開' : '🔇 語音提示：關';
  speechToggle.setAttribute('aria-pressed', String(enabled));
  speechToggle.setAttribute('aria-label', enabled ? '語音提示目前開啟，按下關閉' : '語音提示目前關閉，按下開啟');
}
renderSpeechToggle();
function getProgressStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const progressStorage = getProgressStorage();
let progressStorageAvailable = isProgressStorageReadable(progressStorage);
let mapProgress = readProgress(progressStorage);
let activeLevel = PLACE_VALUE_LEVEL;
let game = createGameState(activeLevel.questionSet.questions.length);
let missionToastTimer;
let explorerPosition = createExplorerPosition();
let explorationMessage = '';
let numberSecretGame = null;
let numberSecretLearningSession = null;
let numberSecretV2CandidateSession = null;
let comparisonLearningSession = null;
let capacityLearningSession = null;
let integerNumberLineLearningSession = null;
let millimeterRulerLearningSession = null;
let weightKgGLearningSession = null;
let squareCentimeterAreaSession = null;
let fractionTreasureSession = null;
let additionSubtractionSession = null;
const capacityMission = createCapacityMission();
const capacityObservation = createCapacityObservationSession();
const capacityOnboarding = createCapacityOnboarding();
let activeCapacityObservationMode = 'challenge';
let selectedGradeId = null;
let selectedSubjectId = null;
let readingQuestSession = createLearningTaskSession(STORY_FOREST_READING_QUEST);
let englishAdventureSession = createLearningTaskSession(ENGLISH_SCENARIO_ADVENTURE);
let scienceExplorationSession = createLearningTaskSession(ANIMAL_OBSERVATION_EXPLORATION);
let socialExplorationSession = createLearningTaskSession(NEIGHBORHOOD_CHANGE_EXPLORATION);
let mathDataTableSession = createLearningTaskSession(MATH_DATA_TABLE_WORKSHOP);
let artsRhythmSession = createLearningTaskSession(ARTS_RHYTHM_WORKSHOP);
let activeCatalogTask = null;
let activeCatalogTaskSession = null;
let activeCandidateRouteContext = null;
const completedCandidateRouteStops = new Set();
const curriculumPickerSelection = {
  gradeId: '',
  subjectId: '',
  semesterId: '',
  learningObjectiveId: '',
  challengeMode: '',
};
let explorationGuideDismissed = false;
let heldDirectionButton = null;
let suppressedDirectionClickButton = null;
let suppressedDirectionClickTimer = null;
let explorerCharacter = null;
let explorerCharacterLoad = null;
let explorerMovementStopTimer = null;
let lastExplorerDirection = 'down';
const movementHoldController = createMovementHoldController((direction) => moveExplorerInScene(direction));

// Keep the home screen usable even if later, nonessential rendering initialization fails.
document.getElementById('start-button').addEventListener('click', () => showScreen('select'));
document.querySelector('.brand')?.addEventListener('click', (event) => {
  event.preventDefault();
  window.history.replaceState(window.history.state, '', '#home');
  showScreen('home');
});

function renderGradeSelection() {
  let discoveryGuide = document.getElementById('student-adventure-discovery-guide');
  if (!discoveryGuide) {
    discoveryGuide = document.createElement('div');
    discoveryGuide.id = 'student-adventure-discovery-guide';
    discoveryGuide.className = 'student-adventure-discovery-guide';
    const sequence = document.createElement('p');
    sequence.className = 'student-adventure-step-sequence';
    sequence.textContent = '① 選年級 → ② 選科目 → ③ 選遊戲';
    const prompt = document.createElement('p');
    prompt.id = 'student-adventure-step-prompt';
    prompt.className = 'student-adventure-step-prompt';
    prompt.setAttribute('role', 'status');
    discoveryGuide.append(sequence, prompt);
    document.getElementById('select-screen').insertBefore(discoveryGuide, document.querySelector('.grade-picker'));
  }

  const hasSelectedGrade = Boolean(selectedGradeId);
  const host = document.getElementById('grade-options');
  host.replaceChildren();
  for (const grade of GRADE_CATALOG) {
    const summary = getGradeAdventureSummary(grade);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grade-option';
    button.dataset.gradeId = grade.gradeId;
    button.setAttribute('aria-pressed', String(grade.gradeId === selectedGradeId));
    button.classList.toggle('is-selected', grade.gradeId === selectedGradeId);
    const name = document.createElement('strong');
    name.textContent = grade.name;
    const status = document.createElement('small');
    status.textContent = summary.activityCount > 0
      ? `${summary.activityCount} 個活動入口・${summary.subjectCount} 科`
      : '目前沒有可玩活動';
    button.append(name, status);
    button.addEventListener('click', () => {
      selectedGradeId = grade.gradeId;
      selectedSubjectId = null;
      document.getElementById('grade-teacher-info').open = false;
      document.getElementById('grade-subject-teacher-info').open = false;
      renderGradeSelection();
    });
    host.append(button);
  }

  const grade = getGradeById(selectedGradeId) ?? GRADE_CATALOG[2];
  if (!grade.subjects.some(({ subjectId }) => subjectId === selectedSubjectId)) selectedSubjectId = null;
  const hasSelectedSubject = hasSelectedGrade && Boolean(selectedSubjectId);
  const stepPrompt = document.getElementById('student-adventure-step-prompt');
  stepPrompt.textContent = !hasSelectedGrade
    ? '第 1 步｜選擇你的年級'
    : !hasSelectedSubject
      ? '第 2 步｜選擇科目'
      : '第 3 步｜選一個遊戲開始探險';
  discoveryGuide.dataset.currentStep = !hasSelectedGrade ? '1' : !hasSelectedSubject ? '2' : '3';
  const isGradeThree = grade.gradeNumber === 3;
  document.querySelector('.grade-picker').hidden = hasSelectedGrade;
  document.getElementById('grade3-experience').hidden = !(hasSelectedSubject && isGradeThree && selectedSubjectId === 'mathematics');
  renderGrade3MathAdventureMap();
  const preparationPanel = document.getElementById('grade-preparation-panel');
  preparationPanel.hidden = !hasSelectedGrade;
  document.getElementById('student-back-to-grades').hidden = !hasSelectedGrade || hasSelectedSubject;
  document.getElementById('student-subject-back').hidden = !hasSelectedSubject;
  const selectedSubjectName = hasSelectedSubject ? grade.subjects.find(({ subjectId }) => subjectId === selectedSubjectId)?.name : null;
  document.getElementById('grade-preparation-title').textContent = hasSelectedSubject
    ? `${grade.name}｜${selectedSubjectName}｜選擇遊戲`
    : `${grade.name}｜選擇科目`;
  document.getElementById('grade-directory-title').textContent = `選擇${grade.name}科目`;
  document.getElementById('grade-directory-title').hidden = hasSelectedSubject;
    const gradeSummary = getGradeAdventureSummary(grade);
    const playableSubjects = gradeSummary.subjects.filter(({ activityCount }) => activityCount > 0);
    const hasPlayableSubjectActivities = playableSubjects.length > 0;
    const playableSubjectNames = playableSubjects.map(({ name }) => name).join('、');
    document.getElementById('grade-development-status').textContent = hasPlayableSubjectActivities ? `${playableSubjectNames}有已註冊活動入口` : '年級入口已建立・尚無可啟動活動';
    document.getElementById('grade-preparation-title').textContent = `${grade.name}學園課程目錄`;
  document.getElementById('grade-preparation-badge').textContent = hasPlayableSubjectActivities
    ? `${gradeSummary.activityCount} 個活動入口｜${gradeSummary.candidatePendingTeacherReviewCount} 個候選待審`
    : '目前沒有可玩的關卡';
  document.getElementById('grade-preparation-note').textContent = '選擇一個領域或科目查看課程與任務狀態。正式課綱的領域架構已登錄；各年級內容、校本教材與授課順序仍須核對。';
  renderCandidateRoutes(grade);
  const semesterHost = document.getElementById('grade-semester-list');
  semesterHost.replaceChildren();
  for (const semester of grade.semesters) {
    const card = document.createElement('section');
    card.className = 'grade-semester-card';
    const title = document.createElement('h3');
    title.textContent = semester.name;
    const status = document.createElement('p');
    status.className = 'grade-semester-status';
    status.textContent = '課程安排與實際授課順序待學校／教師確認；本目錄不將活動指派至學期。';
    card.append(title, status);
    semesterHost.append(card);
  }

  const directory = document.getElementById('grade-subject-directory');
  directory.replaceChildren();
  directory.hidden = hasSelectedSubject;
  for (const subject of grade.subjects) {
    const subjectActivities = getSubjectLaunchableActivities(grade, subject);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grade-subject-card';
    button.dataset.subjectId = subject.subjectId;
    button.setAttribute('aria-pressed', String(subject.subjectId === selectedSubjectId));
    button.classList.toggle('is-selected', subject.subjectId === selectedSubjectId);
    const area = ELEMENTARY_CURRICULUM_AREAS.find(({ areaId }) => areaId === subject.areaId);
    const name = document.createElement('strong');
    name.textContent = subject.name;
    const areaLabel = document.createElement('span');
    areaLabel.textContent = subject.areaId === 'life-course' ? '國小整合課程' : area?.name ?? '課程領域待確認';
    const status = document.createElement('small');
    status.className = 'grade-subject-card-status';
    status.textContent = subjectActivities.length > 0 ? `${subjectActivities.length} 個遊戲` : '目前尚無可開始的遊戲';
    button.append(areaLabel, name, status);
    button.addEventListener('click', () => {
      selectedSubjectId = subject.subjectId;
      document.getElementById('grade-subject-teacher-info').open = false;
      renderGradeSelection();
    });
    directory.append(button);
  }

  const subject = hasSelectedSubject ? grade.subjects.find(({ subjectId }) => subjectId === selectedSubjectId) : null;
    const area = ELEMENTARY_CURRICULUM_AREAS.find(({ areaId }) => areaId === subject?.areaId);
  const subjectSummary = getSubjectDirectorySummary(grade, subject);
  const subjectActivities = subjectSummary.activities;
  const detail = document.getElementById('grade-subject-detail');
  detail.hidden = !subject;
  document.getElementById('grade-teacher-info').hidden = hasSelectedSubject;
  if (subject) {
    document.getElementById('grade-subject-detail-title').textContent = `${subject.name}可玩活動`;
    document.getElementById('grade-subject-detail-status').textContent = subjectActivities.length > 0
      ? `${subjectActivities.length} 個已註冊入口可啟動候選活動；均待教師審查`
      : subject.existingYearLevelContent.length > 0
        ? '目前只有舊原型／目錄參照，尚無已註冊的活動啟動入口'
        : '目前尚無可啟動的遊戲活動；這是課程架構入口，不代表課綱已建置';
    const areaName = subject.areaId === 'life-course' ? '國小生活課程' : area?.name ?? '課程領域待確認';
    document.getElementById('grade-subject-detail-copy').textContent = `${areaName}；官方框架來源：${CURRICULUM_FRAMEWORK_SOURCE.documentTitle}，${CURRICULUM_FRAMEWORK_SOURCE.verifiedLocations.map(({ table, printedPage }) => `${table}（印刷頁 ${printedPage}）`).join('、')}。此來源核對的是總綱領域架構，不代表 ${grade.name} 年級細目、學期順序或教材版本已確認。`;
    const taskList = document.getElementById('grade-subject-task-list');
    taskList.replaceChildren();
    const scopeNote = document.createElement('p');
    scopeNote.className = 'grade-task-boundary';
    scopeNote.textContent = `年級適用範圍：${subject.frameworkGradeScope?.label ?? '待核對'}`;
    taskList.append(scopeNote);
    const entrySummary = document.createElement('p');
    entrySummary.className = 'grade-task-boundary';
    const referenceNotes = [
      subjectSummary.underDevelopmentReferenceCount ? `${subjectSummary.underDevelopmentReferenceCount} 項候選目錄參照尚未接入可玩入口` : '',
      subjectSummary.gatedReferenceCount ? `${subjectSummary.gatedReferenceCount} 項舊原型受既有條件限制` : '',
      subjectSummary.legacyPlayableReferenceCount ? `${subjectSummary.legacyPlayableReferenceCount} 項舊示範原型走既有數字島入口` : '',
      subjectSummary.directoryOnlyReferenceCount ? `${subjectSummary.directoryOnlyReferenceCount} 項僅有目錄記錄，尚不可玩` : '',
    ].filter(Boolean);
    entrySummary.textContent = subjectSummary.activityCount
      ? `此科目有 ${subjectSummary.activityCount} 個已註冊的活動入口；${subjectSummary.candidatePendingTeacherReviewCount} 個仍待教師審查。${referenceNotes.length ? `另有${referenceNotes.join('；')}。` : ''}活動完成不等於課綱完整涵蓋或正式精熟。`
      : referenceNotes.length
        ? `目前沒有已註冊的候選活動入口。${referenceNotes.join('；')}。`
        : '目前沒有已註冊的可玩活動；此科目卡片只呈現課程架構，並非課綱完成證據。';
    taskList.append(entrySummary);
    const relation = getLearningTaskRelation(grade.gradeId, subject.subjectId);
    if (relation) {
      const note = document.createElement('p');
      note.className = 'grade-task-boundary';
      note.textContent = `候選學習目標：${relation.learningObjectiveIds.join('、')}；遊戲任務與目標採多對多參照。任務完成不是精熟判定。`;
      taskList.append(note);
      for (const task of relation.tasks) {
        const item = document.createElement('article');
        item.className = 'grade-task-reference';
        const taskTitle = document.createElement('strong');
        taskTitle.textContent = task.title ?? task.taskId;
        const taskStatus = document.createElement('small');
        taskStatus.textContent = task.status === 'existing_playable_prototype_pending_teacher_review'
          ? '數字島任務路線・候選原型・待教師審查'
          : task.taskKind === 'interactive_reading_quest'
            ? '故事森林線索探索・可玩候選原型・待教師審查'
            : task.taskKind === 'interactive_scenario_phrase_assembly'
              ? '英語情境對話組句・可玩候選原型・待教師審查'
              : task.taskKind === 'interactive_observation_classification'
                ? '自然觀察紀錄分類・可玩候選原型・待教師審查'
          : task.taskKind === 'interactive_observation_evidence_collection'
            ? '觀察線索蒐集與分類・可玩候選任務・待教師審查'
            : task.taskKind === 'interactive_sport_safety_classification'
              ? '運動安全情境巡檢・可玩候選任務・待教師審查'
                : task.taskKind === 'interactive_division_situation_classification'
                  ? '除法情境分類與乘法檢查・可玩候選任務・待教師審查'
                  : task.taskKind === 'interactive_time_sequence_and_elapsed_minutes'
                    ? '時刻排序與分鐘間隔・可玩候選任務・待教師審查'
                    : task.taskKind === 'interactive_angle_reference_classification'
                      ? '角度參照分類・文字化候選任務・待教師審查'
                : task.taskKind === 'interactive_learning_method_sequence'
                ? '學習方法步驟排序・可玩候選任務・待教師審查'
                : '共用學習單元流程・候選・待教師審查';
        item.append(taskTitle, taskStatus);
        taskList.append(item);
      }
      for (const level of subject.existingYearLevelContent) {
        const item = document.createElement('p');
        item.className = 'grade-level-reference';
        const curriculumText = level.curriculumCodes?.length ? `；課綱參照 ${level.curriculumCodes.join('、')}（學習階段範圍，年級／學期進度待確認）` : '';
        item.textContent = `${level.title}：${level.runtimeAvailability === 'playable_prototype' ? '可由既有地圖進入' : level.runtimeAvailability === 'playable_candidate_prototype' ? '可由課程目錄進入候選任務' : level.runtimeAvailability === 'gated_prototype' ? '候選入口受既有條件限制' : level.runtimeAvailability === 'catalog_candidate' ? '候選目錄，尚未開放' : '目錄記錄，尚不可玩'}${curriculumText}`;
        taskList.append(item);
      }
    } else {
      const empty = document.createElement('p');
      empty.className = 'grade-task-boundary';
      empty.textContent = '尚無已連結的學習目標或遊戲任務。此處是課程目錄入口，不是已完成課程。';
      taskList.append(empty);
    }
    const openMap = document.getElementById('grade-subject-open-map');
    openMap.hidden = !(isGradeThree && subject.subjectId === 'mathematics');
    document.getElementById('grade-subject-open-reading').hidden = true;
    document.getElementById('grade-subject-open-english').hidden = !(isGradeThree && subject.subjectId === 'english-language' && subject.developmentStatus === 'playable_candidate_prototype');
    document.getElementById('grade-subject-open-science').hidden = !(isGradeThree && subject.subjectId === 'natural-science' && subject.developmentStatus === 'playable_candidate_prototype');
    document.getElementById('grade-subject-open-social').hidden = !(isGradeThree && subject.subjectId === 'social-studies' && subject.developmentStatus === 'playable_candidate_prototype');
    document.getElementById('grade-subject-open-math-data').hidden = !(isGradeThree && subject.subjectId === 'mathematics' && subject.existingYearLevelContent.some(({ activityId }) => activityId === MATH_DATA_TABLE_WORKSHOP.activityId));
    document.getElementById('grade-subject-open-arts').hidden = !(isGradeThree && subject.subjectId === 'arts' && subject.developmentStatus === 'playable_candidate_prototype');
    const extraLaunches = document.getElementById('grade-subject-extra-activities');
    extraLaunches.replaceChildren();
    if (subjectActivities.length > 0) {
      const gameHeading = document.createElement('h4');
      gameHeading.className = 'student-game-list-heading';
      gameHeading.textContent = '第 3 步｜選一個遊戲開始探險';
      const gameCount = document.createElement('p');
      gameCount.className = 'student-game-list-count';
      gameCount.textContent = `找到 ${subjectActivities.length} 個可以挑戰的遊戲`;
      extraLaunches.append(gameHeading, gameCount);
    } else {
      const emptyGames = document.createElement('p');
      emptyGames.className = 'student-game-list-empty';
      emptyGames.textContent = '目前還沒有可開始的遊戲。';
      extraLaunches.append(emptyGames);
    }
    for (const activity of subjectActivities) {
      const isCandidateActivity = CATALOG_CANDIDATE_TASK_BY_ID.has(activity.activityId);
      const isReadingDirectLaunch = activity.entryRoute?.directLaunch === true && activity.entryRoute.targetScreen === 'reading-quest';
      if (!isCandidateActivity && !isReadingDirectLaunch) continue;
      const card = document.createElement('article');
      card.className = 'student-game-card';
      card.dataset.activityId = activity.activityId;
      const title = document.createElement('h5');
      title.textContent = activity.title?.split(/[：:]/, 1)[0] ?? '學習冒險';
      const description = document.createElement('p');
      const titleSummary = activity.title?.split(/[：:]/).slice(1).join('：').trim();
      description.textContent = titleSummary
        ? titleSummary.replace('比吸起數量', '比較磁力強弱')
        : activity.learningObjective?.statement ?? activity.instructions ?? '動手完成任務挑戰。';
      const challengeCount = document.createElement('small');
      challengeCount.className = 'student-game-card-challenges';
      challengeCount.textContent = isCandidateActivity ? `${activity.stages?.length ?? 0} 個挑戰` : '閱讀任務';
      const status = document.createElement('small');
      status.className = 'student-game-card-status';
      status.textContent = isCandidateActivity ? '候選活動・待教師審查' : '閱讀任務';
      const launch = document.createElement('button');
      launch.type = 'button';
      launch.className = 'button button-primary catalog-task-launch';
      launch.dataset.activityId = activity.activityId;
      launch.textContent = isCandidateActivity ? '開始挑戰' : '開始閱讀任務';
      launch.addEventListener('click', () => {
        if (isCandidateActivity) startCatalogCandidateTask(activity.activityId);
        else if (activity.entryRoute?.directLaunch === true && activity.entryRoute.targetScreen === 'reading-quest') {
          document.getElementById('grade-subject-open-reading').click();
        }
      });
      card.append(title, description, challengeCount, status, launch);
      extraLaunches.append(card);
    }
    const mathRelation = isGradeThree && subject.subjectId === 'mathematics' ? getLearningTaskRelation('grade-3', 'mathematics') : null;
    if (mathRelation?.candidateLearningPath?.length) {
      const path = document.createElement('section'); path.className = 'candidate-math-learning-path';
      const heading = document.createElement('h3'); heading.textContent = '候選學習路徑（參考順序，不改變正式解鎖）'; path.append(heading);
      const list = document.createElement('ol');
      for (const node of mathRelation.candidateLearningPath) {
        const item = document.createElement('li'); item.textContent = `${node.title}｜${node.status === 'not_built' ? '尚未建置' : node.status === 'playable_candidate' ? '可玩候選活動' : '既有候選路徑參照'}${node.curriculumCodes?.length ? `｜${node.curriculumCodes.join('、')}` : ''}${node.prerequisite ? `｜先備：${node.prerequisite}` : ''}`; list.append(item);
      }
      path.append(list); taskList.append(path);
    }
  }
}

function renderGrade3MathAdventureMap() {
  renderGrade3MathRepairMainline();
  const host = document.getElementById('grade3-math-adventure-regions');
  if (!host) return;
  host.replaceChildren();
  for (const region of GRADE3_MATH_ADVENTURE_MAP.regions) {
    const section = document.createElement('section');
    section.className = 'grade3-math-adventure-region';
    section.dataset.regionId = region.id;
    const heading = document.createElement('div');
    heading.className = 'grade3-math-region-heading';
    const title = document.createElement('h3');
    title.textContent = `${region.icon} ${region.title}`;
    const count = document.createElement('span');
    count.className = 'grade3-math-region-count';
    count.textContent = `${region.activityCount} 關`;
    const description = document.createElement('p');
    description.textContent = region.description;
    heading.append(title, count);
    section.append(heading, description);
    const list = document.createElement('div');
    list.className = 'grade3-math-adventure-cards';
    for (const activity of region.activities) {
      const card = document.createElement('article');
      card.className = 'grade3-math-adventure-card';
      card.dataset.activityId = activity.activityId;
      const cardTitle = document.createElement('h4');
      cardTitle.textContent = activity.title;
      const objective = document.createElement('p');
      objective.textContent = activity.learningObjective?.statement ?? activity.instructions;
      const status = document.createElement('small');
      status.className = 'grade3-math-adventure-status';
      status.textContent = activity.runtimeAvailability === 'under_development' || activity.runtimeAvailability === 'catalog_candidate'
        ? '開發中・尚不可遊玩'
        : '可玩候選活動・待教師審查';
      const codes = document.createElement('small');
      codes.className = 'grade3-math-adventure-codes';
      codes.textContent = `課綱參照：${(activity.curriculumCodes ?? []).join('、') || '待核對'}；這是活動入口，不代表完整涵蓋。`;
      card.append(cardTitle, objective, status, codes);
      if (activity.runtimeAvailability === 'under_development' || activity.runtimeAvailability === 'catalog_candidate') {
        const unavailable = document.createElement('span');
        unavailable.className = 'grade3-math-adventure-unavailable';
        unavailable.textContent = '目前無法遊玩';
        card.append(unavailable);
      } else {
        const launch = document.createElement('button');
        launch.type = 'button';
        launch.className = 'button button-primary';
        launch.dataset.activityId = activity.activityId;
        launch.textContent = '進入關卡';
        launch.addEventListener('click', () => {
          if (activity.activityId === MATH_DATA_TABLE_WORKSHOP.activityId) {
            activeCandidateRouteContext = { kind: 'grade3-math-adventure-map' };
            mathDataTableSession = createLearningTaskSession(MATH_DATA_TABLE_WORKSHOP, `${MATH_DATA_TABLE_WORKSHOP.activityId}:adventure-map-session`);
            renderMathDataWorkshop();
            showScreen('math-data-quest');
            document.getElementById('math-data-quest-title')?.focus({ preventScroll: true });
            return;
          }
          startCatalogCandidateTask(activity.activityId, { kind: 'grade3-math-adventure-map' });
        });
        card.append(launch);
      }
      list.append(card);
    }
    section.append(list);
    host.append(section);
  }
  const legacy = document.createElement('section');
  legacy.className = 'grade3-math-legacy-entries';
  const legacyTitle = document.createElement('h3');
  legacyTitle.textContent = '既有數字島原型與條件式入口';
  const legacyNote = document.createElement('p');
  legacyNote.textContent = '這兩項沿用原數字島流程，不列入上方 25 個可直接啟動的候選活動數；其中候選單元依既有關卡條件開放。';
  legacy.append(legacyTitle, legacyNote);
  for (const reference of GRADE3_MATH_LEGACY_ENTRY_REFERENCES) {
    const item = document.createElement('article');
    item.className = 'grade3-math-legacy-entry';
    item.dataset.activityId = reference.activityId;
    const name = document.createElement('strong');
    name.textContent = reference.title;
    const status = document.createElement('small');
    status.textContent = reference.status === 'candidate_pending_teacher_review' ? '候選學習單元・待教師審查・沿用舊目錄條件' : '既有原型・候選示範・非正式精熟證據';
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'button button-secondary';
    link.textContent = reference.entry === 'legacy-number-island' ? '前往數字島示範入口' : '前往數字島候選單元目錄';
    link.addEventListener('click', () => {
      const target = document.getElementById(reference.entry === 'legacy-number-island' ? 'level-start-button' : 'math-level-directory-list');
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (target instanceof HTMLButtonElement) target.focus({ preventScroll: true });
    });
    item.append(name, status, link);
    legacy.append(item);
  }
  host.append(legacy);
  const legacyMapButton = document.createElement('button');
  legacyMapButton.type = 'button';
  legacyMapButton.className = 'button button-secondary grade3-math-legacy-map-link';
  legacyMapButton.textContent = '查看完整既有數字島關卡目錄';
  legacyMapButton.addEventListener('click', () => document.getElementById('math-level-directory-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  host.append(legacyMapButton);
}

function startGrade3MathRepairMainline(restart = false) {
  const route = GRADE3_MATH_REPAIR_MAINLINE;
  if (restart) for (const stop of route.stops) completedCandidateRouteStops.delete(stop.activityId);
  const nextIndex = route.stops.findIndex(({ activityId }) => !completedCandidateRouteStops.has(activityId));
  const stopIndex = nextIndex < 0 ? 0 : nextIndex;
  const stop = route.stops[stopIndex];
  selectedGradeId = route.gradeId;
  selectedSubjectId = route.subjectId;
  startCatalogCandidateTask(stop.activityId, { routeId: route.routeId, stopIndex });
}

function renderGrade3MathRepairMainline() {
  const host = document.getElementById('grade3-math-repair-mainline');
  if (!host) return;
  host.replaceChildren();
  const route = GRADE3_MATH_REPAIR_MAINLINE;
  const completedCount = route.stops.filter(({ activityId }) => completedCandidateRouteStops.has(activityId)).length;
  const card = document.createElement('section');
  card.className = 'grade3-math-mainline-card';
  card.dataset.routeId = route.routeId;
  const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = '候選連續任務・記憶體進度';
  const title = document.createElement('h3'); title.textContent = route.title;
  const story = document.createElement('p'); story.className = 'grade3-math-mainline-story'; story.textContent = '數字島的能源核心熄滅了。沿著修復路線操作既有數學關卡，逐步找回位值、運算、數量表徵、測量與資料線索。';
  const note = document.createElement('p'); note.className = 'grade3-math-mainline-note'; note.textContent = `${route.sequenceNote} ${route.evidenceNote} ${route.finaleScope}`;
  const progressLabel = document.createElement('strong'); progressLabel.className = 'grade3-math-mainline-progress'; progressLabel.textContent = `本次主線體驗：${completedCount}/${route.stops.length} 站完成（只存在目前頁面記憶體）`;
  const list = document.createElement('ol'); list.className = 'grade3-math-mainline-stops';
  for (const stop of route.stops) {
    const task = CATALOG_CANDIDATE_TASK_BY_ID.get(stop.activityId);
    const item = document.createElement('li'); item.dataset.activityId = stop.activityId;
    item.className = completedCandidateRouteStops.has(stop.activityId) ? 'is-complete' : '';
    const heading = document.createElement('strong'); heading.textContent = `${stop.order}. ${stop.missionTitle}`;
    const taskTitle = document.createElement('span'); taskTitle.textContent = `既有關卡：${stop.title}`;
    const goal = document.createElement('p'); goal.textContent = stop.missionGoal;
    const codes = document.createElement('small'); codes.textContent = `課綱參照：${stop.curriculumCodes.join('、')}；候選待教師審查`;
    const state = document.createElement('small'); state.textContent = item.classList.contains('is-complete') ? '本次已完成' : task?.status === 'candidate_pending_teacher_review' ? '候選可玩關卡' : '狀態待確認';
    item.append(heading, taskTitle, goal, codes, state); list.append(item);
  }
  const actions = document.createElement('div'); actions.className = 'grade3-math-mainline-actions';
  const start = document.createElement('button'); start.type = 'button'; start.className = 'button button-primary'; start.id = 'grade3-math-mainline-start';
  start.textContent = completedCount === 0 ? '開始數字島修復任務' : completedCount === route.stops.length ? '重新開始主線' : `繼續主線（第 ${completedCount + 1} 站）`;
  start.addEventListener('click', () => startGrade3MathRepairMainline(completedCount === route.stops.length));
  actions.append(start);
  if (completedCount > 0 && completedCount < route.stops.length) {
    const restart = document.createElement('button'); restart.type = 'button'; restart.className = 'button button-secondary'; restart.id = 'grade3-math-mainline-restart'; restart.textContent = '從第一站重新開始';
    restart.addEventListener('click', () => startGrade3MathRepairMainline(true)); actions.append(restart);
  }
  card.append(eyebrow, title, story, note, progressLabel, list, actions); host.append(card);
}

function returnToGrade3MathAdventureMap() {
  activeCandidateRouteContext = null;
  selectedGradeId = 'grade-3';
  selectedSubjectId = 'mathematics';
  renderGradeSelection();
  showScreen('select');
  requestAnimationFrame(() => document.getElementById('grade3-math-adventure-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function renderCandidateRoutes(grade) {
  const panel = document.getElementById('grade-candidate-route-panel');
  panel.replaceChildren();
  const route = grade.gradeNumber === 3 ? null : grade.candidateRoutes?.[0];
  panel.hidden = !route;
  if (!route) return;
  const heading = document.createElement('h3');
  heading.id = 'grade-candidate-route-title';
  heading.className = 'grade-directory-title';
  heading.textContent = route.title;
  const note = document.createElement('p');
  note.className = 'candidate-route-note';
  note.textContent = `${route.sequenceNote} ${route.evidenceNote}`;
  const scopeDetails = document.createElement('details');
  scopeDetails.className = 'candidate-route-exclusions';
  const scopeSummary = document.createElement('summary');
  scopeSummary.textContent = '本路線未納入的目錄項目及原因';
  const scopeList = document.createElement('ul');
  for (const omitted of route.omittedCatalogEntries ?? []) {
    const definition = SUBJECT_DEFINITIONS.find(({ subjectId }) => subjectId === omitted.subjectId);
    const item = document.createElement('li');
    item.textContent = `${definition?.name ?? omitted.subjectId}：${omitted.reason}`;
    scopeList.append(item);
  }
  scopeDetails.append(scopeSummary, scopeList);
  const list = document.createElement('ol');
  list.className = 'candidate-route-stops';
  for (const stop of route.stops) {
    const subject = grade.subjects.find(({ subjectId }) => subjectId === stop.subjectId);
    const item = document.createElement('li');
    item.className = 'candidate-route-stop';
    item.dataset.activityId = stop.activityId;
    item.dataset.routeStopId = stop.stopId;
    const meta = document.createElement('p');
    meta.className = 'candidate-route-meta';
    meta.textContent = `第 ${stop.order} 站｜${subject?.name ?? stop.subjectId}｜候選待教師審查`;
    const title = document.createElement('h4');
    title.textContent = stop.title;
    const objective = document.createElement('p');
    objective.textContent = `任務目標：${stop.learningObjective}`;
    const rationale = document.createElement('p');
    rationale.textContent = `路線安排：${stop.routeRationale}`;
    const refs = document.createElement('p');
    refs.className = 'candidate-route-reference';
    refs.textContent = `課綱代碼：${stop.curriculumCodes.join('、')}；追溯資料：${stop.curriculumSourceRef}（核對狀態請以來源紀錄為準）。活動範圍：${stop.curriculumScope}`;
    const state = document.createElement('p');
    state.className = 'candidate-route-state';
    state.setAttribute('aria-live', 'polite');
    state.textContent = completedCandidateRouteStops.has(stop.activityId) ? '本次瀏覽已完成（記憶體狀態）' : '尚未完成本次體驗';
    const launch = document.createElement('button');
    launch.type = 'button';
    launch.className = 'button button-primary candidate-route-launch';
    launch.dataset.routeActivityId = stop.activityId;
    launch.textContent = completedCandidateRouteStops.has(stop.activityId) ? '重玩此站' : '開始此站';
    launch.addEventListener('click', () => {
      selectedGradeId = route.gradeId;
      selectedSubjectId = stop.subjectId;
      startCatalogCandidateTask(stop.activityId, { routeId: route.routeId, stopIndex: stop.order - 1 });
    });
    item.append(meta, title, objective, rationale, refs, state, launch);
    list.append(item);
  }
  panel.append(heading, note, scopeDetails, list);
}

function renderReadingQuest() {
  const host = document.getElementById('reading-quest-content');
  if (!host) return;
  host.replaceChildren();
  const stage = STORY_FOREST_READING_QUEST.stages[readingQuestSession.stageIndex];
  const addButton = (label, className, onClick) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    host.append(button);
    return button;
  };
  const renderPassage = (passage) => {
    const card = document.createElement('article');
    card.className = 'reading-passage-card';
    const title = document.createElement('h2');
    title.textContent = passage.title;
    const list = document.createElement('ol');
    for (const line of passage.lines) {
      const item = document.createElement('li');
      item.textContent = line;
      list.append(item);
    }
    card.append(title, list);
    host.append(card);
  };
  const renderCurrentStage = () => {
    const title = document.createElement('h2');
    title.className = 'reading-stage-heading';
    title.textContent = `探險 ${readingQuestSession.stageIndex + 1}／${STORY_FOREST_READING_QUEST.stages.length}`;
    const prompt = document.createElement('p');
    prompt.className = 'reading-stage-prompt';
    prompt.textContent = stage.prompt;
    host.append(title, prompt);
    const list = document.createElement('div');
    list.className = 'reading-choice-list';
    for (const option of stage.options) {
      const selected = readingQuestSession.selection.includes(option.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `reading-quest-option${selected ? ' is-selected' : ''}`;
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = option.text;
      button.addEventListener('click', () => {
        const action = stage.interaction === 'collect_evidence' ? 'toggle_evidence' : 'select_option';
        readingQuestSession = dispatchLearningTask(readingQuestSession, STORY_FOREST_READING_QUEST, action, { optionId: option.id }).session;
        renderReadingQuest();
      });
      list.append(button);
    }
    host.append(list);
    if (stage.interaction === 'collect_evidence') {
      const count = document.createElement('p');
      count.className = 'reading-selection-count';
      count.textContent = `已收集 ${readingQuestSession.selection.length} 個線索；選兩個後檢查。`;
      host.append(count);
    }
    if (readingQuestSession.hintLevel > 0) {
      const hint = document.createElement('p');
      hint.className = 'reading-hint';
      hint.setAttribute('role', 'status');
      hint.textContent = `提示 ${readingQuestSession.hintLevel}：${stage.hints[readingQuestSession.hintLevel - 1]}`;
      host.append(hint);
    }
    const controls = document.createElement('div');
    controls.className = 'reading-task-controls';
    if (readingQuestSession.hintLevel < stage.hints.length) {
      const hintButton = document.createElement('button');
      hintButton.type = 'button'; hintButton.className = 'button button-secondary'; hintButton.textContent = '查看提示';
      hintButton.addEventListener('click', () => { readingQuestSession = dispatchLearningTask(readingQuestSession, STORY_FOREST_READING_QUEST, 'hint').session; renderReadingQuest(); });
      controls.append(hintButton);
    }
    const submit = document.createElement('button');
    submit.type = 'button'; submit.className = 'button button-primary'; submit.textContent = stage.interaction === 'collect_evidence' ? '檢查線索' : '送出想法';
    submit.disabled = readingQuestSession.selection.length === 0;
    submit.addEventListener('click', () => { readingQuestSession = dispatchLearningTask(readingQuestSession, STORY_FOREST_READING_QUEST, 'submit').session; renderReadingQuest(); });
    controls.append(submit);
    host.append(controls);
  };

  if (readingQuestSession.phase === 'intro') {
    const intro = document.createElement('article'); intro.className = 'reading-quest-intro';
    const copy = document.createElement('p'); copy.textContent = STORY_FOREST_READING_QUEST.instructions;
    const meta = document.createElement('p'); meta.textContent = `候選目標：${STORY_FOREST_READING_QUEST.learningObjective.statement}`;
    intro.append(copy, meta); host.append(intro);
    addButton('開始收集故事線索', 'button button-primary', () => { readingQuestSession = dispatchLearningTask(readingQuestSession, STORY_FOREST_READING_QUEST, 'start').session; renderReadingQuest(); });
  } else if (readingQuestSession.phase === 'completed') {
    const heading = document.createElement('h2'); heading.textContent = '線索任務完成！';
    const summary = document.createElement('p'); summary.textContent = `你完成了 ${STORY_FOREST_READING_QUEST.stages.length} 個故事挑戰，共留下 ${readingQuestSession.attempts.length} 次作答嘗試。這是本次候選活動紀錄，不代表正式學習檢核或精熟。`;
    host.append(heading, summary);
    const list = document.createElement('ol');
    for (const attempt of readingQuestSession.attempts) { const item = document.createElement('li'); item.textContent = `${STORY_FOREST_READING_QUEST.stages.find(({ stageId }) => stageId === attempt.stageId)?.prompt} ${attempt.result === 'correct' ? '完成' : '重新思考'}${attempt.hintUsed ? '（曾使用提示）' : '（未使用提示）'}`; list.append(item); }
    host.append(list);
    addButton('再玩一次', 'button button-primary', () => { readingQuestSession = dispatchLearningTask(readingQuestSession, STORY_FOREST_READING_QUEST, 'restart').session; renderReadingQuest(); });
    return;
  } else if (stage) {
    const passage = STORY_FOREST_READING_QUEST.passages[stage.passageId];
    if (passage) renderPassage(passage);
    if (readingQuestSession.phase === 'active') renderCurrentStage();
    else if (readingQuestSession.phase === 'feedback' || readingQuestSession.phase === 'success') {
      const message = document.createElement('p');
      message.className = `reading-task-feedback ${readingQuestSession.lastFeedback?.correct ? 'is-correct' : 'is-incorrect'}`;
      message.setAttribute('role', 'status'); message.textContent = readingQuestSession.lastFeedback?.text ?? '';
      host.append(message);
      addButton(readingQuestSession.phase === 'success' ? '繼續下一段探險' : '再讀一次並重試', 'button button-primary', () => {
        readingQuestSession = dispatchLearningTask(readingQuestSession, STORY_FOREST_READING_QUEST, readingQuestSession.phase === 'success' ? 'next' : 'retry').session;
        renderReadingQuest();
      });
    }
  }
}

function renderReusableCandidateTask(activity, session, host, updateSession, taskKind) {
  host.replaceChildren();
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (label, className, handler) => {
    const node = element('button', className, label);
    node.type = 'button';
    node.addEventListener('click', handler);
    host.append(node);
    return node;
  };
  const dispatch = (action, payload = {}) => {
    const result = dispatchLearningTask(session, activity, action, payload);
    updateSession(result.session);
    renderReusableCandidateTask(activity, result.session, host, updateSession, taskKind);
    return result;
  };
  const makeClockFace = (hour, minute, label = '類比鐘面') => {
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    face.setAttribute('viewBox', '0 0 240 240'); face.setAttribute('role', 'img'); face.setAttribute('aria-label', label);
    const cx = 120; const cy = 120; const radius = 92;
    const circle = document.createElementNS(face.namespaceURI, 'circle');
    circle.setAttribute('cx', String(cx)); circle.setAttribute('cy', String(cy)); circle.setAttribute('r', String(radius)); circle.setAttribute('fill', '#fff'); circle.setAttribute('stroke', '#31596b'); circle.setAttribute('stroke-width', '4'); face.append(circle);
    for (let n = 1; n <= 12; n += 1) {
      const angle = n * Math.PI / 6; const labelNode = document.createElementNS(face.namespaceURI, 'text');
      labelNode.setAttribute('x', String(cx + Math.sin(angle) * 72)); labelNode.setAttribute('y', String(cy - Math.cos(angle) * 72 + 6));
      labelNode.setAttribute('text-anchor', 'middle'); labelNode.setAttribute('font-size', '16'); labelNode.textContent = String(n); face.append(labelNode);
    }
    const drawHand = (angle, length, color, width) => {
      const line = document.createElementNS(face.namespaceURI, 'line');
      line.setAttribute('x1', String(cx)); line.setAttribute('y1', String(cy));
      line.setAttribute('x2', String(cx + Math.sin(angle) * length)); line.setAttribute('y2', String(cy - Math.cos(angle) * length));
      line.setAttribute('stroke', color); line.setAttribute('stroke-width', String(width)); line.setAttribute('stroke-linecap', 'round'); face.append(line);
    };
    drawHand(((hour % 12) * 30 + minute * 0.5) * Math.PI / 180, 48, '#d05d37', 6);
    drawHand(minute * 6 * Math.PI / 180, 68, '#155a78', 4);
    const hub = document.createElementNS(face.namespaceURI, 'circle'); hub.setAttribute('cx', String(cx)); hub.setAttribute('cy', String(cy)); hub.setAttribute('r', '5'); hub.setAttribute('fill', '#233b46'); face.append(hub);
    return face;
  };
  const formatClockTime = (hour, minute) => `${hour}:${String(minute).padStart(2, '0')}`;
  const studentActivityTitle = activity.title?.split(/[：:]/, 1)[0] ?? activity.title ?? '學習冒險';
  const humanizeCandidateStatus = (status) => ({
    candidate_pending_teacher_review: '候選活動，待教師審查',
  })[status] ?? status;
  const humanizeTeacherReviewStatus = (status) => ({
    not_reviewed: '尚未審查',
    reviewed: '已完成審查',
  })[status] ?? status;
  const humanizeCoverageStatus = (status) => ({
    partial: '部分涵蓋',
    relation_only: '僅有關聯，尚無足夠互動證據',
    uncovered: '尚未涵蓋',
    needs_verification: '待核實',
    covered: '已完成內容核對，待教師審查',
  })[status] ?? status;
  const appendTeacherDetails = () => {
    const details = element('details', 'candidate-teacher-info');
    details.append(element('summary', '', '👩‍🏫 教師／課綱資訊'));
    const content = element('div', 'candidate-teacher-info-content');
    const addInfo = (label, value) => {
      if (value === undefined || value === null || value === '') return;
      content.append(element('p', '', `${label}：${value}`));
    };
    addInfo('活動狀態', humanizeCandidateStatus(activity.status));
    addInfo('教師審查', humanizeTeacherReviewStatus(activity.teacherReview?.status));
    addInfo('學習目標', activity.learningObjective?.statement);
    if (activity.curriculumCodes?.length) addInfo('課綱參照', activity.curriculumCodes.join('、'));
    if (activity.curriculumMapId) addInfo('課程地圖', '已連結課程地圖（技術識別見下方）');
    addInfo('活動範圍', activity.curriculumScope);
    addInfo('候選任務說明', activity.instructions);
    if (activity.evidencePolicy && typeof activity.evidencePolicy === 'object') {
      const policy = activity.evidencePolicy;
      const policyInfo = element('section', 'candidate-evidence-policy');
      policyInfo.append(element('strong', '', '證據紀錄方式'));
      const persistence = policy.persistence === 'memory_only_no_student_records_no_localStorage'
        ? '僅保留於本次頁面記憶體，不寫入學生紀錄或 localStorage'
        : '依本活動設定記錄';
      policyInfo.append(element('p', '', `紀錄方式：${persistence}`));
      if (typeof policy.completionIsMastery === 'boolean') policyInfo.append(element('p', '', `是否代表精熟：${policy.completionIsMastery ? '是' : '否'}`));
      if (typeof policy.hintAssistedResponseIsIndependentEvidence === 'boolean') policyInfo.append(element('p', '', `提示後作答是否視為獨立證據：${policy.hintAssistedResponseIsIndependentEvidence ? '是' : '否'}`));
      content.append(policyInfo);
    } else if (typeof activity.evidencePolicy === 'string') {
      addInfo('證據紀錄方式', activity.evidencePolicy);
    }
    if (activity.coverage?.status) addInfo('內容對照狀態', humanizeCoverageStatus(activity.coverage.status));
    if (activity.coverage?.covered?.length) addInfo('已涵蓋內容', activity.coverage.covered.join('；'));
    if (activity.coverage?.notCovered?.length) addInfo('尚未涵蓋內容', activity.coverage.notCovered.join('；'));
    if (activity.openQuestions?.length) {
      content.append(element('p', '', '教師核對事項：'));
      const questions = element('ul', 'candidate-teacher-open-questions');
      for (const question of activity.openQuestions) questions.append(element('li', '', question));
      content.append(questions);
    }
    addInfo('候選紀錄說明', '活動完成狀態只保存在本次頁面記憶體，不會寫入正式學生進度、成績、精熟度或解鎖。');
    const technical = element('details', 'candidate-teacher-technical');
    technical.append(element('summary', '', '技術識別（供核對）'));
    const technicalContent = element('div', 'candidate-teacher-technical-content');
    for (const [label, value] of [
      ['活動 ID', activity.activityId],
      ['學習目標 ID', activity.learningObjective?.objectiveId],
      ['課程地圖 ID', activity.curriculumMapId],
    ]) {
      if (value) technicalContent.append(element('p', '', `${label}：${value}`));
    }
    technical.append(technicalContent);
    content.append(technical);
    details.append(content);
    host.append(details);
    return content;
  };
  if (session.phase === 'intro') {
    const intro = element('article', 'reading-quest-intro candidate-student-intro');
    intro.append(element('p', 'candidate-student-summary', activity.stages[0]?.prompt ?? activity.instructions ?? '完成任務中的挑戰。'));
    intro.append(element('p', 'candidate-student-challenge-count', `${activity.stages.length} 個挑戰`));
    host.append(intro);
    button('開始挑戰', 'button button-primary', () => dispatch('start'));
    appendTeacherDetails();
    return;
  }
  if (session.phase === 'completed') {
    host.append(element('h2', 'candidate-student-completion-title', '挑戰完成！'));
    host.append(element('p', 'candidate-student-completion-summary', `你完成了「${studentActivityTitle}」的 ${activity.stages.length} 個挑戰。`));
    host.append(element('p', 'candidate-memory-reward', `獲得「${activity.completionReward ?? '探索小隊完成章'}」！`));
    if (activeCandidateRouteContext) {
      if (activeCandidateRouteContext.kind === 'grade3-math-adventure-map') {
        button('返回三年級數學冒險地圖', 'button button-secondary candidate-route-next', returnToGrade3MathAdventureMap);
      }
      const route = GRADE_CATALOG.flatMap(({ candidateRoutes }) => candidateRoutes ?? []).find(({ routeId }) => routeId === activeCandidateRouteContext.routeId);
      const currentStop = route?.stops[activeCandidateRouteContext.stopIndex];
      if (currentStop?.activityId === activity.activityId) {
        completedCandidateRouteStops.add(activity.activityId);
        if (currentStop.storyAfterCompletion) host.append(element('article', 'candidate-route-story-progress', currentStop.storyAfterCompletion));
        const nextStop = route.stops[activeCandidateRouteContext.stopIndex + 1];
        if (nextStop) {
          const nextSubject = route.gradeId && getGradeById(route.gradeId)?.subjects.find(({ subjectId }) => subjectId === nextStop.subjectId);
          button(`前往下一站：${nextSubject?.name ?? nextSubject?.subjectId ?? route.subjectId ?? nextStop.subjectId}｜${nextStop.missionTitle ?? nextStop.title}`, 'button button-secondary candidate-route-next', () => {
            selectedGradeId = route.gradeId;
            selectedSubjectId = nextStop.subjectId;
            startCatalogCandidateTask(nextStop.activityId, { routeId: route.routeId, stopIndex: nextStop.order - 1 });
          });
        } else {
          if (route.routeId === GRADE3_MATH_REPAIR_MAINLINE.routeId) {
            host.append(element('h2', 'candidate-route-finale-title', '數字島修復完成！'));
            host.append(element('p', 'candidate-route-finale-summary', `十站候選主線已依序完成。第十站把 18 個水壺與新送來的 6 個先合成 24 個，再平均分裝到 4 箱，每箱 6 個。這只記錄本次遊戲流程，不代表精熟或正式解鎖。`));
          }
          if (route.gradeId === 'grade-3') button('返回三年級數學冒險地圖', 'button button-secondary candidate-route-next', returnToGrade3MathAdventureMap);
          else button('返回四年級學習路線', 'button button-secondary candidate-route-next', () => { activeCandidateRouteContext = null; renderGradeSelection(); showScreen('select'); });
        }
      }
    }
    button('回到遊戲選單', 'button button-secondary candidate-student-return-menu', () => {
      activeCandidateRouteContext = null;
      selectedGradeId = activity.gradeId;
      selectedSubjectId = activity.subjectId;
      renderGradeSelection();
      showScreen('select');
    });
    button('再玩一次', 'button button-primary', () => dispatch('restart'));
    const teacherInfo = appendTeacherDetails();
    teacherInfo.append(element('p', '', `完成 ${activity.stages.length} 個階段，共 ${session.attempts.length} 次作答嘗試；以下僅為本次候選活動紀錄。`));
    const list = element('ol', 'candidate-attempt-list');
    for (const attempt of session.attempts) {
      const stage = activity.stages.find(({ stageId }) => stageId === attempt.stageId);
      list.append(element('li', '', `${stage.prompt} ${attempt.result === 'correct' ? '完成' : '曾答錯後修正'}；${attempt.hintUsed ? '使用過提示' : '未使用提示'}。`));
    }
    teacherInfo.append(list);
    return;
  }
  const stage = activity.stages[session.stageIndex];
  if (!stage) return;
  host.append(element('h2', 'reading-stage-heading', `挑戰 ${session.stageIndex + 1}／${activity.stages.length}`));
  if (stage.context?.length) {
    const dialogue = element('article', 'candidate-context-card');
    dialogue.setAttribute('aria-label', '情境資料');
    dialogue.append(element('h3', 'candidate-source-heading', '情境資料'));
    for (const line of stage.context) dialogue.append(element('p', '', `${line.speaker}：${line.text}`));
    host.append(dialogue);
  }
  if (stage.passageId && activity.passages?.[stage.passageId]) {
    const passage = activity.passages[stage.passageId];
    const article = element('article', 'reading-passage-card');
    article.setAttribute('aria-label', '閱讀資料');
    article.append(element('h3', 'candidate-source-heading', '閱讀資料'), element('h4', '', passage.title));
    const lines = element('ol', '');
    for (const line of passage.lines ?? []) lines.append(element('li', '', line));
    article.append(lines);
    host.append(article);
  }
  if (stage.evidenceRecords?.length) {
    const evidence = element('section', 'candidate-evidence-records');
    evidence.setAttribute('aria-label', '觀察資料');
    evidence.append(element('h3', 'candidate-source-heading', '觀察資料'));
    for (const record of stage.evidenceRecords) {
      const card = element('article', 'candidate-observation-record');
      card.append(element('strong', '', record.title), element('p', '', record.text));
      evidence.append(card);
    }
    host.append(evidence);
  }
  const appendTableView = (table, dynamicAssignments = null, crossTab = null) => {
    if (!table && !crossTab) return;
    const wrapper = element('div', 'candidate-table-wrap');
    wrapper.setAttribute('aria-label', '題目提供的表格資料');
    const node = element('table', 'candidate-frequency-table');
    node.append(element('caption', '', table?.title ?? '交叉表'));
    const columns = table?.columns ?? crossTab?.columns ?? [];
    const rows = table?.rows ?? crossTab?.rows ?? [];
    const rowHeader = table?.rowHeader ?? crossTab?.rowHeader ?? '類別';
    const head = document.createElement('tr');
    head.append(element('th', '', `${rowHeader}／${table?.columnHeader ?? crossTab?.columnHeader ?? ''}`));
    for (const column of columns) head.append(element('th', '', column.label));
    const thead = document.createElement('thead'); thead.append(head); node.append(thead);
    const tbody = document.createElement('tbody');
    for (const rowData of rows) {
      const tr = document.createElement('tr'); tr.append(element('th', '', rowData.label));
      for (const column of columns) {
        let value = table ? rowData.values?.[column.id] : 0;
        if (crossTab) {
          const categoryId = crossTab.cellCategoryIds[`${rowData.id}|${column.id}`];
          value = Object.values(dynamicAssignments ?? {}).filter((id) => id === categoryId).length;
        }
        tr.append(element('td', '', String(value ?? '')));
      }
      tbody.append(tr);
    }
    node.append(tbody); wrapper.append(node); host.append(wrapper);
  };
  if (stage.tableView) appendTableView(stage.tableView);
  host.append(element('p', 'reading-stage-prompt candidate-student-task', `這一關要做什麼：${stage.prompt}`));
  const answerCount = stage.correctOptionIds?.length ?? (stage.correctOptionId ? 1 : 0);
  const responseGuidance = stage.interaction === 'order_items'
    ? '操作方式：① 看清楚題目 → ② 用「上移／下移」調整順序 → ③ 排好後檢查答案'
    : stage.interaction === 'assemble_response'
      ? '操作方式：① 看清楚題目 → ② 依順序點選內容 → ③ 檢查「我的答案」 → ④ 完成後檢查答案'
    : stage.interaction === 'choose_response'
      ? stage.selectionMode === 'multiple' ? '作答方式：這題可以選多個答案' : '作答方式：請選 1 個答案'
    : stage.interaction === 'collect_evidence'
      ? stage.options?.every((option) => Number.isFinite(option.valueAmount))
        ? '操作方式：① 看清楚付款需求 → ② 選擇錢幣 → ③ 確認目前合計 → ④ 完成後檢查答案'
        : stage.evidenceRecords?.length
          ? '操作方式：① 看觀察資料 → ② 選出符合題目的證據 → ③ 檢查「我的選擇」 → ④ 完成後檢查答案'
          : stage.context?.length || stage.passageId && activity.passages?.[stage.passageId] || stage.tableView
            ? '操作方式：① 看題目提供的資料 → ② 選出符合題目的證據 → ③ 檢查「我的選擇」 → ④ 完成後檢查答案'
            : '操作方式：① 看清楚題目 → ② 選出符合題目的證據 → ③ 檢查「我的選擇」 → ④ 完成後檢查答案'
    : stage.interaction === 'magnet_interaction'
      ? '操作方式：① 操作 → ② 觀察 → ③ 作答'
    : stage.interaction === 'classify_observations'
      ? '操作方式：① 看觀察紀錄 → ② 選擇分類'
      : stage.options?.length && answerCount > 0
        ? answerCount === 1 ? '這是單選題，請選 1 個答案。' : `這是複選題，請選 ${answerCount} 個答案。`
        : '操作方式：① 操作 → ② 觀察 → ③ 作答';
  host.append(element('p', 'candidate-student-response-guidance', responseGuidance));
  const classificationProgress = stage.interaction === 'classify_observations' && stage.observations?.length
    ? {
      completedCount: session.phase === 'success'
        ? stage.observations.length
        : stage.observations.filter(({ id }) => Boolean(session.assignments?.[id])).length,
      totalCount: stage.observations.length,
    }
    : null;
  if (classificationProgress) {
    host.append(element('p', 'candidate-student-answer-progress', `作答進度：${classificationProgress.completedCount} / ${classificationProgress.totalCount}`));
  }
  if (stage.deriveFromPrevious && Number.isInteger(session.previousStepResult)) host.append(element('p', 'candidate-intermediate-result', `第一步中間結果：${session.previousStepResult}。請把這個數量帶到第二步。`));
  if (session.phase === 'active' && stage.interaction === 'order_items') {
    host.append(element('h3', 'candidate-order-heading', '目前順序'));
    const board = element('ol', 'candidate-order-board');
    board.setAttribute('aria-label', '目前順序');
    for (const [index, itemId] of session.orderedItems.entries()) {
      const item = stage.items.find(({ id }) => id === itemId);
      const itemText = item?.text ?? itemId;
      const row = element('li', 'candidate-order-row');
      row.dataset.orderItemId = itemId;
      row.tabIndex = -1;
      row.setAttribute('aria-label', `第 ${index + 1} 項：${itemText}`);
      row.append(element('span', 'candidate-order-position', String(index + 1)), element('span', 'candidate-order-text', itemText));
      const controls = element('span', 'candidate-order-controls');
      const up = element('button', 'candidate-token', '上移'); up.type = 'button'; up.disabled = index === 0; up.setAttribute('aria-label', `將「${itemText}」上移${up.disabled ? '；這一項已經在最上面' : ''}`); if (up.disabled) up.title = '這一項已經在最上面';
      up.addEventListener('click', () => {
        dispatch('move_ordered_item', { itemId, toIndex: index - 1 });
        [...host.querySelectorAll('.candidate-order-row')].find((candidateRow) => candidateRow.dataset.orderItemId === itemId)?.focus();
      });
      const down = element('button', 'candidate-token', '下移'); down.type = 'button'; down.disabled = index === session.orderedItems.length - 1; down.setAttribute('aria-label', `將「${itemText}」下移${down.disabled ? '；這一項已經在最下面' : ''}`); if (down.disabled) down.title = '這一項已經在最下面';
      down.addEventListener('click', () => {
        dispatch('move_ordered_item', { itemId, toIndex: index + 1 });
        [...host.querySelectorAll('.candidate-order-row')].find((candidateRow) => candidateRow.dataset.orderItemId === itemId)?.focus();
      });
      controls.append(up, down); row.append(controls); board.append(row);
    }
    host.append(board);
  }
    if (stage.circleDiagram || stage.interaction === 'adjust_circle_radius') {
      const circleDiagram = stage.circleDiagram ?? { highlight: 'radius', caption: '滑桿調整圓心到圓周的示意距離' };
      const previewRadius = stage.interaction === 'adjust_circle_radius'
        ? (session.circleRadius ?? stage.circleRules.minRadius) * 12
        : undefined;
      renderCircleDiagram(circleDiagram, host, element, previewRadius);
    }
  if (session.phase === 'active' && stage.interaction === 'complete_calculation_steps') {
    const panel = element('section', 'candidate-response-build calculation-step-board');
    panel.append(element('strong', '', stage.calculationTitle));
    for (const step of stage.calculationSteps) {
      const row = element('fieldset', 'calculation-step-row');
      row.append(element('legend', '', step.label));
      const choices = element('div', 'candidate-token-list');
      for (const choice of step.choices) {
        const selected = session.calculationValues[step.id] === choice.value;
        const tile = element('button', `candidate-token${selected ? ' is-selected' : ''}`, String(choice.label ?? choice.value));
        tile.type = 'button'; tile.setAttribute('aria-pressed', String(selected));
        tile.addEventListener('click', () => dispatch('select_calculation_value', { stepId: step.id, value: choice.value }));
        choices.append(tile);
      }
      row.append(choices); panel.append(row);
    }
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'build_place_value_blocks') {
    const rules = stage.placeValueRules;
    const panel = element('section', 'candidate-response-build place-value-block-workbench');
    panel.append(element('strong', '', '位值積木操作板：改變積木組數，或把一個高位值換成十個相鄰低位值。'));
    const weights = { thousands: 1000, hundreds: 100, tens: 10, ones: 1 };
    const labels = { thousands: '千位', hundreds: '百位', tens: '十位', ones: '個位' };
    const quantity = Object.entries(session.placeValueBlocks).reduce((sum, [place, count]) => sum + weights[place] * count, 0);
    panel.append(element('output', 'place-value-total', `目前表示：${quantity.toLocaleString('zh-TW')}；目標：${rules.targetValue.toLocaleString('zh-TW')}`));
    const columns = element('div', 'place-value-block-columns');
    for (const place of Object.keys(weights)) {
      const count = session.placeValueBlocks[place] ?? 0;
      const column = element('section', 'place-value-block-column');
      column.append(element('strong', '', labels[place]), element('output', 'place-value-block-count', `${count} 個`));
      const blocks = element('div', 'place-value-block-display');
      blocks.setAttribute('aria-label', `${labels[place]}有${count}個積木`);
      for (let index = 0; index < count; index += 1) blocks.append(element('span', `place-value-block place-value-block-${place}`, ''));
      column.append(blocks);
      const controls = element('div', 'place-value-block-controls');
      for (const [delta, label] of [[-1, `減少一個${labels[place]}積木`], [1, `增加一個${labels[place]}積木`]]) {
        const control = element('button', 'candidate-token', delta < 0 ? '−' : '+'); control.type = 'button'; control.setAttribute('aria-label', label);
        control.disabled = delta < 0 ? count === 0 : count >= rules.maxCounts[place];
        control.addEventListener('click', () => dispatch('adjust_place_value_block', { place, delta })); controls.append(control);
      }
      column.append(controls); columns.append(column);
    }
    panel.append(columns);
    if (rules.allowedExchanges.length) {
      const exchanges = element('div', 'place-value-exchange-controls');
      for (const { from, to } of rules.allowedExchanges) {
        const control = element('button', 'button button-secondary', `1 個${labels[from]} → 10 個${labels[to]}`); control.type = 'button';
        control.disabled = (session.placeValueBlocks[from] ?? 0) < 1;
        control.addEventListener('click', () => dispatch('exchange_place_value_block', { from, to })); exchanges.append(control);
      }
      panel.append(exchanges, element('p', '', `已操作交換：${session.placeValueExchangeCount} 次；交換前後總值應維持 ${rules.targetValue.toLocaleString('zh-TW')}。`));
    }
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'operate_vertical_calculation') {
    const panel = element('section', 'candidate-response-build vertical-calculation-workbench');
    panel.append(element('strong', '', '直式操作板：逐欄調整寫下的數字，並檢查進位／退位紀錄。'));
    const board = element('div', 'vertical-calculation-board');
    board.setAttribute('aria-label', `直式 ${stage.verticalLayout.topNumber} ${stage.verticalLayout.operator} ${stage.verticalLayout.bottomNumber}`);
    const placeLabels = ['千位', '百位', '十位', '個位'];
    for (const [rowLabel, digits] of [
      ['上方數', String(stage.verticalLayout.topNumber)],
      [stage.verticalLayout.operator, String(stage.verticalLayout.bottomNumber)],
    ]) {
      const label = element('span', 'vertical-calculation-row-label', rowLabel); board.append(label);
      [...digits].forEach((digit, index) => board.append(element('span', 'vertical-calculation-digit', digit)));
    }
    board.append(element('span', 'vertical-calculation-row-label', '結果'));
    for (const column of stage.verticalLayout.columns) {
      const step = stage.calculationSteps.find(({ id }) => id === column.digitStepId);
      const value = session.verticalCalculationValues[column.digitStepId] ?? 0;
      const cell = element('section', 'vertical-calculation-result-column');
      cell.append(element('small', '', column.label), element('output', 'vertical-calculation-result-digit', String(value)));
      if (step) {
        const controls = element('div', 'vertical-calculation-step-controls');
        for (const delta of [-1, 1]) {
          const control = element('button', 'candidate-token', delta < 0 ? '−' : '+'); control.type = 'button';
          control.setAttribute('aria-label', `${column.label}結果${delta < 0 ? '減少' : '增加'}一`);
          control.disabled = delta < 0 ? value <= step.minValue : value >= step.maxValue;
          control.addEventListener('click', () => dispatch('adjust_vertical_calculation_step', { stepId: step.id, delta })); controls.append(control);
        }
        cell.append(controls);
      }
      board.append(cell);
    }
    panel.append(board);
    const transfers = stage.calculationSteps.filter(({ kind }) => kind !== 'digit');
    if (transfers.length) {
      panel.append(element('strong', 'vertical-transfer-heading', stage.verticalLayout.operator === '+' ? '進位紀錄' : '退位交換紀錄'));
      const ledger = element('div', 'vertical-transfer-ledger');
      for (const step of transfers) {
        const row = element('fieldset', 'vertical-transfer-step'); row.append(element('legend', '', step.label));
        const value = session.verticalCalculationValues[step.id] ?? step.initialValue ?? 0;
        const display = element('output', 'vertical-transfer-value', String(value));
        const controls = element('div', 'vertical-calculation-step-controls');
        for (const delta of [-1, 1]) {
          const control = element('button', 'candidate-token', delta < 0 ? '−' : '+'); control.type = 'button';
          control.setAttribute('aria-label', `${step.label}數值${delta < 0 ? '減少' : '增加'}一`);
          control.disabled = delta < 0 ? value <= step.minValue : value >= step.maxValue;
          control.addEventListener('click', () => dispatch('adjust_vertical_calculation_step', { stepId: step.id, delta })); controls.append(control);
        }
        row.append(display, controls, element('small', '', step.placeLabel)); ledger.append(row);
      }
      panel.append(ledger);
    }
    if (stage.regroupingNote) panel.append(element('p', 'vertical-regrouping-note', stage.regroupingNote));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'adjust_decimal_place_value') {
    const panel = element('section', 'candidate-response-build decimal-place-value-builder');
    const value = session.decimalHundredths;
    const whole = Math.floor(value / 100);
    const fractional = String(value % 100).padStart(2, '0');
    panel.append(element('strong', '', '位值操作板：每按一次，增加或減少 1、0.1 或 0.01。'));
    panel.append(element('output', 'decimal-place-value-display', `${whole}.${fractional}`));
    const columns = element('div', 'decimal-place-value-columns');
    for (const [place, label, amount] of [['ones', '個位', '1'], ['tenths', '十分位', '0.1'], ['hundredths', '百分位', '0.01']]) {
      const column = element('section', 'decimal-place-column');
      column.append(element('strong', '', label), element('span', 'decimal-place-amount', amount));
      for (const [delta, actionLabel] of [[1, `增加 ${amount}`], [-1, `減少 ${amount}`]]) {
        const control = element('button', 'candidate-token decimal-place-control', actionLabel); control.type = 'button';
        control.addEventListener('click', () => dispatch('adjust_decimal_place', { place, delta }));
        column.append(control);
      }
      columns.append(column);
    }
    panel.append(columns); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'adjust_circle_radius') {
    const panel = element('section', 'candidate-response-build circle-radius-builder');
    panel.append(element('strong', '', '拖動滑桿改變圓規張開的半徑，再畫出圓。'));
    const slider = element('input', 'circle-radius-slider'); slider.type = 'range'; slider.min = String(stage.circleRules.minRadius); slider.max = String(stage.circleRules.maxRadius); slider.step = '1'; slider.value = String(session.circleRadius ?? stage.circleRules.minRadius);
    slider.setAttribute('aria-label', '調整圓的半徑');
    slider.addEventListener('change', () => dispatch('set_circle_radius', { radius: Number(slider.value) }));
    panel.append(slider, element('p', '', `目前半徑：${session.circleRadius ?? '尚未調整'} 格`)); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'assemble_response') {
    host.append(element('h3', 'candidate-response-options-heading', '可選內容'));
    const tiles = element('div', 'candidate-token-list');
    for (const token of stage.tokens) {
      const isSelected = session.selection.includes(token.id);
      const tile = element('button', `candidate-token candidate-response-option${isSelected ? ' is-selected' : ''}`, `${isSelected ? '✓ ' : ''}${token.text}`);
      tile.type = 'button'; tile.setAttribute('aria-pressed', String(isSelected));
      tile.dataset.responseTokenId = token.id;
      tile.setAttribute('aria-label', isSelected ? `從我的答案移除「${token.text}」` : `將「${token.text}」加入我的答案`);
      tile.addEventListener('click', () => {
        dispatch(isSelected ? 'remove_phrase_token' : 'add_phrase_token', { tokenId: token.id });
        [...host.querySelectorAll('.candidate-response-option')].find((candidateTile) => candidateTile.dataset.responseTokenId === token.id)?.focus();
      });
      tiles.append(tile);
    }
    host.append(tiles);
    const answer = element('section', 'candidate-response-build candidate-response-answer');
    answer.setAttribute('aria-label', '我的答案，依點選順序排列');
    answer.append(element('h3', 'candidate-response-answer-heading', '我的答案'));
    if (session.selection.length === 0) {
      answer.append(element('p', 'candidate-response-empty', '還沒有加入內容。請從「可選內容」依順序點選。'));
    } else {
      const answerList = element('ol', 'candidate-response-answer-list');
      for (const [index, tokenId] of session.selection.entries()) {
        const tokenText = stage.tokens.find(({ id }) => id === tokenId)?.text ?? tokenId;
        const item = element('li', 'candidate-response-answer-item');
        item.setAttribute('aria-label', `第 ${index + 1} 項：${tokenText}`);
        item.append(element('span', 'candidate-response-sequence-number', String(index + 1)), element('span', 'candidate-response-answer-text', tokenText));
        answerList.append(item);
      }
      answer.append(answerList);
    }
    host.append(answer);
  }
  if (session.phase === 'active' && stage.interaction === 'build_array') {
    const panel = element('section', 'candidate-response-build math-array-builder');
    const total = session.arrayRows * session.arrayColumns;
    const unitLabel = stage.arrayRules.unitLabel ?? '個';
    panel.append(element('strong', '', `目前陣列：${session.arrayRows} 排 × 每排 ${session.arrayColumns} 個 = ${total} ${unitLabel}`));
    const board = element('div', 'math-array-grid');
    board.style.gridTemplateColumns = `repeat(${Math.max(1, session.arrayColumns)}, minmax(20px, 1fr))`;
    if (!total) board.append(element('p', 'math-array-empty', '調整排數與每排數量，建立物件陣列。'));
    for (let i = 0; i < total; i += 1) board.append(element('span', 'math-array-object', stage.arrayRules.objectLabel ?? '●'));
    panel.append(board);
    const controls = element('div', 'candidate-token-list');
    for (const [label, dimension, delta] of [['少一排', 'rows', -1], ['增加一排', 'rows', 1], ['每排少一個', 'columns', -1], ['每排多一個', 'columns', 1]]) {
      const control = element('button', 'candidate-token', label); control.type = 'button';
      control.addEventListener('click', () => dispatch('adjust_array_dimension', { dimension, delta }));
      controls.append(control);
    }
    panel.append(controls); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'build_unknown_quantity_model') {
    const rules = stage.unknownQuantityRules;
    const value = session.unknownQuantityValue ?? rules.initialValue;
    const panel = element('section', 'candidate-response-build unknown-quantity-model');
    panel.setAttribute('aria-label', '未知數量操作模型');
    panel.append(element('strong', '', '補給物件模型：每次增減一枚，觀察兩部分與整體的關係。'));
    const equation = element('p', 'unknown-quantity-equation', stage.equation.display.replace('{{value}}', String(value)));
    panel.append(equation);
    const tokens = element('div', 'unknown-quantity-counters');
    tokens.setAttribute('aria-label', `目前未知數量為 ${value}`);
    for (let index = 0; index < value; index += 1) tokens.append(element('span', 'unknown-quantity-counter', '●'));
    panel.append(tokens);
    if (rules.mode === 'missing_subtrahend') {
      const remaining = rules.total - value;
      panel.append(element('p', 'candidate-response-line', `原有 ${rules.total} 罐：拿走 ${value} 罐，模型剩下 ${remaining} 罐。`));
    } else if (rules.mode === 'missing_minuend') {
      panel.append(element('p', 'candidate-response-line', `原有 ${value} 箱：拿走 ${rules.knownValue} 箱，模型剩下 ${value - rules.knownValue} 箱。`));
    } else {
      panel.append(element('p', 'candidate-response-line', `${rules.knownValue} + ${value} = ${rules.knownValue + value}；目標總數 ${rules.total}。`));
    }
    const controls = element('div', 'candidate-token-list unknown-quantity-controls');
    for (const [delta, label] of [[-1, '減少一個補給物件'], [1, '增加一個補給物件']]) {
      const button = element('button', 'candidate-token', delta < 0 ? '− 減一個' : '+ 加一個');
      button.type = 'button'; button.setAttribute('aria-label', label);
      button.disabled = delta < 0 ? value <= rules.min : value >= rules.max;
      button.addEventListener('click', () => dispatch('adjust_unknown_quantity', { delta }));
      controls.append(button);
    }
    panel.append(controls); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'set_estimate_range') {
    const { min, max, step } = stage.estimateRules.inputRange;
    const panel = element('section', 'candidate-response-build estimation-slider-panel');
    if (stage.estimateRules.contextText) panel.append(element('p', 'estimate-context', stage.estimateRules.contextText));
    panel.append(element('strong', '', `拖動滑桿，選一個合理的估算值。估算可以有範圍，不必等於精確計算結果。${stage.estimateRules.unitLabel ? `單位：${stage.estimateRules.unitLabel}` : ''}`));
    const range = element('input', 'estimation-range-slider');
    range.type = 'range'; range.min = String(min); range.max = String(max); range.step = String(step);
    range.value = String(session.estimateValue ?? min);
    range.setAttribute('aria-label', '選擇估算值');
    const unit = stage.estimateRules.unitLabel ?? '';
    const output = element('output', 'estimation-current-value', session.estimateValue === null ? '尚未選擇估算值' : `目前估算：${session.estimateValue} ${unit}`.trim());
    range.addEventListener('input', () => { output.textContent = `目前估算：${range.value} ${unit}`.trim(); });
    range.addEventListener('change', () => dispatch('set_estimate_value', { value: Number(range.value) }));
    panel.append(range, output, element('p', 'estimation-input-bounds', `可選範圍：${min} 到 ${max} ${unit}，每次調整 ${step} ${unit}`.trim()));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'measure_length_model') {
    const rules = stage.lengthRules;
    const lengthUnit = rules.unitLabel ?? '毫米';
    const panel = element('section', 'candidate-response-build length-measurement-model');
    panel.append(element('strong', '', rules.instruction ?? `操作畫面中的${lengthUnit}尺模型，記錄測量結果。`));
    const control = (label, initial, min, max, onChange) => {
      const wrap = element('label', 'length-measurement-control');
      wrap.append(element('span', '', label));
      const range = element('input', 'length-measurement-slider');
      range.type = 'range'; range.min = String(min); range.max = String(max); range.step = '1'; range.value = String(initial);
      range.setAttribute('aria-label', label);
      const output = element('output', 'length-measurement-value', String(initial));
      range.addEventListener('input', () => { output.textContent = range.value; });
      range.addEventListener('change', () => onChange(Number(range.value)));
      wrap.append(range, output); return wrap;
    };
    if (rules.mode === 'estimate') {
      panel.append(element('p', '', `${rules.objectLabel}看起來有多長？先用${lengthUnit}估一估，再和模擬測量結果比較。`));
      panel.append(control(`估測長度（${lengthUnit}）`, session.lengthEstimate ?? rules.estimateRange.min, rules.estimateRange.min, rules.estimateRange.max,
        (value) => dispatch('set_length_estimate', { value })));
      panel.append(element('p', 'length-measurement-readout', session.lengthEstimate === null ? '尚未作答' : `你的估測：${session.lengthEstimate} ${lengthUnit}；完成後會顯示模擬實測值。`));
    } else if (rules.mode === 'align_read') {
      const track = element('div', 'length-ruler-visual');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const max = rules.maxReading; const scale = Math.min(8, 540 / max); const objectStartX = 76;
      const zeroX = objectStartX + (session.lengthRulerZero - rules.object.start) * scale;
      const width = Math.max(360, zeroX + max * scale + 35);
      svg.setAttribute('viewBox', `0 0 ${width} 112`); svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `物件長度示意與${lengthUnit}尺，物件起點位置 ${rules.object.start} ${lengthUnit}`);
      const object = document.createElementNS(svg.namespaceURI, 'rect'); object.setAttribute('x', String(objectStartX)); object.setAttribute('y', '18'); object.setAttribute('width', String(rules.object.length * scale)); object.setAttribute('height', '15'); object.setAttribute('rx', '3'); object.setAttribute('fill', '#e6a84c'); svg.append(object);
      const line = document.createElementNS(svg.namespaceURI, 'line'); line.setAttribute('x1', String(zeroX)); line.setAttribute('x2', String(zeroX + max * scale)); line.setAttribute('y1', '54'); line.setAttribute('y2', '54'); line.setAttribute('stroke', '#31596b'); line.setAttribute('stroke-width', '3'); svg.append(line);
      for (let tick = 0; tick <= max; tick += 1) {
        const x = zeroX + tick * scale; const major = tick % 10 === 0;
        const mark = document.createElementNS(svg.namespaceURI, 'line'); mark.setAttribute('x1', String(x)); mark.setAttribute('x2', String(x)); mark.setAttribute('y1', '54'); mark.setAttribute('y2', String(major ? 75 : 63)); mark.setAttribute('stroke', '#31596b'); mark.setAttribute('stroke-width', major ? '2' : '1'); svg.append(mark);
        if (major) { const text = document.createElementNS(svg.namespaceURI, 'text'); text.setAttribute('x', String(x)); text.setAttribute('y', '94'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '12'); text.textContent = String(tick); svg.append(text); }
      }
      const zeroMark = document.createElementNS(svg.namespaceURI, 'text'); zeroMark.setAttribute('x', String(zeroX)); zeroMark.setAttribute('y', '48'); zeroMark.setAttribute('text-anchor', 'middle'); zeroMark.setAttribute('font-size', '11'); zeroMark.textContent = '0'; svg.append(zeroMark);
      const startMark = document.createElementNS(svg.namespaceURI, 'line'); startMark.setAttribute('x1', String(objectStartX)); startMark.setAttribute('x2', String(objectStartX)); startMark.setAttribute('y1', '12'); startMark.setAttribute('y2', '62'); startMark.setAttribute('stroke', '#c54b37'); startMark.setAttribute('stroke-width', '2'); svg.append(startMark);
      track.append(svg); panel.append(track, element('p', '', `${rules.object.label}：橘線是物件起點；尺上的 0 要對準橘線。`));
      const alignControls = element('div', 'candidate-token-list');
      for (const [label, delta] of [[`尺往左 1 ${lengthUnit}`, -1], [`尺往右 1 ${lengthUnit}`, 1]]) { const buttonNode = element('button', 'candidate-token', label); buttonNode.type = 'button'; buttonNode.addEventListener('click', () => dispatch('move_length_ruler', { delta })); alignControls.append(buttonNode); }
      panel.append(alignControls, element('p', 'length-measurement-readout', `尺的 0 目前位於物件起點的 ${session.lengthRulerZero - rules.object.start} ${lengthUnit}處。`));
      panel.append(control(`讀取物件末端刻度（${lengthUnit}）`, session.lengthReadings[rules.object.id] ?? 0, 0, rules.maxReading,
        (value) => dispatch('set_length_reading', { objectId: rules.object.id, value })));
    } else if (rules.mode === 'compare') {
      panel.append(element('p', '', '依兩條刻度示意記錄長度，再操作差值滑桿。情境資料為數位模型，不是實物測量。'));
      for (const object of rules.objects) {
        const bar = element('div', 'length-comparison-rail'); bar.setAttribute('aria-label', `${object.label}示意長度`);
        bar.style.width = `${Math.max(12, Math.round(object.length * 3))}px`; panel.append(element('p', '', `${object.label}（模擬物件）`), bar);
        panel.append(control(`${object.label}刻度讀值（${lengthUnit}）`, session.lengthReadings[object.id] ?? 0, 0, rules.maxReading,
          (value) => dispatch('set_length_reading', { objectId: object.id, value })));
      }
      panel.append(control(`你測得兩者相差（${lengthUnit}）`, session.lengthDifference ?? 0, 0, rules.maxReading,
        (value) => dispatch('set_length_difference', { value })));
      if (Number.isInteger(rules.conversionTargetMillimeters)) {
        panel.append(element('p', '', `最後把兩段合計 ${rules.conversionTargetMillimeters} 毫米換成公分與毫米。`));
        panel.append(control('合計的公分數', session.lengthCentimeters ?? 0, 0, rules.maxCentimeters, (centimeters) => dispatch('set_length_conversion', { centimeters, millimeters: session.lengthRemainingMillimeters ?? 0 })));
        panel.append(control('合計剩餘毫米數', session.lengthRemainingMillimeters ?? 0, 0, 9, (millimeters) => dispatch('set_length_conversion', { centimeters: session.lengthCentimeters ?? 0, millimeters })));
      }
    } else if (rules.mode === 'convert') {
      panel.append(element('p', '', `${rules.targetMillimeters} 毫米等於幾公分又幾毫米？每 10 毫米合成 1 公分。`));
      panel.append(control('公分數', session.lengthCentimeters ?? 0, 0, rules.maxCentimeters, (centimeters) => dispatch('set_length_conversion', { centimeters, millimeters: session.lengthRemainingMillimeters ?? 0 })));
      panel.append(control('剩餘毫米數', session.lengthRemainingMillimeters ?? 0, 0, 9, (millimeters) => dispatch('set_length_conversion', { centimeters: session.lengthCentimeters ?? 0, millimeters })));
      panel.append(element('p', 'length-measurement-readout', `${session.lengthCentimeters ?? 0} 公分又 ${session.lengthRemainingMillimeters ?? 0} 毫米`));
    }
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'build_area_grid') {
    const rules = stage.areaGridRules;
    const panel = element('section', 'candidate-response-build area-grid-builder');
    panel.append(element('strong', '', '每一格代表 1 平方公分。點方格可以放入或取下單位方格；請依任務輪廓建造。'));
    if (rules.mode === 'estimate_cover') {
      const estimate = element('label', 'area-estimate-control');
      estimate.append(element('span', '', `先估測面積（${rules.estimate.min}–${rules.estimate.max} 平方公分）`));
      const slider = element('input', 'area-estimate-slider'); slider.type = 'range'; slider.min = String(rules.estimate.min); slider.max = String(rules.estimate.max); slider.step = '1';
      slider.value = String(session.areaEstimate ?? rules.estimate.initial); slider.setAttribute('aria-label', '估測面積平方公分數');
      const output = element('output', 'area-estimate-value', session.areaEstimate === null ? '尚未提交估測' : `${session.areaEstimate} 平方公分`);
      slider.addEventListener('input', () => { output.textContent = `${slider.value} 平方公分`; });
      slider.addEventListener('change', () => { dispatch('set_area_estimate', { value: Number(slider.value) }); });
      estimate.append(slider, output); panel.append(estimate);
      if (!Number.isInteger(session.areaEstimate)) panel.append(element('p', 'area-grid-note', '先移動估測滑桿並放開，再開始鋪格。'));
    }
    const addBoard = (board, index) => {
      const wrap = element('section', `area-grid-board${index ? ' area-grid-board-secondary' : ''}`);
      const current = session.areaGridCells[board.id] ?? [];
      const target = new Set(board.targetCells ?? []);
      const reference = new Set(board.referenceCells ?? []);
      wrap.append(element('h3', '', board.title));
      const grid = element('div', 'area-grid-tile-board');
      grid.style.gridTemplateColumns = `repeat(${board.columns}, minmax(0, 1fr))`;
      for (let row = 0; row < board.rows; row += 1) for (let column = 0; column < board.columns; column += 1) {
        const id = `r${row}c${column}`;
        const classes = ['area-grid-tile'];
        if (target.has(id)) classes.push('is-target');
        if (reference.has(id)) classes.push('is-reference');
        if (current.includes(id)) classes.push('is-filled');
        const tile = element('button', classes.join(' '), current.includes(id) ? '●' : reference.has(id) ? '■' : target.has(id) ? '·' : '');
        tile.type = 'button'; tile.disabled = rules.mode === 'estimate_cover' && !Number.isInteger(session.areaEstimate);
        tile.dataset.areaBoardId = board.id; tile.dataset.areaCell = id;
        tile.setAttribute('aria-pressed', String(current.includes(id)));
        tile.setAttribute('aria-label', `${board.title}第 ${row + 1} 排第 ${column + 1} 格，${current.includes(id) ? '已鋪方格，點擊取下' : target.has(id) ? '輪廓內空格，點擊鋪設' : '空格，點擊鋪設或取下'}`);
        tile.addEventListener('click', () => dispatch('toggle_area_cell', { boardId: board.id, row, column }));
        grid.append(tile);
      }
      wrap.append(grid, element('p', 'area-grid-count', `已鋪 ${current.length} 格＝${current.length} 平方公分`));
      return wrap;
    };
    const boards = element('div', 'area-grid-boards');
    rules.boards.forEach((board, index) => boards.append(addBoard(board, index)));
    if (rules.mode === 'same_area_different_shape') {
      const referenceBoard = { id: 'area-reference', title: '參考形狀（示意）', rows: rules.boards[0].rows, columns: rules.boards[0].columns, targetCells: [], referenceCells: rules.boards[0].referenceCells };
      boards.prepend(addBoard(referenceBoard, 1));
      panel.append(element('p', 'area-grid-note', `目標：${rules.targetArea} 平方公分；建造結果須與參考形狀不同且方格相連。`));
    }
    panel.append(boards);
    if (rules.mode === 'compare_regions') {
      const relationControls = element('div', 'area-relation-controls');
      relationControls.append(element('span', '', '比較甲與乙的面積：'));
      for (const relation of ['<', '=', '>']) {
        const control = element('button', `candidate-token${session.areaRelation === relation ? ' is-selected' : ''}`, `甲 ${relation} 乙`);
        control.type = 'button'; control.setAttribute('aria-pressed', String(session.areaRelation === relation));
        control.dataset.areaRelation = relation; control.addEventListener('click', () => dispatch('set_area_relation', { relation })); relationControls.append(control);
      }
      panel.append(relationControls);
    }
    panel.append(element('p', 'area-grid-note', '這是螢幕方格模型，不能取代實體平方公分板、紙片操作或真實測量。'));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'magnet_interaction') {
    const rules = stage.magnetRules;
    const model = session.magnetModel;
    const panel = element('section', 'candidate-response-build magnet-model-builder');
    panel.setAttribute('aria-label', '可操作的磁力數位模擬');
    if (rules.mode === 'poles') {
      const same = rules.fixedPole === model.facingPole;
      const magnets = element('div', 'magnet-model-pair');
      magnets.append(element('div', 'magnet-pole magnet-pole-n', `固定磁鐵｜${rules.fixedPole}`));
      const result = element('strong', `magnet-result ${same ? 'is-repel' : 'is-attract'}`, same ? '同極相對：排斥' : '異極相對：吸引');
      magnets.append(result, element('div', `magnet-pole magnet-pole-${model.facingPole.toLowerCase()}`, `可翻轉磁鐵｜${model.facingPole}`));
      panel.append(magnets, element('p', 'magnet-model-readout', `模型即時結果：${same ? '磁鐵往外推開' : '磁鐵互相靠近'}`));
      const flip = element('button', 'candidate-token', '翻轉磁鐵，改變相對磁極'); flip.type = 'button'; flip.setAttribute('aria-label', '翻轉可操作磁鐵'); flip.addEventListener('click', () => dispatch('flip_magnet')); panel.append(flip);
    } else if (rules.mode === 'materials') {
      panel.append(element('p', 'magnet-model-readout', '操作順序：① 測試材料 → ② 看觀察結果 → ③ 選擇答案'));
      panel.append(element('p', 'magnet-model-readout', '五種材料都完成後，再按「檢查答案」。'));
      const completedMaterialCount = rules.materials.filter(({ id }) => model.testedObjectIds.includes(id) && Boolean(model.assignments[id])).length;
      panel.append(element('strong', 'magnet-material-progress', `完成進度：${completedMaterialCount} / ${rules.materials.length}${completedMaterialCount === rules.materials.length ? ' ✓' : ''}`));
      for (const material of rules.materials) {
        const row = element('article', 'magnet-material-row');
        row.append(element('strong', '', material.label));
        const tested = model.testedObjectIds.includes(material.id);
        row.append(element('strong', 'magnet-material-step', '步驟 1｜測試材料'));
        const observationText = material.attracted ? '觀察結果：物品移向磁鐵。' : '觀察結果：物品沒有移動。';
        const test = element('button', 'candidate-token', tested ? '✓ 已測試｜再測一次' : '🧲 移近磁鐵測試'); test.type = 'button'; test.setAttribute('aria-label', `${material.label}移近磁鐵測試`); test.addEventListener('click', () => {
          const result = dispatch('test_magnet_material', { materialId: material.id });
          if (result.changed) speak(observationText);
        }); row.append(test);
        row.append(element('span', 'magnet-observation', tested ? observationText : '觀察結果：尚未測試'));
        if (tested) {
          const repeat = element('button', 'button button-secondary magnet-observation-repeat', '🔊 再聽一次');
          repeat.type = 'button';
          repeat.setAttribute('aria-label', `再聽一次：${observationText}`);
          repeat.addEventListener('click', () => speak(observationText));
          row.append(repeat);
        }
        row.append(element('strong', 'magnet-material-step', '步驟 2｜你的答案'));
        const categories = element('div', 'magnet-category-controls');
        for (const category of rules.categories) {
          const selected = model.assignments[material.id] === category.id;
          const assign = element('button', `candidate-token${selected ? ' is-selected' : ''}`, `${selected ? '✓ ' : ''}${category.label}`); assign.type = 'button'; assign.disabled = !tested; assign.setAttribute('aria-pressed', String(selected)); assign.addEventListener('click', () => dispatch('assign_magnet_material', { materialId: material.id, categoryId: category.id })); categories.append(assign);
        }
        row.append(categories);
        if (!tested) row.append(element('p', 'magnet-material-instruction', '請先測試材料'));
        panel.append(row);
      }
    } else {
      panel.append(element('p', 'magnet-model-readout', `共同條件：${rules.sharedConditions}。先測兩個磁鐵，再比較吸起的圓片數。`));
      const magnets = element('div', 'magnet-strength-cards');
      for (const magnet of rules.magnets) {
        const card = element('article', 'magnet-strength-card'); card.append(element('strong', '', magnet.label));
        const tested = model.testedMagnetIds.includes(magnet.id);
        const test = element('button', 'candidate-token', tested ? '已完成模擬測試' : '測試吸起數量'); test.type = 'button'; test.setAttribute('aria-label', `${magnet.label}測試吸起數量`); test.addEventListener('click', () => dispatch('test_magnet_strength', { magnetId: magnet.id })); card.append(test);
        card.append(element('p', 'magnet-observation', tested ? `觀察：吸起 ${magnet.liftedIronPieces} 片含鐵圓片` : '觀察：尚未測試'));
        magnets.append(card);
      }
      panel.append(magnets, element('strong', '', '依測試紀錄選出本模型吸起較多者：'));
      const choices = element('div', 'magnet-category-controls');
      for (const magnet of rules.magnets) {
        const selected = model.selectedStrongerMagnetId === magnet.id;
        const choose = element('button', `candidate-token${selected ? ' is-selected' : ''}`, `選 ${magnet.label}`); choose.type = 'button'; choose.disabled = !rules.magnets.every(({ id }) => model.testedMagnetIds.includes(id)); choose.setAttribute('aria-pressed', String(selected)); choose.addEventListener('click', () => dispatch('select_stronger_magnet', { magnetId: magnet.id })); choices.append(choose);
      }
      panel.append(choices);
    }
    panel.append(element('p', 'magnet-model-limit', '這是數位磁力模型；材料結果與吸起數量是預設模擬資料，不能取代實際磁鐵、含鐵物測試、變因控制或教師觀察。'));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'build_weight_scale') {
    const rules = stage.weightRules;
    const model = session.weightScale;
    const panel = element('section', 'candidate-response-build weight-scale-builder');
    panel.setAttribute('aria-label', '可操作的數位秤重模型');
    const makeRange = (label, value, min, max, step, onChange, className = 'weight-scale-slider') => {
      const wrap = element('label', 'weight-scale-control');
      wrap.append(element('span', '', label));
      const range = element('input', className); range.type = 'range'; range.min = String(min); range.max = String(max); range.step = String(step); range.value = String(value);
      range.setAttribute('aria-label', label);
      const output = element('output', 'weight-scale-output', `${value}`);
      range.addEventListener('input', () => { output.textContent = `${range.value}`; });
      range.addEventListener('change', () => onChange(Number(range.value)));
      wrap.append(range, output); return wrap;
    };
    if (rules.mode === 'estimate') {
      panel.append(element('strong', '', `估測 ${rules.objectLabel}的重量（公克）`));
      panel.append(makeRange('先估測重量（公克）', model.estimate ?? rules.input.min, rules.input.min, rules.input.max, rules.input.step, (value) => dispatch('set_weight_estimate', { value })));
      panel.append(element('p', 'weight-scale-readout', model.estimate === null ? '先移動滑桿提出估測，再送出檢查。' : `目前估測：${model.estimate} 公克；送出後顯示模擬秤重值。`));
    } else if (rules.mode === 'balance') {
      const panWeight = (side) => rules[side].fixedGrams + model.balanceCounts[side] * rules.counterweightGrams;
      const difference = panWeight('left') - panWeight('right');
      const beam = element('div', 'weight-scale-beam'); beam.style.transform = `rotate(${Math.max(-8, Math.min(8, -difference / 25))}deg)`;
      beam.append(element('span', 'weight-scale-pan', `${rules.left.label}：${panWeight('left')} 克`), element('span', 'weight-scale-pivot', '▲'), element('span', 'weight-scale-pan', `${rules.right.label}：${panWeight('right')} 克`));
      panel.append(element('strong', '', '調整砝碼，讓兩盤重量相同。'), beam);
      panel.append(element('p', 'weight-scale-readout', `每個活動砝碼 ${rules.counterweightGrams} 公克；目前兩側相差 ${Math.abs(difference)} 公克。`));
      const controls = element('div', 'weight-pan-controls');
      for (const side of ['left', 'right']) {
        const group = element('div', 'weight-pan-control'); group.append(element('strong', '', `${side === 'left' ? '左' : '右'}盤砝碼`));
        for (const [label, delta] of [['取下一個', -1], ['加上一個', 1]]) {
          const buttonNode = element('button', 'candidate-token', `${label}（${rules.counterweightGrams} 克）`); buttonNode.type = 'button';
          buttonNode.setAttribute('aria-label', `${side === 'left' ? '左' : '右'}盤${label}${rules.counterweightGrams}公克砝碼`);
          buttonNode.disabled = delta < 0 ? model.balanceCounts[side] === 0 : model.balanceCounts[side] >= rules.maxCounterweights;
          buttonNode.addEventListener('click', () => dispatch('adjust_weight_pan', { side, delta })); group.append(buttonNode);
        }
        group.append(element('small', '', `已放 ${model.balanceCounts[side]} 個`)); controls.append(group);
      }
      panel.append(controls);
    } else if (rules.mode === 'read') {
      panel.append(element('strong', '', `調整指針讀取「${rules.objectLabel}」的重量`));
      const dial = element('div', 'weight-scale-dial');
      const marker = element('span', 'weight-scale-pointer'); marker.style.left = `${(model.reading ?? rules.input.min) / rules.input.max * 100}%`; dial.append(marker);
      for (let value = rules.input.min; value <= rules.input.max; value += 100) dial.append(element('span', 'weight-scale-tick', `${value}`));
      panel.append(dial, makeRange('秤面指針讀值（公克）', model.reading ?? rules.input.min, rules.input.min, rules.input.max, rules.input.step, (value) => dispatch('set_weight_scale_reading', { value })));
      panel.append(element('p', 'weight-scale-readout', model.readingTouched ? `目前讀值：${model.reading} 公克` : '小格 50 公克，大格 100 公克。'));
    } else if (rules.mode === 'compare') {
      panel.append(element('strong', '', '逐一記下秤面讀值，再比較並計算差值。'));
      for (const item of rules.items) {
        const itemPanel = element('div', 'weight-compare-item'); itemPanel.append(element('span', '', `⚖ ${item.label}（模擬物件）`));
        itemPanel.append(makeRange(`${item.label}秤面讀值（公克）`, model.compareReadings[item.id] ?? rules.input.min, rules.input.min, rules.input.max, rules.input.step, (value) => dispatch('set_weight_scale_reading', { itemId: item.id, value })));
        panel.append(itemPanel);
      }
      const relations = element('div', 'weight-relation-controls'); relations.append(element('span', '', '甲與乙的重量關係：'));
      for (const relation of ['<', '=', '>']) {
        const buttonNode = element('button', `candidate-token${model.relation === relation ? ' is-selected' : ''}`, `甲 ${relation} 乙`); buttonNode.type = 'button'; buttonNode.setAttribute('aria-pressed', String(model.relation === relation));
        buttonNode.addEventListener('click', () => dispatch('set_weight_relation', { relation })); relations.append(buttonNode);
      }
      panel.append(relations, makeRange('重量差（公克）', model.difference ?? 0, 0, rules.input.max, 50, (value) => dispatch('set_weight_difference', { value })));
    } else if (rules.mode === 'convert') {
      panel.append(element('strong', '', `把 ${rules.targetGrams} 公克表示成公斤和公克`));
      panel.append(makeRange('公斤數', model.kilograms, rules.kilograms.min, rules.kilograms.max, 1, (kilograms) => dispatch('set_weight_conversion', { kilograms, grams: model.grams })));
      panel.append(makeRange('剩餘公克數', model.grams, rules.grams.min, rules.grams.max, 50, (grams) => dispatch('set_weight_conversion', { kilograms: model.kilograms, grams })));
      panel.append(element('p', 'weight-scale-readout', `${model.kilograms} 公斤又 ${model.grams} 公克（畫面即時顯示分解結果）`));
    } else if (rules.mode === 'supply') {
      panel.append(element('strong', '', `選擇物品讓總重量剛好 ${rules.targetGrams} 公克。`));
      const choices = element('div', 'weight-supply-options');
      for (const item of rules.items) {
        const selected = model.selectedItems.includes(item.id); const option = element('button', `candidate-token${selected ? ' is-selected' : ''}`, `${item.label}｜${item.grams} 克`); option.type = 'button'; option.setAttribute('aria-pressed', String(selected));
        option.addEventListener('click', () => dispatch('toggle_weight_supply_item', { itemId: item.id })); choices.append(option);
      }
      const total = rules.items.filter(({ id }) => model.selectedItems.includes(id)).reduce((sum, item) => sum + item.grams, 0);
      panel.append(choices, element('p', 'weight-scale-readout', `已選 ${model.selectedItems.length} 件；合計 ${total} 公克；目標 ${rules.targetGrams} 公克。`));
    }
    panel.append(element('p', 'weight-scale-limit', '此關使用數位秤重模擬資料；不能取代真實物品、實體秤具與教師觀察。'));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'build_capacity_model') {
    const rules = stage.capacityRules;
    const model = session.capacityModel;
    const panel = element('section', 'candidate-response-build capacity-model-builder');
    panel.setAttribute('aria-label', '可操作的數位容量與液面模型');
    const makeRange = (label, value, min, max, step, action) => {
      const wrap = element('label', 'capacity-model-range');
      wrap.append(element('span', '', label));
      const input = element('input', 'capacity-model-slider'); input.type = 'range';
      Object.assign(input, { min: String(min), max: String(max), step: String(step), value: String(value) });
      input.setAttribute('aria-label', label);
      const output = element('output', '', `${value} 毫升`);
      input.addEventListener('input', () => { output.textContent = `${input.value} 毫升`; });
      input.addEventListener('change', () => action(Number(input.value)));
      wrap.append(input, output); return wrap;
    };
    const makeVessel = (label, capacity, volume, variant = 'standard', revealCapacity = true) => {
      const card = element('div', `capacity-vessel-card capacity-vessel-${variant}`);
      card.append(element('strong', '', label));
      const vessel = element('div', 'capacity-vessel');
      vessel.setAttribute('role', 'img'); vessel.setAttribute('aria-label', revealCapacity ? `${label}；模擬總容量 ${capacity} 毫升，目前液量 ${volume} 毫升` : `${label}；目前液量 ${volume} 毫升；以共同量杯逐次裝填比較，容器總容量未標示`);
      const water = element('span', 'capacity-vessel-water'); water.style.height = `${capacity ? volume / capacity * 100 : 0}%`;
      vessel.append(water);
      const marks = element('span', 'capacity-vessel-marks', revealCapacity ? `0 ─ ─ ─ ${Math.round(capacity / 2)} ─ ─ ─ ${capacity} 毫升` : '以等量量杯逐次裝填');
      card.append(vessel, marks); return card;
    };
    const addVolumeControls = (target, current, capacity, step, label, handler) => {
      const controls = element('div', 'capacity-volume-controls');
      for (const [text, delta] of [[`取出 ${step} 毫升`, -1], [`倒入 ${step} 毫升`, 1]]) {
        const control = element('button', 'candidate-token', text); control.type = 'button';
        control.disabled = delta < 0 ? current <= 0 : current >= capacity;
        control.setAttribute('aria-label', `${label}${text}`);
        control.addEventListener('click', () => handler(delta)); controls.append(control);
      }
      target.append(controls);
    };
    if (rules.mode === 'estimate') {
      panel.append(element('strong', '', '先估量兩瓶合計容量；送出後再比較估量與模擬結果。'));
      panel.append(makeVessel('容量參照量杯', rules.containerCapacityMl, 0));
      panel.append(makeRange('你的估量', model.estimateMl ?? rules.input.min, rules.input.min, rules.input.max, rules.input.step, (value) => dispatch('set_capacity_estimate', { value })));
      panel.append(element('p', 'capacity-model-readout', model.estimateMl === null ? '移動估量標記，再檢查合理範圍。' : `目前估量 ${model.estimateMl} 毫升；送出後才揭示模擬情境結果。`));
    } else if (rules.mode === 'fill' || rules.mode === 'read' || rules.mode === 'difference') {
      const current = model.volumeMl;
      panel.append(makeVessel(`總容量 ${rules.containerCapacityMl} 毫升`, rules.containerCapacityMl, current));
      addVolumeControls(panel, current, rules.containerCapacityMl, rules.stepMl, '液量控制：', (delta) => dispatch('adjust_capacity_volume', { delta }));
      panel.append(element('p', 'capacity-model-readout', `目前液量 ${current} 毫升；剩餘可裝 ${rules.containerCapacityMl - current} 毫升。`));
      if (rules.mode === 'fill') panel.append(element('p', 'capacity-model-target', `任務目標：${rules.targetMl} 毫升`));
      if (rules.mode === 'read') {
        panel.append(makeRange('液面讀值標記', model.readingMl ?? 0, 0, rules.containerCapacityMl, rules.readingStepMl, (value) => dispatch('set_capacity_reading', { value })));
        panel.append(element('p', 'capacity-model-limit', '刻度與液面是螢幕模擬，不取代真實量杯及實際倒水。'));
      }
      if (rules.mode === 'difference') {
        panel.append(makeRange('記錄取出的容量差', model.differenceMl ?? 0, 0, rules.containerCapacityMl, rules.answerStepMl, (value) => dispatch('set_capacity_difference', { value })));
      }
    } else if (rules.mode === 'compare') {
      panel.append(element('strong', '', '用同一個量杯逐次裝填，再比較兩種外形的總容量。'));
      const compareCards = element('div', 'capacity-compare-cards');
      for (const [index, container] of rules.containers.entries()) {
        const current = model.containerVolumes[container.id] ?? 0;
        const card = element('div', 'capacity-compare-item');
        card.append(makeVessel(`${container.label}：目前 ${current} 毫升`, container.capacityMl, current, index === 0 ? 'wide' : 'tall', false));
        addVolumeControls(card, current, container.capacityMl, rules.stepMl, `${container.label}：`, (delta) => dispatch('adjust_capacity_container', { containerId: container.id, delta }));
        compareCards.append(card);
      }
      panel.append(compareCards);
      const relations = element('div', 'capacity-relation-controls');
      for (const relation of ['<', '=', '>']) {
        const control = element('button', `candidate-token${model.relation === relation ? ' is-selected' : ''}`, `甲 ${relation} 乙`); control.type = 'button';
        control.setAttribute('aria-pressed', String(model.relation === relation));
        control.addEventListener('click', () => dispatch('set_capacity_relation', { relation })); relations.append(control);
      }
      panel.append(element('p', 'capacity-model-readout', `甲已倒入 ${model.containerVolumes.wide} 毫升；乙已倒入 ${model.containerVolumes.tall} 毫升。`), relations);
    } else if (rules.mode === 'supply') {
      const choices = element('div', 'capacity-supply-options');
      for (const item of rules.items) {
        const selected = model.selectedItems.includes(item.id);
        const control = element('button', `candidate-token${selected ? ' is-selected' : ''}`, `${item.label}｜${item.volumeMl} 毫升`); control.type = 'button';
        control.setAttribute('aria-pressed', String(selected));
        control.addEventListener('click', () => dispatch('toggle_capacity_supply_item', { itemId: item.id })); choices.append(control);
      }
      const total = rules.items.filter(({ id }) => model.selectedItems.includes(id)).reduce((sum, item) => sum + item.volumeMl, 0);
      panel.append(element('strong', '', `挑選水瓶，組成 ${rules.targetMl} 毫升補給。`), choices,
        makeVessel(`補給容器總容量 ${rules.containerCapacityMl} 毫升`, rules.containerCapacityMl, total),
        element('p', 'capacity-model-readout', `目前 ${total} 毫升；尚有 ${rules.containerCapacityMl - total} 毫升空間。`));
    }
    panel.append(element('p', 'capacity-model-limit', '此關使用數位液體與刻度模擬；不能取代真實容器、實際倒水、量具操作或教師觀察。'));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'set_clock_time') {
    const panel = element('section', 'candidate-response-build clock-time-builder');
    panel.append(element('strong', '', stage.clockRules.instruction ?? '調整鐘面上的時針和分針，表示指定時刻。'));
    if (Number.isInteger(session.clockHour) && Number.isInteger(session.clockMinute)) {
      panel.append(makeClockFace(session.clockHour, session.clockMinute, '可操作的類比鐘面'));
    }
    const timeText = session.clockHour === null || session.clockMinute === null ? '尚未設定完整時刻' : `目前設定：${session.clockHour} 時 ${String(session.clockMinute).padStart(2, '0')} 分`;
    panel.append(element('p', 'candidate-response-line', timeText));
    const controls = element('div', 'candidate-token-list clock-hand-controls');
    const hourValue = session.clockHour ?? stage.clockRules.initialHour;
    const minuteValue = session.clockMinute ?? stage.clockRules.initialMinute;
    for (const [label, hand, value] of [['時針向前一小時', 'hour', hourValue % 12 + 1], ['時針向後一小時', 'hour', (hourValue + 10) % 12 + 1], ['分針向前五分鐘', 'minute', (minuteValue + 5) % 60], ['分針向後五分鐘', 'minute', (minuteValue + 55) % 60]]) {
      const control = element('button', 'candidate-token', label); control.type = 'button';
      control.addEventListener('click', () => dispatch('set_clock_hand', { hand, value })); controls.append(control);
    }
    const setHour = element('button', 'candidate-token', `設定時針為 ${stage.clockRules.initialHour} 時`); setHour.type = 'button';
    setHour.addEventListener('click', () => dispatch('set_clock_hand', { hand: 'hour', value: stage.clockRules.initialHour }));
    const setMinute = element('button', 'candidate-token', `設定分針為 ${stage.clockRules.initialMinute} 分`); setMinute.type = 'button';
    setMinute.addEventListener('click', () => dispatch('set_clock_hand', { hand: 'minute', value: stage.clockRules.initialMinute }));
    controls.append(setHour, setMinute); panel.append(controls); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'elapsed_time_model') {
    const rules = stage.elapsedRules;
    const panel = element('section', 'candidate-response-build elapsed-time-builder');
    panel.append(element('strong', '', '沿時間線移動標記；每一格代表 5 分鐘。'));
    const track = element('div', 'elapsed-time-track');
    track.setAttribute('role', 'img');
    track.setAttribute('aria-label', `時間線從 ${formatClockTime(rules.startHour, rules.startMinute)} 到 ${formatClockTime(rules.endHour, rules.endMinute)}；每格 ${rules.stepMinutes} 分鐘`);
    const rail = element('div', 'elapsed-time-rail');
    const tickCount = (rules.maxMinutes - rules.minMinutes) / rules.stepMinutes;
    for (let tickIndex = 0; tickIndex <= tickCount; tickIndex += 1) {
      const tick = element('span', 'elapsed-time-tick');
      tick.style.left = `${tickIndex / tickCount * 100}%`;
      tick.setAttribute('aria-hidden', 'true');
      rail.append(tick);
    }
    const marker = element('span', 'elapsed-time-marker');
    marker.style.left = `${((session.elapsedMinutes ?? rules.initialMinutes) - rules.minMinutes) / (rules.maxMinutes - rules.minMinutes) * 100}%`;
    rail.append(marker); track.append(rail); panel.append(track);
    const labels = element('div', 'elapsed-time-endpoints');
    labels.append(element('strong', '', `開始 ${formatClockTime(rules.startHour, rules.startMinute)}`), element('strong', '', `結束 ${formatClockTime(rules.endHour, rules.endMinute)}`));
    panel.append(labels);
    const current = session.elapsedMinutes ?? rules.initialMinutes;
    const totalMinutes = rules.startHour * 60 + rules.startMinute + current;
    const currentHour = Math.floor(totalMinutes / 60) % 12 || 12;
    const currentMinute = totalMinutes % 60;
    panel.append(element('output', 'elapsed-time-readout', `目前標記：${formatClockTime(currentHour, currentMinute)}｜經過 ${current} 分鐘`));
    const slider = element('input', 'elapsed-time-slider');
    slider.type = 'range'; slider.min = String(rules.minMinutes); slider.max = String(rules.maxMinutes); slider.step = String(rules.stepMinutes); slider.value = String(current);
    slider.setAttribute('aria-label', '調整時間線上的經過分鐘數');
    slider.addEventListener('change', () => dispatch('set_elapsed_minutes', { value: Number(slider.value) }));
    panel.append(slider);
    const controls = element('div', 'elapsed-time-controls');
    for (const [label, value] of [['往回 5 分鐘', current - rules.stepMinutes], ['往後 5 分鐘', current + rules.stepMinutes]]) {
      const control = element('button', 'candidate-token', label); control.type = 'button';
      control.disabled = value < rules.minMinutes || value > rules.maxMinutes;
      control.addEventListener('click', () => dispatch('set_elapsed_minutes', { value })); controls.append(control);
    }
    panel.append(controls); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'build_volume') {
    const panel = element('section', 'candidate-response-build volume-builder');
    const cubeCount = session.volumeRows * session.volumeColumns * session.volumeLayers;
    panel.append(element('strong', '', `目前模型：${session.volumeLayers} 層 × 每層 ${session.volumeRows} 排 × 每排 ${session.volumeColumns} 個`));
    panel.append(element('p', 'candidate-response-line', `模型共有 ${cubeCount} 個 1 立方公分方塊`));
    const stack = element('div', 'volume-layer-stack');
    for (let layer = 0; layer < session.volumeLayers; layer += 1) {
      const layerPanel = element('div', 'volume-layer'); layerPanel.append(element('span', '', `第 ${layer + 1} 層`));
      const grid = element('div', 'volume-cube-grid'); grid.style.gridTemplateColumns = `repeat(${Math.max(1, session.volumeColumns)}, minmax(18px, 1fr))`;
      for (let cube = 0; cube < session.volumeRows * session.volumeColumns; cube += 1) grid.append(element('span', 'volume-unit-cube', '1'));
      layerPanel.append(grid); stack.append(layerPanel);
    }
    panel.append(stack);
    const controls = element('div', 'candidate-token-list volume-dimension-controls');
    for (const [label, dimension, delta] of [['少一排', 'rows', -1], ['增加一排', 'rows', 1], ['每排少一個', 'columns', -1], ['每排多一個', 'columns', 1], ['少一層', 'layers', -1], ['增加一層', 'layers', 1]]) {
      const control = element('button', 'candidate-token', label); control.type = 'button';
      control.addEventListener('click', () => dispatch('adjust_volume_dimension', { dimension, delta })); controls.append(control);
    }
    panel.append(controls); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'place_number_line_marker') {
    const { start, end, tickCount } = stage.numberLine;
    const panel = element('section', 'candidate-response-build decimal-number-line');
    panel.append(element('strong', '', stage.numberLine.valueFormat === 'integer' ? '移動標記，在數線上放置指定數字。' : '拖動標記，在數線上放置小數點。'));
    const scale = element('div', 'decimal-number-line-scale');
    const rail = element('div', 'decimal-number-line-rail');
    const marker = element('span', 'decimal-number-line-marker');
    marker.style.left = `${(session.numberLineTick ?? 0) / tickCount * 100}%`;
    rail.append(marker); scale.append(rail);
    const ticks = element('div', 'decimal-number-line-ticks');
    for (let tick = 0; tick <= tickCount; tick += 1) {
      const item = element('span', 'decimal-number-line-tick', tick === 0 ? String(start) : tick === tickCount ? String(end) : '');
      item.style.left = `${tick / tickCount * 100}%`; ticks.append(item);
    }
    scale.append(ticks); panel.append(scale);
    const slider = element('input', 'decimal-number-line-slider');
    slider.type = 'range'; slider.min = '0'; slider.max = String(tickCount); slider.step = '1'; slider.value = String(session.numberLineTick ?? 0);
    slider.setAttribute('aria-label', stage.numberLine.valueFormat === 'integer' ? '在整數數線上移動標記' : '在十分位數線上移動標記');
    slider.addEventListener('change', () => dispatch('set_number_line_tick', { tick: Number(slider.value) }));
    panel.append(slider);
    const markerValue = session.numberLineTick === null ? null : start + (end - start) * session.numberLineTick / tickCount;
    panel.append(element('p', 'candidate-response-line', `目前標記：${markerValue === null ? '尚未放置' : stage.numberLine.valueFormat === 'integer' ? String(markerValue) : markerValue.toFixed(1)}`));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'compose_shape') {
    const panel = element('section', 'candidate-response-build geometry-composer');
    const selectionCount = stage.shapeRules.selectionCount ?? stage.shapeRules.rows * stage.shapeRules.columns;
    panel.append(element('strong', '', `拼圖板：${stage.shapeRules.rows} 排 × ${stage.shapeRules.columns} 格（已選 ${session.selection.length}/${selectionCount} 塊）`));
    const board = element('div', 'geometry-composition-grid');
    board.style.gridTemplateColumns = `repeat(${stage.shapeRules.columns}, minmax(36px, 1fr))`;
    for (let slot = 0; slot < stage.shapeRules.rows * stage.shapeRules.columns; slot += 1) {
      const pieceId = session.selection[slot];
      const piece = stage.pieces.find(({ id }) => id === pieceId);
      const cell = element('div', `geometry-composition-cell${piece ? ' is-filled' : ''}`);
      if (piece) cell.append(createGeometryPiece(piece)); else cell.append(element('span', 'geometry-slot-empty', '放入圖形片'));
      board.append(cell);
    }
    panel.append(board);
    const tray = element('div', 'candidate-token-list geometry-piece-tray');
    for (const piece of stage.pieces) {
      const selected = session.selection.includes(piece.id);
      const tile = element('button', `candidate-token geometry-piece-button${selected ? ' is-selected' : ''}`);
      tile.type = 'button'; tile.setAttribute('aria-pressed', String(selected)); tile.setAttribute('aria-label', `${piece.label}${selected ? '，已放入拼圖板' : ''}`);
      tile.append(createGeometryPiece(piece), element('span', '', piece.label));
      tile.addEventListener('click', () => dispatch('toggle_shape_piece', { pieceId: piece.id }));
      tray.append(tile);
    }
    panel.append(tray); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'geometry_exploration' && stage.geometryMode === 'split_recompose') {
    const panel = element('section', 'candidate-response-build geometry-recomposition-panel');
    panel.append(element('strong', '', '選一片拼片，再用方向鍵移動或旋轉；拼片格要剛好覆蓋目標。'));
    const board = element('div', 'geometry-recomposition-board');
    board.style.gridTemplateColumns = `repeat(${stage.board.columns}, minmax(0, 1fr))`;
    const occupied = new Map();
    for (const piece of stage.pieces) {
      const transform = session.geometryPieces[piece.id];
      let cells = piece.cells.map(([row, column]) => [row, column]);
      if (transform.flipped) {
        const maxColumn = Math.max(...cells.map(([, column]) => column));
        cells = cells.map(([row, column]) => [row, maxColumn - column]);
      }
      for (let turn = 0; turn < transform.rotation; turn += 1) {
        const maxRow = Math.max(...cells.map(([row]) => row));
        cells = cells.map(([row, column]) => [column, maxRow - row]);
        const minRow = Math.min(...cells.map(([row]) => row)); const minColumn = Math.min(...cells.map(([, column]) => column));
        cells = cells.map(([row, column]) => [row - minRow, column - minColumn]);
      }
      for (const [row, column] of cells) occupied.set(`${row + transform.row},${column + transform.column}`, piece);
    }
    const targets = new Set(stage.targetCells.map(({ row, column }) => `${row},${column}`));
    for (let row = 0; row < stage.board.rows; row += 1) for (let column = 0; column < stage.board.columns; column += 1) {
      const piece = occupied.get(`${row},${column}`);
      const cell = element(piece ? 'button' : 'div', `geometry-recomposition-cell${targets.has(`${row},${column}`) ? ' is-target' : ''}${piece ? ` is-piece${piece.id === session.geometrySelectedPieceId ? ' is-selected' : ''}` : ''}`, piece ? '■' : targets.has(`${row},${column}`) ? '目標' : '');
      if (piece) { cell.type = 'button'; cell.setAttribute('aria-label', `${piece.label}，第 ${row + 1} 列第 ${column + 1} 格`); cell.setAttribute('aria-pressed', String(piece.id === session.geometrySelectedPieceId)); cell.addEventListener('click', () => dispatch('select_geometry_piece', { pieceId: piece.id })); }
      else cell.setAttribute('aria-hidden', 'true');
      board.append(cell);
    }
    panel.append(board, element('p', 'candidate-response-line', `目前選取：${stage.pieces.find(({ id }) => id === session.geometrySelectedPieceId)?.label ?? '尚未選取'}`));
    const controls = element('div', 'geometry-move-controls');
    for (const [label, direction] of [['↑ 上移', 'up'], ['↓ 下移', 'down'], ['← 左移', 'left'], ['→ 右移', 'right']]) {
      const control = element('button', 'candidate-token geometry-control', label); control.type = 'button';
      control.addEventListener('click', () => dispatch('move_geometry_piece', { pieceId: session.geometrySelectedPieceId, direction })); controls.append(control);
    }
    const rotate = element('button', 'candidate-token geometry-control', '轉四分之一圈'); rotate.type = 'button';
    rotate.addEventListener('click', () => dispatch('rotate_geometry_piece', { pieceId: session.geometrySelectedPieceId })); controls.append(rotate);
    const flip = element('button', 'candidate-token geometry-control', '左右翻面'); flip.type = 'button';
    flip.addEventListener('click', () => dispatch('flip_geometry_piece', { pieceId: session.geometrySelectedPieceId })); controls.append(flip);
    panel.append(controls, element('small', '', '藍綠色虛線格是目標；拼片可在棋盤內移動。')); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'geometry_exploration' && stage.geometryMode === 'fold_net') {
    const panel = element('section', 'candidate-response-build geometry-net-panel');
    panel.append(element('strong', '', '選一張六面展開圖，按下摺合模擬；再觀察立體上的面是否共邊。'));
    const candidates = element('div', 'geometry-net-candidates');
    for (const net of stage.netCandidates) {
      const card = element('button', `geometry-net-choice${session.selectedNetId === net.id ? ' is-selected' : ''}`);
      card.type = 'button'; card.setAttribute('aria-pressed', String(session.selectedNetId === net.id)); card.setAttribute('aria-label', net.label);
      card.append(element('strong', '', net.label));
      const rows = net.faces.map(({ row }) => row); const columns = net.faces.map(({ column }) => column);
      const minRow = Math.min(...rows); const maxRow = Math.max(...rows); const minColumn = Math.min(...columns); const maxColumn = Math.max(...columns);
      const netBoard = element('span', 'geometry-net-board'); netBoard.style.gridTemplateColumns = `repeat(${maxColumn - minColumn + 1}, minmax(18px, 1fr))`;
      for (let row = minRow; row <= maxRow; row += 1) for (let column = minColumn; column <= maxColumn; column += 1) {
        const face = net.faces.find((item) => item.row === row && item.column === column);
        netBoard.append(element('span', `geometry-net-face${face ? '' : ' is-empty'}`, face?.id ?? ''));
      }
      card.append(netBoard); card.addEventListener('click', () => dispatch('select_geometry_net', { netId: net.id })); candidates.append(card);
    }
    panel.append(candidates);
    const fold = element('button', 'button button-secondary geometry-fold-button', '模擬摺合'); fold.type = 'button'; fold.disabled = !session.selectedNetId;
    fold.addEventListener('click', () => dispatch('simulate_geometry_fold')); panel.append(fold);
    if (session.foldedNet) {
      panel.append(element('p', `geometry-fold-result ${session.foldedNet.valid ? 'is-valid' : 'is-invalid'}`, session.foldedNet.valid ? '摺合模擬成功：六個面形成不同方向。' : `這張展開圖無法摺成完整立方體：${session.foldedNet.reason}`));
      if (session.foldedNet.valid) {
        const faceClass = (normal) => ({ '0,0,1': 'front', '0,0,-1': 'back', '1,0,0': 'right', '-1,0,0': 'left', '0,-1,0': 'top', '0,1,0': 'bottom' })[normal.join(',')];
        const scene = element('div', 'geometry-fold-scene'); const cube = element('div', 'geometry-fold-cube');
        for (const face of session.foldedNet.faces) cube.append(element('span', `geometry-cube-face ${faceClass(face.normal)}`, face.id));
        scene.append(cube); panel.append(scene);
        const first = stage.queriedFaceIds[0]; const second = stage.queriedFaceIds[1];
        panel.append(element('p', 'geometry-adjacency-question', `觀察立體：${first} 面和 ${second} 面是否共用一條邊？`));
        const answers = element('div', 'candidate-token-list geometry-adjacency-answers');
        for (const [label, adjacent] of [['有共邊', true], ['沒有共邊', false]]) {
          const answer = element('button', `candidate-token${session.geometryAdjacencyAnswer === adjacent ? ' is-selected' : ''}`, label); answer.type = 'button'; answer.setAttribute('aria-pressed', String(session.geometryAdjacencyAnswer === adjacent));
          answer.addEventListener('click', () => dispatch('set_geometry_adjacency_answer', { adjacent })); answers.append(answer);
        }
        panel.append(answers);
      }
    }
    panel.append(element('small', '', '本立方體是網頁中的摺合模型；可與實際紙片展開圖搭配操作。')); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'angle_exploration') {
    const rules = stage.angleRules;
    const panel = element('section', 'candidate-response-build angle-exploration-panel');
    panel.append(element('strong', '', rules.mode === 'identify' ? '看圖找角' : rules.mode === 'compare' ? '旋轉兩個角，比較開口' : rules.mode === 'right_angle' ? '用直角基準比較' : rules.mode === 'align' ? '旋轉射線，對齊角的開口' : rules.mode === 'rotation' ? '鐘面旋轉操作' : rules.mode === 'measure' ? '量角器對齊與讀值' : rules.mode === 'draw' ? '轉動射線畫角' : '先觀察角的開口，再估測度數'));
    if (rules.displayDegrees === false) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', rules.mode === 'identify' ? '0 0 420 190' : '0 0 320 225');
      svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '可操作角形示意圖'); svg.classList.add('angle-exploration-diagram');
      const add = (tag, attrs = {}, text = '') => { const node = document.createElementNS(svg.namespaceURI, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); if (text) node.textContent = text; svg.append(node); return node; };
      const drawAngle = ({ x, y, degrees, length = 72, color = '#d45b36', label = '', dashed = false, selected = false, rightMarker = false }) => {
        const group = document.createElementNS(svg.namespaceURI, 'g');
        group.setAttribute('aria-label', label || `角開口 ${degrees}`);
        if (selected) { const halo = document.createElementNS(svg.namespaceURI, 'circle'); halo.setAttribute('cx', String(x)); halo.setAttribute('cy', String(y)); halo.setAttribute('r', '8'); halo.setAttribute('fill', '#f4c96b'); halo.setAttribute('opacity', '.6'); group.append(halo); }
        const endX = x + length * Math.cos(degrees * Math.PI / 180); const endY = y - length * Math.sin(degrees * Math.PI / 180);
        const line = (x1, y1, x2, y2, stroke, width = 4, dash = false) => { const node = document.createElementNS(svg.namespaceURI, 'line'); node.setAttribute('x1', String(x1)); node.setAttribute('y1', String(y1)); node.setAttribute('x2', String(x2)); node.setAttribute('y2', String(y2)); node.setAttribute('stroke', stroke); node.setAttribute('stroke-width', String(width)); node.setAttribute('stroke-linecap', 'round'); if (dash) node.setAttribute('stroke-dasharray', '5 4'); group.append(node); };
        line(x, y, x + length, y, color, 4, dashed); line(x, y, endX, endY, color, 4, dashed);
        const arc = document.createElementNS(svg.namespaceURI, 'path'); const r = Math.min(22, length * .32); const ax = x + r; const ay = y; const bx = x + r * Math.cos(degrees * Math.PI / 180); const by = y - r * Math.sin(degrees * Math.PI / 180);
        arc.setAttribute('d', `M ${ax} ${ay} A ${r} ${r} 0 ${degrees > 180 ? 1 : 0} 0 ${bx} ${by}`); arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', selected ? '#a76700' : color); arc.setAttribute('stroke-width', '2'); group.append(arc);
        const vertex = document.createElementNS(svg.namespaceURI, 'circle'); vertex.setAttribute('cx', String(x)); vertex.setAttribute('cy', String(y)); vertex.setAttribute('r', '4'); vertex.setAttribute('fill', '#243f49'); group.append(vertex);
        if (rightMarker) { const square = document.createElementNS(svg.namespaceURI, 'path'); square.setAttribute('d', `M ${x + 10} ${y} L ${x + 10} ${y - 10} L ${x} ${y - 10}`); square.setAttribute('fill', 'none'); square.setAttribute('stroke', '#24749a'); square.setAttribute('stroke-width', '2'); group.append(square); }
        if (label) { const text = document.createElementNS(svg.namespaceURI, 'text'); text.setAttribute('x', String(x)); text.setAttribute('y', String(y + 22)); text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '13'); text.setAttribute('font-weight', '800'); text.setAttribute('fill', '#234a5b'); text.textContent = label; group.append(text); }
        svg.append(group); return group;
      };
      if (rules.mode === 'identify') {
        rules.options.forEach((option, index) => drawAngle({ x: 60 + index * 150, y: 126, degrees: option.degrees, length: Math.min(option.rayLength, 82), color: '#24749a', label: option.label, selected: session.angleSelectedOptionId === option.id, rightMarker: option.degrees === 90 }));
        const choices = element('div', 'angle-option-list');
        for (const option of rules.options) { const button = element('button', `candidate-token${session.angleSelectedOptionId === option.id ? ' is-selected' : ''}`, `選 ${option.label} 角`); button.type = 'button'; button.setAttribute('aria-pressed', String(session.angleSelectedOptionId === option.id)); button.addEventListener('click', () => dispatch('select_angle_option', { optionId: option.id })); choices.append(button); }
        panel.append(svg, element('small', '', '藍色射線的長短不同；頂點是兩條射線相接的位置。'), choices);
      } else if (rules.mode === 'compare') {
        drawAngle({ x: 78, y: 150, degrees: session.angleComparisonAngleA, length: rules.rayLengthA, color: '#d45b36', label: '角 A' });
        drawAngle({ x: 242, y: 150, degrees: session.angleComparisonAngleB, length: rules.rayLengthB, color: '#24749a', label: '角 B' });
        panel.append(svg);
        const sliders = element('div', 'angle-comparison-controls');
        for (const [angleId, current] of [['A', session.angleComparisonAngleA], ['B', session.angleComparisonAngleB]]) {
          const label = element('label', 'angle-slider-label', `轉動角 ${angleId} 的射線`);
          const slider = element('input', 'angle-slider'); slider.type = 'range'; slider.min = String(rules.valueRange?.min ?? 20); slider.max = String(rules.valueRange?.max ?? 160); slider.step = String(rules.valueRange?.step ?? 5); slider.value = String(current); slider.setAttribute('aria-label', `旋轉角 ${angleId} 的射線`); slider.addEventListener('change', () => dispatch('set_angle_comparison', { angleId, degrees: Number(slider.value) })); label.append(slider); sliders.append(label);
        }
        panel.append(sliders);
        const relations = element('div', 'angle-relation-controls candidate-token-list');
        for (const [relation, label] of [['less', 'A 小於 B'], ['equal', '兩角相等'], ['greater', 'A 大於 B']]) { const button = element('button', `candidate-token${session.angleComparisonAnswer === relation ? ' is-selected' : ''}`, label); button.type = 'button'; button.setAttribute('aria-pressed', String(session.angleComparisonAnswer === relation)); button.addEventListener('click', () => dispatch('set_angle_comparison_answer', { relation })); relations.append(button); }
        panel.append(relations);
      } else if (rules.mode === 'right_angle') {
        const current = Number.isInteger(session.angleDrawValue) ? session.angleDrawValue : rules.initialDegrees;
        drawAngle({ x: 88, y: 170, degrees: 90, length: 72, color: '#24749a', label: '直角基準', dashed: true, rightMarker: true });
        drawAngle({ x: 232, y: 170, degrees: current, length: rules.rayLength ?? 78, color: '#d45b36', label: '角 A' });
        panel.append(svg);
        const label = element('label', 'angle-slider-label', '轉動角 A 的射線，和藍色直角基準比較');
        const slider = element('input', 'angle-slider'); slider.type = 'range'; slider.min = '20'; slider.max = '160'; slider.step = '5'; slider.value = String(current); slider.setAttribute('aria-label', '旋轉角 A 並與直角比較'); slider.addEventListener('change', () => dispatch('set_angle_value', { degrees: Number(slider.value) })); label.append(slider); panel.append(label);
        const relations = element('div', 'angle-relation-controls candidate-token-list');
        for (const [relation, text] of [['less', '小於直角'], ['equal', '等於直角'], ['greater', '大於直角']]) { const button = element('button', `candidate-token${session.angleComparisonAnswer === relation ? ' is-selected' : ''}`, text); button.type = 'button'; button.setAttribute('aria-pressed', String(session.angleComparisonAnswer === relation)); button.addEventListener('click', () => dispatch('set_angle_comparison_answer', { relation })); relations.append(button); }
        panel.append(relations);
      } else {
        const current = Number.isInteger(session.angleDrawValue) ? session.angleDrawValue : rules.initialDegrees;
        drawAngle({ x: 160, y: 170, degrees: rules.referenceDegrees, length: rules.rayLength ?? 88, color: '#24749a', label: '參照角', dashed: true });
        drawAngle({ x: 160, y: 170, degrees: current, length: (rules.rayLength ?? 88) * .72, color: '#d45b36', label: '可旋轉射線' });
        panel.append(svg);
        const label = element('label', 'angle-slider-label', '拖動滑桿旋轉射線；比對兩個開口，不用看邊的長度');
        const slider = element('input', 'angle-slider'); slider.type = 'range'; slider.min = '20'; slider.max = '160'; slider.step = '5'; slider.value = String(current); slider.setAttribute('aria-label', '旋轉橘色射線對齊參照角'); slider.addEventListener('change', () => dispatch('set_angle_value', { degrees: Number(slider.value) })); label.append(slider); panel.append(label);
      }
      panel.append(element('small', '', '這是角形的螢幕示意操作，不能取代直尺、三角板或描角紙片等實物操作。'));
      host.append(panel);
    } else {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 320 245'); svg.setAttribute('role', 'img'); svg.classList.add('angle-exploration-diagram');
    const add = (tag, attrs = {}, text = '') => { const node = document.createElementNS(svg.namespaceURI, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); if (text) node.textContent = text; svg.append(node); return node; };
    const cx = 160; const cy = rules.mode === 'rotation' ? 120 : 190; const radius = rules.mode === 'rotation' ? 82 : 112;
    const polar = (degrees, length = radius) => ({ x: cx + Math.cos(degrees * Math.PI / 180) * length, y: cy - Math.sin(degrees * Math.PI / 180) * length });
    if (rules.mode === 'rotation') {
      add('circle', { cx, cy, r: 88, fill: '#f5fbff', stroke: '#3d687b', 'stroke-width': 2 });
      for (let h = 1; h <= 12; h += 1) { const p = polar(90 - h * 30, 70); add('text', { x: p.x, y: p.y + 5, 'text-anchor': 'middle', 'font-size': 12, fill: '#234a5b' }, String(h)); }
      const hand = (degrees, color, width = 5) => { const p = polar(90 - degrees, 56); add('line', { x1: cx, y1: cy, x2: p.x, y2: p.y, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }); };
      hand(0, '#3d687b', 4);
      if (session.angleRotationDirection) hand(session.angleRotationDegrees * (session.angleRotationDirection === 'clockwise' ? 1 : -1), '#d45b36', 5);
      add('circle', { cx, cy, r: 6, fill: '#d45b36' });
      add('text', { x: 160, y: 226, 'text-anchor': 'middle', 'font-size': 12, fill: '#234a5b' }, '橘色射線是轉到的位置');
    } else {
      const angle = rules.mode === 'draw' ? (session.angleDrawValue ?? rules.initialDegrees) : rules.targetDegrees;
      const baselineSide = rules.mode === 'measure' ? (session.angleBaselineSide ?? rules.expectedSide) : 'right';
      const centerX = rules.mode === 'measure' ? cx + (session.angleCenterOffset ?? 0) * 6 : cx;
      const baseRotation = rules.mode === 'measure' ? (session.angleBaselineOffset ?? 0) : 0;
      const transformAngle = (baselineSide === 'left' ? 180 : 0) + baseRotation;
      const group = document.createElementNS(svg.namespaceURI, 'g'); group.setAttribute('transform', `translate(${centerX} ${cy}) rotate(${-transformAngle})`);
      if (rules.mode === 'measure' || rules.mode === 'draw') {
        const arc = document.createElementNS(svg.namespaceURI, 'path'); arc.setAttribute('d', `M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`); arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', '#9ab6c5'); arc.setAttribute('stroke-width', '1'); group.append(arc);
        for (let degree = 0; degree <= 180; degree += 5) {
          const outer = { x: radius * Math.cos(degree * Math.PI / 180), y: -radius * Math.sin(degree * Math.PI / 180) };
          const tickRadius = degree % 10 === 0 ? radius - 10 : radius - 5;
          const inner = { x: tickRadius * Math.cos(degree * Math.PI / 180), y: -tickRadius * Math.sin(degree * Math.PI / 180) };
          const tick = document.createElementNS(svg.namespaceURI, 'line'); tick.setAttribute('x1', String(inner.x)); tick.setAttribute('y1', String(inner.y)); tick.setAttribute('x2', String(outer.x)); tick.setAttribute('y2', String(outer.y)); tick.setAttribute('stroke', degree % 10 === 0 ? '#557c8d' : '#9ab6c5'); tick.setAttribute('stroke-width', degree % 10 === 0 ? '1.3' : '0.7'); group.append(tick);
          if (degree % 30 === 0) {
            for (const [labelRadius, labelValue, fill] of [[radius - 20, degree, '#244d60'], [radius - 34, 180 - degree, '#a64b2d']]) {
              const label = document.createElementNS(svg.namespaceURI, 'text');
              label.setAttribute('x', String(labelRadius * Math.cos(degree * Math.PI / 180)));
              label.setAttribute('y', String(-labelRadius * Math.sin(degree * Math.PI / 180) + 4));
              label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '8'); label.setAttribute('fill', fill);
              label.textContent = String(labelValue); group.append(label);
            }
          }
        }
      }
      const end = { x: radius * Math.cos(angle * Math.PI / 180), y: -radius * Math.sin(angle * Math.PI / 180) };
      const base = document.createElementNS(svg.namespaceURI, 'line'); base.setAttribute('x1', rules.mode === 'measure' ? '-90' : '0'); base.setAttribute('y1', '0'); base.setAttribute('x2', String(radius)); base.setAttribute('y2', '0'); base.setAttribute('stroke', '#557c8d'); base.setAttribute('stroke-width', '3'); group.append(base);
      const ray = document.createElementNS(svg.namespaceURI, 'line'); ray.setAttribute('x1', '0'); ray.setAttribute('y1', '0'); ray.setAttribute('x2', String(end.x)); ray.setAttribute('y2', String(end.y)); ray.setAttribute('stroke', '#d45b36'); ray.setAttribute('stroke-width', '4'); ray.setAttribute('stroke-linecap', 'round'); group.append(ray);
      if (rules.mode === 'draw' && Number.isInteger(session.angleDrawValue)) { const label = document.createElementNS(svg.namespaceURI, 'text'); label.setAttribute('x', '0'); label.setAttribute('y', '-12'); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '13'); label.setAttribute('fill', '#9a3e24'); label.textContent = `${session.angleDrawValue}°`; group.append(label); }
      const vertex = document.createElementNS(svg.namespaceURI, 'circle'); vertex.setAttribute('cx', '0'); vertex.setAttribute('cy', '0'); vertex.setAttribute('r', '4'); vertex.setAttribute('fill', '#233e4a'); group.append(vertex);
      svg.append(group);
      if (rules.mode === 'measure') {
        const ghost = document.createElementNS(svg.namespaceURI, 'circle'); ghost.setAttribute('cx', String(cx)); ghost.setAttribute('cy', String(cy)); ghost.setAttribute('r', '5'); ghost.setAttribute('fill', '#24749a'); ghost.setAttribute('opacity', session.angleCenterOffset === 0 ? '0.35' : '1'); svg.append(ghost);
        add('text', { x: cx, y: 232, 'text-anchor': 'middle', 'font-size': 11, fill: '#234a5b' }, `中心偏移 ${session.angleCenterOffset} 格；基準線偏轉 ${session.angleBaselineOffset}°`);
      }
    }
    panel.append(svg);
    if (rules.mode === 'measure') {
      const align = element('div', 'angle-control-row');
      const control = (text, action, payload, disabled = false) => { const b = element('button', 'candidate-token geometry-control', text); b.type = 'button'; b.disabled = disabled; b.addEventListener('click', () => dispatch(action, payload)); align.append(b); };
      control('中心向左一格', 'adjust_angle_alignment', { part: 'center', delta: -1 }, session.angleCenterOffset <= -rules.centerRange);
      control('中心向右一格', 'adjust_angle_alignment', { part: 'center', delta: 1 }, session.angleCenterOffset >= rules.centerRange);
      control('基準線逆轉 5°', 'adjust_angle_alignment', { part: 'baseline', delta: -1 }, session.angleBaselineOffset <= -rules.baselineRange);
      control('基準線順轉 5°', 'adjust_angle_alignment', { part: 'baseline', delta: 1 }, session.angleBaselineOffset >= rules.baselineRange);
      panel.append(align);
      panel.append(element('p', '', '選擇基準邊的 0° 刻度，再讀另一邊射線；量角器有內外兩列刻度。'));
      const sides = element('div', 'candidate-token-list');
      for (const [side, label] of [['left', '從左側 0° 開始'], ['right', '從右側 0° 開始']]) { const b = element('button', `candidate-token${session.angleBaselineSide === side ? ' is-selected' : ''}`, label); b.type = 'button'; b.setAttribute('aria-pressed', String(session.angleBaselineSide === side)); b.addEventListener('click', () => dispatch('set_angle_baseline_side', { side })); sides.append(b); }
      panel.append(sides);
      const reading = element('label', 'angle-slider-label', `從所選 0° 刻度讀值：${session.angleReading ?? '尚未讀取'}°`);
      const readSlider = element('input', 'angle-slider'); readSlider.type = 'range'; readSlider.min = '0'; readSlider.max = '180'; readSlider.step = String(rules.readingStep); readSlider.value = String(session.angleReading ?? 0); readSlider.disabled = session.angleCenterOffset !== 0 || session.angleBaselineOffset !== 0 || !session.angleBaselineSide; readSlider.setAttribute('aria-label', '選擇量角器讀值'); readSlider.addEventListener('change', () => dispatch('set_angle_reading', { degrees: Number(readSlider.value) })); reading.append(readSlider); panel.append(reading);
    } else if (rules.mode === 'estimate' || rules.mode === 'draw') {
      const current = rules.mode === 'estimate' ? session.angleEstimate : session.angleDrawValue;
      const label = element('label', 'angle-slider-label', `${rules.mode === 'estimate' ? '我的估測' : '目前射線角度'}：${Number.isInteger(current) ? `${current}°` : '尚未調整'}`);
      const slider = element('input', 'angle-slider'); slider.type = 'range'; slider.min = String(rules.valueRange.min); slider.max = String(rules.valueRange.max); slider.step = String(rules.valueRange.step); slider.value = String(Number.isInteger(current) ? current : rules.initialDegrees ?? 0); slider.setAttribute('aria-label', rules.mode === 'estimate' ? '設定角度估測值' : '旋轉射線調整作圖角度'); slider.addEventListener('change', () => dispatch('set_angle_value', { degrees: Number(slider.value) })); label.append(slider); panel.append(label);
      if (rules.mode === 'draw') panel.append(element('p', '', `目標 ${rules.targetDegrees}°；目前差 ${Number.isInteger(current) ? Math.abs(current - rules.targetDegrees) : '—'}°。`));
    } else {
      panel.append(element('p', '', `從鐘面 ${rules.startHour} 時位置轉到 ${rules.endHour} 時位置，判斷方向並操作轉過的角度。`));
      const directions = element('div', 'candidate-token-list');
      for (const [direction, label] of [['clockwise', '順時針'], ['counterclockwise', '逆時針']]) { const b = element('button', `candidate-token${session.angleRotationDirection === direction ? ' is-selected' : ''}`, label); b.type = 'button'; b.setAttribute('aria-pressed', String(session.angleRotationDirection === direction)); b.addEventListener('click', () => dispatch('set_angle_rotation', { direction, degrees: session.angleRotationDegrees ?? 0 })); directions.append(b); }
      panel.append(directions);
      const label = element('label', 'angle-slider-label', `轉過：${Number.isInteger(session.angleRotationDegrees) ? session.angleRotationDegrees : '尚未調整'}°`);
      const slider = element('input', 'angle-slider'); slider.type = 'range'; slider.min = '0'; slider.max = '360'; slider.step = String(rules.rotationStep); slider.value = String(session.angleRotationDegrees ?? 0); slider.disabled = !session.angleRotationDirection; slider.setAttribute('aria-label', '調整鐘面旋轉角度'); slider.addEventListener('change', () => dispatch('set_angle_rotation', { direction: session.angleRotationDirection, degrees: Number(slider.value) })); label.append(slider); panel.append(label);
    }
    host.append(panel);
    }
  }
  if (session.phase === 'active' && stage.interaction === 'construct_lines') {
    const rules = stage.lineRules;
    const panel = element('section', 'candidate-response-build line-construction-panel');
    panel.append(element('strong', '', rules.relation === 'parallel'
      ? '點選兩個格點建構平行線；紅點是指定通過點。'
      : '點選兩個格點建構垂直線；紅點是指定通過點。'));
    const board = element('div', 'line-construction-board');
    board.style.setProperty('--line-grid-columns', String(rules.columns));
    board.style.setProperty('--line-grid-rows', String(rules.rows));
    board.style.cssText += `;position:relative;display:grid;grid-template-columns:repeat(${rules.columns},minmax(0,1fr));grid-template-rows:repeat(${rules.rows},minmax(32px,1fr));width:min(100%,420px);aspect-ratio:1;margin:14px auto;border:1px solid #aac2ca;border-radius:12px;background:#fff;overflow:hidden`;
    const drawing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    drawing.setAttribute('viewBox', '0 0 600 600'); drawing.setAttribute('aria-hidden', 'true');
    drawing.classList.add('line-construction-drawing');
    drawing.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    for (let column = 0; column < rules.columns; column += 1) {
      const line = document.createElementNS(drawing.namespaceURI, 'line');
      const x = (column + 0.5) * (600 / rules.columns);
      line.setAttribute('x1', String(x)); line.setAttribute('x2', String(x)); line.setAttribute('y1', '0'); line.setAttribute('y2', '600');
      line.style.cssText = 'stroke:#dce8eb;stroke-width:1'; drawing.append(line);
    }
    for (let row = 0; row < rules.rows; row += 1) {
      const line = document.createElementNS(drawing.namespaceURI, 'line');
      const y = (row + 0.5) * (600 / rules.rows);
      line.setAttribute('x1', '0'); line.setAttribute('x2', '600'); line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
      line.style.cssText = 'stroke:#dce8eb;stroke-width:1'; drawing.append(line);
    }
    const drawSegment = (start, end, className) => {
      const line = document.createElementNS(drawing.namespaceURI, 'line');
      line.setAttribute('x1', String((start.column + 0.5) * (600 / rules.columns)));
      line.setAttribute('y1', String((start.row + 0.5) * (600 / rules.rows)));
      line.setAttribute('x2', String((end.column + 0.5) * (600 / rules.columns)));
      line.setAttribute('y2', String((end.row + 0.5) * (600 / rules.rows)));
      line.setAttribute('class', className); drawing.append(line);
      line.style.cssText = className === 'line-reference-segment' ? 'stroke:#548496;stroke-width:8;stroke-linecap:round;opacity:.9' : 'stroke:#e47736;stroke-width:8;stroke-linecap:round;opacity:.95';
    };
    rules.referenceSegments.forEach(({ start, end }) => drawSegment(start, end, 'line-reference-segment'));
    if (session.linePoints.length === 2) {
      const parse = (id) => { const match = /^r(\d+)c(\d+)$/.exec(id); return { row: Number(match[1]), column: Number(match[2]) }; };
      drawSegment(parse(session.linePoints[0]), parse(session.linePoints[1]), 'line-student-segment');
    }
    board.append(drawing);
    const referencePoints = new Set();
    const referenceLines = [];
    for (const segment of rules.referenceSegments) {
      referencePoints.add(`r${segment.start.row}c${segment.start.column}`);
      referencePoints.add(`r${segment.end.row}c${segment.end.column}`);
      referenceLines.push(segment);
    }
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const pointId = `r${row}c${column}`;
      const button = element('button', `line-construction-point${referencePoints.has(pointId) ? ' is-reference' : ''}${pointId === `r${rules.requiredPoint.row}c${rules.requiredPoint.column}` ? ' is-required' : ''}${session.linePoints.includes(pointId) ? ' is-selected' : ''}`, pointId === `r${rules.requiredPoint.row}c${rules.requiredPoint.column}` ? '●' : '');
      button.type = 'button'; button.dataset.linePoint = pointId;
      button.style.cssText = `position:relative;z-index:1;display:grid;place-items:center;align-self:center;justify-self:center;width:${pointId === `r${rules.requiredPoint.row}c${rules.requiredPoint.column}` ? 'min(100%,36px)' : referencePoints.has(pointId) ? '11px' : 'min(100%,36px)'};aspect-ratio:1;padding:0;border:0;border-radius:50%;background:${pointId === `r${rules.requiredPoint.row}c${rules.requiredPoint.column}` ? '#fff' : referencePoints.has(pointId) ? '#548496' : 'transparent'};color:#b62f35;box-shadow:${pointId === `r${rules.requiredPoint.row}c${rules.requiredPoint.column}` ? '0 0 0 2px #b62f35' : session.linePoints.includes(pointId) ? '0 0 0 3px #fff,0 0 0 5px #bd5421' : 'none'};cursor:pointer;touch-action:manipulation`;
      button.setAttribute('aria-label', `第 ${row + 1} 列第 ${column + 1} 欄格點${pointId === `r${rules.requiredPoint.row}c${rules.requiredPoint.column}` ? '，指定通過點' : ''}`);
      button.setAttribute('aria-pressed', String(session.linePoints.includes(pointId)));
      button.addEventListener('click', () => dispatch('select_line_construction_point', { pointId }));
      board.append(button);
    }
    panel.append(board);
    panel.append(element('p', 'candidate-response-line', session.linePoints.length
      ? `已選 ${session.linePoints.length}/2 個端點：${session.linePoints.join('、')}`
      : '請依序點選兩個格點；再點第三點會開始畫一條新線。'));
    const referenceLabels = referenceLines.map(({ start, end }) => `參考線 r${start.row}c${start.column} 到 r${end.row}c${end.column}`);
    panel.append(element('small', '', referenceLabels.join('；')));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'complete_symmetry_grid') {
    const rules = stage.symmetryRules;
    const panel = element('section', 'candidate-response-build symmetry-grid-builder');
    panel.append(element('strong', '', `補上對稱軸另一側的格子；紅線是對稱軸（第 ${rules.axisColumn + 1} 欄與第 ${rules.axisColumn + 2} 欄之間）。`));
    const board = element('div', 'symmetry-grid-board');
    board.style.display = 'grid'; board.style.gridTemplateColumns = `repeat(${rules.columns}, minmax(30px, 1fr))`; board.style.maxWidth = '360px'; board.style.margin = '12px auto';
    const fixed = new Set(rules.fixedCellIds);
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const cellId = `${row}-${column}`;
      const cell = element('button', `symmetry-grid-cell${fixed.has(cellId) ? ' is-given' : ''}${session.symmetryCells.includes(cellId) ? ' is-filled' : ''}${column === rules.axisColumn + 1 ? ' symmetry-axis-edge' : ''}`, fixed.has(cellId) ? '●' : session.symmetryCells.includes(cellId) ? '●' : '');
      cell.type = 'button'; cell.dataset.cellId = cellId; cell.disabled = fixed.has(cellId) || !rules.fillableCellIds.includes(cellId); cell.setAttribute('aria-label', `第 ${row + 1} 列第 ${column + 1} 欄${fixed.has(cellId) ? '已給定圖格' : session.symmetryCells.includes(cellId) ? '已填色' : '空白，可切換'}`); cell.setAttribute('aria-pressed', String(fixed.has(cellId) || session.symmetryCells.includes(cellId)));
      if (!cell.disabled) cell.addEventListener('click', () => dispatch('toggle_symmetry_cell', { cellId }));
      board.append(cell);
    }
    panel.append(board, element('p', 'candidate-response-line', `已補 ${session.symmetryCells.length} 格；檢查每個圖格到對稱軸的距離是否相同。`));
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'plot_line_chart') {
    const rules = stage.plotRules;
    const panel = element('section', 'candidate-response-build line-chart-builder');
    panel.append(element('strong', '', `依資料選每個日期的點高，再檢查相鄰點的變化。資料圖：${rules.chartTitle}`));
    const chart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chart.setAttribute('viewBox', `0 0 ${Math.max(320, rules.points.length * 76)} 220`); chart.setAttribute('role', 'img'); chart.setAttribute('aria-label', '依已選資料即時形成的折線圖'); chart.style.width = '100%'; chart.style.maxWidth = '620px'; chart.style.display = 'block'; chart.style.margin = '8px auto';
    const chartWidth = Math.max(320, rules.points.length * 76); const x0 = 42; const y0 = 24; const chartHeight = 150; const chartInnerWidth = chartWidth - 68;
    const axis = document.createElementNS(chart.namespaceURI, 'path'); axis.setAttribute('d', `M${x0},${y0} V${y0 + chartHeight} H${x0 + chartInnerWidth}`); axis.setAttribute('fill', 'none'); axis.setAttribute('stroke', '#31596b'); axis.setAttribute('stroke-width', '2'); chart.append(axis);
    const maxValue = Math.max(...rules.valueOptions);
    for (const value of rules.valueOptions) { const y = y0 + chartHeight - (value / maxValue) * chartHeight; const tick = document.createElementNS(chart.namespaceURI, 'text'); tick.setAttribute('x', String(x0 - 8)); tick.setAttribute('y', String(y + 4)); tick.setAttribute('text-anchor', 'end'); tick.setAttribute('font-size', '11'); tick.textContent = String(value); chart.append(tick); const grid = document.createElementNS(chart.namespaceURI, 'line'); grid.setAttribute('x1', String(x0)); grid.setAttribute('x2', String(x0 + chartInnerWidth)); grid.setAttribute('y1', String(y)); grid.setAttribute('y2', String(y)); grid.setAttribute('stroke', '#d8e2e8'); grid.setAttribute('stroke-width', '1'); chart.append(grid); }
    const coordinates = rules.points.filter(({ id }) => Number.isFinite(session.lineChartValues[id])).map((point) => `${x0 + (rules.points.indexOf(point) / (rules.points.length - 1)) * chartInnerWidth},${y0 + chartHeight - (session.lineChartValues[point.id] / maxValue) * chartHeight}`);
    if (coordinates.length > 1) { const line = document.createElementNS(chart.namespaceURI, 'polyline'); line.setAttribute('points', coordinates.join(' ')); line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#d05d37'); line.setAttribute('stroke-width', '4'); chart.append(line); }
    rules.points.forEach((point, index) => {
      const x = x0 + (index / (rules.points.length - 1)) * chartInnerWidth; const label = document.createElementNS(chart.namespaceURI, 'text'); label.setAttribute('x', String(x)); label.setAttribute('y', String(y0 + chartHeight + 20)); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '12'); label.textContent = point.label; chart.append(label);
      if (Number.isFinite(session.lineChartValues[point.id])) { const dot = document.createElementNS(chart.namespaceURI, 'circle'); dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y0 + chartHeight - (session.lineChartValues[point.id] / maxValue) * chartHeight)); dot.setAttribute('r', '6'); dot.setAttribute('fill', '#155a78'); chart.append(dot); }
    });
    panel.append(chart, element('p', '', `${rules.yAxisTitle}：${rules.valueOptions.join('、')}；請依表中的模擬觀測資料設定各點。`));
    const table = element('div', 'line-chart-point-controls');
    for (const point of rules.points) {
      const row = element('fieldset', 'line-chart-point-row'); row.append(element('legend', '', `${point.label}：${point.observation}`));
      const choices = element('div', 'candidate-token-list');
      for (const value of rules.valueOptions) { const choice = element('button', `candidate-token${session.lineChartValues[point.id] === value ? ' is-selected' : ''}`, String(value)); choice.type = 'button'; choice.setAttribute('aria-pressed', String(session.lineChartValues[point.id] === value)); choice.addEventListener('click', () => dispatch('set_line_chart_point', { pointId: point.id, value })); choices.append(choice); }
      row.append(choices); table.append(row);
    }
    panel.append(table); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'build_bar_chart') {
    const rules = stage.barChartRules;
    const panel = element('section', 'candidate-response-build bar-chart-builder');
    panel.append(element('strong', '', `${rules.chartTitle}（依分類資料建立長條圖）`));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const width = Math.max(320, rules.categories.length * 76);
    const chartHeight = 164; const x0 = 42; const y0 = 18; const innerWidth = width - 56;
    svg.setAttribute('viewBox', `0 0 ${width} 220`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '依操作中的資料即時形成長條圖');
    svg.style.width = '100%'; svg.style.maxWidth = '620px'; svg.style.display = 'block'; svg.style.margin = '8px auto';
    for (let value = 0; value <= rules.maxValue; value += 1) {
      const y = y0 + chartHeight - (value / rules.maxValue) * chartHeight;
      const grid = document.createElementNS(svg.namespaceURI, 'line'); grid.setAttribute('x1', String(x0)); grid.setAttribute('x2', String(x0 + innerWidth)); grid.setAttribute('y1', String(y)); grid.setAttribute('y2', String(y)); grid.setAttribute('stroke', '#d8e2e8'); svg.append(grid);
      const tick = document.createElementNS(svg.namespaceURI, 'text'); tick.setAttribute('x', '28'); tick.setAttribute('y', String(y + 4)); tick.setAttribute('font-size', '11'); tick.textContent = String(value); svg.append(tick);
    }
    const slot = innerWidth / rules.categories.length;
    rules.categories.forEach((category, index) => {
      const value = session.barChartValues[category.id] ?? 0; const barHeight = (value / rules.maxValue) * chartHeight;
      const rect = document.createElementNS(svg.namespaceURI, 'rect'); rect.setAttribute('x', String(x0 + index * slot + slot * 0.2)); rect.setAttribute('y', String(y0 + chartHeight - barHeight)); rect.setAttribute('width', String(slot * 0.6)); rect.setAttribute('height', String(barHeight)); rect.setAttribute('rx', '3'); rect.setAttribute('fill', '#287c91'); svg.append(rect);
      const label = document.createElementNS(svg.namespaceURI, 'text'); label.setAttribute('x', String(x0 + index * slot + slot / 2)); label.setAttribute('y', String(y0 + chartHeight + 18)); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '11'); label.textContent = category.label; svg.append(label);
      const count = document.createElementNS(svg.namespaceURI, 'text'); count.setAttribute('x', String(x0 + index * slot + slot / 2)); count.setAttribute('y', String(y0 + chartHeight - barHeight - 4)); count.setAttribute('text-anchor', 'middle'); count.setAttribute('font-size', '11'); count.textContent = String(value); svg.append(count);
    });
    panel.append(svg, element('p', '', `${rules.yAxisTitle}；依資料卡逐類調整柱高。`));
    const controls = element('div', 'candidate-classification-board');
    for (const category of rules.categories) {
      const row = element('fieldset', 'candidate-classification-card');
      row.append(element('legend', '', `${category.label}：資料 ${category.value} 筆；目前柱高 ${session.barChartValues[category.id] ?? 0}`));
      for (const [delta, text] of [[-1, '減 1'], [1, '加 1']]) {
        const button = element('button', 'candidate-category', text); button.type = 'button';
        button.setAttribute('aria-label', `${category.label}${text}`);
        button.addEventListener('click', () => dispatch('adjust_bar_chart_bar', { categoryId: category.id, delta })); row.append(button);
      }
      controls.append(row);
    }
    panel.append(controls); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'construct_triangle') {
    const rules = stage.triangleRules; const panel = element('section', 'candidate-response-build triangle-builder');
    panel.append(element('strong', '', `${rules.promptLabel}：依格點選出 3 個頂點，畫出指定三角形。`));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 250 250'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '目前所選三角形頂點及連線'); svg.style.width = '100%'; svg.style.maxWidth = '360px'; svg.style.display = 'block'; svg.style.margin = '8px auto';
    const margin = 25; const step = 200 / (rules.columns - 1);
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const x = margin + column * step; const y = margin + row * step;
      for (const [x1, y1, x2, y2] of [[x, margin, x, 225], [margin, y, 225, y]]) { const line = document.createElementNS(svg.namespaceURI, 'line'); line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1)); line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2)); line.setAttribute('stroke', '#d8e2e8'); svg.append(line); }
    }
    const selectedPoints = session.triangleVertices.map((id) => { const [, row, column] = /^r(\d+)c(\d+)$/.exec(id); return { x: margin + Number(column) * step, y: margin + Number(row) * step }; });
    if (selectedPoints.length > 1) { const poly = document.createElementNS(svg.namespaceURI, 'polyline'); poly.setAttribute('points', [...selectedPoints, ...(selectedPoints.length === 3 ? [selectedPoints[0]] : [])].map(({ x, y }) => `${x},${y}`).join(' ')); poly.setAttribute('fill', selectedPoints.length === 3 ? 'rgba(40,124,145,.16)' : 'none'); poly.setAttribute('stroke', '#287c91'); poly.setAttribute('stroke-width', '3'); svg.append(poly); }
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const pointId = `r${row}c${column}`; const dot = document.createElementNS(svg.namespaceURI, 'circle'); dot.setAttribute('cx', String(margin + column * step)); dot.setAttribute('cy', String(margin + row * step)); dot.setAttribute('r', session.triangleVertices.includes(pointId) ? '8' : '4'); dot.setAttribute('fill', session.triangleVertices.includes(pointId) ? '#d05d37' : '#31596b'); svg.append(dot);
    }
    const points = element('div', 'candidate-token-list');
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const pointId = `r${row}c${column}`; const button = element('button', `candidate-token${session.triangleVertices.includes(pointId) ? ' is-selected' : ''}`, session.triangleVertices.includes(pointId) ? '●' : '＋'); button.type = 'button'; button.dataset.pointId = pointId; button.setAttribute('aria-label', `${session.triangleVertices.includes(pointId) ? '取消' : '選擇'}頂點，第${row + 1}列第${column + 1}欄`); button.setAttribute('aria-pressed', String(session.triangleVertices.includes(pointId))); button.addEventListener('click', () => dispatch('toggle_triangle_vertex', { pointId })); points.append(button);
    }
    panel.append(svg, element('p', 'candidate-selection-count', `已選 ${session.triangleVertices.length}/3 個頂點。`), points); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'construct_quadrilateral') {
    const rules = stage.quadrilateralRules;
    const panel = element('section', 'candidate-response-build quadrilateral-builder');
    panel.append(element('strong', '', `${rules.promptLabel}：依序點選四個角點，完成封閉四邊形。`));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 250 250'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `目前建構的${rules.promptLabel}`); svg.style.width = '100%'; svg.style.maxWidth = '360px'; svg.style.display = 'block'; svg.style.margin = '8px auto';
    const margin = 25; const step = 200 / (rules.columns - 1);
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const x = margin + column * step; const y = margin + row * step;
      for (const [x1, y1, x2, y2] of [[x, margin, x, 225], [margin, y, 225, y]]) { const line = document.createElementNS(svg.namespaceURI, 'line'); line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1)); line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2)); line.setAttribute('stroke', '#d8e2e8'); svg.append(line); }
    }
    const chosen = session.quadrilateralVertices.map((id) => { const [, row, column] = /^r(\d+)c(\d+)$/.exec(id); return { x: margin + Number(column) * step, y: margin + Number(row) * step }; });
    if (chosen.length > 1) { const poly = document.createElementNS(svg.namespaceURI, 'polyline'); poly.setAttribute('points', [...chosen, ...(chosen.length === 4 ? [chosen[0]] : [])].map(({ x, y }) => `${x},${y}`).join(' ')); poly.setAttribute('fill', chosen.length === 4 ? 'rgba(40,124,145,.16)' : 'none'); poly.setAttribute('stroke', '#287c91'); poly.setAttribute('stroke-width', '3'); svg.append(poly); }
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const pointId = `r${row}c${column}`; const selected = session.quadrilateralVertices.includes(pointId);
      const dot = document.createElementNS(svg.namespaceURI, 'circle'); dot.setAttribute('cx', String(margin + column * step)); dot.setAttribute('cy', String(margin + row * step)); dot.setAttribute('r', selected ? '7' : '3'); dot.setAttribute('fill', selected ? '#d05d37' : '#31596b'); svg.append(dot);
    }
    const points = element('div', 'candidate-token-list');
    for (let row = 0; row < rules.rows; row += 1) for (let column = 0; column < rules.columns; column += 1) {
      const pointId = `r${row}c${column}`; const selected = session.quadrilateralVertices.includes(pointId);
      const button = element('button', `candidate-token${selected ? ' is-selected' : ''}`, selected ? '●' : '＋'); button.type = 'button'; button.dataset.quadrilateralPoint = pointId;
      button.setAttribute('aria-label', `${selected ? '取消' : '選擇'}頂點，第${row + 1}列第${column + 1}欄`); button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', () => dispatch('toggle_quadrilateral_vertex', { pointId })); points.append(button);
    }
    panel.append(svg, element('p', 'candidate-selection-count', `已選 ${session.quadrilateralVertices.length}/4 個頂點，順序即為邊的連接順序。`), points); host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'manipulate_fraction_model') {
    const rules = stage.fractionRules;
    const panel = element('section', 'candidate-response-build fraction-model-builder');
    panel.append(element('strong', '', '分數拼片操作板：先選整體與等分份數，再選要操作的模型，把每一片移到目標位置。'));
    if (rules.wholeOptions?.length) {
      const wholeChoices = element('div', 'candidate-token-list fraction-whole-choices');
      for (const whole of rules.wholeOptions) {
        const choice = element('button', `candidate-token${session.fractionSelectedWholeId === whole.id ? ' is-selected' : ''}`, whole.label);
        choice.type = 'button'; choice.setAttribute('aria-pressed', String(session.fractionSelectedWholeId === whole.id));
        choice.addEventListener('click', () => dispatch('select_fraction_whole', { wholeId: whole.id })); wholeChoices.append(choice);
      }
      panel.append(element('p', '', '選擇完整整體：'), wholeChoices);
    }
    const denominatorChoices = element('div', 'candidate-token-list fraction-denominator-choices');
    for (const denominator of rules.denominatorOptions) {
      const choice = element('button', `candidate-token${session.fractionDenominator === denominator ? ' is-selected' : ''}`, `平均分成 ${denominator} 份`);
      choice.type = 'button'; choice.setAttribute('aria-pressed', String(session.fractionDenominator === denominator));
      choice.addEventListener('click', () => dispatch('set_fraction_denominator', { denominator })); denominatorChoices.append(choice);
    }
    panel.append(element('p', '', '選擇題目指定的等分份數；每片代表同一整體的一個等大部分。'), denominatorChoices);
    if (session.fractionDenominator !== null) {
      const fractionGroups = element('div', 'fraction-model-groups');
      for (const model of rules.groups) {
        const groupPanel = element('section', `fraction-model-group${session.fractionSelectedModelId === model.id ? ' is-active' : ''}`);
        groupPanel.dataset.fractionGroupId = model.id;
        const count = Object.values(session.fractionPieceLocations).filter((groupId) => groupId === model.id).length;
        const title = element('div', 'fraction-model-heading');
        title.append(element('strong', '', model.label));
        if (model.kind !== 'pool') title.append(element('output', 'fraction-model-count', `${count}/${session.fractionDenominator} 份`));
        groupPanel.append(title);
        if (model.acceptsPieces) {
          const select = element('button', `button button-secondary fraction-model-select${session.fractionSelectedModelId === model.id ? ' is-selected' : ''}`, session.fractionSelectedModelId === model.id ? '目前操作這條' : '操作這條模型');
          select.type = 'button'; select.setAttribute('aria-pressed', String(session.fractionSelectedModelId === model.id));
          select.addEventListener('click', () => dispatch('select_fraction_model', { groupId: model.id })); groupPanel.append(select);
        }
        const groupPieces = rules.pieces.filter(({ id }) => session.fractionPieceLocations[id] === model.id);
        const slots = element('div', `fraction-piece-slots${model.kind === 'pool' ? ' is-pool' : ''}`);
        slots.style.setProperty('--fraction-denominator', String(session.fractionDenominator));
        if (model.kind === 'pool') {
          for (const piece of groupPieces) {
            const pieceButton = element('button', 'fraction-piece fraction-piece-available', '1 片'); pieceButton.type = 'button';
            pieceButton.dataset.fractionPieceId = piece.id;
            pieceButton.setAttribute('aria-label', `分數片 ${piece.id}，移到目前操作的模型`);
            pieceButton.disabled = !session.fractionSelectedModelId || session.fractionSelectedModelId === model.id;
            pieceButton.addEventListener('click', () => dispatch('move_fraction_piece', { pieceId: piece.id, targetGroupId: session.fractionSelectedModelId })); slots.append(pieceButton);
          }
        } else {
          for (let slot = 0; slot < session.fractionDenominator; slot += 1) {
            const piece = groupPieces[slot];
            if (piece) {
              const pieceButton = element('button', 'fraction-piece fraction-piece-placed', '▰'); pieceButton.type = 'button';
              pieceButton.dataset.fractionPieceId = piece.id;
              const isAtOrigin = model.id === piece.initialGroupId;
              pieceButton.setAttribute('aria-label', isAtOrigin
                ? `第 ${slot + 1} 片，移到目前選取的模型`
                : `已移動的第 ${slot + 1} 片，點擊移回原來源`);
              pieceButton.addEventListener('click', () => dispatch('move_fraction_piece', {
                pieceId: piece.id,
                targetGroupId: isAtOrigin ? session.fractionSelectedModelId : piece.initialGroupId,
              })); slots.append(pieceButton);
            } else {
              const empty = element('span', 'fraction-piece fraction-piece-empty', '□'); empty.setAttribute('aria-label', `空的第 ${slot + 1} 格`); slots.append(empty);
            }
          }
        }
        groupPanel.append(slots, element('small', '', model.kind === 'pool' ? '點選分數片，放入目前選取的模型。' : '每片代表同一整體平均分成的等份之一。'));
        fractionGroups.append(groupPanel);
      }
      panel.append(fractionGroups);
    }
    if (rules.mode === 'compare') {
      const relations = element('div', 'candidate-token-list fraction-relation-choices');
      for (const relation of ['<', '=', '>']) {
        const choice = element('button', `candidate-token${session.fractionRelation === relation ? ' is-selected' : ''}`, relation); choice.type = 'button';
        choice.setAttribute('aria-pressed', String(session.fractionRelation === relation));
        choice.addEventListener('click', () => dispatch('set_fraction_relation', { relation })); relations.append(choice);
      }
      panel.append(element('p', '', '依兩個模型的單位分數片數，放入比較符號：'), relations);
    }
    host.append(panel);
  }
  if (session.phase === 'active' && stage.interaction === 'choose_response') {
    if (stage.clockDisplay) {
      const clockPanel = element('section', 'clock-reading-panel');
      clockPanel.append(element('strong', '', '看鐘面，選出相同的數位時刻。'), makeClockFace(stage.clockDisplay.hour, stage.clockDisplay.minute, stage.clockDisplay.ariaLabel ?? '類比鐘面'));
      host.append(clockPanel);
    }
    const answerSection = element('section', 'candidate-answer-selection');
    answerSection.setAttribute('aria-labelledby', `candidate-answer-heading-${stage.stageId}`);
    const answerHeading = element('h3', 'candidate-answer-selection-heading', '選擇答案');
    answerHeading.id = `candidate-answer-heading-${stage.stageId}`;
    answerSection.append(answerHeading);
    const choices = element('div', 'candidate-category-list');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', '選擇答案');
    for (const option of stage.options) {
      const selected = session.selection.includes(option.id);
      const choice = element('button', `candidate-category candidate-answer-option${selected ? ' is-selected' : ''}`, `${selected ? '✓ 已選｜' : ''}${option.text}`);
      choice.type = 'button';
      choice.setAttribute('aria-pressed', String(selected));
      choice.setAttribute('aria-label', `${selected ? '目前已選答案' : '選擇答案'}「${option.text}」`);
      choice.addEventListener('click', () => dispatch('select_option', { optionId: option.id }));
      choices.append(choice);
    }
    answerSection.append(choices);
    host.append(answerSection);
  }
  if (session.phase === 'active' && stage.interaction === 'collect_evidence') {
    const isMoneySelection = stage.options.every((option) => Number.isFinite(option.valueAmount));
    const evidenceSection = element('section', 'candidate-evidence-selection');
    evidenceSection.setAttribute('aria-labelledby', `candidate-evidence-heading-${stage.stageId}`);
    const evidenceHeading = element('h3', 'candidate-evidence-selection-heading', isMoneySelection ? '選擇錢幣' : '選擇證據');
    evidenceHeading.id = `candidate-evidence-heading-${stage.stageId}`;
    evidenceSection.append(evidenceHeading);
    const evidenceChoices = element('div', 'candidate-category-list');
    evidenceChoices.setAttribute('role', 'group');
    evidenceChoices.setAttribute('aria-label', isMoneySelection ? '選擇錢幣' : '選擇證據');
    for (const option of stage.options) {
      const selected = session.selection.includes(option.id);
      const choice = element('button', `candidate-category candidate-evidence-option${selected ? ' is-selected' : ''}`, `${selected ? '✓ 已選｜' : ''}${option.text}`);
      choice.type = 'button';
      choice.setAttribute('aria-pressed', String(selected));
      choice.setAttribute('aria-label', `${selected ? '取消選擇' : '選擇'}${isMoneySelection ? '錢幣' : '證據'}「${option.text}」`);
      if (option.figure) choice.prepend(createGeometryFigure(option.figure));
      choice.addEventListener('click', () => dispatch('toggle_evidence', { optionId: option.id }));
      evidenceChoices.append(choice);
    }
    evidenceSection.append(evidenceChoices);
    host.append(evidenceSection);
    const selectedAmount = isMoneySelection
      ? `，目前合計 ${stage.options.filter((option) => session.selection.includes(option.id)).reduce((sum, option) => sum + option.valueAmount, 0)} 元`
      : '';
    const selectionSummary = session.selection.length
      ? `我的選擇：已選 ${session.selection.length} 項${selectedAmount}`
      : `我的選擇：${isMoneySelection ? '還沒有選擇錢幣。' : '還沒有選擇證據。'}`;
    host.append(element('p', 'candidate-selection-count candidate-evidence-selection-summary', selectionSummary));
  }
  if (session.phase === 'active' && stage.interaction === 'classify_observations') {
    if (stage.distributionBoard) {
      const model = stage.distributionBoard;
      const summary = element('section', 'candidate-distribution-summary');
      summary.setAttribute('aria-label', '分裝操作即時統計');
      summary.append(element('strong', '', `${model.itemLabel}分配板：${model.goalLabel}`));
      const counts = element('div', 'candidate-distribution-counts');
      for (const category of stage.categories) {
        const count = Object.values(session.assignments).filter((id) => id === category.id).length;
        const targetText = model.mode === 'equal_share' ? `目標每份 ${model.expectedGroupSize}`
          : model.mode === 'groups_with_remainder' && category.id === 'remainder-tray' ? '未裝滿的剩餘物'
            : `目標每組 ${model.expectedGroupSize}`;
        const counter = element('div', 'candidate-distribution-count');
        counter.append(element('span', '', category.label), element('b', '', `${count} 個`), element('small', '', targetText));
        counts.append(counter);
      }
      summary.append(counts);
      const board = element('div', 'candidate-classification-board candidate-distribution-board');
      for (const observation of stage.observations) {
        const card = element('fieldset', 'candidate-classification-card candidate-distribution-card');
        card.dataset.observationId = observation.id;
        card.append(element('legend', '', observation.text));
        const choices = element('div', 'candidate-category-list');
        for (const category of stage.categories) {
          const selected = session.assignments[observation.id] === category.id;
          const choice = element('button', `candidate-category${selected ? ' is-selected' : ''}`, category.label);
          choice.type = 'button';
          choice.setAttribute('aria-pressed', String(selected));
          choice.setAttribute('aria-label', `${observation.text}，分配到${category.label}`);
          choice.addEventListener('click', () => dispatch('assign_category', { observationId: observation.id, categoryId: category.id }));
          choices.append(choice);
        }
        card.append(choices); board.append(card);
      }
      host.append(summary, board);
    } else {
    const board = element('div', 'candidate-classification-board');
    for (const observation of stage.observations) {
      const card = element('fieldset', 'candidate-classification-card');
      card.dataset.observationId = observation.id;
      card.append(element('legend', '', observation.text));
      const comparison = stage.lengthComparison?.comparisons?.find(({ id }) => id === observation.id);
      if (comparison) {
        const visual = element('div', 'length-comparison-visual');
        visual.append(element('p', '', `${comparison.leftKind} A`));
        for (const [label, units] of [['A', comparison.leftUnits], ['B', comparison.rightUnits]]) {
          const rail = element('div', 'length-comparison-rail'); rail.setAttribute('aria-label', `${label} 路徑，${units} 個${stage.lengthComparison.unitLabel}`);
          for (let i = 0; i < units; i += 1) rail.append(element('span', 'length-comparison-unit', ''));
          visual.append(rail);
        }
        visual.append(element('small', '', `共同參照：${stage.lengthComparison.unitLabel}`)); card.append(visual);
      }
      const choices = element('div', 'candidate-category-list');
      for (const category of stage.categories) {
        const choice = element('button', `candidate-category${session.assignments[observation.id] === category.id ? ' is-selected' : ''}`, category.label);
        choice.type = 'button';
        choice.setAttribute('aria-pressed', String(session.assignments[observation.id] === category.id));
        choice.addEventListener('click', () => dispatch('assign_category', { observationId: observation.id, categoryId: category.id }));
        choices.append(choice);
      }
      card.append(choices); board.append(card);
    }
    host.append(board);
    }
  }
  if (session.phase === 'active' && stage.interaction === 'build_frequency_table') {
    if (stage.collectionRules) {
      const collection = element('section', 'candidate-data-collection');
      collection.append(element('strong', '', `${stage.collectionRules.label ?? '資料收集'}：${session.collectedObservationIds.length}/${stage.collectionRules.requiredObservationIds.length}`));
      collection.append(element('p', 'candidate-task-instructions', '以下是專案提供的模擬紀錄。逐張點選收集，再依線索分類；這不是實際班級調查。'));
      const records = element('div', 'candidate-data-sample-list');
      for (const observation of stage.observations.filter(({ id }) => stage.collectionRules.requiredObservationIds.includes(id))) {
        const collected = session.collectedObservationIds.includes(observation.id);
        const record = element('button', `candidate-data-sample${collected ? ' is-selected' : ''}`, `${collected ? '✓ 已收集：' : '＋ 收集：'}${observation.text}`);
        record.type = 'button'; record.dataset.observationId = observation.id;
        record.setAttribute('aria-pressed', String(collected));
        record.addEventListener('click', () => dispatch('toggle_table_observation', { observationId: observation.id }));
        records.append(record);
      }
      collection.append(records);
      host.append(collection);
      if (session.collectedObservationIds.length !== stage.collectionRules.requiredObservationIds.length) {
        host.append(element('p', 'candidate-collection-locked', '收集完所有紀錄後，才能開始分類並建立表格。'));
      }
    }
    const collectionComplete = !stage.collectionRules || stage.collectionRules.requiredObservationIds.every((id) => session.collectedObservationIds.includes(id));
    if (collectionComplete) {
    if (stage.crossTab) appendTableView({ title: stage.tableTitle, rowHeader: stage.crossTab.rowHeader, columnHeader: stage.crossTab.columnHeader, rows: stage.crossTab.rows, columns: stage.crossTab.columns }, session.assignments, stage.crossTab);
    else {
      const tableWrap = element('div', 'candidate-table-wrap');
      const table = element('table', 'candidate-frequency-table');
      table.append(element('caption', '', stage.tableTitle));
      const head = document.createElement('tr');
      for (const title of ['類別', '目前筆數']) head.append(element('th', '', title));
      const thead = document.createElement('thead'); thead.append(head); table.append(thead);
      const tbody = document.createElement('tbody');
      for (const category of stage.categories) {
        const row = document.createElement('tr');
        row.append(element('th', '', category.label));
        row.append(element('td', '', String(Object.values(session.assignments).filter((id) => id === category.id).length)));
        tbody.append(row);
      }
      table.append(tbody); tableWrap.append(table); host.append(tableWrap);
    }
    const board = element('div', 'candidate-classification-board');
    for (const observation of stage.observations) {
      const card = element('fieldset', 'candidate-classification-card');
      card.dataset.observationId = observation.id;
      card.append(element('legend', '', observation.text));
      const choices = element('div', 'candidate-category-list');
      for (const category of stage.categories) {
        const choice = element('button', `candidate-category${session.assignments[observation.id] === category.id ? ' is-selected' : ''}`, category.label);
        choice.type = 'button'; choice.setAttribute('aria-pressed', String(session.assignments[observation.id] === category.id));
        choice.addEventListener('click', () => dispatch('assign_category', { observationId: observation.id, categoryId: category.id }));
        choices.append(choice);
      }
      card.append(choices); board.append(card);
    }
    host.append(board);
    }
  }
  if (session.phase === 'active' && stage.interaction === 'compose_pattern') {
    const pattern = element('section', 'candidate-response-build');
    const grid = stage.patternRules.grid;
    const mode = stage.patternRules.mode ?? 'extend';
    if (mode === 'number_builder') {
      const rules = stage.patternRules;
      pattern.append(element('strong', '', `數列建造（${session.patternSequenceEntries.length}/${rules.termCount} 項）`));
      pattern.append(element('p', 'candidate-task-instructions', '先調整起始數與固定增加量，再逐項輸入並填入數列。'));
      const rulePanel = element('div', 'candidate-pattern-row');
      for (const [field, label, value, bounds] of [
        ['start', '起始數', session.patternStartValue, rules.startRange],
        ['increment', '每次增加', session.patternIncrement, rules.incrementRange],
      ]) {
        const group = element('div', 'candidate-pattern-rule-control');
        group.append(element('strong', '', `${label}：${value}`));
        for (const delta of [-1, 1]) {
          const control = element('button', 'button button-secondary', delta < 0 ? '−' : '+'); control.type = 'button';
          control.disabled = value + delta < bounds.min || value + delta > bounds.max;
          control.setAttribute('aria-label', `${label}${delta > 0 ? '加一' : '減一'}`);
          control.addEventListener('click', () => dispatch('set_pattern_rule_value', { field, value: value + delta })); group.append(control);
        }
        rulePanel.append(group);
      }
      pattern.append(rulePanel);
      const row = element('div', 'candidate-pattern-row');
      session.patternSequenceEntries.forEach((value, index) => row.append(element('span', 'candidate-token is-selected', `${index + 1}. ${value}`)));
      pattern.append(row);
      const entry = document.createElement('input'); entry.type = 'number'; entry.step = '1'; entry.setAttribute('aria-label', '輸入下一個數'); entry.className = 'candidate-number-entry';
      const add = element('button', 'button button-secondary', '填入這一項'); add.type = 'button';
      add.disabled = session.patternSequenceEntries.length >= rules.termCount;
      add.addEventListener('click', () => { if (entry.value !== '') dispatch('append_pattern_sequence_term', { value: Number(entry.value) }); });
      const entryRow = element('div', 'candidate-pattern-row'); entryRow.append(entry, add); pattern.append(entryRow);
      host.append(pattern);
    } else if (mode === 'repair') {
      const rules = stage.patternRules;
      pattern.append(element('strong', '', `找出並修正錯誤格（${session.patternRepairIndex === null ? '尚未選格' : `第 ${session.patternRepairIndex + 1} 格`}）`));
      pattern.append(element('p', 'candidate-task-instructions', '先點選你認為錯誤的位置，再從材料列選出正確圖形。'));
      const row = element('div', 'candidate-pattern-row');
      session.selection.forEach((tokenId, index) => {
        const token = stage.tokens.find(({ id }) => id === tokenId);
        const cell = element('button', `candidate-token${session.patternRepairIndex === index ? ' is-selected' : ''}`, `${index + 1}. ${token?.text ?? tokenId}`);
        cell.type = 'button'; cell.setAttribute('aria-pressed', String(session.patternRepairIndex === index));
        cell.addEventListener('click', () => dispatch('select_pattern_repair_cell', { index })); row.append(cell);
      });
      pattern.append(row);
      const tiles = element('div', 'candidate-token-list');
      for (const token of stage.tokens) {
        const tile = element('button', 'candidate-token', token.text); tile.type = 'button';
        tile.disabled = session.patternRepairIndex === null;
        tile.addEventListener('click', () => dispatch('add_pattern_beat', { tokenId: token.id })); tiles.append(tile);
      }
      pattern.append(tiles); host.append(pattern);
    } else {
    pattern.append(element('strong', '', grid
      ? `數字圖補格（${session.selection.length}/${stage.patternRules.beatCount} 格）`
      : mode === 'repeat_unit_builder' ? `自建重複規律（${session.selection.length}/${stage.patternRules.beatCount} 格）` : `節奏排列（${session.selection.length}/${stage.patternRules.beatCount} 拍）`));
    if (mode === 'repeat_unit_builder') pattern.append(element('p', 'candidate-task-instructions', '先用前兩格建立自己的重複單位，再照相同順序填滿後面的格子。'));
    if (grid) {
      const board = element('div', 'candidate-pattern-grid');
      board.style.cssText = `display:grid;grid-template-columns:repeat(${grid[0].length},minmax(52px,1fr));gap:6px;max-width:440px;margin:12px auto`;
      let blankIndex = 0;
      for (const gridRow of grid) for (const value of gridRow) {
        const selectedId = value === null ? session.selection[blankIndex++] : null;
        const token = stage.tokens.find(({ id }) => id === selectedId);
        const cell = element('button', `candidate-token pattern-grid-cell${selectedId ? ' is-selected' : ''}`, value === null ? (token?.text ?? '？') : String(value));
        cell.type = 'button'; cell.disabled = value !== null;
        cell.setAttribute('aria-label', value === null ? `待填數字${selectedId ? ` ${token?.text}` : ''}` : `已知數字 ${value}`);
        board.append(cell);
      }
      pattern.append(board);
      const selected = element('div', 'candidate-pattern-row');
      session.selection.forEach((tokenId, index) => {
        const token = stage.tokens.find(({ id }) => id === tokenId);
        const beat = element('button', 'candidate-token is-selected', token?.text ?? tokenId);
        beat.type = 'button'; beat.setAttribute('aria-label', `移除第 ${index + 1} 個答案 ${token?.text ?? ''}`);
        beat.addEventListener('click', () => dispatch('remove_pattern_beat', { index })); selected.append(beat);
      });
      pattern.append(selected);
    } else {
      const row = element('div', 'candidate-pattern-row');
      session.selection.forEach((tokenId, index) => {
        const token = stage.tokens.find(({ id }) => id === tokenId);
        const beat = element('button', 'candidate-token is-selected', token?.text ?? tokenId);
        beat.type = 'button'; beat.setAttribute('aria-label', `移除第 ${index + 1} 拍 ${token?.text ?? ''}`);
        beat.addEventListener('click', () => dispatch('remove_pattern_beat', { index })); row.append(beat);
      });
      pattern.append(row);
    }
    host.append(pattern);
    const tiles = element('div', 'candidate-token-list');
    for (const token of stage.tokens) {
      const tile = element('button', 'candidate-token', token.text); tile.type = 'button';
      tile.addEventListener('click', () => dispatch('add_pattern_beat', { tokenId: token.id })); tiles.append(tile);
    }
    host.append(tiles);
    }
  }
  if (session.phase === 'active') {
    if (session.hintLevel > 0) host.append(element('p', 'reading-hint', `提示 ${session.hintLevel}：${stage.hints[session.hintLevel - 1]}`));
    const controls = element('div', 'reading-task-controls');
    if (session.hintLevel < stage.hints.length) {
      const hint = element('button', 'button button-secondary', '查看提示'); hint.type = 'button';
      hint.addEventListener('click', () => dispatch('hint'));
      controls.append(hint);
    }
    const hasResponse = ['classify_observations', 'build_frequency_table'].includes(stage.interaction)
      ? (!stage.collectionRules || stage.collectionRules.requiredObservationIds.every((id) => session.collectedObservationIds.includes(id))) && stage.observations.every(({ id }) => session.assignments[id])
      : stage.interaction === 'complete_symmetry_grid'
        ? session.symmetryCells.length > 0
        : stage.interaction === 'plot_line_chart'
          ? stage.plotRules.points.every(({ id }) => Number.isFinite(session.lineChartValues[id]))
          : stage.interaction === 'build_bar_chart'
            ? stage.barChartRules.categories.every(({ id }) => session.barChartTouched.includes(id) && Number.isInteger(session.barChartValues[id]))
            : stage.interaction === 'construct_triangle'
              ? session.triangleVertices.length === 3
              : stage.interaction === 'construct_quadrilateral'
                ? session.quadrilateralVertices.length === 4
      : stage.interaction === 'compose_pattern'
        ? stage.patternRules.mode === 'number_builder'
          ? Number.isInteger(session.patternStartValue) && Number.isInteger(session.patternIncrement) && session.patternSequenceEntries.length === stage.patternRules.termCount
          : stage.patternRules.mode === 'repair' ? session.patternRepairTouched && Number.isInteger(session.patternRepairIndex)
            : session.selection.length === stage.patternRules.beatCount
        : stage.interaction === 'build_array'
          ? session.arrayRows > 0 && session.arrayColumns > 0
          : stage.interaction === 'build_unknown_quantity_model'
            ? session.unknownQuantityTouched && Number.isInteger(session.unknownQuantityValue)
          : stage.interaction === 'place_number_line_marker'
            ? Number.isInteger(session.numberLineTick)
            : stage.interaction === 'compose_shape'
              ? session.selection.length === (stage.shapeRules.selectionCount ?? stage.shapeRules.rows * stage.shapeRules.columns)
          : stage.interaction === 'order_items'
            ? session.orderedItems.length === stage.items.length
          : stage.interaction === 'complete_calculation_steps'
            ? stage.calculationSteps.every(({ id }) => Number.isInteger(session.calculationValues[id]))
            : stage.interaction === 'operate_vertical_calculation'
              ? stage.calculationSteps.every(({ id }) => Number.isInteger(session.verticalCalculationValues[id]))
              : stage.interaction === 'build_place_value_blocks'
                ? session.placeValueTouched
            : stage.interaction === 'adjust_decimal_place_value'
              ? Number.isInteger(session.decimalHundredths)
            : stage.interaction === 'adjust_circle_radius'
              ? Number.isInteger(session.circleRadius)
              : stage.interaction === 'set_estimate_range'
                ? Number.isFinite(session.estimateValue)
                : stage.interaction === 'set_clock_time'
                  ? Number.isInteger(session.clockHour) && Number.isInteger(session.clockMinute)
                  : stage.interaction === 'elapsed_time_model'
                    ? Number.isInteger(session.elapsedMinutes)
                  : stage.interaction === 'build_volume'
                    ? session.volumeRows > 0 && session.volumeColumns > 0 && session.volumeLayers > 0
        : stage.interaction === 'geometry_exploration'
          ? stage.geometryMode === 'split_recompose'
            ? stage.pieces.some((piece) => JSON.stringify(session.geometryPieces[piece.id]) !== JSON.stringify({ row: piece.initialPosition.row, column: piece.initialPosition.column, rotation: piece.initialRotation ?? 0, flipped: piece.initialFlipped ?? false }))
            : Boolean(session.foldedNet && typeof session.geometryAdjacencyAnswer === 'boolean')
        : stage.interaction === 'angle_exploration'
          ? stage.angleRules.mode === 'estimate' ? Number.isInteger(session.angleEstimate)
            : stage.angleRules.mode === 'measure' ? Number.isInteger(session.angleReading)
              : ['draw', 'align'].includes(stage.angleRules.mode) ? Number.isInteger(session.angleDrawValue)
                : stage.angleRules.mode === 'identify' ? Boolean(session.angleSelectedOptionId)
                  : ['compare', 'right_angle'].includes(stage.angleRules.mode)
                    ? Number.isInteger(stage.angleRules.mode === 'compare' ? session.angleComparisonAngleA : session.angleDrawValue)
                      && Boolean(session.angleComparisonAnswer)
                      && (stage.angleRules.mode !== 'compare' || Number.isInteger(session.angleComparisonAngleB))
                : Boolean(session.angleRotationDirection && Number.isInteger(session.angleRotationDegrees))
        : stage.interaction === 'construct_lines'
          ? session.linePoints.length === 2
        : stage.interaction === 'manipulate_fraction_model'
          ? session.fractionDenominator !== null
        : stage.interaction === 'measure_length_model'
          ? stage.lengthRules.mode === 'estimate' ? Number.isInteger(session.lengthEstimate)
            : stage.lengthRules.mode === 'align_read' ? session.lengthRulerTouched && session.lengthReadingTouched.includes(stage.lengthRules.object.id) && Number.isInteger(session.lengthReadings[stage.lengthRules.object.id])
              : stage.lengthRules.mode === 'compare' ? stage.lengthRules.objects.every(({ id }) => session.lengthReadingTouched.includes(id) && Number.isInteger(session.lengthReadings[id])) && session.lengthReadingTouched.includes('__difference__') && (!Number.isInteger(stage.lengthRules.conversionTargetMillimeters) || (session.lengthConversionTouched && Number.isInteger(session.lengthCentimeters) && Number.isInteger(session.lengthRemainingMillimeters)))
                : stage.lengthRules.mode === 'convert' ? session.lengthConversionTouched && Number.isInteger(session.lengthCentimeters) && Number.isInteger(session.lengthRemainingMillimeters)
                  : false
        : stage.interaction === 'build_area_grid'
          ? stage.areaGridRules.mode === 'estimate_cover'
            ? Number.isInteger(session.areaEstimate) && session.areaGridTouched.includes(stage.areaGridRules.boards[0].id)
            : stage.areaGridRules.mode === 'compare_regions'
              ? stage.areaGridRules.boards.every(({ id }) => session.areaGridTouched.includes(id)) && Boolean(session.areaRelation)
              : session.areaGridTouched.includes(stage.areaGridRules.boards[0].id)
        : stage.interaction === 'build_weight_scale'
          ? stage.weightRules.mode === 'estimate' ? Number.isInteger(session.weightScale?.estimate)
            : stage.weightRules.mode === 'balance' ? session.weightScale?.balanceTouched
              : stage.weightRules.mode === 'read' ? session.weightScale?.readingTouched
                : stage.weightRules.mode === 'compare' ? stage.weightRules.items.every(({ id }) => session.weightScale?.compareTouched.includes(id)) && session.weightScale?.differenceTouched && Boolean(session.weightScale?.relation)
                  : stage.weightRules.mode === 'convert' ? session.weightScale?.conversionTouched
                    : session.weightScale?.selectedItems.length > 0
        : stage.interaction === 'build_capacity_model'
          ? stage.capacityRules.mode === 'estimate' ? Number.isInteger(session.capacityModel?.estimateMl)
            : stage.capacityRules.mode === 'fill' ? session.capacityModel?.touched
              : stage.capacityRules.mode === 'read' ? session.capacityModel?.touched && session.capacityModel?.volumeMl === stage.capacityRules.targetMl && session.capacityModel?.readingTouched
                : stage.capacityRules.mode === 'compare' ? stage.capacityRules.containers.every(({ id }) => session.capacityModel?.compareTouched.includes(id)) && Boolean(session.capacityModel?.relation)
                  : stage.capacityRules.mode === 'difference' ? session.capacityModel?.touched && Number.isInteger(session.capacityModel?.differenceMl)
                    : session.capacityModel?.touched && session.capacityModel?.selectedItems.length > 0
        : stage.interaction === 'magnet_interaction'
          ? stage.magnetRules.mode === 'poles' ? session.magnetModel?.touched
            : stage.magnetRules.mode === 'materials' ? stage.magnetRules.materials.every(({ id }) => session.magnetModel?.testedObjectIds.includes(id) && session.magnetModel.assignments[id])
              : stage.magnetRules.magnets.every(({ id }) => session.magnetModel?.testedMagnetIds.includes(id)) && Boolean(session.magnetModel?.selectedStrongerMagnetId)
        : session.selection.length > 0;
    const submitLabel = stage.interaction === 'magnet_interaction' && stage.magnetRules.mode === 'materials' ? '檢查答案' : taskKind === 'english' ? '送出英文回應' : taskKind === 'chinese' ? '檢查閱讀線索' : taskKind === 'mathData' ? '完成資料表' : taskKind === 'math' ? '檢查數學解法' : taskKind === 'science' ? '檢查觀察與分類' : taskKind === 'arts' ? '檢查節奏作品' : taskKind === 'living' ? '提交觀察線索' : taskKind === 'hpe' ? '檢查安全分類' : taskKind === 'integrative' ? '檢查步驟順序' : '檢查分類';
    const submit = element('button', 'button button-primary', submitLabel);
    submit.type = 'button'; submit.disabled = !hasResponse;
    submit.addEventListener('click', () => dispatch('submit', { submissionId: `${session.sessionId}:submission:${session.attempts.length + 1}` }));
    controls.append(submit);
    const readinessId = `candidate-submit-readiness-${stage.stageId}`;
    const hasSpecificReadiness = stage.interaction === 'magnet_interaction' && stage.magnetRules.mode === 'materials';
    if (!hasResponse && !hasSpecificReadiness) {
      let readinessText = '還沒完成喔！完成上面的作答後，就可以檢查答案。';
      if (classificationProgress && !stage.collectionRules) {
        const remainingCount = classificationProgress.totalCount - classificationProgress.completedCount;
        if (remainingCount > 0) readinessText = `還差 ${remainingCount} 個項目，完成後就可以檢查答案。`;
      }
      const readiness = element('p', 'candidate-submit-readiness', readinessText);
      readiness.id = readinessId;
      submit.setAttribute('aria-describedby', readinessId);
      controls.append(readiness);
    }
    if (stage.interaction === 'magnet_interaction' && stage.magnetRules.mode === 'materials') {
      const completedMaterialCount = stage.magnetRules.materials.filter(({ id }) => session.magnetModel?.testedObjectIds.includes(id) && Boolean(session.magnetModel.assignments[id])).length;
      const readiness = element('p', 'magnet-material-submit-status', hasResponse ? `${stage.magnetRules.materials.length} 種材料都完成了，可以檢查答案。` : `還有 ${stage.magnetRules.materials.length - completedMaterialCount} 種材料尚未完成`);
      readiness.id = readinessId;
      submit.setAttribute('aria-describedby', readinessId);
      controls.append(readiness);
    }
    host.append(controls);
    appendTeacherDetails();
    return;
  }
  const success = session.phase === 'success';
  host.append(element('p', `reading-task-feedback ${success ? 'is-correct' : 'is-incorrect'}`, session.lastFeedback?.text ?? ''));
  button(success ? '繼續下一個挑戰' : '重新觀察並重試', 'button button-primary', () => dispatch(success ? 'next' : 'retry'));
  appendTeacherDetails();
}

function renderCircleDiagram(config, host, element, radius = 62) {
  const panel = element('section', 'candidate-circle-diagram');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 240 180'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '圓的構成元素示意圖');
  const circle = document.createElementNS(svg.namespaceURI, 'circle');
  circle.setAttribute('cx', '120'); circle.setAttribute('cy', '90'); circle.setAttribute('r', String(radius)); circle.setAttribute('fill', '#e5f4ff'); circle.setAttribute('stroke', '#155a78'); circle.setAttribute('stroke-width', '4'); svg.append(circle);
  if (config.highlight === 'radius' || config.highlight === 'diameter') {
    const line = document.createElementNS(svg.namespaceURI, 'line'); line.setAttribute('x1', config.highlight === 'radius' ? '120' : String(120 - radius)); line.setAttribute('y1', '90'); line.setAttribute('x2', String(120 + radius)); line.setAttribute('y2', '90'); line.setAttribute('stroke', '#d85e39'); line.setAttribute('stroke-width', '5'); svg.append(line);
  }
  const center = document.createElementNS(svg.namespaceURI, 'circle'); center.setAttribute('cx','120'); center.setAttribute('cy','90'); center.setAttribute('r','6'); center.setAttribute('fill','#c52e2e'); svg.append(center);
  const label = document.createElementNS(svg.namespaceURI, 'text'); label.setAttribute('x','120'); label.setAttribute('y','165'); label.setAttribute('text-anchor','middle'); label.setAttribute('font-size','14'); label.textContent = config.caption; svg.append(label);
  panel.append(svg); host.append(panel);
}

function createGeometryPiece(piece) {
  const wrapper = document.createElement('span');
  wrapper.className = `geometry-piece-icon geometry-piece-${piece.shape}`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 48 48'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', piece.shape === 'square' ? '正方形圖形片' : '三角形圖形片');
  const shape = document.createElementNS('http://www.w3.org/2000/svg', piece.shape === 'square' ? 'rect' : 'polygon');
  if (piece.shape === 'square') { shape.setAttribute('x', '4'); shape.setAttribute('y', '4'); shape.setAttribute('width', '40'); shape.setAttribute('height', '40'); }
  else shape.setAttribute('points', '24,4 45,44 3,44');
  shape.setAttribute('fill', 'currentColor'); shape.setAttribute('stroke', '#244c5e'); shape.setAttribute('stroke-width', '2');
  svg.append(shape); wrapper.append(svg); return wrapper;
}

function createGeometryFigure(figure) {
  const wrapper = document.createElement('span');
  wrapper.className = 'geometry-figure-icon';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 80 64');
  svg.setAttribute('role', 'img');
  const typeLabels = { square: '正方形', rectangle: '長方形', parallelogram: '平行四邊形', trapezoid: '梯形', rhombus: '菱形' };
  svg.setAttribute('aria-label', `${figure.label}，${typeLabels[figure.type] ?? '四邊形'}示意圖`);
  const group = document.createElementNS(svg.namespaceURI, 'g');
  group.setAttribute('transform', `rotate(${Number(figure.rotation ?? 0)} 40 32)`);
  let points;
  if (figure.type === 'square') points = '25,12 55,12 55,42 25,42';
  else if (figure.type === 'rectangle') points = '16,17 64,17 64,47 16,47';
  else if (figure.type === 'parallelogram') points = '26,15 64,15 54,45 16,45';
  else if (figure.type === 'trapezoid') points = '24,15 56,15 68,45 12,45';
  else points = '40,10 62,32 40,54 18,32';
  const polygon = document.createElementNS(svg.namespaceURI, 'polygon');
  polygon.setAttribute('points', points); polygon.setAttribute('fill', '#e4f2ec'); polygon.setAttribute('stroke', '#244c5e'); polygon.setAttribute('stroke-width', '2.4');
  group.append(polygon);
  if (['square', 'rectangle'].includes(figure.type)) {
    const mark = document.createElementNS(svg.namespaceURI, 'path');
    mark.setAttribute('d', figure.type === 'square' ? 'M29 16 L33 16 L33 20 L29 20 M47 16 L51 16 L51 20 L47 20 M51 34 L47 34 L47 38 L51 38 M33 34 L29 34 L29 38 L33 38' : 'M20 21 L24 21 L24 25 L20 25 M56 21 L60 21 L60 25 L56 25 M60 39 L56 39 L56 43 L60 43 M24 39 L20 39 L20 43 L24 43');
    mark.setAttribute('fill', 'none'); mark.setAttribute('stroke', '#d66a3a'); mark.setAttribute('stroke-width', '1.6'); group.append(mark);
  }
  svg.append(group);
  const caption = document.createElement('span');
  caption.className = 'geometry-figure-caption';
  caption.textContent = figure.label;
  wrapper.append(caption, svg);
  return wrapper;
}

function renderEnglishAdventure() {
  renderReusableCandidateTask(ENGLISH_SCENARIO_ADVENTURE, englishAdventureSession, document.getElementById('english-quest-content'), (session) => { englishAdventureSession = session; }, 'english');
}

function renderScienceExploration() {
  renderReusableCandidateTask(ANIMAL_OBSERVATION_EXPLORATION, scienceExplorationSession, document.getElementById('science-quest-content'), (session) => { scienceExplorationSession = session; }, 'science');
}

function renderSocialExploration() {
  renderReusableCandidateTask(NEIGHBORHOOD_CHANGE_EXPLORATION, socialExplorationSession, document.getElementById('social-quest-content'), (session) => { socialExplorationSession = session; }, 'social');
}

function renderMathDataWorkshop() {
  renderReusableCandidateTask(MATH_DATA_TABLE_WORKSHOP, mathDataTableSession, document.getElementById('math-data-quest-content'), (session) => { mathDataTableSession = session; }, 'mathData');
}

function renderArtsRhythmWorkshop() {
  renderReusableCandidateTask(ARTS_RHYTHM_WORKSHOP, artsRhythmSession, document.getElementById('arts-quest-content'), (session) => { artsRhythmSession = session; }, 'arts');
}

function startCatalogCandidateTask(activityId, routeContext = null) {
  const activity = CATALOG_CANDIDATE_TASK_BY_ID.get(activityId);
  if (!activity) return;
  activeCandidateRouteContext = routeContext;
  activeCatalogTask = activity;
  activeCatalogTaskSession = createLearningTaskSession(activity, `${activity.activityId}:catalog-session`);
  document.getElementById('catalog-task-title').textContent = activity.title?.split(/[：:]/, 1)[0] ?? activity.title;
    const kind = activity.subjectId === 'mathematics' ? 'math' : activity.subjectId === 'chinese-language' ? 'chinese' : activity.subjectId === 'english-language' ? 'english' : activity.subjectId === 'natural-science' ? 'science' : activity.subjectId === 'social-studies' ? 'social' : activity.subjectId === 'arts' ? 'arts' : activity.subjectId === 'living-curriculum' ? 'living' : activity.subjectId === 'health-physical-education' ? 'hpe' : 'integrative';
  renderReusableCandidateTask(activity, activeCatalogTaskSession, document.getElementById('catalog-task-content'), (session) => { activeCatalogTaskSession = session; }, kind);
  showScreen('catalog-task');
}

function renderCurriculumGamePicker() {
  const gradeSelect = document.getElementById('picker-grade');
  const subjectSelect = document.getElementById('picker-subject');
  const semesterSelect = document.getElementById('picker-semester');
  const objectiveSelect = document.getElementById('picker-objective');
  const objectiveSummary = document.getElementById('picker-objective-summary');
  const challengeSelect = document.getElementById('picker-challenge');
  const list = document.getElementById('curriculum-game-list');
  const scopeNote = document.getElementById('curriculum-picker-scope-note');

  if (gradeSelect.options.length === 1) {
    for (const grade of GRADE_CATALOG) {
      const option = document.createElement('option');
      option.value = grade.gradeId;
      option.textContent = `${grade.name}${grade.developmentStatus === 'preparation' ? '（準備中）' : '（部分原型）'}`;
      gradeSelect.append(option);
    }
  }
  if (subjectSelect.options.length === 1) {
    for (const subject of GRADE_CATALOG[2].subjects) {
      const option = document.createElement('option');
      option.value = subject.subjectId;
      option.textContent = subject.name;
      subjectSelect.append(option);
    }
  }
  if (challengeSelect.options.length === 1) {
    for (const mode of PICKER_CHALLENGE_MODES) {
      const option = document.createElement('option');
      option.value = mode.id;
      option.textContent = mode.label;
      challengeSelect.append(option);
    }
  }

  gradeSelect.value = curriculumPickerSelection.gradeId;
  subjectSelect.value = curriculumPickerSelection.subjectId;
  semesterSelect.value = curriculumPickerSelection.semesterId;
  challengeSelect.value = curriculumPickerSelection.challengeMode;
  subjectSelect.disabled = !curriculumPickerSelection.gradeId;
  semesterSelect.disabled = !curriculumPickerSelection.subjectId;
  const objectives = getPickerObjectiveOptions(CURRICULUM_GAME_CATALOG, curriculumPickerSelection.gradeId, curriculumPickerSelection.subjectId);
  const previousObjective = curriculumPickerSelection.learningObjectiveId;
  objectiveSelect.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = !curriculumPickerSelection.gradeId || !curriculumPickerSelection.subjectId
    ? '請先選年級與科目'
    : objectives.length ? '請選擇學習目標' : '此範圍尚無已登錄目標（待核對／開發）';
  objectiveSelect.append(placeholder);
  objectiveSelect.disabled = !curriculumPickerSelection.semesterId || objectives.length === 0;
  for (const objective of objectives) {
    const option = document.createElement('option');
    option.value = objective.id;
    option.textContent = `${objective.topicTitle}｜${objective.text}`;
    objectiveSelect.append(option);
  }
  curriculumPickerSelection.learningObjectiveId = objectives.some(({ id }) => id === previousObjective) ? previousObjective : '';
  objectiveSelect.value = curriculumPickerSelection.learningObjectiveId;
  const selectedObjective = objectives.find(({ id }) => id === curriculumPickerSelection.learningObjectiveId);
  objectiveSummary.hidden = !selectedObjective;
  objectiveSummary.textContent = selectedObjective ? `已選目標：${selectedObjective.text}` : '';
  challengeSelect.disabled = !curriculumPickerSelection.learningObjectiveId;
  const grade = getGradeById(curriculumPickerSelection.gradeId);
  const subject = grade?.subjects.find(({ subjectId }) => subjectId === curriculumPickerSelection.subjectId);
  scopeNote.textContent = subject
    ? `${grade.name}・${subject.name}：${subject.curriculumApplicabilityStatus === 'pending_official_grade_scope_verification' ? '年級課綱適用範圍待核對。' : '目前有部分範圍記錄；學期順序與班級進度仍待確認。'} 選「全部學期」不代表已確認全年教學順序。`
    : '請先選擇年級與科目。';

  list.replaceChildren();
  const games = filterCurriculumGames(CURRICULUM_GAME_CATALOG, curriculumPickerSelection);
  const hasObjectives = objectives.length > 0;
  if (games.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'curriculum-picker-empty';
    empty.textContent = describeCurriculumPickerEmptyState(curriculumPickerSelection, hasObjectives);
    list.append(empty);
    return;
  }

  for (const gameEntry of games) {
    const availability = getCurriculumGameAvailability(gameEntry);
    const card = document.createElement('article');
    card.className = 'curriculum-game-card';
    const heading = document.createElement('h3');
    heading.textContent = gameEntry.title;
    const gradeSubject = document.createElement('p');
    gradeSubject.className = 'curriculum-game-meta';
    gradeSubject.textContent = `${getGradeById(gameEntry.gradeId)?.name ?? gameEntry.gradeId}・${GRADE_CATALOG[2].subjects.find(({ subjectId }) => subjectId === gameEntry.subjectId)?.name ?? gameEntry.subjectId}・學期待確認`;
    const codes = document.createElement('p');
    codes.className = 'curriculum-game-codes';
    codes.textContent = `專案已登錄課綱參照（不等於逐題核准）：${gameEntry.curriculumCodeRefs.map(({ code, scopeLabel }) => `${code}（${scopeLabel}）`).join('；')}`;
    const objectiveTitle = document.createElement('strong');
    objectiveTitle.textContent = '候選學習目標（待教師審查）';
    const objectiveList = document.createElement('ul');
    for (const objective of gameEntry.learningObjectiveSummaries) {
      const item = document.createElement('li');
      item.textContent = `${objective.id}：${objective.text}`;
      objectiveList.append(item);
    }
    const statuses = document.createElement('p');
    statuses.className = 'curriculum-game-statuses';
    const reviewLabels = {
      not_started: '尚未開始',
      pending_teacher_review: '待教師審查',
      approved_for_pilot: '僅核准小規模試用',
      approved_for_publication: '已完成內容審查',
    };
    const publicationLabel = gameEntry.publicationStatus === 'approved' ? '已核准' : '未核准';
    const unitStatus = gameEntry.formalUnitId ? `。單元 ${gameEntry.formalUnitId}：${gameEntry.formalUnitStatus}` : '';
    statuses.textContent = `開發狀態：${availability.label}。教師審查：${reviewLabels[gameEntry.reviewStatus] ?? '待確認'}。正式發布：${publicationLabel}${unitStatus}。`;
    const note = document.createElement('p');
    note.textContent = gameEntry.entryRoute?.kind === 'catalog_candidate_activity'
      ? availability.reason
      : `${availability.reason} 目前只有一個候選原型，不代表完整的多關課程；依序挑戰仍須經數字島石碑的既有入口。`;
    card.append(heading, gradeSubject, codes, objectiveTitle, objectiveList, statuses, note);
    if (availability.available) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button-primary';
      button.textContent = availability.buttonLabel;
      button.addEventListener('click', () => {
        const launch = resolveCurriculumGameLaunch(gameEntry);
        if (launch?.kind === 'catalog_candidate_activity') {
          startCatalogCandidateTask(launch.activityId);
          document.getElementById('catalog-task-title').focus({ preventScroll: true });
          return;
        }
        if (launch?.kind !== 'existing_map_route') return;
        selectedGradeId = gameEntry.gradeId;
        renderGradeSelection();
        showScreen(launch.targetScreen);
        document.getElementById('level-start-button').focus({ preventScroll: true });
      });
      card.append(button);
    }
    list.append(card);
  }
}

function renderMapProgress() {
  const completion = mapProgress.completedLevels[DEMO_LEVEL_ID];
  const mathState = document.getElementById('map-math-state');
  const mathSummary = document.getElementById('map-math-summary');
  const note = document.getElementById('map-progress-note');
  renderMathLevelDirectory();

  if (completion) {
    const best = `${completion.bestStars}/${DEMO_LEVEL_MAX_STARS}`;
    mathState.textContent = `已完成・最佳 ${best} 星`;
    mathSummary.textContent = `已完成；本機最佳成績 ${best} 顆星`;
    note.textContent = progressStorageAvailable
      ? `數字島已完成，本機示範最佳成績為 ${best} 顆星。`
      : `本次瀏覽已完成數字島，最佳成績 ${best} 顆星；本機儲存不可用，關閉頁面後可能不保留。`;
    return;
  }

  mathState.textContent = '數字與位值・開始';
  document.getElementById('level-start-button').setAttribute('aria-label', `開始數學：數字島，${MATH_LEVEL_DIRECTORY.find((entry) => entry.levelId === DEMO_LEVEL_ID)?.questionCount ?? DEMO_LEVEL_MAX_STARS} 題原型示範關卡`);
  mathSummary.textContent = `原型示範關卡：數字與位值（${DEMO_LEVEL_MAX_STARS} 題）`;
  note.textContent = progressStorageAvailable
    ? '星星只保存在這台裝置的示範進度中。'
    : '本機儲存目前不可用；本次仍可遊玩，但關閉頁面後不會保留完成紀錄。';
}

function renderMathLevelDirectory() {
  const host = document.getElementById('math-level-directory-list');
  if (!host) return;
  host.replaceChildren();

  for (const entry of MATH_LEVEL_DIRECTORY) {
    const card = document.createElement('article');
    card.className = `math-directory-card${entry.entryKind === 'catalog_candidate' ? ' math-directory-card-planned' : ''}`;
    card.dataset.levelId = entry.levelId;

    const copy = document.createElement('div');
    copy.className = 'math-directory-copy';
    const title = document.createElement('h3');
    title.textContent = entry.title;
    const theme = document.createElement('p');
    theme.textContent = entry.learningTheme;
    const state = document.createElement('strong');
    state.className = 'math-directory-state';

    const levelRecord = mapProgress.completedLevels[entry.levelId];
    let canOpenComparison = false;
    if (entry.levelId === DEMO_LEVEL_ID) {
      state.textContent = levelRecord
        ? `原型可重玩・最佳 ${levelRecord.bestStars}/${entry.questionCount} 星`
        : `可從地圖進入數字島・${entry.questionCount} 題原型示範`;
    } else if (entry.levelId === NUMBER_SECRET_LEVEL.id) {
      const foundObelisk = mapProgress.completedMissionIds.includes('task-find-number-obelisk');
      state.textContent = foundObelisk
        ? '探索任務已解鎖・可在數字島石碑處進入'
        : '在數字島找到石碑後，才能開始任務';
    } else if (entry.levelId === NUMBER_COMPARISON_LEVEL.id) {
      canOpenComparison = isLevelUnlocked(NUMBER_COMPARISON_LEVEL, mapProgress);
      card.classList.add('math-directory-card-comparison');
      state.textContent = canOpenComparison
        ? `已解鎖・待教師審核示範題${levelRecord ? `・最佳 ${levelRecord.bestStars}/${entry.questionCount} 星` : ''}`
        : '🔒 完成「數字與位值」關卡後解鎖';
    } else if (entry.levelId === INTEGER_NUMBER_LINE_LEARNING_UNIT.levelId) {
      state.textContent = '候選互動試作・待教師審查；不是正式關卡';
    } else if (entry.levelId === MILLIMETER_RULER_LEARNING_UNIT.levelId) {
      state.textContent = '候選互動試作・待教師審查；不是正式關卡';
    } else if (entry.levelId === WEIGHT_KG_G_LEARNING_UNIT.levelId) {
      state.textContent = '候選互動試作・待教師審查；不是正式關卡';
    } else if (entry.levelId === SQUARE_CENTIMETER_AREA_LEARNING_UNIT.levelId) {
      state.textContent = '平方公分候選互動・待教師審查；不是正式關卡';
    } else if (entry.levelId === FRACTION_TREASURE_LEARNING_UNIT.levelId) {
      state.textContent = '同分母分數候選互動・待教師審查；不是正式關卡';
    } else if (entry.levelId === ADDITION_SUBTRACTION_LEARNING_UNIT.levelId) {
      state.textContent = '多位數加減候選互動・待教師審查；不是正式關卡';
    } else {
      state.textContent = entry.levelId === 'math-capacity-candidate'
        ? '有刻度判讀候選共用單元・待教師審查，非正式關卡'
        : '規劃中・僅顯示資訊，尚無可玩題目';
    }

    const evidence = document.createElement('small');
    if (entry.curriculumEvidenceStatus === 'pending_verification') {
      evidence.textContent = '課綱對應待核；教材、學期進度與教師審查尚待確認。';
    } else if (entry.curriculumEvidenceStatus === 'official_reference_recorded_item_alignment_pending') {
      evidence.textContent = '課綱參照已記錄；個別題目對應、教材與授課進度仍待確認。';
    } else {
      evidence.textContent = '課綱來源有登錄；教材、校本進度及教師審查仍待確認。';
    }
    copy.append(title, theme, state, evidence);
    card.append(copy);

    if (entry.runtime.availability === 'gated_prototype') {
      const button = document.createElement('button');
      button.id = 'comparison-level-button';
      button.type = 'button';
      button.className = 'comparison-level-button';
      button.disabled = !canOpenComparison;
      button.textContent = canOpenComparison ? '開始候選示範關卡' : '尚未解鎖';
      button.setAttribute('aria-label', canOpenComparison
        ? `${entry.title}，待教師審核的示範關卡`
        : `${entry.title}，完成數字與位值關卡後解鎖`);
      button.addEventListener('click', startComparisonLevel);
      card.append(button);
      const unitButton = document.createElement('button');
      unitButton.type = 'button';
      unitButton.className = 'comparison-level-button comparison-learning-unit-button';
      unitButton.disabled = !canOpenComparison;
      unitButton.textContent = canOpenComparison ? '試玩共用學習單元流程' : '解鎖後可試玩學習流程';
      unitButton.setAttribute('aria-label', `${entry.title}候選學習單元流程，${canOpenComparison ? '待教師審查' : '完成數字與位值關卡後解鎖'}`);
      unitButton.addEventListener('click', startComparisonLearningUnit);
      card.append(unitButton);
    }
    if (entry.levelId === 'math-capacity-candidate') {
      const button = document.createElement('button');
      button.id = 'capacity-prototype-button';
      button.type = 'button';
      button.className = 'comparison-level-button capacity-prototype-button';
      button.textContent = '開發測試：預覽互動原型';
      button.setAttribute('aria-label', `${entry.title}，開發測試入口，非正式關卡`);
      button.addEventListener('click', openCapacityMission);
      card.append(button);
      const learningUnitButton = document.createElement('button');
      learningUnitButton.type = 'button';
      learningUnitButton.className = 'comparison-level-button capacity-prototype-button';
      learningUnitButton.textContent = '試玩共用單元：刻度判讀';
      learningUnitButton.setAttribute('aria-label', '容量刻度判讀，共用引擎候選學習單元，待教師審查');
      learningUnitButton.addEventListener('click', startCapacityLearningUnit);
      card.append(learningUnitButton);
    }
    if (entry.levelId === INTEGER_NUMBER_LINE_LEARNING_UNIT.levelId) {
      const candidateButton = document.createElement('button');
      candidateButton.type = 'button';
      candidateButton.className = 'comparison-level-button capacity-prototype-button';
      candidateButton.textContent = '開發試玩：數線定位';
      candidateButton.setAttribute('aria-label', '整數數線定位候選活動，待教師審查，不是正式關卡');
      candidateButton.addEventListener('click', startIntegerNumberLineLearningUnit);
      card.append(candidateButton);
    }
    if (entry.levelId === MILLIMETER_RULER_LEARNING_UNIT.levelId) {
      const candidateButton = document.createElement('button');
      candidateButton.type = 'button';
      candidateButton.className = 'comparison-level-button capacity-prototype-button';
      candidateButton.textContent = '開發試玩：毫米刻度';
      candidateButton.setAttribute('aria-label', '長度毫米刻度候選活動，待教師審查，不是正式關卡');
      candidateButton.addEventListener('click', startMillimeterRulerLearningUnit);
      card.append(candidateButton);
    }
    if (entry.levelId === WEIGHT_KG_G_LEARNING_UNIT.levelId) {
      const candidateButton = document.createElement('button');
      candidateButton.type = 'button';
      candidateButton.className = 'comparison-level-button capacity-prototype-button';
      candidateButton.textContent = '開發試玩：公克與公斤';
      candidateButton.setAttribute('aria-label', '重量公克與公斤候選活動，待教師審查，不是正式關卡');
      candidateButton.addEventListener('click', startWeightKgGLearningUnit);
      card.append(candidateButton);
    }
    if (entry.levelId === SQUARE_CENTIMETER_AREA_LEARNING_UNIT.levelId) {
      const candidateButton = document.createElement('button');
      candidateButton.type = 'button';
      candidateButton.className = 'comparison-level-button capacity-prototype-button';
      candidateButton.textContent = '開發試玩：平方公分方格';
      candidateButton.setAttribute('aria-label', '平方公分面積候選活動，待教師審查，不是正式關卡');
      candidateButton.addEventListener('click', startSquareCentimeterAreaLearningUnit);
      card.append(candidateButton);
    }
    if (entry.levelId === FRACTION_TREASURE_LEARNING_UNIT.levelId) {
      const candidateButton = document.createElement('button');
      candidateButton.type = 'button';
      candidateButton.className = 'comparison-level-button capacity-prototype-button';
      candidateButton.textContent = '開發試玩：同分母分數';
      candidateButton.setAttribute('aria-label', '分數寶藏島同分母分數候選活動，待教師審查，不是正式關卡');
      candidateButton.addEventListener('click', startFractionTreasureLearningUnit);
      card.append(candidateButton);
    }
    if (entry.levelId === ADDITION_SUBTRACTION_LEARNING_UNIT.levelId) {
      const candidateButton = document.createElement('button');
      candidateButton.type = 'button';
      candidateButton.className = 'comparison-level-button capacity-prototype-button';
      candidateButton.textContent = '開發試玩：多位數加減';
      candidateButton.setAttribute('aria-label', '加減法大挑戰候選活動，待教師審查，不是正式關卡');
      candidateButton.addEventListener('click', startAdditionSubtractionLearningUnit);
      card.append(candidateButton);
    }

    host.append(card);
  }
}

function renderMissionBoard() {
  const completedIds = new Set(mapProgress.completedMissionIds);
  const list = document.getElementById('mission-list');
  list.replaceChildren();
  document.getElementById('mission-reward-total').textContent = `探索徽章 ${getMissionBadgeTotal(mapProgress.completedMissionIds)} 枚`;

  for (const mission of MISSION_DEFINITIONS) {
    const completed = completedIds.has(mission.id);
    const item = document.createElement('li');
    item.className = `mission-card${completed ? ' mission-card-complete' : ''}`;
    item.dataset.missionId = mission.id;

    const icon = document.createElement('span');
    icon.className = 'mission-card-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = completed ? '✅' : '🧭';

    const copy = document.createElement('div');
    copy.className = 'mission-card-copy';
    const title = document.createElement('strong');
    title.textContent = mission.title;
    const description = document.createElement('p');
    description.textContent = mission.description;
    const status = document.createElement('span');
    status.className = 'mission-card-state';
    status.textContent = completed
      ? `已完成・已領取 +${mission.rewardBadges} 枚葉片徽章`
      : `進行中・完成可得 +${mission.rewardBadges} 枚葉片徽章`;
    copy.append(title, description, status);
    item.append(icon, copy);
    list.append(item);
  }
}

function updateExplorerHints() {
  const completed = new Set(mapProgress.completedMissionIds);
  const message = mapProgress.challengeRecords[NUMBER_SECRET_QUEST_ID]?.completed
    ? '千位數的秘密解開了！寶箱獎勵已收進探險包。'
    : completed.has('task-find-number-obelisk')
    ? '石碑線索已找到！再去看看寶箱和星星吧。'
    : completed.has('task-finish-place-value')
    ? '數字島任務完成！星星與徽章都收進探險包了。'
    : completed.has('task-earn-first-star')
      ? '你找到第一顆星了！再完成數字島任務吧。'
      : completed.has('task-enter-number-island')
        ? '你踏上數字島了！答對一題就能完成星星任務。'
        : '今天要探索哪一座島呢？';
  document.getElementById('explorer-message').textContent = message;
  document.getElementById('map-explorer-message').textContent = message;
}

function recordMissionEvent(event, evidence) {
  const result = resolveMissionsForEvent(mapProgress.completedMissionIds, event, evidence);
  if (result.newlyCompleted.length > 0) {
    mapProgress = { ...mapProgress, completedMissionIds: result.completedMissionIds };
  }
  return result.newlyCompleted;
}

function persistAndRenderProgress() {
  progressStorageAvailable = writeProgress(getProgressStorage(), mapProgress);
  renderMapProgress();
  renderMissionBoard();
  updateExplorerHints();
}

function showMissionToast(missions) {
  if (missions.length === 0) return;
  const badgeCount = missions.reduce((sum, mission) => sum + mission.rewardBadges, 0);
  const title = missions.map((mission) => mission.title).join('、');
  const toast = document.getElementById('mission-toast');
  toast.textContent = `任務完成：${title}！獲得 ${badgeCount} 枚葉片徽章。`;
  toast.hidden = false;
  window.clearTimeout(missionToastTimer);
  missionToastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
}

renderMapProgress();
renderMissionBoard();
updateExplorerHints();
document.getElementById('grade-subject-open-map').addEventListener('click', () => {
  document.getElementById('grade3-math-adventure-map')?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  document.querySelector('#grade3-math-adventure-map .grade3-math-adventure-region button')?.focus({ preventScroll: true });
});
document.getElementById('grade3-math-map-return-directory').addEventListener('click', () => {
  selectedGradeId = 'grade-3';
  selectedSubjectId = 'mathematics';
  renderGradeSelection();
  document.getElementById('grade-subject-detail-title')?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  document.getElementById('student-subject-back')?.focus({ preventScroll: true });
});
document.getElementById('student-back-to-grades').addEventListener('click', () => {
  selectedGradeId = null;
  selectedSubjectId = null;
  document.getElementById('grade-teacher-info').open = false;
  document.getElementById('grade-subject-teacher-info').open = false;
  renderGradeSelection();
  const heading = document.getElementById('grade-picker-title');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
});
document.getElementById('student-subject-back').addEventListener('click', () => {
  const previousSubjectId = selectedSubjectId;
  selectedSubjectId = null;
  document.getElementById('grade-subject-teacher-info').open = false;
  renderGradeSelection();
  document.querySelector(`[data-subject-id="${previousSubjectId}"]`)?.focus({ preventScroll: true });
});
document.getElementById('grade-subject-open-reading').addEventListener('click', () => {
  readingQuestSession = createLearningTaskSession(STORY_FOREST_READING_QUEST);
  renderReadingQuest();
  showScreen('reading-quest');
  document.getElementById('reading-quest-title').focus({ preventScroll: true });
});
document.getElementById('grade-subject-open-english').addEventListener('click', () => {
  englishAdventureSession = createLearningTaskSession(ENGLISH_SCENARIO_ADVENTURE);
  renderEnglishAdventure();
  showScreen('english-quest');
  document.getElementById('english-quest-title').focus({ preventScroll: true });
});
document.getElementById('grade-subject-open-science').addEventListener('click', () => {
  scienceExplorationSession = createLearningTaskSession(ANIMAL_OBSERVATION_EXPLORATION);
  renderScienceExploration();
  showScreen('science-quest');
  document.getElementById('science-quest-title').focus({ preventScroll: true });
});
document.getElementById('grade-subject-open-social').addEventListener('click', () => {
  socialExplorationSession = createLearningTaskSession(NEIGHBORHOOD_CHANGE_EXPLORATION);
  renderSocialExploration();
  showScreen('social-quest');
  document.getElementById('social-quest-title').focus({ preventScroll: true });
});
document.getElementById('grade-subject-open-math-data').addEventListener('click', () => {
  mathDataTableSession = createLearningTaskSession(MATH_DATA_TABLE_WORKSHOP);
  renderMathDataWorkshop(); showScreen('math-data-quest');
  document.getElementById('math-data-quest-title').focus({ preventScroll: true });
});
document.getElementById('grade-subject-open-arts').addEventListener('click', () => {
  artsRhythmSession = createLearningTaskSession(ARTS_RHYTHM_WORKSHOP);
  renderArtsRhythmWorkshop(); showScreen('arts-quest');
  document.getElementById('arts-quest-title').focus({ preventScroll: true });
});

renderGradeSelection();
renderReadingQuest();
renderEnglishAdventure();
renderScienceExploration();
renderSocialExploration();
renderMathDataWorkshop();
renderArtsRhythmWorkshop();
renderCurriculumGamePicker();

function showScreen(name) {
  if (name !== 'explore') {
    movementHoldController.stop();
    heldDirectionButton = null;
    stopExplorerAnimation();
  }
  for (const [screenName, element] of Object.entries(screens)) element.hidden = screenName !== name;
  explorerCharacter?.setActive(name === 'explore');
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  const heading = screens[name].querySelector('h1');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
}

function renderCapacityMission() {
  const state = capacityMission.getState();
  document.getElementById('capacity-water').style.height = `${state.fillPercent}%`;
  document.getElementById('capacity-amount').textContent = state.displayAmount;
  const slider = document.getElementById('capacity-slider');
  slider.value = String(state.waterMl);
  slider.setAttribute('aria-valuetext', `${state.displayAmount}，容器容量 ${state.displayCapacity}`);
  document.getElementById('capacity-confirm').disabled = state.completed;
  document.getElementById('capacity-plus').disabled = state.waterMl >= state.capacityMl || state.completed;
  document.getElementById('capacity-minus').disabled = state.waterMl <= 0 || state.completed;
  slider.disabled = state.completed;
  document.getElementById('capacity-reward').hidden = !state.completed;
}

function renderCapacityObservation() {
  const state = capacityObservation.getState();
  const complete = Boolean(state.review);
  document.getElementById('observation-prompt').hidden = complete;
  document.getElementById('observation-workspace').hidden = complete;
  document.getElementById('observation-review').hidden = !complete;
  const water = document.getElementById('observation-water');
  const vessel = document.getElementById('observation-vessel');
  water.style.height = `${state.fillPercent}%`;
  vessel.setAttribute('aria-label', state.amountHidden
    ? '透明量杯，水面位於其中一條刻度；目前隱藏數字'
    : `透明量杯，水面對應 ${state.waterMl} 毫升`);
  document.getElementById('observation-amount').textContent = state.displayAmount;
  const toggle = document.getElementById('observation-toggle-amount');
  toggle.textContent = state.mode === 'practice' ? '練習模式顯示水量' : state.amountHidden ? '顯示水量' : '隱藏水量';
  toggle.disabled = state.mode === 'practice';
  toggle.setAttribute('aria-pressed', String(state.amountHidden));
  document.getElementById('observation-progress').textContent = `情境 ${state.scenarioIndex + 1}／${state.scenarioCount}`;
  const marks = document.getElementById('observation-ticks');
  marks.replaceChildren();
  for (let ml = CAPACITY_MISSION_CONFIG.capacityMl; ml >= 0; ml -= 100) {
    const tick = document.createElement('span');
    tick.className = `observation-tick${ml % 200 === 0 ? ' observation-tick-major' : ''}`;
    tick.style.top = `${100 - (ml / CAPACITY_MISSION_CONFIG.capacityMl) * 100}%`;
    marks.append(tick);
  }
  const options = document.getElementById('observation-options');
  options.replaceChildren();
  for (const option of state.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `observation-option${state.selectedOptionId === option.optionId ? ' is-selected' : ''}`;
    button.textContent = option.text;
    button.setAttribute('aria-pressed', String(state.selectedOptionId === option.optionId));
    button.disabled = state.solved;
    button.addEventListener('click', () => {
      capacityObservation.selectOption(option.optionId);
      renderCapacityObservation();
    });
    options.append(button);
  }
  document.getElementById('observation-check').disabled = !state.selectedOptionId || state.solved;
  document.getElementById('observation-next').hidden = !state.solved || state.scenarioIndex >= state.scenarioCount - 1;
  const feedback = document.getElementById('observation-feedback');
  feedback.classList.toggle('is-success', state.lastResult === 'correct');
  feedback.classList.toggle('is-hint', state.lastResult === 'retry');
  if (state.lastResult === 'correct') feedback.textContent = state.explanation;
  else if (state.lastResult === 'retry') feedback.textContent = `再看一次刻度提示：${state.hint}選好後可以再試。`;
  else feedback.textContent = state.solved ? `三個情境都完成了！${state.explanation}` : '選一個答案後確認。';

  if (state.review) renderCapacityReview(state.review);
}

function renderCapacityReview(review) {
  document.getElementById('review-completed-count').textContent = String(review.completedScenarioCount);
  document.getElementById('review-correct-count').textContent = String(review.correctReadingCount);
  document.getElementById('review-first-try-count').textContent = String(review.firstTryCorrectCount);
  document.getElementById('review-after-hint-count').textContent = String(review.afterHintCorrectCount);
  const needsPractice = review.needsPractice
    .map((id) => CAPACITY_OBSERVATION_SCENARIOS.find(({ id: scenarioId }) => scenarioId === id)?.waterMl)
    .filter(Number.isFinite);
  document.getElementById('review-needs-practice').textContent = needsPractice.length
    ? `需要再練習：${needsPractice.map((amount) => `${amount} 毫升`).join('、')}（這些情境曾看提示後才答對）`
    : '所有情境都首次答對，可以挑戰隱藏水量模式！';
  const list = document.getElementById('review-scenario-list');
  list.replaceChildren();
  for (const [index, detail] of review.scenarioDetails.entries()) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `情境 ${index + 1}：${detail.correctWaterMl} 毫升・${detail.firstTryCorrect ? '首次答對' : '經提示後答對'}`;
    const explanation = document.createElement('p');
    explanation.textContent = detail.explanation;
    item.append(title, explanation);
    list.append(item);
  }
}

function setCapacityMode(mode) {
  const observationActive = mode === 'observation';
  document.getElementById('capacity-refill-mode').hidden = observationActive;
  document.getElementById('capacity-observation-mode').hidden = !observationActive;
  document.getElementById('capacity-mode-select').hidden = true;
  document.getElementById('capacity-mode-switch').hidden = false;
  document.getElementById('capacity-guide').hidden = true;
  document.getElementById('capacity-refill-mode-button').classList.toggle('is-active', !observationActive);
  document.getElementById('capacity-observation-mode-button').classList.toggle('is-active', observationActive);
  document.getElementById('capacity-refill-mode-button').setAttribute('aria-pressed', String(!observationActive));
  document.getElementById('capacity-observation-mode-button').setAttribute('aria-pressed', String(observationActive));
  document.getElementById('capacity-title').textContent = observationActive ? '刻度觀察員' : '探險隊水壺補給站';
  document.querySelector('#capacity-screen > .screen-lead').textContent = observationActive
    ? activeCapacityObservationMode === 'practice' ? '練習模式：看水量、對照刻度，再選出正確讀數。' : '挑戰模式：先觀察刻度，再選出量杯裡的水量。'
    : '用量杯刻度找線索，看看今天想挑戰哪一種容量任務！';
  if (observationActive) renderCapacityObservation();
}

function showCapacityModeSelect() {
  document.getElementById('capacity-guide').hidden = true;
  document.getElementById('capacity-mode-select').hidden = false;
  document.getElementById('capacity-mode-switch').hidden = true;
  document.getElementById('capacity-refill-mode').hidden = true;
  document.getElementById('capacity-observation-mode').hidden = true;
  showScreen('capacity');
}

function startCapacityObservation(mode) {
  activeCapacityObservationMode = mode;
  capacityObservation.setMode(mode);
  setCapacityMode('observation');
  showScreen('capacity');
}

function openCapacityMission() {
  const entry = capacityOnboarding.enter();
  if (entry === 'guide') {
    document.getElementById('capacity-guide').hidden = false;
    document.getElementById('capacity-mode-select').hidden = true;
    document.getElementById('capacity-mode-switch').hidden = true;
    document.getElementById('capacity-refill-mode').hidden = true;
    document.getElementById('capacity-observation-mode').hidden = true;
    showScreen('capacity');
    return;
  }
  showCapacityModeSelect();
}

function startCapacityRefill() {
  setCapacityMode('refill');
  const state = capacityMission.getState();
  document.getElementById('capacity-feedback').textContent = state.completed
    ? '補給任務已完成。若要再玩一次，請按「重新開始」。'
    : '把水量調整到 500 毫升，再確認看看！';
  renderCapacityMission();
  showScreen('capacity');
}

function setCapacityFeedback(result) {
  const feedback = document.getElementById('capacity-feedback');
  feedback.classList.toggle('is-success', result.correct);
  feedback.classList.toggle('is-hint', !result.correct);
  feedback.textContent = result.correct
    ? result.rewardGranted ? '補給成功！水量正好是 500 毫升。' : '任務已完成；徽章不會重複領取。'
    : `還差一點，再調整水量試試！目前是 ${result.state.waterMl} 毫升。`;
}

function startExploration() {
  explorerPosition = createExplorerPosition();
  explorationMessage = '';
  document.getElementById('explore-control-guide').hidden = explorationGuideDismissed;
  renderExploration();
  const newlyCompleted = recordMissionEvent(MISSION_EVENTS.ENTER_NUMBER_ISLAND, { entered: true });
  if (newlyCompleted.length > 0) persistAndRenderProgress();
  showScreen('explore');
  ensureExplorerCharacter();
  showMissionToast(newlyCompleted);
}

function startGame(level = PLACE_VALUE_LEVEL) {
  if (validateLevel(level).length > 0 || !isLevelUnlocked(level, mapProgress)) return;
  activeLevel = level;
  game = createGameState(activeLevel.questionSet.questions.length);
  renderQuestion();
  showScreen('game');
}

function startComparisonLevel() {
  startGame(NUMBER_COMPARISON_LEVEL);
}

function startComparisonLearningUnit() {
  if (!isLevelUnlocked(NUMBER_COMPARISON_LEVEL, mapProgress)) return;
  comparisonLearningSession = createCandidateUnitSession(NUMBER_COMPARISON_LEARNING_UNIT);
  const panel = document.getElementById('comparison-learning-unit-panel');
  panel.hidden = false;
  renderComparisonLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function startCapacityLearningUnit() {
  capacityLearningSession = createCandidateUnitSession(CAPACITY_READING_LEARNING_UNIT);
  const panel = document.getElementById('capacity-learning-unit-panel');
  panel.hidden = false;
  renderCapacityLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function startIntegerNumberLineLearningUnit() {
  integerNumberLineLearningSession = createCandidateUnitSession(INTEGER_NUMBER_LINE_LEARNING_UNIT);
  const panel = document.getElementById('integer-number-line-learning-unit-panel');
  panel.hidden = false;
  renderIntegerNumberLineLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function startMillimeterRulerLearningUnit() {
  millimeterRulerLearningSession = createCandidateUnitSession(MILLIMETER_RULER_LEARNING_UNIT);
  const panel = document.getElementById('millimeter-ruler-learning-unit-panel');
  panel.hidden = false;
  renderMillimeterRulerLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function startWeightKgGLearningUnit() {
  weightKgGLearningSession = createCandidateUnitSession(WEIGHT_KG_G_LEARNING_UNIT);
  const panel = document.getElementById('weight-kg-g-learning-unit-panel');
  panel.hidden = false;
  renderWeightKgGLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function startSquareCentimeterAreaLearningUnit() {
  squareCentimeterAreaSession = createCandidateUnitSession(SQUARE_CENTIMETER_AREA_LEARNING_UNIT);
  const panel = document.getElementById('square-centimeter-area-learning-unit-panel');
  panel.hidden = false;
  renderSquareCentimeterAreaLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function startFractionTreasureLearningUnit() {
  fractionTreasureSession = createCandidateUnitSession(FRACTION_TREASURE_LEARNING_UNIT);
  const panel = document.getElementById('fraction-treasure-learning-unit-panel');
  panel.hidden = false;
  renderFractionTreasureLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function renderFractionTreasureStrip(model) {
  const figure = learningElement('figure', undefined, 'candidate-fraction-figure');
  figure.setAttribute('aria-label', '同一大小的連續圖形平均分成等大的小部分；斜線紋理表示選取部分');
  const strip = learningElement('div', undefined, 'candidate-fraction-strip');
  strip.style.setProperty('--fraction-parts', String(model.denominator));
  for (const shaded of model.parts) {
    const part = learningElement('span', shaded ? '▨' : '□', `candidate-fraction-part${shaded ? ' is-shaded' : ''}`);
    part.setAttribute('aria-hidden', 'true');
    strip.append(part);
  }
  figure.append(strip, learningElement('figcaption', `${model.label}・斜線格為選取部分`));
  return figure;
}

function renderFractionTreasureLearningUnit() {
  const session = fractionTreasureSession;
  if (!session) return;
  const unit = FRACTION_TREASURE_LEARNING_UNIT;
  const content = document.getElementById('fraction-treasure-learning-unit-content');
  const actions = document.getElementById('fraction-treasure-learning-unit-actions');
  const progressText = document.getElementById('fraction-treasure-learning-unit-progress');
  const feedbackBox = document.getElementById('fraction-treasure-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.fractionTreasureAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選互動原型／待教師審查；作答只保存在記憶體，不是正式評量、成績或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${unit.title}・候選活動`;
    content.append(learningElement('p', unit.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of unit.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals, learningElement('p', '本次只試作等分圖形讀取、分子／分母角色及同分母比較；沒有分數加減、正式檢核或連結補強活動。三年級實際進度、教材與先備仍待教師確認。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = unit.questions[session.questionIndex];
    progressText.textContent = `候選練習 ${session.questionIndex + 1} / ${unit.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    for (const model of question.visualization?.models ?? []) content.append(renderFractionTreasureStrip(model));
    if (question.visualization?.models?.length) content.append(learningElement('p', '每條圖形表示完整的一個整體；只有在整體相同且平均分成等大部分時，才能直接比較部分數量。', 'candidate-fraction-note'));
    renderLearningOptions(content, question, 'fraction_treasure_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct' ? question.explanation : candidateWrongGuidance(question);
      if (event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === unit.questions.length - 1 ? '查看結果' : '下一題', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '分數寶藏島探險回顧', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '這些數字只描述本次候選活動，不代表正式檢核通過或學習目標達成。'));
    const review = learningElement('ol');
    for (const question of unit.questions) {
      const attempts = getCandidateQuestionAttempts(session, question.id);
      const history = attempts.length
        ? attempts.map((attempt) => {
          const selected = question.options.find((option) => option.optionId === attempt.selectedOptionId)?.text ?? '無效選項';
          const stage = ({ first_independent: '首次未看提示', after_hint: '看提示後', retry: '重試', after_remediation: '補強後' })[attempt.attemptStage] ?? '候選作答';
          return `${stage}選「${selected}」${attempt.result === 'correct' ? '，答對' : '，答錯'}`;
        }).join('；')
        : '';
      review.append(learningElement('li', `${question.prompt} 作答歷程：${history || '未作答'}。解析：${question.explanation}`));
    }
    content.append(review);
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleFractionTreasureLearningAction(event) {
  const target = event.target.closest('[data-fraction-treasure-action], [data-learning-action="fraction_treasure_answer"]');
  if (!target || !fractionTreasureSession) return;
  const action = target.dataset.fractionTreasureAction ?? 'answer';
  if (action === 'close') {
    fractionTreasureSession = null;
    document.getElementById('fraction-treasure-learning-unit-panel').hidden = true;
    return;
  }
  const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${fractionTreasureSession.sessionId}:ui:${fractionTreasureSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(fractionTreasureSession, FRACTION_TREASURE_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  fractionTreasureSession = result.session;
  renderFractionTreasureLearningUnit();
}

function startAdditionSubtractionLearningUnit() {
  additionSubtractionSession = createCandidateUnitSession(ADDITION_SUBTRACTION_LEARNING_UNIT);
  const panel = document.getElementById('addition-subtraction-learning-unit-panel');
  panel.hidden = false;
  renderAdditionSubtractionLearningUnit();
  panel.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
}

function renderAdditionSubtractionLearningUnit() {
  const session = additionSubtractionSession;
  if (!session) return;
  const unit = ADDITION_SUBTRACTION_LEARNING_UNIT;
  const content = document.getElementById('addition-subtraction-learning-unit-content');
  const actions = document.getElementById('addition-subtraction-learning-unit-actions');
  const progressText = document.getElementById('addition-subtraction-learning-unit-progress');
  const feedbackBox = document.getElementById('addition-subtraction-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.additionSubtractionAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選互動原型／待教師審查；作答只保存在記憶體，不是正式評量、成績或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${unit.title}・候選活動`;
    content.append(learningElement('p', unit.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of unit.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals, learningElement('p', '本候選包含四題多次進位／退位計算結果選擇，另有一題以已給定情境選擇重新分組說明。兩種作答分開記錄，均不是正式檢核或策略精熟判定；估算、生活應用及實際書寫／口述策略證據未提供。課綱原文與位置已核對，教材、先備及班級進度待教師確認。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = unit.questions[session.questionIndex];
    progressText.textContent = `候選練習 ${session.questionIndex + 1} / ${unit.questions.length}`;
    content.append(learningElement('p', question.responseDimension === 'strategy_explanation' ? '候選策略說明題・與計算結果題分開記錄' : '候選計算結果題', 'prototype-note'));
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    if (question.responseDimension === 'strategy_explanation') {
      content.append(learningElement('p', '這題檢視對一個已給定計算情境的說明選擇，不代表學生能自行完成計算或穩定運用策略。', 'prototype-note'));
    } else {
      const calculation = learningElement('div', `${question.operands[0].toLocaleString('en-US')} ${question.operator} ${question.operands[1].toLocaleString('en-US')}`, 'candidate-calculation-expression');
      calculation.setAttribute('aria-label', `算式 ${question.operands[0]} ${question.operator} ${question.operands[1]}`);
      content.append(calculation, learningElement('p', '候選示範只記錄你選的計算結果，未記錄或評分直式步驟。', 'prototype-note'));
    }
    renderLearningOptions(content, question, 'addition_subtraction_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct' ? question.explanation : candidateWrongGuidance(question);
      if (event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === unit.questions.length - 1 ? '查看結果' : '下一題', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '加減法探險回顧', 'number-secret-question'));
    content.append(learningElement('p', `本次記錄 ${summary.attemptCount} 個候選作答事件；下列維度分開彙總，重試也會逐次列出。`));
    const dimensions = summary.responseDimensionSummaries ?? {};
    const calculationSummary = dimensions.calculation_result;
    const strategySummary = dimensions.strategy_explanation;
    if (calculationSummary) content.append(learningElement('p', `計算結果題：${calculationSummary.attemptCount} 次作答，答對 ${calculationSummary.correctCount} 次、答錯 ${calculationSummary.incorrectCount} 次。`));
    if (strategySummary) content.append(learningElement('p', `策略說明選擇題：${strategySummary.attemptCount} 次作答，答對 ${strategySummary.correctCount} 次、答錯 ${strategySummary.incorrectCount} 次。這不是穩定策略理解或精熟度判定。`));
    content.append(learningElement('p', '本結果只描述候選作答，不是正式檢核、正式成績或學習目標達成證據。'));
    const review = learningElement('ol');
    for (const question of unit.questions) {
      const attempts = getCandidateQuestionAttempts(session, question.id);
      const history = attempts.length ? attempts.map((attempt) => {
        const selected = question.options.find((option) => option.optionId === attempt.selectedOptionId)?.text ?? '無效選項';
        const stage = ({ first_independent: '首次未看提示', after_hint: '看提示後', retry: '重試', after_remediation: '補強後' })[attempt.attemptStage] ?? '候選作答';
        return `${stage}選「${selected}」${attempt.result === 'correct' ? '，答對' : '，答錯'}`;
      }).join('；') : '未作答';
      const dimensionLabel = question.responseDimension === 'strategy_explanation' ? '策略說明選擇' : '計算結果選擇';
      review.append(learningElement('li', `【${dimensionLabel}】${question.prompt} 作答歷程：${history}。解析：${question.explanation}`));
    }
    content.append(review, learningElement('p', '尚無連結的補強活動。', 'prototype-note'));
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleAdditionSubtractionLearningAction(event) {
  const target = event.target.closest('[data-addition-subtraction-action], [data-learning-action="addition_subtraction_answer"]');
  if (!target || !additionSubtractionSession) return;
  const action = target.dataset.additionSubtractionAction ?? 'answer';
  if (action === 'close') {
    additionSubtractionSession = null;
    document.getElementById('addition-subtraction-learning-unit-panel').hidden = true;
    return;
  }
  const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${additionSubtractionSession.sessionId}:ui:${additionSubtractionSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(additionSubtractionSession, ADDITION_SUBTRACTION_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  additionSubtractionSession = result.session;
  renderAdditionSubtractionLearningUnit();
}

function renderSquareCentimeterAreaFigure(rows, label, index) {
  const figure = learningElement('figure', undefined, 'candidate-area-figure');
  figure.setAttribute('aria-label', `${label}：以邊長 1 公分的單位方格表示`);
  const grid = learningElement('div', undefined, 'candidate-area-grid');
  grid.style.setProperty('--area-grid-columns', String(Math.max(1, ...rows.map((row) => row.length))));
  for (const row of rows) {
    for (const filled of row) {
      const cell = learningElement('span', filled ? '■' : '', `candidate-area-cell${filled ? ' is-filled' : ' is-empty'}`);
      cell.setAttribute('aria-hidden', 'true');
      grid.append(cell);
    }
  }
  figure.append(grid, learningElement('figcaption', `${label}・每個完整小格代表 1 平方公分`));
  return figure;
}

function renderSquareCentimeterAreaLearningUnit() {
  const session = squareCentimeterAreaSession;
  if (!session) return;
  const unit = SQUARE_CENTIMETER_AREA_LEARNING_UNIT;
  const content = document.getElementById('square-centimeter-area-learning-unit-content');
  const actions = document.getElementById('square-centimeter-area-learning-unit-actions');
  const progressText = document.getElementById('square-centimeter-area-learning-unit-progress');
  const feedbackBox = document.getElementById('square-centimeter-area-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.areaUnitAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選互動原型／待教師審查；本次作答只保存在記憶體，不是正式評量、成績或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${unit.title}・候選活動`;
    content.append(learningElement('p', unit.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of unit.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals, learningElement('p', '本原型以完整單位方格點數與比較為主；沒有一般面積公式、周長、估測或連結補強活動。課綱年級適切性、先備與教材進度待教師確認。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = unit.questions[session.questionIndex];
    progressText.textContent = `候選練習 ${session.questionIndex + 1} / ${unit.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    if (question.visualization.type === 'comparison') {
      question.visualization.figures.forEach((rows, index) => content.append(renderSquareCentimeterAreaFigure(rows, index === 0 ? '甲花圃' : '乙花圃', index)));
    } else {
      content.append(renderSquareCentimeterAreaFigure(question.visualization.rows, '方格圖', 0));
    }
    content.append(learningElement('p', '圖形只用完整方格表示；每個小方格都是邊長 1 公分的正方形。', 'area-visual-note'));
    renderLearningOptions(content, question, 'square_centimeter_area_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct' ? question.explanation : candidateWrongGuidance(question);
      if (event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === unit.questions.length - 1 ? '查看結果' : '下一題', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '平方公分探險回顧', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '這些數字只描述本次候選活動，不代表正式檢核通過或學習目標達成。'));
    const review = learningElement('ol');
    for (const question of unit.questions) {
      const attempt = session.attempts.find((event) => event.questionId === question.id);
      const selected = question.options.find((option) => option.optionId === attempt?.selectedOptionId)?.text ?? '未作答';
      const status = attempt?.result === 'correct' ? '答對。' : attempt ? '答錯。' : '未作答。';
      review.append(learningElement('li', `${question.prompt} 你的選擇：${selected}。${status} ${question.explanation}`));
    }
    content.append(review);
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleSquareCentimeterAreaLearningAction(event) {
  const target = event.target.closest('[data-area-unit-action], [data-learning-action="square_centimeter_area_answer"]');
  if (!target || !squareCentimeterAreaSession) return;
  const action = target.dataset.areaUnitAction ?? 'answer';
  if (action === 'close') {
    squareCentimeterAreaSession = null;
    document.getElementById('square-centimeter-area-learning-unit-panel').hidden = true;
    return;
  }
  const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${squareCentimeterAreaSession.sessionId}:ui:${squareCentimeterAreaSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(squareCentimeterAreaSession, SQUARE_CENTIMETER_AREA_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  squareCentimeterAreaSession = result.session;
  renderSquareCentimeterAreaLearningUnit();
}

function renderWeightKgGLearningUnit() {
  const session = weightKgGLearningSession;
  if (!session) return;
  const unit = WEIGHT_KG_G_LEARNING_UNIT;
  const content = document.getElementById('weight-kg-g-learning-unit-content');
  const actions = document.getElementById('weight-kg-g-learning-unit-actions');
  const progressText = document.getElementById('weight-kg-g-learning-unit-progress');
  const feedbackBox = document.getElementById('weight-kg-g-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.weightKgGAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選互動試作／待教師審查；作答只保存在本次記憶體，不是正式評量或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${unit.title}・候選學習單元`;
    content.append(learningElement('p', unit.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of unit.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals, learningElement('p', '各題提供符合讀單位、單位關係或同單位比較的兩層提示與錯答引導；尚未提供獨立補強活動。量感、換算、比較先備及教材進度待教師確認。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = unit.questions[session.questionIndex];
    progressText.textContent = `候選練習 ${session.questionIndex + 1} / ${unit.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    renderLearningOptions(content, question, 'weight_kg_g_unit_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct'
        ? question.explanation
        : candidateWrongGuidance(question);
      if (!event.result || event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === unit.questions.length - 1 ? '查看結果' : '下一題', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '公克與公斤候選練習完成', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '結果只描述本次候選活動，不是正式檢核或學習目標達成證據。'));
    const review = learningElement('ol');
    for (const question of unit.questions) {
      const attempt = session.attempts.find((event) => event.questionId === question.id);
      const selected = question.options.find((option) => option.optionId === attempt?.selectedOptionId)?.text ?? '未作答';
      review.append(learningElement('li', `${question.prompt} 你的選擇：${selected}。${attempt?.result === 'correct' ? '答對。' : '答錯。'} ${question.explanation}`));
    }
    content.append(review);
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleWeightKgGLearningAction(event) {
  const target = event.target.closest('[data-weight-kg-g-action], [data-learning-action="weight_kg_g_unit_answer"]');
  if (!target || !weightKgGLearningSession) return;
  const action = target.dataset.weightKgGAction ?? 'answer';
  if (action === 'close') {
    weightKgGLearningSession = null;
    document.getElementById('weight-kg-g-learning-unit-panel').hidden = true;
    return;
  }
    const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${weightKgGLearningSession.sessionId}:ui:${weightKgGLearningSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(weightKgGLearningSession, WEIGHT_KG_G_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  weightKgGLearningSession = result.session;
  renderWeightKgGLearningUnit();
}

function renderMillimeterRuler(content, visualization) {
  const figure = learningElement('figure', undefined, 'candidate-millimeter-ruler');
  figure.setAttribute('aria-label', `毫米尺從 ${visualization.startMm} 到 ${visualization.endMm} 毫米；線段起點對齊零刻度，另一端以標記指出，請依刻度判讀。`);
  const ruler = learningElement('div', undefined, 'candidate-millimeter-ruler-track');
  ruler.setAttribute('aria-hidden', 'true');
  const count = (visualization.endMm - visualization.startMm) / visualization.minorStepMm;
  for (let index = 0; index <= count; index += 1) {
    const value = visualization.startMm + index * visualization.minorStepMm;
    const tick = learningElement('span', undefined, `candidate-millimeter-tick${value % visualization.majorStepMm === 0 ? ' is-major' : ''}`);
    tick.style.left = `${(value - visualization.startMm) / (visualization.endMm - visualization.startMm) * 100}%`;
    if (value % visualization.majorStepMm === 0) tick.append(learningElement('small', String(value)));
    ruler.append(tick);
  }
  const measuredLine = learningElement('span', undefined, 'candidate-millimeter-measured-line');
  measuredLine.style.width = `${(visualization.markMm - visualization.startMm) / (visualization.endMm - visualization.startMm) * 100}%`;
  const endMarker = learningElement('span', '終點', 'candidate-millimeter-end-marker');
  endMarker.style.left = `${(visualization.markMm - visualization.startMm) / (visualization.endMm - visualization.startMm) * 100}%`;
  ruler.append(measuredLine, endMarker);
  figure.append(ruler, learningElement('figcaption', '尺的 0 刻度對齊線段起點；長度讀取起點到終點的位置。大刻度每 10 毫米，小刻度每 1 毫米。'));
  content.append(figure);
}

function renderMillimeterRulerLearningUnit() {
  const session = millimeterRulerLearningSession;
  if (!session) return;
  const unit = MILLIMETER_RULER_LEARNING_UNIT;
  const content = document.getElementById('millimeter-ruler-learning-unit-content');
  const actions = document.getElementById('millimeter-ruler-learning-unit-actions');
  const progressText = document.getElementById('millimeter-ruler-learning-unit-progress');
  const feedbackBox = document.getElementById('millimeter-ruler-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.millimeterRulerAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選互動試作／待教師審查；作答只留在本次記憶體，不是正式評量或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${unit.title}・候選學習單元`;
    content.append(learningElement('p', unit.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of unit.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals, learningElement('p', '各題提供兩層讀刻度提示與錯答引導；尚未提供獨立補強活動。教材版本、毫米刻度讀法的先備能力與班級授課進度待教師確認。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = unit.questions[session.questionIndex];
    progressText.textContent = `候選練習 ${session.questionIndex + 1} / ${unit.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    renderMillimeterRuler(content, question.visualization);
    renderLearningOptions(content, question, 'millimeter_ruler_unit_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct'
        ? question.explanation
        : candidateWrongGuidance(question);
      if (event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === unit.questions.length - 1 ? '查看結果' : '下一題', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '毫米刻度候選練習完成', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '結果只描述本次候選活動，不是正式檢核或學習目標達成證據。'));
    const review = learningElement('ol');
    for (const question of unit.questions) {
      const attempt = session.attempts.find((event) => event.questionId === question.id);
      const selected = question.options.find((option) => option.optionId === attempt?.selectedOptionId)?.text ?? '未作答';
      review.append(learningElement('li', `${question.prompt} 你的選擇：${selected}。${attempt?.result === 'correct' ? '答對。' : '答錯。'} ${question.explanation}`));
    }
    content.append(review);
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleMillimeterRulerLearningAction(event) {
  const target = event.target.closest('[data-millimeter-ruler-action], [data-learning-action="millimeter_ruler_unit_answer"]');
  if (!target || !millimeterRulerLearningSession) return;
  const action = target.dataset.millimeterRulerAction ?? 'answer';
  if (action === 'close') {
    millimeterRulerLearningSession = null;
    document.getElementById('millimeter-ruler-learning-unit-panel').hidden = true;
    return;
  }
  const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${millimeterRulerLearningSession.sessionId}:ui:${millimeterRulerLearningSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(millimeterRulerLearningSession, MILLIMETER_RULER_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  millimeterRulerLearningSession = result.session;
  renderMillimeterRulerLearningUnit();
}

function renderIntegerNumberLine(host, visualization) {
  const figure = learningElement('figure', undefined, 'candidate-number-line-figure');
  figure.setAttribute('aria-label', `從 ${visualization.start} 到 ${visualization.end} 的整數數線；標示刻度 ${visualization.majorTicks.join('、')}；數線上有 ${visualization.points.map(({ label }) => `${label} 標記`).join('、')}，請依刻度判讀位置。`);
  const axis = learningElement('div', undefined, 'candidate-number-line-axis');
  axis.setAttribute('aria-hidden', 'true');
  const count = Math.floor((visualization.end - visualization.start) / visualization.minorStep);
  for (let index = 0; index <= count; index += 1) {
    const value = visualization.start + index * visualization.minorStep;
    const tick = learningElement('span', undefined, `candidate-number-line-tick${visualization.majorTicks.includes(value) ? ' is-major' : ''}`);
    tick.style.left = `${(value - visualization.start) / (visualization.end - visualization.start) * 100}%`;
    if (visualization.majorTicks.includes(value)) tick.append(learningElement('small', String(value)));
    axis.append(tick);
  }
  for (const point of visualization.points) {
    const marker = learningElement('span', point.label, 'candidate-number-line-marker');
    marker.style.left = `${(point.value - visualization.start) / (visualization.end - visualization.start) * 100}%`;
    marker.setAttribute('aria-hidden', 'true');
    axis.append(marker);
  }
  figure.append(axis, learningElement('figcaption', `每一小格代表 ${visualization.minorStep}。數線由 ${visualization.start} 向右增加。`));
  host.append(figure);
}

function renderIntegerNumberLineLearningUnit() {
  const session = integerNumberLineLearningSession;
  if (!session) return;
  const unit = INTEGER_NUMBER_LINE_LEARNING_UNIT;
  const content = document.getElementById('integer-number-line-learning-unit-content');
  const actions = document.getElementById('integer-number-line-learning-unit-actions');
  const progressText = document.getElementById('integer-number-line-learning-unit-progress');
  const feedbackBox = document.getElementById('integer-number-line-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.numberLineUnitAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選互動試作／待教師審查；作答只留在本次記憶體，不是正式評量或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${unit.title}・候選學習單元`;
    content.append(learningElement('p', unit.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of unit.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals, learningElement('p', '各題提供確認起點與間距的兩層提示及錯答引導；尚未提供獨立補強活動。教材刻度間距、先備知識及年級／學期進度待教師確認。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = unit.questions[session.questionIndex];
    progressText.textContent = `候選情境 ${session.questionIndex + 1} / ${unit.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    renderIntegerNumberLine(content, question.visualization);
    renderLearningOptions(content, question, 'integer_number_line_unit_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct'
        ? question.explanation
        : candidateWrongGuidance(question);
      if (event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === unit.questions.length - 1 ? '查看結果' : '下一題', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '這輪候選練習完成', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '結果只描述本次候選活動，不是正式檢核或學習目標達成證據。'));
    const review = learningElement('ol');
    for (const question of unit.questions) {
      const attempt = session.attempts.find((event) => event.questionId === question.id);
      const selected = question.options.find((option) => option.optionId === attempt?.selectedOptionId)?.text ?? '未作答';
      review.append(learningElement('li', `${question.prompt} 你的選擇：${selected}。${attempt?.result === 'correct' ? '答對。' : '答錯。'} ${question.explanation}`));
    }
    content.append(review);
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleIntegerNumberLineLearningAction(event) {
  const target = event.target.closest('[data-number-line-unit-action], [data-learning-action="integer_number_line_unit_answer"]');
  if (!target || !integerNumberLineLearningSession) return;
  const action = target.dataset.numberLineUnitAction ?? 'answer';
  if (action === 'close') {
    integerNumberLineLearningSession = null;
    document.getElementById('integer-number-line-learning-unit-panel').hidden = true;
    return;
  }
  const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${integerNumberLineLearningSession.sessionId}:ui:${integerNumberLineLearningSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(integerNumberLineLearningSession, INTEGER_NUMBER_LINE_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  integerNumberLineLearningSession = result.session;
  renderIntegerNumberLineLearningUnit();
}

function renderCapacityCandidateScale(content, question) {
  const visualization = question.visualization;
  if (!visualization) return;
  const figure = learningElement('figure', undefined, 'candidate-capacity-visual');
  figure.setAttribute('aria-label', `透明量杯，容量 ${visualization.capacityMl} 毫升；圖中顯示水面位置，請對照刻度判讀。`);
  const wrap = learningElement('div', undefined, 'candidate-capacity-scale');
  const vessel = learningElement('div', undefined, 'candidate-capacity-vessel');
  const water = learningElement('div', undefined, 'candidate-capacity-water');
  water.style.height = `${visualization.waterMl / visualization.capacityMl * 100}%`;
  vessel.append(water);
  const ticks = learningElement('div', undefined, 'candidate-capacity-ticks');
  for (let amount = visualization.capacityMl; amount >= 0; amount -= visualization.stepMl) {
    const mark = learningElement('span', amount % 200 === 0 ? `${amount} mL` : '');
    mark.className = amount % 200 === 0 ? 'is-major' : '';
    mark.style.top = `${100 - amount / visualization.capacityMl * 100}%`;
    ticks.append(mark);
  }
  wrap.append(vessel, ticks);
  figure.append(wrap, learningElement('figcaption', '每一小格代表 100 毫升；這是候選教學示意圖。'));
  content.append(figure);
}

function renderCapacityLearningUnit() {
  const session = capacityLearningSession;
  if (!session) return;
  const unit = CAPACITY_READING_LEARNING_UNIT;
  const content = document.getElementById('capacity-learning-unit-content');
  const actions = document.getElementById('capacity-learning-unit-actions');
  const progressText = document.getElementById('capacity-learning-unit-progress');
  const feedbackBox = document.getElementById('capacity-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.capacityUnitAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選示範活動／待教師審查；作答只留在本次記憶體，不是正式評量或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${unit.title}・候選學習單元`;
    content.append(learningElement('p', unit.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of unit.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals);
    content.append(learningElement('p', '各題提供兩層刻度觀察提示與錯答引導；尚未提供獨立補強活動。答錯只作候選線索，不推定錯誤原因。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = unit.questions[session.questionIndex];
    progressText.textContent = `候選情境 ${session.questionIndex + 1} / ${unit.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    renderCapacityCandidateScale(content, question);
    renderLearningOptions(content, question, 'capacity_unit_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct'
        ? question.explanation
        : candidateWrongGuidance(question);
      if (event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === unit.questions.length - 1 ? '查看結果' : '下一個情境', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '這輪候選練習完成', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '結果只描述本次候選活動，不是正式檢核或學習目標達成證據。'));
    const review = learningElement('ol');
    for (const question of unit.questions) {
      const attempt = session.attempts.find((event) => event.questionId === question.id);
      const selected = question.options.find((option) => option.optionId === attempt?.selectedOptionId)?.text ?? '未作答';
      review.append(learningElement('li', `${question.prompt} 你的選擇：${selected}。${attempt?.result === 'correct' ? '答對。' : '答錯。'} ${question.explanation}`));
    }
    content.append(review);
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleCapacityLearningAction(event) {
  const target = event.target.closest('[data-capacity-unit-action], [data-learning-action="capacity_unit_answer"]');
  if (!target || !capacityLearningSession) return;
  const action = target.dataset.capacityUnitAction ?? 'answer';
  if (action === 'close') {
    capacityLearningSession = null;
    document.getElementById('capacity-learning-unit-panel').hidden = true;
    return;
  }
  const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${capacityLearningSession.sessionId}:ui:${capacityLearningSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(capacityLearningSession, CAPACITY_READING_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  capacityLearningSession = result.session;
  renderCapacityLearningUnit();
}

function renderComparisonLearningUnit() {
  const session = comparisonLearningSession;
  if (!session) return;
  const content = document.getElementById('comparison-learning-unit-content');
  const actions = document.getElementById('comparison-learning-unit-actions');
  const progressText = document.getElementById('comparison-learning-unit-progress');
  const feedbackBox = document.getElementById('comparison-learning-unit-feedback');
  content.replaceChildren();
  actions.replaceChildren();
  feedbackBox.hidden = true;
  feedbackBox.classList.remove('is-wrong');
  feedbackBox.textContent = '';
  const addAction = (label, action, className = 'button button-secondary') => {
    const button = learningButton(label, action, className);
    button.dataset.comparisonUnitAction = action;
    actions.append(button);
  };
  content.append(learningElement('p', '候選示範活動／待教師審查；作答只留在本次記憶體，不是正式評量或學習紀錄。', 'prototype-note'));
  if (session.phase === 'intro') {
    progressText.textContent = `${NUMBER_COMPARISON_LEARNING_UNIT.title}・候選學習單元`;
    content.append(learningElement('p', NUMBER_COMPARISON_LEARNING_UNIT.introduction));
    const goals = learningElement('ul', undefined, 'candidate-learning-goals');
    for (const goal of NUMBER_COMPARISON_LEARNING_UNIT.learningGoals) goals.append(learningElement('li', goal));
    content.append(goals);
    content.append(learningElement('p', '各題提供依位值順序比較的兩層提示與錯答引導；尚未提供獨立補強活動。錯答只作候選線索，不推定原因；跨千位題先備待教師確認。'));
    addAction('開始候選練習', 'start', 'button button-primary');
  } else if (session.phase === 'question' || session.phase === 'feedback') {
    const question = NUMBER_COMPARISON_LEARNING_UNIT.questions[session.questionIndex];
    progressText.textContent = `候選活動 ${session.questionIndex + 1} / ${NUMBER_COMPARISON_LEARNING_UNIT.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    renderLearningOptions(content, question, 'comparison_unit_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      const event = session.attempts.at(-1);
      feedbackBox.hidden = false;
      feedbackBox.classList.toggle('is-wrong', event.result !== 'correct');
      feedbackBox.textContent = event.result === 'correct'
        ? question.explanation
        : candidateWrongGuidance(question);
      if (event.result !== 'correct') addAction('再想一次', 'retry');
      addAction(session.questionIndex === NUMBER_COMPARISON_LEARNING_UNIT.questions.length - 1 ? '查看結果' : '下一題', 'next', 'button button-primary');
    }
  } else {
    const summary = summarizeCandidateUnit(session);
    progressText.textContent = '候選活動回顧';
    content.append(learningElement('h3', '這輪候選練習完成', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '結果只描述本次候選活動，不是正式檢核或學習目標達成證據。'));
    const review = learningElement('ol');
    for (const question of NUMBER_COMPARISON_LEARNING_UNIT.questions) {
      const attempt = session.attempts.find((event) => event.questionId === question.id);
      const selected = question.options.find((option) => option.optionId === attempt?.selectedOptionId)?.text ?? '未作答';
      review.append(learningElement('li', `${question.prompt} 你的選擇：${selected}。${attempt?.result === 'correct' ? '答對。' : '答錯。'} ${question.explanation}`));
    }
    content.append(review);
    addAction('重新練習', 'restart', 'button button-primary');
  }
}

function handleComparisonLearningAction(event) {
  const target = event.target.closest('[data-comparison-unit-action], [data-learning-action="comparison_unit_answer"]');
  if (!target || !comparisonLearningSession) return;
  const action = target.dataset.comparisonUnitAction ?? 'answer';
  if (action === 'close') {
    comparisonLearningSession = null;
    document.getElementById('comparison-learning-unit-panel').hidden = true;
    return;
  }
  const payload = action === 'answer'
    ? { optionId: target.dataset.optionId, submissionId: `${comparisonLearningSession.sessionId}:ui:${comparisonLearningSession.attemptSequence + 1}` }
    : {};
  const result = dispatchCandidateUnit(comparisonLearningSession, NUMBER_COMPARISON_LEARNING_UNIT, action, payload);
  if (!result.changed) return;
  comparisonLearningSession = result.session;
  renderComparisonLearningUnit();
}

function renderExploration() {
  const avatar = document.getElementById('explorer-avatar');
  avatar.style.left = `${explorerPosition.x}%`;
  avatar.style.top = `${explorerPosition.y}%`;
  const nearby = getNearbyObject(explorerPosition);
  const prompt = document.getElementById('nearby-prompt');
  const interactButton = document.getElementById('interact-button');
  const taskPanelOpen = !document.getElementById('number-secret-panel').hidden;
  if (taskPanelOpen) {
    movementHoldController.stop();
    stopExplorerAnimation();
  }
  const collected = new Set(mapProgress.collectedStarIds);
  const secretComplete = isNumberSecretTreasureUnlocked(mapProgress);
  document.getElementById('exploration-star-count').textContent = `場景星星 ${collected.size} / 1`;
  interactButton.disabled = !nearby || taskPanelOpen;
  document.querySelectorAll('[data-move]').forEach((button) => { button.disabled = taskPanelOpen; });
  document.getElementById('start-quiz-button').disabled = taskPanelOpen;
  prompt.textContent = explorationMessage || (nearby
    ? `靠近「${nearby.name}」了！按 E 或點物件互動。`
    : '移動探險家，靠近物件後就可以互動。');
  for (const object of ISLAND_OBJECTS) {
    const button = document.querySelector(`[data-object-id="${object.id}"]`);
    const canInteract = !taskPanelOpen && nearby?.id === object.id;
    button.style.left = `${object.x}%`;
    button.style.top = `${object.y}%`;
    button.disabled = !canInteract;
    button.setAttribute('aria-label', `${object.name}${canInteract ? '，已靠近，按下互動' : '，走近後可互動'}`);
    if (object.kind === 'star' && collected.has(object.id)) {
      button.classList.add('world-object-collected');
      button.querySelector('small').textContent = '已收集';
    } else if (object.kind === 'chest' && secretComplete) {
      button.classList.add('world-object-collected');
      button.querySelector('span').textContent = '🎁';
      button.querySelector('small').textContent = '任務已完成';
    } else {
      button.classList.remove('world-object-collected');
      if (object.kind === 'chest') button.querySelector('span').textContent = '🧰';
      button.querySelector('small').textContent = '靠近查看';
    }
  }
}

function moveExplorerInScene(direction) {
  if (!['up', 'down', 'left', 'right'].includes(direction)) return;
  explorerPosition = moveExplorer(explorerPosition, direction);
  lastExplorerDirection = direction;
  if (explorerCharacter?.loaded && !screens.explore.hidden && document.getElementById('number-secret-panel').hidden) {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion) {
      explorerCharacter.face(direction);
      stopExplorerAnimation();
    } else {
      explorerCharacter.move(direction, 'walk');
      window.clearTimeout(explorerMovementStopTimer);
      explorerMovementStopTimer = window.setTimeout(stopExplorerAnimation, 190);
    }
  }
  explorationMessage = '';
  renderExploration();
}

function stopExplorerAnimation() {
  window.clearTimeout(explorerMovementStopTimer);
  explorerMovementStopTimer = null;
  explorerCharacter?.stop();
}

function ensureExplorerCharacter() {
  if (explorerCharacterLoad) return explorerCharacterLoad;
  const host = document.getElementById('explorer-avatar');
  const fallback = document.getElementById('explorer-avatar-fallback');
  const showFailure = (error) => {
    host.classList.add('character-load-failed');
    host.setAttribute('aria-label', '3D 探險家無法載入；方向控制仍可操作');
    fallback.hidden = false;
    fallback.textContent = `3D 角色載入失敗，仍可繼續探索（${error?.message || '模型或 WebGL 無法使用'}）。`;
  };

  // Import Three.js and the character controller only when the player enters the island.
  // The promise is cached so repeated entries never create duplicate canvases/controllers.
  explorerCharacterLoad = import('./explorerCharacter3d.js')
    .then(({ createExplorerCharacter3D }) => {
      explorerCharacter = createExplorerCharacter3D(host, {
        onLoaded: ({ clips }) => {
          fallback.hidden = true;
          host.setAttribute('aria-label', '可由方向鍵、WASD 或觸控按鈕移動的 3D 探險家');
          host.classList.add('has-3d-character');
          explorerCharacter.face(lastExplorerDirection);
          explorerCharacter.setActive(!screens.explore.hidden);
          if (!clips.some((name) => name.toLowerCase() === 'walking')) {
            fallback.hidden = false;
            fallback.textContent = '角色已載入，但模型沒有 Walking 動畫；仍可移動探索。';
          }
        },
        onError: showFailure,
      });
      return explorerCharacter.ready.then(() => explorerCharacter);
    })
    .catch((error) => {
      explorerCharacter?.dispose();
      explorerCharacter = null;
      showFailure(error);
      return null;
    });
  return explorerCharacterLoad;
}

function interactWithNearbyObject(objectId = getNearbyObject(explorerPosition)?.id) {
  const object = ISLAND_OBJECTS.find((candidate) => candidate.id === objectId);
  const result = interactWithObject(explorerPosition, object);
  if (!result.ok) {
    explorationMessage = '還有一點距離，走近物件再試試看！';
    document.getElementById('nearby-prompt').textContent = explorationMessage;
    return;
  }

  if (object.id === 'number-obelisk') {
    const newlyCompleted = recordMissionEvent(MISSION_EVENTS.FIND_NUMBER_OBELISK, { objectId: object.id, nearby: true });
    if (newlyCompleted.length > 0) persistAndRenderProgress();
    explorationMessage = '石碑線索：3,000 裡的 3 在千位，表示 3 個千。這是遊戲示意內容。';
    showMissionToast(newlyCompleted);
    openNumberSecretIntro();
  } else if (object.kind === 'chest') {
    explorationMessage = isNumberSecretTreasureUnlocked(mapProgress)
      ? '寶箱已經打開！千位數的秘密任務完成了。'
      : '寶箱還鎖著，先找到數字石碑並完成「千位數的秘密」吧！';
  } else {
    const result = collectDemoStar(mapProgress, object.id);
    mapProgress = result.progress;
    if (result.collected) {
      persistAndRenderProgress();
      explorationMessage = '收集到一顆場景星星！它是探險收藏，和答題星星分開計算。';
    } else {
      explorationMessage = '這顆場景星星已收進探險包囉！';
    }
  }
  renderExploration();
}

function showNumberSecretView(viewId) {
  for (const id of ['number-secret-intro', 'number-secret-learning-view', 'number-secret-challenge-view', 'number-secret-result']) {
    document.getElementById(id).hidden = id !== viewId;
  }
}

function openNumberSecretIntro() {
  document.getElementById('number-secret-intro-copy').textContent = numberSecretChallenge.intro;
  showNumberSecretView('number-secret-intro');
  document.getElementById('number-secret-panel').hidden = false;
  document.getElementById('number-secret-title').focus({ preventScroll: true });
  document.getElementById('number-secret-panel').scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  renderExploration();
}

function closeNumberSecret() {
  document.getElementById('number-secret-panel').hidden = true;
  renderExploration();
  document.getElementById('explore-title').focus({ preventScroll: true });
}

function startNumberSecretChallenge() {
  if (!canStartNumberSecret(mapProgress.completedMissionIds)) {
    explorationMessage = '先走到數字石碑旁互動，才能開始這項任務。';
    renderExploration();
    closeNumberSecret();
    return;
  }
  numberSecretGame = createGameState(numberSecretChallenge.questions.length);
  showNumberSecretView('number-secret-challenge-view');
  renderNumberSecretQuestion();
}

function renderNumberSecretQuestion() {
  const question = numberSecretChallenge.questions[numberSecretGame.questionIndex];
  document.getElementById('number-secret-progress').textContent = `第 ${numberSecretGame.questionIndex + 1} 題，共 ${numberSecretChallenge.questions.length} 題・本次答對 ${numberSecretGame.score} 題`;
  const prompt = document.getElementById('number-secret-question');
  prompt.textContent = question.prompt;
  const options = document.getElementById('number-secret-options');
  options.replaceChildren();
  for (const option of question.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'number-secret-option';
    button.dataset.optionId = option.optionId;
    button.textContent = option.text;
    button.addEventListener('click', () => answerNumberSecret(option.optionId));
    options.append(button);
  }
  const feedback = document.getElementById('number-secret-feedback');
  feedback.hidden = true;
  feedback.textContent = '';
  const next = document.getElementById('number-secret-next');
  next.hidden = true;
  next.textContent = numberSecretGame.questionIndex === numberSecretChallenge.questions.length - 1 ? '完成任務・打開寶箱' : '下一題 ➜';
  prompt.focus({ preventScroll: true });
}

function answerNumberSecret(optionId) {
  const question = numberSecretChallenge.questions[numberSecretGame.questionIndex];
  const result = submitAnswer(numberSecretGame, question, optionId);
  if (!result.changed) return;
  numberSecretGame = result.state;
  const options = document.getElementById('number-secret-options');
  for (const button of options.querySelectorAll('button')) {
    button.disabled = true;
    if (button.dataset.optionId === question.answerId) button.classList.add('is-correct');
    else if (button.dataset.optionId === optionId) button.classList.add('is-wrong');
  }
  const answer = question.options.find((option) => option.optionId === question.answerId);
  const feedback = document.getElementById('number-secret-feedback');
  feedback.classList.toggle('is-wrong', !result.isCorrect);
  feedback.textContent = `${result.isCorrect ? '答對了！' : `再想一想，正確答案是「${answer.text}」。`}${question.explanation}`;
  feedback.hidden = false;
  document.getElementById('number-secret-next').hidden = false;
}

function completeNumberSecretChallenge() {
  mapProgress = recordNumberSecretCompletion(mapProgress, numberSecretGame.score);
  const reward = NUMBER_SECRET_LEVEL.completionReward;
  const newlyCompleted = recordMissionEvent(reward.event, reward.evidence);
  persistAndRenderProgress();
  document.getElementById('number-secret-result-copy').textContent = `本次答對 ${numberSecretGame.score} / ${numberSecretChallenge.questions.length} 題；本機最佳紀錄 ${mapProgress.challengeRecords[NUMBER_SECRET_QUEST_ID].bestScore} / ${numberSecretChallenge.questions.length} 題。獲得的任務徽章只會發放一次。`;
  showNumberSecretView('number-secret-result');
  renderExploration();
  showMissionToast(newlyCompleted);
}

function nextNumberSecretQuestion() {
  numberSecretGame = advanceQuestion(numberSecretGame, numberSecretChallenge.questions.length);
  if (numberSecretGame.complete) {
    completeNumberSecretChallenge();
    return;
  }
  renderNumberSecretQuestion();
}

function learningElement(tag, text, className = '') {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function learningButton(label, action, className = 'button button-secondary') {
  const button = learningElement('button', label, className);
  button.type = 'button';
  button.dataset.learningAction = action;
  return button;
}

function appendCandidateHint(content, session, question, addAction) {
  if (session.currentHintLevel > 0) {
    content.append(learningElement('p', question.hints[session.currentHintLevel - 1], 'learning-unit-hint'));
  }
  if (Array.isArray(question.hints) && session.currentHintLevel < question.hints.length) {
    addAction(`顯示第 ${session.currentHintLevel + 1} 層提示`, 'hint');
  }
}

function candidateWrongGuidance(question) {
  return question.wrongGuidance
    ?? '這是候選作答線索，不能單次判定錯誤原因。請回看題目提供的表徵，再決定是否重試。';
}

function dispatchLearning(action, payload) {
  if (!numberSecretLearningSession) return;
  const result = dispatchLearningUnit(numberSecretLearningSession, action, payload);
  if (!result.changed) return;
  numberSecretLearningSession = result.session;
  renderNumberSecretLearningUnit();
}

function renderNumberSecretV2Candidate() {
  const session = numberSecretV2CandidateSession;
  if (!session) return;
  showNumberSecretView('number-secret-learning-view');
  const content = document.getElementById('learning-unit-content');
  const actions = document.getElementById('learning-unit-actions');
  const feedback = document.getElementById('learning-unit-feedback');
  const progress = document.getElementById('learning-unit-progress');
  content.replaceChildren();
  actions.replaceChildren();
  feedback.hidden = true;
  feedback.classList.remove('is-wrong');
  feedback.textContent = '';
  const addAction = (...args) => actions.append(learningButton(...args));
  content.append(learningElement('p', '候選試作，尚未經教師核准；作答只留在本次記憶體，不是正式評量或學習紀錄。', 'prototype-note'));
  if (session.phase === 'question' || session.phase === 'feedback') {
    const question = NUMBER_SECRET_V2_CANDIDATE_SET.questions[session.questionIndex];
    progress.textContent = `第二版候選檢核試作 ${session.questionIndex + 1} / ${NUMBER_SECRET_V2_CANDIDATE_SET.questions.length}`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    renderLearningOptions(content, question, 'v2_candidate_answer', session.phase === 'feedback');
    if (session.phase === 'question') appendCandidateHint(content, session, question, addAction);
    if (session.phase === 'feedback') {
      feedback.hidden = false;
      feedback.classList.toggle('is-wrong', !session.lastFeedback.correct);
      const selected = session.attempts.at(-1);
      feedback.textContent = session.lastFeedback.correct
        ? question.explanation
        : candidateWrongGuidance(question);
      if (!session.lastFeedback.correct) addAction('再想一次', 'v2_candidate_retry');
      addAction(session.questionIndex === NUMBER_SECRET_V2_CANDIDATE_SET.questions.length - 1 ? '查看候選結果' : '下一題', 'v2_candidate_next', 'button button-primary');
      if (selected?.draftId !== question.draftId) feedback.textContent = '候選作答紀錄與目前題目不一致，請返回後重新開始。';
    }
  } else {
    const summary = summarizeNumberSecretV2CandidateSession(session);
    progress.textContent = '第二版候選試作結果';
    content.append(learningElement('h3', '候選題組試作完成', 'number-secret-question'));
    content.append(learningElement('p', `本次作答 ${summary.attemptCount} 次：答對 ${summary.correctCount} 次、答錯 ${summary.incorrectCount} 次。`));
    content.append(learningElement('p', '這是本次候選試作結果，不代表正式檢核通過或學習目標達成。'));
    renderNumberSecretV2DeferredQuestionPreview(content, NUMBER_SECRET_V2_CANDIDATE_SET.deferredQuestions[0]);
    addAction('重新試作', 'v2_candidate_restart', 'button button-primary');
    const exportStatus = learningElement('p', '紀錄僅存在記憶體；不輸入姓名或學生識別資料。匯出只會在教師按下按鈕後下載 JSON 到本機。', 'prototype-note');
    exportStatus.id = 'v2-candidate-export-status';
    content.append(exportStatus);
    addAction('教師匯出本次匿名候選測試紀錄', 'v2_candidate_export');
  }
  renderNumberSecretV2ObservationTools(content, session);
  addAction('返回原學習單元', 'v2_candidate_back');
}

function renderNumberSecretV2ObservationTools(host, session) {
  const details = learningElement('details', undefined, 'candidate-observation-tools');
  const summary = learningElement('summary', '教師觀察紀錄（候選試作準備）');
  const note = learningElement('p', '只記錄操作問題代碼，不記錄姓名、口頭內容或其他可識別資訊。學生提示／補救尚不支援，請依核准後的紙本試教表記錄。');
  const label = learningElement('label', '操作問題類型');
  label.htmlFor = 'v2-candidate-technical-issue';
  const select = learningElement('select');
  select.id = 'v2-candidate-technical-issue';
  for (const [value, text] of [
    ['', '選擇（沒有操作問題時不記錄）'],
    ['display', '畫面／文字顯示'],
    ['touch_input', '觸控操作'],
    ['keyboard_input', '鍵盤操作'],
    ['navigation', '畫面導覽'],
    ['other', '其他操作問題'],
  ]) {
    const option = learningElement('option', text);
    option.value = value;
    select.append(option);
  }
  const issueButton = learningButton('記錄操作問題', 'v2_candidate_log_issue');
  issueButton.disabled = session.phase === 'result' && !session.completedAt;
  label.append(select);
  details.append(summary, note, label, issueButton);
  host.append(details);
}

function downloadNumberSecretV2TeacherExport(session) {
  const result = createNumberSecretV2TeacherExport(session);
  if (!result.ok) return false;
  const blob = new Blob([JSON.stringify(result.record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `number-secret-v2-candidate-${result.record.observationCode}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

function renderNumberSecretV2DeferredQuestionPreview(host, question) {
  if (!question || question.enabled !== false) return;
  const preview = learningElement('section', undefined, 'v2-deferred-question-preview');
  preview.setAttribute('aria-labelledby', 'v2-deferred-question-title');
  preview.append(learningElement('p', '題 3 候選預覽・尚未啟用，不能作答', 'prototype-note'));
  preview.append(learningElement('h4', question.prompt, 'v2-deferred-question-title'));
  const table = learningElement('table', undefined, 'v2-place-value-table');
  const caption = learningElement('caption', question.table.caption);
  table.append(caption);
  const head = learningElement('thead');
  const headerRow = learningElement('tr');
  for (const label of question.table.columns) headerRow.append(learningElement('th', label));
  head.append(headerRow);
  const body = learningElement('tbody');
  const digitRow = learningElement('tr');
  for (const digit of question.table.digits) digitRow.append(learningElement('td', String(digit)));
  body.append(digitRow);
  table.append(head, body);
  preview.append(table);
  const options = learningElement('ul', undefined, 'v2-deferred-question-options');
  for (const option of question.options) options.append(learningElement('li', option.text));
  preview.append(options);
  preview.append(learningElement('p', question.prerequisiteNote, 'prototype-note'));
  host.append(preview);
}

function dispatchNumberSecretV2CandidateAction(action, payload = {}) {
  if (!numberSecretV2CandidateSession) return;
  const result = dispatchNumberSecretV2Candidate(numberSecretV2CandidateSession, action, payload);
  if (!result.changed) return;
  numberSecretV2CandidateSession = result.session;
  renderNumberSecretV2Candidate();
}

function renderLearningOptions(host, question, action, disabled = false) {
  const group = learningElement('div', undefined, 'number-secret-options');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', '候選練習作答選項');
  for (const option of question.options) {
    const button = learningButton(option.text, action, 'number-secret-option');
    button.dataset.optionId = option.optionId;
    button.disabled = disabled;
    group.append(button);
  }
  host.append(group);
}

function renderPlaceValueBlocks(host, visualization) {
  if (!visualization || visualization.type !== 'base_ten_place_value_blocks') return;
  const figure = learningElement('section', undefined, 'place-value-guided-visual');
  figure.setAttribute('aria-label', '候選引導練習：位值積木圖');
  figure.append(learningElement('h4', '先觀察每一組積木', 'place-value-visual-title'));
  const groups = learningElement('div', undefined, 'place-value-block-groups');
  for (const item of visualization.groups) {
    const card = learningElement('article', undefined, 'place-value-block-group');
    card.append(learningElement('h5', item.label));
    card.append(learningElement('p', `${item.quantity} ${item.unitLabel}`, 'place-value-block-count'));
    const blocks = learningElement('div', undefined, `place-value-blocks place-value-blocks--${item.place}`);
    blocks.setAttribute('aria-label', `${item.label}有${item.quantity}${item.unitLabel}`);
    for (let index = 0; index < item.quantity; index += 1) {
      const block = learningElement('span', undefined, `place-value-block place-value-block--${item.shape}`);
      block.setAttribute('aria-hidden', 'true');
      blocks.append(block);
    }
    card.append(blocks);
    groups.append(card);
  }
  figure.append(groups);
  if (visualization.table) {
    const scaffold = learningElement('section', undefined, 'place-value-table-scaffold');
    scaffold.setAttribute('aria-label', '教學支架：位值表，不是獨立檢核');
    scaffold.append(learningElement('p', visualization.note, 'prototype-note'));
    const table = document.createElement('table');
    table.className = 'place-value-table';
    const caption = document.createElement('caption');
    caption.textContent = '位值表教學支架（候選練習）';
    table.append(caption);
    const head = document.createElement('thead');
    const headingRow = document.createElement('tr');
    headingRow.append(document.createElement('th'));
    for (const label of visualization.table.columns) headingRow.append(learningElement('th', label));
    head.append(headingRow);
    table.append(head);
    const body = document.createElement('tbody');
    const countRow = document.createElement('tr');
    countRow.append(learningElement('th', '積木組數', 'place-value-row-heading'));
    for (const digit of visualization.table.digits) countRow.append(learningElement('td', String(digit)));
    body.append(countRow);
    table.append(body);
    scaffold.append(table);
    figure.append(scaffold);
  }
  host.append(figure);
}

function responseClassLabel(responseClass) {
  return ({
    first_try_independent: '首次獨立答對',
    correct_after_hint: '提示後答對',
    correct_after_retry: '重試答對',
    correct_after_remediation: '補強後答對',
    incorrect: '本次答錯（僅是作答線索，不能單獨判定原因）',
  })[responseClass] ?? '作答已記錄於本次記憶體流程';
}

function renderNumberSecretLearningUnit() {
  const session = numberSecretLearningSession;
  if (!session) return;
  showNumberSecretView('number-secret-learning-view');
  const content = document.getElementById('learning-unit-content');
  const actions = document.getElementById('learning-unit-actions');
  const feedback = document.getElementById('learning-unit-feedback');
  const progress = document.getElementById('learning-unit-progress');
  content.replaceChildren();
  actions.replaceChildren();
  feedback.hidden = true;
  feedback.classList.remove('is-wrong');
  feedback.textContent = '';

  const showFeedback = (result) => {
    if (!result) return;
    feedback.hidden = false;
    feedback.classList.toggle('is-wrong', result.correct === false);
    feedback.textContent = result.text;
  };
  const addAction = (...args) => actions.append(learningButton(...args));

  if (session.phase === 'intro') {
    progress.textContent = '學習目標・候選內容';
    content.append(learningElement('h3', '準備探索千位數了嗎？', 'number-secret-question'));
    content.append(learningElement('p', '先認識一個千，再看數字在千位時表示多少。接著會有循序練習、錯誤補強和待教師審查的獨立候選檢核。'));
    content.append(learningElement('p', '這是學習單元原型；檢核結果不會變成正式評量或學習紀錄。', 'prototype-note'));
    addAction('開始學習流程', 'start', 'button button-primary');
    addAction('開啟第二版候選試作（僅開發測試）', 'v2_candidate_start');
  } else if (session.phase === 'lesson') {
    const lesson = NUMBER_SECRET_LEARNING_UNIT.lessonSteps[session.lessonIndex];
    progress.textContent = `概念教學 ${session.lessonIndex + 1} / ${NUMBER_SECRET_LEARNING_UNIT.lessonSteps.length}`;
    if (session.lessonIndex === 0) {
      content.append(learningElement('p', '本活動目標（候選／待教師審查）：理解一個千的數量，並辨認數字在千位時表示幾個千。'));
    }
    content.append(learningElement('h3', lesson.title, 'number-secret-question'));
    content.append(learningElement('p', lesson.text));
    const visual = learningElement('div', undefined, 'thousand-visual');
    visual.setAttribute('aria-label', `${lesson.visualThousands} 個千，每個代表 1,000`);
    for (let index = 0; index < lesson.visualThousands; index += 1) {
      visual.append(learningElement('span', '1,000', 'thousand-block'));
    }
    content.append(visual);
    content.append(learningElement('p', '這是本機示範教學圖，不代表已完成教材或教師審查。', 'prototype-note'));
    addAction(session.lessonIndex === NUMBER_SECRET_LEARNING_UNIT.lessonSteps.length - 1 ? '開始循序練習' : '下一步', 'lesson_next', 'button button-primary');
  } else if (['practice', 'practice_retry', 'practice_feedback', 'practice_answered'].includes(session.phase)) {
    const question = NUMBER_SECRET_LEARNING_UNIT.practiceQuestions[session.practiceIndex];
    const isBlockCandidate = question.id === 'DRAFT-M3-NUM-01-01';
    progress.textContent = isBlockCandidate
      ? '候選引導練習・待教師審查'
      : `循序練習 ${session.practiceIndex + 1} / ${NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.length}・候選示範題`;
    content.append(learningElement('h3', question.prompt, 'number-secret-question'));
    if (question.visualization) renderPlaceValueBlocks(content, question.visualization);
    renderLearningOptions(content, question, 'practice_answer', ['practice_feedback', 'practice_answered'].includes(session.phase));
    const latestAttempt = session.practiceAttempts.at(-1);
    if (isBlockCandidate && latestAttempt?.questionId === question.id) content.append(learningElement('p', `本次回饋分類：${responseClassLabel(latestAttempt.responseClass)}。這是候選引導練習，不代表教師核准或學習目標達成。`, 'prototype-note'));
    if (session.currentHintVisible) content.append(learningElement('p', question.hint, 'learning-unit-hint'));
    if (session.phase === 'practice_feedback') {
      showFeedback(session.lastFeedback);
      addAction('直接再試一次', 'retry');
      addAction('看提示再試', 'hint');
      addAction('做對應補強', 'remediation_start', 'button button-primary');
    } else if (session.phase === 'practice_answered') {
      showFeedback(session.lastFeedback);
      addAction(session.practiceIndex === NUMBER_SECRET_LEARNING_UNIT.practiceQuestions.length - 1 ? '進入獨立候選檢核' : '下一題', 'practice_next', 'button button-primary');
    } else {
      if (!session.currentHintVisible) addAction('顯示提示', 'hint');
    }
  } else if (session.phase === 'remediation' || session.phase === 'remediation_retry' || session.phase === 'remediation_feedback' || session.phase === 'remediation_complete') {
    const activity = NUMBER_SECRET_LEARNING_UNIT.reinforcementActivities.find((item) => item.activityId === session.remediationActivityId);
    progress.textContent = `補強活動・${activity.title}・候選內容`;
    content.append(learningElement('h3', activity.prompt, 'number-secret-question'));
    if (activity.visualization) renderPlaceValueBlocks(content, activity.visualization);
    renderLearningOptions(content, activity, 'remediation_answer', ['remediation_feedback', 'remediation_complete'].includes(session.phase));
    if (session.currentHintVisible) content.append(learningElement('p', activity.hint, 'learning-unit-hint'));
    if (session.phase === 'remediation_feedback') {
      showFeedback(session.lastFeedback);
      addAction('再試一次', 'retry');
      addAction('看提示', 'hint');
    } else if (session.phase === 'remediation_complete') {
      showFeedback(session.lastFeedback);
      addAction('回到原活動', 'remediation_continue', 'button button-primary');
    } else if (session.phase === 'remediation') addAction('顯示提示', 'hint');
  } else if (session.phase === 'check_intro') {
    progress.textContent = '獨立候選檢核・新一輪作答';
    content.append(learningElement('h3', '準備好自己判讀了嗎？', 'number-secret-question'));
    content.append(learningElement('p', '這三題是待教師審查的檢核設計候選，不是正式學習檢核。作答時不提供提示。'));
    addAction('開始獨立候選檢核', 'check_start', 'button button-primary');
    if (session.checkResults.length) addAction('查看本輪回顧', 'review');
  } else if (session.phase === 'check' || session.phase === 'check_result') {
    if (session.phase === 'check') {
      const question = NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions[session.checkIndex];
      progress.textContent = `獨立候選檢核 ${session.checkIndex + 1} / ${NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions.length}・不提供提示`;
      content.append(learningElement('h3', question.prompt, 'number-secret-question'));
      renderLearningOptions(content, question, 'check_answer', session.checkAnswered);
      if (session.checkAnswered) {
        showFeedback(session.lastFeedback);
        addAction(session.checkIndex === NUMBER_SECRET_LEARNING_UNIT.candidateCheckQuestions.length - 1 ? '查看候選檢核結果' : '下一題', 'check_next', 'button button-primary');
      }
    } else {
      const check = session.checkResults.at(-1);
      const responseCounts = check.responseCounts;
      progress.textContent = `候選檢核結果 ${check.correctCount} / ${check.total}；這不是正式通過判定`;
      content.append(learningElement('h3', check.correctCount === check.total ? '這輪候選題都答對了！' : '有些概念可以再練習', 'number-secret-question'));
      content.append(learningElement('p', '正式學習檢核與學習目標達成：尚未評估。'));
      content.append(learningElement('p', `本輪作答分類：首次獨立答對 ${responseCounts.firstTryIndependentCorrect} 次；提示後答對 ${responseCounts.correctAfterHint} 次；重試答對 ${responseCounts.correctAfterRetry} 次；答錯 ${responseCounts.incorrect} 次。候選檢核不提供提示或同輪重答。`));
      showFeedback(session.lastFeedback);
      for (const errorType of check.failedErrorTypes) {
        const remediate = learningButton('練習對應補強', 'remediation_start');
        remediate.dataset.errorType = errorType;
        actions.append(remediate);
      }
      addAction('重新檢核', 'check_retry');
      addAction('看單元回顧', 'review', 'button button-primary');
    }
  } else if (session.phase === 'review') {
    const summary = summarizeNumberSecretLearningSession(session);
    const check = summary.checkResult;
    progress.textContent = '單元回顧・本次原型活動';
    content.append(learningElement('h3', '完成一次學習流程', 'number-secret-question'));
    content.append(learningElement('p', `原題練習 ${summary.practiceSummary.attemptCount} 次：首次獨立答對 ${summary.practiceSummary.firstTryIndependentCorrect} 次、提示後答對 ${summary.practiceSummary.correctAfterHint} 次、重試答對 ${summary.practiceSummary.correctAfterRetry} 次、補強後答對 ${summary.practiceSummary.correctAfterRemediation} 次、答錯 ${summary.practiceSummary.incorrectAttempts} 次。`));
    content.append(learningElement('p', `補強題作答 ${summary.reinforcementSummary.attemptCount} 次：首次獨立答對 ${summary.reinforcementSummary.firstTryIndependentCorrect} 次、提示後答對 ${summary.reinforcementSummary.correctAfterHint} 次、重試答對 ${summary.reinforcementSummary.correctAfterRetry} 次、答錯 ${summary.reinforcementSummary.incorrectAttempts} 次。練習與補強總計 ${summary.practiceAndReinforcementTotal} 次；以上皆非正式精熟判定。`));
    content.append(learningElement('p', `獨立候選檢核作答 ${summary.candidateCheckAttemptCount} 次，其中答錯 ${summary.candidateCheckIncorrect} 次；僅作本機原型回顧。`));
    content.append(learningElement('p', check ? `最近一輪候選檢核：${check.correctCount} / ${check.total}。` : '尚未完成候選檢核。'));
    content.append(learningElement('p', '正式檢核：尚未評估。學習目標達成：尚未評估。遊戲完成不代表章節學會。'));
    if (check?.failedErrorTypes.length) {
      const nextActivity = NUMBER_SECRET_LEARNING_UNIT.reinforcementActivities.find((item) => item.errorType === check.failedErrorTypes[0]);
      if (nextActivity) content.append(learningElement('p', `下一步建議：可以先做「${nextActivity.title}」，再開新一輪候選檢核。`));
    } else if (check && check.correctCount === check.total) {
      content.append(learningElement('p', '下一步建議：和教師一起檢視不同表示方式、0 佔位與新情境是否適合納入後續學習。'));
    } else content.append(learningElement('p', '下一步建議：可回到概念教學或重新練習，再由教師確認適切的後續活動。'));
    content.append(learningElement('h4', '各方向覆蓋盤點'));
    const gaps = learningElement('ul');
    for (const gap of summary.coverageGaps) gaps.append(learningElement('li', `${gap.title}（${gap.status}）`));
    content.append(gaps);
    addAction('再練一次', 'restart', 'button button-primary');
    addAction('返回探索', 'close');
  }
}

function startNumberSecretLearningUnit() {
  if (!canStartNumberSecret(mapProgress.completedMissionIds)) {
    explorationMessage = '先走到數字石碑旁互動，才能開始這項任務。';
    renderExploration();
    closeNumberSecret();
    return;
  }
  numberSecretLearningSession = createNumberSecretLearningSession();
  renderNumberSecretLearningUnit();
}

function handleLearningUnitAction(event) {
  const button = event.target.closest('[data-learning-action]');
  if (!button || !numberSecretLearningSession) return;
  const action = button.dataset.learningAction;
  if (action === 'v2_candidate_start') {
    numberSecretV2CandidateSession = createNumberSecretV2CandidateSession();
    renderNumberSecretV2Candidate();
    return;
  }
  if (numberSecretV2CandidateSession) {
    if (action === 'v2_candidate_back') {
      numberSecretV2CandidateSession = null;
      renderNumberSecretLearningUnit();
      return;
    }
    if (action === 'v2_candidate_export') {
      const exported = downloadNumberSecretV2TeacherExport(numberSecretV2CandidateSession);
      const status = document.getElementById('v2-candidate-export-status');
      if (status) status.textContent = exported
        ? '已匯出此匿名候選測試資料；檔案位於本機下載位置，不會上傳或寫入正式進度。'
        : '尚未完成候選試作，不能匯出結果。';
      return;
    }
    if (action === 'v2_candidate_log_issue') {
      const issueCode = document.getElementById('v2-candidate-technical-issue')?.value;
      if (issueCode) dispatchNumberSecretV2CandidateAction('technical_issue', { issueCode });
      return;
    }
    const payload = {
      optionId: button.dataset.optionId,
      submissionId: `${numberSecretV2CandidateSession.sessionId}:ui:${numberSecretV2CandidateSession.attemptSequence + 1}`,
    };
    const candidateAction = ({
      v2_candidate_answer: 'answer',
      v2_candidate_next: 'next',
      v2_candidate_restart: 'restart',
      hint: 'hint',
      v2_candidate_retry: 'retry',
    })[action];
    if (candidateAction) dispatchNumberSecretV2CandidateAction(candidateAction, payload);
    return;
  }
  if (action === 'close') {
    closeNumberSecret();
    return;
  }
  const payload = {
    optionId: button.dataset.optionId,
    errorType: button.dataset.errorType,
    submissionId: `${numberSecretLearningSession.sessionId}:ui:${numberSecretLearningSession.attemptSequence + 1}`,
  };
  dispatchLearning(action, payload);
}

function renderQuestion() {
  const questions = activeLevel.questionSet.questions;
  const question = questions[game.questionIndex];
  document.getElementById('question-title').textContent = activeLevel.title;
  document.getElementById('question-eyebrow').textContent = activeLevel.reviewStatus === 'pending_teacher_review'
    ? '待教師審核的示範題・非正式題庫'
    : '原型示範題・非正式題庫';
  document.getElementById('question-prompt').textContent = question.prompt;
  document.getElementById('score-value').textContent = String(game.score);
  document.getElementById('progress-label').textContent = `第 ${game.questionIndex + 1} 題，共 ${questions.length} 題`;
  document.getElementById('progress-fill').style.width = `${(game.questionIndex / questions.length) * 100}%`;
  progress.setAttribute('aria-valuemax', String(questions.length));
  progress.setAttribute('aria-valuenow', String(game.questionIndex));
  feedback.hidden = true;
  feedback.classList.remove('is-wrong');
  document.getElementById('continue-button').hidden = true;
  questionHint.textContent = question.hint ?? '';
  questionHint.hidden = true;
  questionHintButton.hidden = !question.hint;
  optionsHost.replaceChildren();
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-option';
    button.dataset.optionId = option.optionId;
    const shortcut = document.createElement('span');
    shortcut.className = 'choice-key';
    shortcut.textContent = String(index + 1);
    button.append(shortcut, document.createTextNode(option.text));
    button.addEventListener('click', () => chooseAnswer(option.optionId));
    optionsHost.append(button);
  });
  questionHintButton.onclick = () => {
    questionHint.hidden = false;
    questionHintButton.disabled = true;
  };
}

function chooseAnswer(optionId) {
  const questions = activeLevel.questionSet.questions;
  const question = questions[game.questionIndex];
  const result = submitAnswer(game, question, optionId);
  if (!result.changed) return;
  game = result.state;
  const answerReward = activeLevel.correctAnswerReward;
  const newlyCompleted = result.isCorrect && answerReward?.type === 'mission_event'
    ? recordMissionEvent(answerReward.event, answerReward.evidence)
    : [];
  if (newlyCompleted.length > 0) persistAndRenderProgress();
  for (const button of optionsHost.querySelectorAll('button')) {
    button.disabled = true;
    if (button.dataset.optionId === question.answerId) button.classList.add('is-correct');
    else if (button.dataset.optionId === optionId) button.classList.add('is-wrong');
  }
  feedback.hidden = false;
  feedback.classList.toggle('is-wrong', !result.isCorrect);
  document.getElementById('feedback-icon').textContent = result.isCorrect ? '🌟' : '💡';
  document.getElementById('feedback-title').textContent = result.isCorrect ? '答對了！得到一顆星！' : '再想一想，看看解析吧！';
  const correctOption = question.options.find((option) => option.optionId === question.answerId);
  document.getElementById('answer-explanation').textContent = result.isCorrect
    ? question.explanation
    : `正確答案是「${correctOption.text}」。${question.explanation}`;
  document.getElementById('score-value').textContent = String(game.score);
  const continueButton = document.getElementById('continue-button');
  continueButton.textContent = !result.isCorrect ? '重新作答 ↻' : game.questionIndex === questions.length - 1 ? '完成探險 ★' : '下一題 ➜';
  continueButton.hidden = false;
  continueButton.focus();
  showMissionToast(newlyCompleted);
}

function continueGame() {
  if (game.answered && game.lastAnswerCorrect === false) {
    game = retryLevelQuestion(game);
    renderQuestion();
    return;
  }
  const questionCount = activeLevel.questionSet.questions.length;
  game = advanceQuestion(game, questionCount);
  if (game.complete) {
    document.getElementById('progress-fill').style.width = '100%';
    progress.setAttribute('aria-valuenow', String(questionCount));
    mapProgress = activeLevel.id === DEMO_LEVEL_ID
      ? recordDemoCompletion(mapProgress, game.score)
      : recordLevelCompletion(mapProgress, activeLevel.id, game.score);
    const reward = activeLevel.completionReward;
    const newlyCompleted = reward?.type === 'mission_event'
      ? recordMissionEvent(reward.event, reward.evidence)
      : [];
    persistAndRenderProgress();
    const bestStars = mapProgress.completedLevels[activeLevel.id]?.bestStars ?? game.score;
    document.getElementById('complete-title').textContent = `${activeLevel.title}完成了！`;
    document.getElementById('completion-score').textContent = `本次答對 ${game.score} / ${questionCount} 題；本機最佳 ${bestStars} / ${questionCount} 題。星星只作為遊戲回饋。`;
    document.getElementById('completion-message').textContent = game.score === questionCount
      ? '太棒了！每一道題目都答對了，繼續保持好奇心！'
      : '完成任務就是很棒的開始！你可以再挑戰一次，看看能不能收集更多星星。';
    showScreen('complete');
    showMissionToast(newlyCompleted);
    return;
  }
  renderQuestion();
  document.getElementById('question-prompt').focus?.();
}

document.getElementById('level-start-button').addEventListener('click', startExploration);
document.getElementById('curriculum-picker-button').addEventListener('click', () => {
  renderCurriculumGamePicker();
  showScreen('curriculum-game');
});
document.getElementById('picker-grade').addEventListener('change', (event) => {
  curriculumPickerSelection.gradeId = event.currentTarget.value;
  curriculumPickerSelection.subjectId = '';
  curriculumPickerSelection.semesterId = '';
  curriculumPickerSelection.learningObjectiveId = '';
  curriculumPickerSelection.challengeMode = '';
  renderCurriculumGamePicker();
});
document.getElementById('picker-subject').addEventListener('change', (event) => {
  curriculumPickerSelection.subjectId = event.currentTarget.value;
  curriculumPickerSelection.semesterId = '';
  curriculumPickerSelection.learningObjectiveId = '';
  curriculumPickerSelection.challengeMode = '';
  renderCurriculumGamePicker();
});
document.getElementById('picker-semester').addEventListener('change', (event) => {
  curriculumPickerSelection.semesterId = event.currentTarget.value;
  curriculumPickerSelection.learningObjectiveId = '';
  curriculumPickerSelection.challengeMode = '';
  renderCurriculumGamePicker();
});
document.getElementById('picker-objective').addEventListener('change', (event) => {
  curriculumPickerSelection.learningObjectiveId = event.currentTarget.value;
  curriculumPickerSelection.challengeMode = '';
  renderCurriculumGamePicker();
});
document.getElementById('picker-challenge').addEventListener('change', (event) => {
  curriculumPickerSelection.challengeMode = event.currentTarget.value;
  renderCurriculumGamePicker();
});
document.getElementById('start-quiz-button').addEventListener('click', () => startGame());
document.querySelectorAll('[data-move]').forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    if (button.disabled || screens.explore.hidden || !document.getElementById('number-secret-panel').hidden) return;
    event.preventDefault();
    heldDirectionButton = button;
    try { button.setPointerCapture(event.pointerId); } catch { /* Some synthetic pointer events do not support capture. */ }
    movementHoldController.start(button.dataset.move);
  });
  const stopHeldMovement = (event) => {
    if (heldDirectionButton !== button) return;
    if (event?.pointerId !== undefined) {
      try { if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId); } catch { /* Pointer capture may already be released. */ }
    }
    movementHoldController.stop();
    heldDirectionButton = null;
    suppressedDirectionClickButton = button;
    window.clearTimeout(suppressedDirectionClickTimer);
    suppressedDirectionClickTimer = window.setTimeout(() => { suppressedDirectionClickButton = null; }, 500);
  };
  button.addEventListener('pointerup', stopHeldMovement);
  button.addEventListener('pointercancel', stopHeldMovement);
  button.addEventListener('lostpointercapture', stopHeldMovement);
  button.addEventListener('click', () => {
    if (suppressedDirectionClickButton === button) {
      suppressedDirectionClickButton = null;
      window.clearTimeout(suppressedDirectionClickTimer);
      return;
    }
    moveExplorerInScene(button.dataset.move);
  });
});
window.addEventListener('blur', () => {
  movementHoldController.stop();
  heldDirectionButton = null;
});
document.getElementById('explore-guide-dismiss').addEventListener('click', () => {
  explorationGuideDismissed = true;
  document.getElementById('explore-control-guide').hidden = true;
});
document.querySelectorAll('[data-object-id]').forEach((button) => {
  button.addEventListener('click', () => interactWithNearbyObject(button.dataset.objectId));
});
document.getElementById('interact-button').addEventListener('click', () => interactWithNearbyObject());
document.getElementById('number-secret-close').addEventListener('click', closeNumberSecret);
document.getElementById('number-secret-finish').addEventListener('click', closeNumberSecret);
document.getElementById('number-secret-start').addEventListener('click', startNumberSecretChallenge);
document.getElementById('number-secret-learning-start').addEventListener('click', startNumberSecretLearningUnit);
document.getElementById('number-secret-retry').addEventListener('click', startNumberSecretChallenge);
document.getElementById('number-secret-next').addEventListener('click', nextNumberSecretQuestion);
document.getElementById('learning-unit-actions').addEventListener('click', handleLearningUnitAction);
document.getElementById('learning-unit-content').addEventListener('click', handleLearningUnitAction);
document.getElementById('comparison-learning-unit-panel').addEventListener('click', handleComparisonLearningAction);
document.getElementById('capacity-learning-unit-panel').addEventListener('click', handleCapacityLearningAction);
document.getElementById('integer-number-line-learning-unit-panel').addEventListener('click', handleIntegerNumberLineLearningAction);
document.getElementById('millimeter-ruler-learning-unit-panel').addEventListener('click', handleMillimeterRulerLearningAction);
document.getElementById('weight-kg-g-learning-unit-panel').addEventListener('click', handleWeightKgGLearningAction);
document.getElementById('square-centimeter-area-learning-unit-panel').addEventListener('click', handleSquareCentimeterAreaLearningAction);
document.getElementById('fraction-treasure-learning-unit-panel').addEventListener('click', handleFractionTreasureLearningAction);
document.getElementById('addition-subtraction-learning-unit-panel').addEventListener('click', handleAdditionSubtractionLearningAction);
document.querySelectorAll('[data-go="home"]').forEach((button) => button.addEventListener('click', () => showScreen('home')));
document.querySelectorAll('[data-go="select"]').forEach((button) => button.addEventListener('click', () => {
  if (button.closest('#catalog-task-screen, #math-data-quest-screen') && (activeCandidateRouteContext?.kind === 'grade3-math-adventure-map' || activeCandidateRouteContext?.routeId === GRADE3_MATH_REPAIR_MAINLINE.routeId)) {
    returnToGrade3MathAdventureMap();
    return;
  }
  renderGradeSelection(); showScreen('select');
}));
document.getElementById('continue-button').addEventListener('click', continueGame);
document.getElementById('retry-button').addEventListener('click', () => startGame(activeLevel));
document.getElementById('choose-again-button').addEventListener('click', () => showScreen('select'));
document.getElementById('capacity-return').addEventListener('click', () => showScreen('select'));
document.getElementById('capacity-guide-start').addEventListener('click', () => {
  capacityOnboarding.startPractice();
  startCapacityObservation('practice');
});
document.getElementById('capacity-guide-skip').addEventListener('click', () => {
  capacityOnboarding.skip();
  showCapacityModeSelect();
});
document.getElementById('capacity-choose-refill').addEventListener('click', startCapacityRefill);
document.getElementById('capacity-choose-practice').addEventListener('click', () => startCapacityObservation('practice'));
document.getElementById('capacity-choose-challenge').addEventListener('click', () => startCapacityObservation('challenge'));
document.getElementById('capacity-refill-mode-button').addEventListener('click', startCapacityRefill);
document.getElementById('capacity-observation-mode-button').addEventListener('click', () => startCapacityObservation(activeCapacityObservationMode));
document.getElementById('capacity-slider').addEventListener('input', (event) => {
  capacityMission.setWaterMl(Number(event.currentTarget.value));
  renderCapacityMission();
});
document.getElementById('capacity-minus').addEventListener('click', () => {
  capacityMission.adjustWaterMl(-CAPACITY_MISSION_CONFIG.adjustmentStepMl);
  renderCapacityMission();
});
document.getElementById('capacity-plus').addEventListener('click', () => {
  capacityMission.adjustWaterMl(CAPACITY_MISSION_CONFIG.adjustmentStepMl);
  renderCapacityMission();
});
document.getElementById('capacity-confirm').addEventListener('click', () => {
  const result = capacityMission.confirm();
  setCapacityFeedback(result);
  renderCapacityMission();
});
document.getElementById('capacity-restart').addEventListener('click', () => {
  capacityMission.restart();
  const feedback = document.getElementById('capacity-feedback');
  feedback.classList.remove('is-success', 'is-hint');
  feedback.textContent = '任務已重新開始，調整水量後再確認。';
  renderCapacityMission();
});
document.getElementById('observation-toggle-amount').addEventListener('click', () => {
  const state = capacityObservation.getState();
  capacityObservation.setAmountHidden(!state.amountHidden);
  renderCapacityObservation();
});
document.getElementById('observation-check').addEventListener('click', () => {
  const result = capacityObservation.submitAnswer();
  if (result.changed) renderCapacityObservation();
});
document.getElementById('observation-next').addEventListener('click', () => {
  capacityObservation.nextScenario();
  renderCapacityObservation();
});
document.getElementById('observation-restart').addEventListener('click', () => {
  capacityObservation.restart();
  renderCapacityObservation();
});
document.getElementById('observation-back-to-modes').addEventListener('click', showCapacityModeSelect);
document.getElementById('observation-review-retry').addEventListener('click', () => {
  capacityObservation.restart();
  renderCapacityObservation();
});
document.getElementById('observation-review-map').addEventListener('click', () => showScreen('select'));
document.getElementById('observation-review-modes').addEventListener('click', showCapacityModeSelect);

document.addEventListener('keydown', (event) => {
  if (!screens.explore.hidden) {
    const key = event.key.toLowerCase();
    if (!document.getElementById('number-secret-panel').hidden) {
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e'].includes(key)) event.preventDefault();
      return;
    }
    const direction = MOVEMENT_KEYS[key];
    if (direction) {
      event.preventDefault();
      moveExplorerInScene(direction);
      return;
    }
    if (key === 'e' && !event.target.closest('input, textarea, select, [contenteditable="true"]')) {
      event.preventDefault();
      interactWithNearbyObject();
    }
    return;
  }
  if (screens.game.hidden || game.answered || !/^[1-4]$/.test(event.key)) return;
  const button = optionsHost.querySelectorAll('button')[Number(event.key) - 1];
  button?.click();
});

showScreen('home');
