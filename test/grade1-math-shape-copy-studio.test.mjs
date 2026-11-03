import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE1_SHAPE_COPY_STUDIO as activity } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { isLowGradeReadingAssistanceEnabled, renderStudentText } from '../prototype/studentTextRenderer.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const rendererStart = app.indexOf('function renderReusableCandidateTask(');
const rendererEnd = app.indexOf('\nfunction renderCandidateRoutes(', rendererStart);
const renderer = app.slice(rendererStart, rendererEnd);
const composePronunciationStart = app.indexOf('const COMPOSE_SHAPE_UI_PRONUNCIATION = Object.freeze({');
const composePronunciationEnd = app.indexOf('\n});\n\nfunction composeShapeUiPronunciationTokens', composePronunciationStart);
const lowGradeComposePronunciationSlice = app.slice(composePronunciationStart, composePronunciationEnd + 3);

function assertReviewedPronunciation(text, tokens) {
  assert.ok(Array.isArray(tokens), `pronunciation metadata required for ${text}`);
  assert.equal(tokens.map(({ text: character }) => character).join(''), text, `tokens align with ${text}`);
  for (const token of tokens) {
    if (/\p{Script=Han}/u.test(token.text)) assert.ok(token.reading, `missing reviewed reading for ${token.text} in ${text}`);
    else assert.equal(token.reading, undefined, `non-Han text stays unannotated in ${text}: ${token.text}`);
  }
  assert.match(renderStudentText(text, tokens), /zhuyin-pair/, `existing student text renderer handles ${text}`);
}

function dispatch(session, action, payload) {
  const result = dispatchLearningTask(session, activity, action, payload);
  assert.equal(result.error, undefined, `${action} has no engine error`);
  assert.equal(result.changed, true, `${action} changes the session`);
  return result.session;
}

function startAtStage(stageIndex, sessionId) {
  let session = dispatch(createLearningTaskSession(activity, sessionId), 'start');
  if (stageIndex === 1) {
    for (const pieceId of activity.stages[0].shapeRules.correctPieceIds) {
      session = dispatch(session, 'toggle_shape_piece', { pieceId });
    }
    const submitted = dispatchLearningTask(session, activity, 'submit', { submissionId: `${sessionId}-stage-1` });
    assert.equal(submitted.error, undefined);
    assert.equal(submitted.attempt?.result, 'correct');
    session = dispatch(submitted.session, 'next');
    assert.equal(session.stageIndex, 1);
    assert.equal(activity.stages[session.stageIndex].stageId, 'copy-three-by-two-rectangle');
  }
  return session;
}

test('活動名稱、關卡與格數維持指定的兩種正方形拼板任務', () => {
  assert.equal(activity.activityId, 'ACT-G1-MATH-SHAPE-COPY-STUDIO-CANDIDATE');
  assert.equal(activity.title, '格子拼拼板：用正方形填滿格子');
  assert.equal(activity.gradeId, 'grade-1');
  assert.equal(activity.subjectId, 'mathematics');
  assert.deepEqual(activity.stages.map(({ stageId, interaction }) => [stageId, interaction]), [
    ['copy-two-by-two-square', 'compose_shape'],
    ['copy-three-by-two-rectangle', 'compose_shape'],
  ]);
  assert.deepEqual(activity.stages.map(({ shapeRules }) => [shapeRules.rows, shapeRules.columns]), [[2, 2], [3, 2]]);
  assert.deepEqual(activity.stages.map(({ shapeRules }) => shapeRules.correctPieceIds), [
    ['square-a', 'square-b', 'square-c', 'square-d'],
    ['tile-a', 'tile-b', 'tile-c', 'tile-d', 'tile-e', 'tile-f'],
  ]);
  for (const stage of activity.stages) {
    assert.equal(stage.shapeRules.correctPieceOrder, undefined);
    assert.equal(stage.requiredSelectionCount, undefined);
  }
  assert.deepEqual(validateLearningTask(activity), []);
});

test('兩關題目、提示、正誤回饋及拼片標籤都有對齊的人工注音', () => {
  assert.deepEqual(activity.stages.map(({ prompt }) => prompt), [
    '拼圖板有 2 排，每排 2 格。選 4 片正方形，把格子填滿。',
    '拼圖板有 3 排，每排 2 格。選 6 片正方形，把格子填滿。',
  ]);
  for (const stage of activity.stages) {
    assertReviewedPronunciation(stage.prompt, stage.promptPronunciationTokens);
    assertReviewedPronunciation(stage.studentOperationGuidance, stage.studentOperationGuidancePronunciationTokens);
    for (const hint of stage.hints) assertReviewedPronunciation(hint.text, hint.pronunciationTokens);
    assertReviewedPronunciation(stage.correctFeedback, stage.correctFeedbackPronunciationTokens);
    assertReviewedPronunciation(stage.incorrectFeedback, stage.incorrectFeedbackPronunciationTokens);
    for (const piece of stage.pieces) assertReviewedPronunciation(piece.label, piece.pronunciationTokens);
    assert.match(stage.prompt, /[2346]/u);
    assert.ok(stage.pieces.some(({ label }) => /\b[A-F]\b/u.test(label)) || stage.stageId === 'copy-two-by-two-square');
  }
  assert.equal(activity.stages[0].incorrectFeedback, '再看一次。每一格都要放正方形，不要放三角形。');
  assert.equal(activity.stages[1].incorrectFeedback, activity.stages[0].incorrectFeedback);
  assert.equal(activity.stages[0].correctFeedback, '答對了！你用 4 片正方形把格子填滿了。');
  assert.equal(activity.stages[1].correctFeedback, '答對了！你用 6 片正方形把格子填滿了。');
  assert.equal(activity.stages[0].studentOperationGuidance, '怎麼玩：① 點圖形片放進格子 → ② 點已放的圖形片可以取回 → ③ 填滿後檢查答案');
  assert.equal(activity.stages[1].studentOperationGuidance, activity.stages[0].studentOperationGuidance);
});

test('螢幕模擬限制只保留在教師資料，不混入學生正答回饋', () => {
  const stage = activity.stages[1];
  assert.equal(stage.teacherLimitationNote, '本活動為螢幕模擬，不代表實體拼貼或立體堆疊能力已確認。');
  assert.doesNotMatch(stage.correctFeedback, /螢幕模擬|不代表|已確認/u);
  assert.doesNotMatch(stage.incorrectFeedback, /螢幕模擬|不代表|已確認/u);
});

test('Grade 1–2 compose_shape 依活動 guidance metadata 顯示注音，並保留年級與互動隔離', () => {
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-1'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-2'), true);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-3'), false);
  assert.equal(isLowGradeReadingAssistanceEnabled('grade-6'), false);
  assert.match(renderer, /lowGradeComposeShape = stage\.interaction === 'compose_shape' && isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)/);
  assert.match(renderer, /stage\.studentOperationGuidance \?\? '操作方式：① 操作 → ② 觀察 → ③ 作答'/);
  assert.match(renderer, /lowGradeComposeShape && Array\.isArray\(stage\.studentOperationGuidancePronunciationTokens\)[\s\S]*?appendStudentText\(responseGuidanceNode, responseGuidance, stage\.studentOperationGuidancePronunciationTokens\)/);
  assert.doesNotMatch(renderer, /ACT-G1-MATH-SHAPE-COPY-STUDIO-CANDIDATE/);
  assert.match(renderer, /lowGradeClassifyObservations \? '檢查分類'/);
  assert.match(renderer, /stage\.interaction === 'choose_response' && isLowGradeReadingAssistanceEnabled\(activity\.gradeId\) \? '檢查答案'/);
  assert.match(renderer, /lowGradeComposeShape \? '檢查拼圖'/);
  assert.match(renderer, /else if \(lowGradeComposeShape\) appendComposeShapeUiText\(submit, submitLabel, appendStudentText\)/);
});

