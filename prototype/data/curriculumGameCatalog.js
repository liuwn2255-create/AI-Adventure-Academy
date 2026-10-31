/**
 * Projection for the student-facing curriculum game picker.
 * Curriculum statements and approval remain owned by curriculum/*.json.
 * This is a single candidate prototype entry, not a formal course catalog.
 */
export const CURRICULUM_GAME_CATALOG = Object.freeze([
  Object.freeze({
    gameId: 'picker-prototype-number-secret',
    levelId: 'number-secret-challenge',
    title: '千位數的秘密',
    gradeId: 'grade-3',
    subjectId: 'mathematics',
    semesterIds: Object.freeze([]),
    semesterAssignmentStatus: 'pending_school_and_textbook_evidence',
    topicId: 'topic-m3-number-place-value-candidate',
    topicTitle: '數與位值',
    curriculumItemIds: Object.freeze(['math-number-place-value-m3-num-01']),
    curriculumItemReferenceType: 'curriculum_map_id',
    curriculumCodeRefs: Object.freeze([
      Object.freeze({ code: 'N-3-1', codeType: 'learning_content', scopeLabel: '三年級學習內容；全年進度仍待確認' }),
      Object.freeze({ code: 'n-II-1', codeType: 'learning_performance', scopeLabel: '第二學習階段表現；不代表三年級單獨進度' }),
    ]),
    learningObjectiveIds: Object.freeze([
      'LO-M3-NUM-PLACE-VALUE-01',
      'LO-M3-NUM-PLACE-VALUE-02',
      'LO-M3-NUM-PLACE-VALUE-03',
    ]),
    learningObjectiveSummaries: Object.freeze([
      Object.freeze({ id: 'LO-M3-NUM-PLACE-VALUE-01', text: '在 3,000 中辨認數字 3 位於千位，並說出它表示 3 個千。' }),
      Object.freeze({ id: 'LO-M3-NUM-PLACE-VALUE-02', text: '將 4 個千的數量表徵連結為數字 4,000。' }),
      Object.freeze({ id: 'LO-M3-NUM-PLACE-VALUE-03', text: '把 2,000 與 500 合成 2,500。' }),
    ]),
    prerequisiteIds: Object.freeze([]),
    prerequisiteStatus: 'not_assessed',
    assessmentIds: Object.freeze([]),
    developmentStatus: 'prototype_exists',
    reviewStatus: 'pending_teacher_review',
    publicationStatus: 'not_approved',
    formalUnitStatus: 'candidate',
    supportedChallengeModes: Object.freeze(['sequential_challenge']),
    entryRoute: Object.freeze({
      kind: 'existing_map_route',
      targetScreen: 'select',
      nextStep: '進入數字島、完成石碑互動，再由既有學習單元流程開始',
      unlockMissionId: 'task-find-number-obelisk',
      directLaunch: false,
    }),
    questionCount: 3,
    questionStatus: 'candidate_practice_pending_teacher_review',
  }),
]);

export const PICKER_CHALLENGE_MODES = Object.freeze([
  Object.freeze({ id: 'basic_practice', label: '基礎練習' }),
  Object.freeze({ id: 'sequential_challenge', label: '依序挑戰' }),
  Object.freeze({ id: 'advanced_challenge', label: '進階挑戰' }),
]);