test('拼板標題、空格、拼片標籤、進度和完成提示使用低年級文字呈現', () => {
  const composeStart = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'compose_shape')");
  const composeEnd = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'geometry_exploration'", composeStart);
  const composeRenderer = renderer.slice(composeStart, composeEnd);
  assert.ok(composeStart >= 0 && composeEnd > composeStart);
  const lowGradeTitleStart = composeRenderer.indexOf('if (lowGradeComposeShape) {');
  const lowGradeTitleEnd = composeRenderer.indexOf('} else panel.append(element(\'strong\'', lowGradeTitleStart);
  const lowGradeTitle = composeRenderer.slice(lowGradeTitleStart, lowGradeTitleEnd);
  const progressStart = composeRenderer.indexOf("const boardProgress = element('p', 'candidate-shape-progress')");
  const progressEnd = composeRenderer.indexOf('panel.append(boardTitle, boardProgress)', progressStart);
  const progress = composeRenderer.slice(progressStart, progressEnd);
  const emptyStart = composeRenderer.indexOf('else if (lowGradeComposeShape) {');
  const emptyEnd = composeRenderer.indexOf("} else cell.append(element('span', 'geometry-slot-empty'", emptyStart);
  const emptySlot = composeRenderer.slice(emptyStart, emptyEnd);
  const pieceLabelStart = composeRenderer.indexOf("const pieceLabel = element('span', '')");
  const pieceLabelEnd = composeRenderer.indexOf('tile.append(createGeometryPiece(piece), pieceLabel)', pieceLabelStart);
  const pieceLabel = composeRenderer.slice(pieceLabelStart, pieceLabelEnd);
  assert.ok(lowGradeTitleStart >= 0 && lowGradeTitleEnd > lowGradeTitleStart);
  assert.ok(progressStart >= 0 && progressEnd > progressStart);
  assert.ok(emptyStart >= 0 && emptyEnd > emptyStart);
  assert.ok(pieceLabelStart >= 0 && pieceLabelEnd > pieceLabelStart);
  assert.match(lowGradeTitle, /appendComposeShapeUiText\(boardTitle, '拼圖板：'/);
  assert.match(progress, /appendComposeShapeUiText\(boardProgress, '已放 '/);
  assert.match(progress, /appendStudentText\(boardProgress, String\(session\.selection\.length\)\)/);
  assert.match(progress, /appendStudentText\(boardProgress, String\(selectionCount\)\)/);
  assert.match(emptySlot, /appendComposeShapeUiText\(empty, '空格'/);
  assert.match(pieceLabel, /appendStudentText\(pieceLabel, piece\.label, piece\.pronunciationTokens\)/);
  assert.match(composeRenderer, /tile\.setAttribute\('aria-pressed', String\(selected\)\)/);
  assert.match(composeRenderer, /tile\.setAttribute\('aria-label', `\$\{piece\.label\}/);
  assert.match(composeRenderer, /createGeometryPiece\(piece\)/);

  const capacityStart = renderer.indexOf('const composeShapeCapacity =');
  const capacityEnd = renderer.indexOf('const lowGradeClassifyObservations =', capacityStart);
  const capacitySection = renderer.slice(capacityStart, capacityEnd);
  assert.ok(capacityStart >= 0 && capacityEnd > capacityStart);
  assert.match(capacitySection, /stage\.interaction === 'compose_shape'[\s\S]*?stage\.shapeRules\.rows \* stage\.shapeRules\.columns/);
  assert.doesNotMatch(capacitySection, /correctPieceIds|correctPieceOrder/);

  const submitControlStart = renderer.indexOf('const submitLabel =');
  const submitControlEnd = renderer.indexOf('const readinessId =', submitControlStart);
  const submitControlSlice = renderer.slice(submitControlStart, submitControlEnd);
  assert.ok(submitControlStart >= 0 && submitControlEnd > submitControlStart);
  assert.match(submitControlSlice, /submit\.disabled = !hasResponse/);

  const readinessStart = renderer.indexOf('const hasLowGradeComposeProgress =');
  const readinessEnd = renderer.indexOf("if (stage.interaction === 'magnet_interaction'", readinessStart);
  const readinessSection = renderer.slice(readinessStart, readinessEnd);
  assert.ok(readinessStart >= 0 && readinessEnd > readinessStart);
  assert.match(readinessSection, /hasLowGradeComposeProgress = lowGradeComposeShape && Number\.isInteger\(composeShapeCapacity\)/);
  assert.match(readinessSection, /remainingCount = composeShapeCapacity - session\.selection\.length/);
  assert.match(readinessSection, /remainingCount > 0 \? `還要放 \$\{remainingCount\} 片。` : '可以檢查答案了。'/);
  assert.match(readinessSection, /appendComposeShapeUiText\(readiness, '可以檢查答案了。', appendStudentText\)/);
  assert.doesNotMatch(readinessSection, /correctPieceIds|correctPieceOrder/);
  assert.ok(composePronunciationStart >= 0 && composePronunciationEnd > composePronunciationStart);
  for (const [text, reading] of [
    ['拼圖板：', 'ㄆㄧㄣ ㄊㄨˊ ㄅㄢˇ'],
    ['空格', 'ㄎㄨㄥ ㄍㄜˊ'],
    ['還要放 ', 'ㄏㄞˊ ㄧㄠˋ ㄈㄤˋ'],
    [' 片', 'ㄆㄧㄢˋ'],
    ['可以檢查答案了。', 'ㄎㄜˇ ㄧˇ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ ㄌㄜ˙'],
    ['檢查拼圖', 'ㄐㄧㄢˇ ㄔㄚˊ ㄆㄧㄣ ㄊㄨˊ'],
  ]) {
    assert.equal(lowGradeComposePronunciationSlice.includes(`'${text}': '${reading}'`), true, `UI pronunciation is reviewed for ${text}`);
  }
});

test('點選放入與再次點選取回維持原 mechanics，滿板阻擋多選且正確集合不依順序計分', () => {
  for (const [stageIndex, stage] of activity.stages.entries()) {
    const capacity = stage.shapeRules.rows * stage.shapeRules.columns;
    let session = startAtStage(stageIndex, `${stage.stageId}-shape-copy-test`);
    assert.equal(session.phase, 'active');
    assert.equal(activity.stages[session.stageIndex].stageId, stage.stageId);
    const otherStagePieceId = stageIndex === 0 ? 'tile-a' : 'square-a';
    const crossStageAttempt = dispatchLearningTask(session, activity, 'toggle_shape_piece', { pieceId: otherStagePieceId });
    assert.equal(crossStageAttempt.changed, false);
    assert.equal(crossStageAttempt.error, 'invalid_shape_piece');
    assert.deepEqual(crossStageAttempt.session.selection, []);

    session = dispatch(session, 'toggle_shape_piece', { pieceId: stage.shapeRules.correctPieceIds[0] });
    assert.deepEqual(session.selection, [stage.shapeRules.correctPieceIds[0]]);
    session = dispatch(session, 'toggle_shape_piece', { pieceId: stage.shapeRules.correctPieceIds[0] });
    assert.deepEqual(session.selection, []);

    for (const pieceId of [...stage.shapeRules.correctPieceIds].reverse()) {
      session = dispatch(session, 'toggle_shape_piece', { pieceId });
    }
    assert.equal(session.selection.length, capacity);
    const extra = stage.pieces.find(({ id }) => !stage.shapeRules.correctPieceIds.includes(id));
    const fullBoard = dispatchLearningTask(session, activity, 'toggle_shape_piece', { pieceId: extra.id });
    assert.equal(fullBoard.changed, false);
    assert.equal(fullBoard.error, 'shape_target_full');
    assert.equal(fullBoard.session.selection.length, capacity);

    const submitted = dispatchLearningTask(session, activity, 'submit', { submissionId: `${stage.stageId}-correct` });
    assert.equal(submitted.error, undefined);
    assert.equal(submitted.attempt?.result, 'correct');
    assert.equal(submitted.session.phase, 'success');

    let incorrectSession = startAtStage(stageIndex, `${stage.stageId}-triangle-wrong-test`);
    const incorrectIds = [...stage.shapeRules.correctPieceIds.slice(0, capacity - 1), extra.id];
    for (const pieceId of incorrectIds) incorrectSession = dispatch(incorrectSession, 'toggle_shape_piece', { pieceId });
    const incorrectSubmission = dispatchLearningTask(incorrectSession, activity, 'submit', { submissionId: `${stage.stageId}-triangle-wrong` });
    assert.equal(incorrectSubmission.error, undefined);
    assert.equal(incorrectSubmission.attempt?.result, 'incorrect');
  }
});
