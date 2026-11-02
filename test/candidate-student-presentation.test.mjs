import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASKS, CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';
import { getSubjectLaunchableActivities } from '../prototype/data/gradeActivityDirectory.js';
import { createLearningTaskSession, dispatchLearningTask, validateLearningTask } from '../prototype/learningTaskEngine.js';
import { isLowGradeReadingAssistanceEnabled } from '../prototype/studentTextRenderer.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../prototype/styles.css', import.meta.url), 'utf8');
const engine = await readFile(new URL('../prototype/learningTaskEngine.js', import.meta.url), 'utf8');
const rendererStart = app.indexOf('function renderReusableCandidateTask(');
const rendererEnd = app.indexOf('\nfunction renderCandidateRoutes(', rendererStart);
const renderer = app.slice(rendererStart, rendererEnd);

test('候選活動介紹先顯示學生任務、挑戰數與開始按鈕，教師資訊預設收合且資料仍保留', () => {
  const intro = renderer.match(/if \(session\.phase === 'intro'\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(intro, /const introStage = activity\.stages\[0\]/);
  assert.match(intro, /appendStudentText\(summary, introStage\?\.prompt \?\? activity\.instructions/);
  assert.match(intro, /\$\{activity\.stages\.length\} 個挑戰/);
  assert.match(intro, /button\('開始挑戰'/);
  assert.doesNotMatch(intro, /curriculumCodes|curriculumMapId|curriculumScope|openQuestions/);
  assert.match(renderer, /element\('details', 'candidate-teacher-info'\)/);
  assert.match(renderer, /👩‍🏫 教師／課綱資訊/);
  assert.match(renderer, /activity\.status/);
  assert.match(renderer, /activity\.learningObjective\?\.objectiveId/);
  assert.match(renderer, /activity\.curriculumCodes/);
  assert.match(renderer, /activity\.curriculumMapId/);
  assert.match(renderer, /activity\.curriculumScope/);
  assert.match(renderer, /activity\.coverage/);
  assert.match(renderer, /activity\.openQuestions/);
  assert.match(renderer, /候選活動，待教師審查/);
  assert.match(renderer, /尚未審查/);
  assert.match(renderer, /addInfo\('學習目標', activity\.learningObjective\?\.statement\)/);
  assert.match(renderer, /addInfo\('課綱參照'/);
  assert.match(renderer, /課程地圖/);
  assert.match(renderer, /紀錄方式：\$\{persistence\}/);
  assert.match(renderer, /是否代表精熟：/);
  assert.match(renderer, /提示後作答是否視為獨立證據：/);
  assert.doesNotMatch(renderer, /JSON\.stringify\(activity\.evidencePolicy\)/);
  assert.match(renderer, /技術識別（供核對）/);
  assert.match(html, /<details class="reading-quest-note candidate-teacher-info-static"><summary>👩‍🏫 候選流程資訊/);
});

test('低年級組句提示簡化，Grade 3 保留完整提示；學生正答回饋與研究限制分開呈現', () => {
  const grade1 = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G1-CHINESE-SENTENCE-TRAIN-CANDIDATE');
  const stage = grade1.stages.find(({ stageId }) => stageId === 'choose-context-word');
  const grade3Assemble = CATALOG_CANDIDATE_TASKS.find(({ gradeId, stages }) => gradeId === 'grade-3' && stages.some(({ interaction }) => interaction === 'assemble_response'));
  assert.ok(grade3Assemble, 'a Grade 3 assemble_response activity remains available for the regression');
  assert.match(renderer, /stage\.interaction === 'assemble_response'[\s\S]*?isLowGradeReadingAssistanceEnabled\(activity\.gradeId\)[\s\S]*?'怎麼玩：① 點詞卡 → ② 排成一句話 → ③ 檢查答案'[\s\S]*?'操作方式：① 看清楚題目 → ② 依順序點選內容 → ③ 檢查「我的答案」 → ④ 完成後檢查答案'/);
  assert.equal(grade1.gradeId, 'grade-1');
  assert.equal(grade3Assemble.gradeId, 'grade-3');
  assert.equal(isLowGradeReadingAssistanceEnabled(grade1.gradeId), true);
  assert.equal(isLowGradeReadingAssistanceEnabled(grade3Assemble.gradeId), false);
  assert.equal(stage.studentCorrectFeedback, '你依情境選出合適詞語。');
  assert.doesNotMatch(stage.studentCorrectFeedback, /不能代表第一學習階段/u);
  assert.equal(stage.teacherLimitationNote, '這是少量原創詞句練習，不能代表第一學習階段識字或寫作整體表現。');
  assert.ok(stage.correctFeedbackPronunciationTokens.length > 0);
  assert.equal(stage.correctFeedbackPronunciationTokens.slice(0, Array.from(stage.studentCorrectFeedback).length).map(({ text }) => text).join(''), stage.studentCorrectFeedback);
  assert.equal(stage.correctOptionIds[0], 'word-umbrella');
  assert.ok(renderer.includes('stage.studentCorrectFeedback') && renderer.includes('stage.correctFeedbackPronunciationTokens?.slice'), 'student feedback uses the existing pronunciation token prefix for its shortened display');
});

test('挑戰畫面以任務提示和互動方式為主，材料分類進度取自觀察數與 assignments', () => {
  const materialActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE');
  const materialStage = materialActivity.stages.find(({ stageId }) => stageId === 'sort-absorption');
  assert.equal(materialStage.interaction, 'classify_observations');
  assert.equal(materialStage.observations.length, 3);
  assert.deepEqual(materialStage.correctAssignments, { cloth: 'absorbs', plastic: 'stays', paper: 'absorbs' });
  assert.match(renderer, /const studentPrompt = element\('p', 'reading-stage-prompt candidate-student-task', '這一關要做什麼：'\)/);
  assert.match(renderer, /appendStudentText\(studentPrompt, stage\.prompt, stage\.promptPronunciationTokens\)/);
  assert.match(renderer, /這是單選題，請選 1 個答案/);
  assert.match(renderer, /這是複選題，請選 \$\{answerCount\} 個答案/);
  assert.match(renderer, /操作方式：① 看觀察紀錄 → ② 選擇分類/);
  const progressStart = renderer.indexOf('const classificationProgress =');
  const progressEnd = renderer.indexOf('if (stage.deriveFromPrevious', progressStart);
  const progressSection = renderer.slice(progressStart, progressEnd);
  assert.ok(progressStart >= 0 && progressEnd > progressStart);
  assert.match(progressSection, /completedCount:[\s\S]*?session\.assignments\?\.\[id\]/);
  assert.match(progressSection, /totalCount: stage\.observations\.length/);
  assert.match(progressSection, /作答進度：\$\{classificationProgress\.completedCount\} \/ \$\{classificationProgress\.totalCount\}/);
  const activeFlowStart = renderer.lastIndexOf("\n  if (session.phase === 'active') {");
  const feedbackStart = renderer.indexOf("\n  const success = session.phase === 'success';", activeFlowStart);
  assert.ok(activeFlowStart >= 0 && feedbackStart > activeFlowStart, 'active flow must have an explicit boundary before feedback rendering');
  const activeFlow = renderer.slice(activeFlowStart, feedbackStart);
  assert.doesNotMatch(activeFlow, /reading-task-feedback/);
  const taskPromptIndex = renderer.indexOf("const studentPrompt = element('p', 'reading-stage-prompt candidate-student-task'");
  const promptBindingIndex = renderer.indexOf('appendStudentText(studentPrompt, stage.prompt, stage.promptPronunciationTokens)', taskPromptIndex);
  const interactionIndex = renderer.indexOf("const controls = element('div', 'candidate-classification-board')", promptBindingIndex);
  const submitIndex = renderer.indexOf("const submit = element('button'", interactionIndex);
  assert.ok(taskPromptIndex >= 0 && promptBindingIndex > taskPromptIndex && interactionIndex > promptBindingIndex && submitIndex > interactionIndex);
  assert.ok(activeFlow.indexOf('host.append(controls)') < activeFlow.indexOf('appendTeacherDetails();'));
  const feedbackBranch = renderer.slice(feedbackStart);
  assert.ok(feedbackBranch.indexOf("'reading-task-feedback'") < feedbackBranch.indexOf('appendTeacherDetails();'));
  assert.equal(materialStage.correctFeedback, '你依觀察紀錄完成分類。未進行實物實驗，也不能由此推論材料的所有性質。');
  assert.match(engine, /state\.phase = correct \? 'success' : 'feedback'/);
  assert.match(engine, /if \(correct\) \{[\s\S]*?state\.assignments = \{\}/);
});

test('完成畫面顯示簡短成果並可回遊戲選單，磁力活動仍使用共用互動 renderer', () => {
  const completion = renderer.match(/if \(session\.phase === 'completed'\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(completion, /'挑戰完成！'/);
  assert.match(completion, /你完成了「\$\{studentActivityTitle\}」的 \$\{activity\.stages\.length\} 個挑戰/);
  assert.match(completion, /button\('回到遊戲選單'/);
  assert.match(completion, /selectedGradeId = activity\.gradeId/);
  assert.match(completion, /selectedSubjectId = activity\.subjectId/);
  assert.match(completion, /teacherInfo\.append\(list\)/);
  const magnet = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE');
  assert.equal(magnet.stages.length, 3);
  assert.ok(magnet.stages.every(({ interaction }) => interaction === 'magnet_interaction'));
  assert.match(renderer, /stage\.interaction === 'magnet_interaction'/);
  assert.match(renderer, /dispatchLearningTask\(session, activity, action, payload\)/);
});

test('共用提交就緒提示只依既有 hasResponse 與可靠分類進度呈現', () => {
  const submitFlowStart = renderer.indexOf('const submitLabel =');
  const submitFlowEnd = renderer.indexOf('host.append(controls)', submitFlowStart);
  const submitFlow = renderer.slice(submitFlowStart, submitFlowEnd);
  assert.ok(submitFlowStart >= 0 && submitFlowEnd > submitFlowStart);
  assert.match(submitFlow, /submit\.disabled = !hasResponse/);
  assert.match(submitFlow, /const hasLowGradeAssembleCount = lowGradeAssembleResponse && Number\.isInteger\(stage\.requiredSelectionCount\)/);
  assert.match(submitFlow, /if \(\(!hasResponse \|\| hasLowGradeAssembleCount\) && !hasSpecificReadiness\)/);
  assert.match(submitFlow, /if \(hasLowGradeAssembleCount\)[\s\S]*?remainingCount > 0 \? `還要選 \$\{remainingCount\} 張。` : '可以檢查答案了。'[\s\S]*?else if \(stage\.interaction === 'collect_evidence'/);
  assert.match(submitFlow, /還沒完成喔！完成上面的作答後，就可以檢查答案。/);
  assert.match(submitFlow, /classificationProgress && !stage\.collectionRules/);
  assert.match(submitFlow, /還差 \$\{remainingCount\} 個項目，完成後就可以檢查答案。/);
  assert.match(submitFlow, /candidate-submit-readiness-\$\{stage\.stageId\}/);
  assert.match(submitFlow, /submit\.setAttribute\('aria-describedby', readinessId\)/);
  assert.match(submitFlow, /hasSpecificReadiness = stage\.interaction === 'magnet_interaction' && stage\.magnetRules\.mode === 'materials'/);
  assert.match(submitFlow, /magnet-material-submit-status/);
  const feedbackBranch = renderer.slice(renderer.indexOf("\n  const success = session.phase === 'success';"));
  assert.doesNotMatch(feedbackBranch, /candidate-submit-readiness|magnet-material-submit-status/);
});

test('order_items 共用呈現說明順序操作、位置與可存取移動控制', () => {
  const orderStart = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'order_items')");
  const orderEnd = renderer.indexOf('if (stage.circleDiagram', orderStart);
  const orderRenderer = renderer.slice(orderStart, orderEnd);
  assert.ok(orderStart >= 0 && orderEnd > orderStart);
  assert.match(renderer, /操作方式：① 看清楚題目 → ② 用「上移／下移」調整順序 → ③ 排好後檢查答案/);
  assert.doesNotMatch(orderRenderer, /hasResponse|submit\.disabled/);
  assert.match(orderRenderer, /'目前順序'/);
  assert.match(orderRenderer, /session\.orderedItems\.entries\(\)/);
  assert.match(orderRenderer, /candidate-order-position', String\(index \+ 1\)/);
  assert.match(orderRenderer, /dispatch\('move_ordered_item', \{ itemId, toIndex: index - 1 \}\)/);
  assert.match(orderRenderer, /dispatch\('move_ordered_item', \{ itemId, toIndex: index \+ 1 \}\)/);
  assert.match(orderRenderer, /up\.disabled = index === 0/);
  assert.match(orderRenderer, /down\.disabled = index === session\.orderedItems\.length - 1/);
  assert.match(orderRenderer, /這一項已經在最上面/);
  assert.match(orderRenderer, /這一項已經在最下面/);
  assert.match(orderRenderer, /將「\$\{itemText\}」上移/);
  assert.match(orderRenderer, /將「\$\{itemText\}」下移/);
  assert.match(orderRenderer, /\.focus\(\)/);
  assert.match(orderRenderer, /aria-label', `第 \$\{index \+ 1\} 項：\$\{itemText\}`/);
  assert.match(css, /\.candidate-order-row:focus\{/);
  assert.match(css, /\.candidate-order-position\{/);
  assert.doesNotMatch(orderRenderer, /作答進度/);
  const hasResponseStart = renderer.indexOf('const hasResponse =');
  const hasResponseEnd = renderer.indexOf('const submitLabel =', hasResponseStart);
  const hasResponseSection = renderer.slice(hasResponseStart, hasResponseEnd);
  assert.ok(hasResponseStart >= 0 && hasResponseEnd > hasResponseStart);
  assert.match(hasResponseSection, /stage\.interaction === 'order_items'[\s\S]*?session\.orderedItems\.length === stage\.items\.length/);
  assert.match(renderer.slice(hasResponseEnd), /submit\.disabled = !hasResponse/);

  const activity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G3-CHINESE-STORY-SEQUENCE-TIMELINE-CANDIDATE');
  assert.ok(activity);
  let session = dispatchLearningTask(createLearningTaskSession(activity, 'order-ux-test'), activity, 'start').session;
  const initial = [...session.orderedItems];
  session = dispatchLearningTask(session, activity, 'move_ordered_item', { itemId: initial[0], toIndex: 1 }).session;
  assert.deepEqual(session.orderedItems, [initial[1], initial[0], ...initial.slice(2)]);
  assert.equal(session.phase, 'active');
  assert.match(engine, /if \(action === 'move_ordered_item'\)[\s\S]*?state\.orderedItems\.splice\(toIndex, 0, itemId\)/);
});

test('assemble_response 清楚分開可選內容與依序組成的答案', () => {
  const assembleStart = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'assemble_response')");
  const assembleEnd = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'build_array')", assembleStart);
  const assembleRenderer = renderer.slice(assembleStart, assembleEnd);
  assert.ok(assembleStart >= 0 && assembleEnd > assembleStart);
  assert.match(renderer, /操作方式：① 看清楚題目 → ② 依順序點選內容 → ③ 檢查「我的答案」 → ④ 完成後檢查答案/);
  assert.match(assembleRenderer, /'可選內容'/);
  assert.match(assembleRenderer, /'我的答案'/);
  assert.match(assembleRenderer, /if \(lowGradeAssembleResponse\) appendAssembleUiText\(emptyResponse, '還沒選卡片。'/);
  assert.match(assembleRenderer, /else emptyResponse\.textContent = '還沒有加入內容。請從「可選內容」依順序點選。'/);
  assert.match(assembleRenderer, /session\.selection\.includes\(token\.id\)/);
  assert.match(assembleRenderer, /dispatch\(isSelected \? 'remove_phrase_token' : 'add_phrase_token', \{ tokenId: token\.id \}\)/);
  assert.match(assembleRenderer, /for \(const \[index, tokenId\] of session\.selection\.entries\(\)\)/);
  assert.match(assembleRenderer, /String\(index \+ 1\)/);
  assert.match(assembleRenderer, /將「\$\{token\.text\}」加入我的答案/);
  assert.match(assembleRenderer, /從我的答案移除「\$\{token\.text\}」/);
  assert.match(assembleRenderer, /aria-label', `第 \$\{index \+ 1\} 項：\$\{tokenText\}`/);
  assert.match(assembleRenderer, /aria-label', '我的答案，依點選順序排列'/);
  assert.match(assembleRenderer, /selectionProgress/);
  assert.match(assembleRenderer, /String\(stage\.requiredSelectionCount\)/);
  assert.doesNotMatch(assembleRenderer, /correctOptionIds\.length/);
  assert.match(app, /'還沒選卡片。': 'ㄏㄞˊ ㄇㄟˊ ㄒㄩㄢˇ ㄎㄚˇ ㄆㄧㄢˋ'/);
  assert.match(app, /'還要選 ': 'ㄏㄞˊ ㄧㄠˋ ㄒㄩㄢˇ'/);
  assert.match(app, /'可以檢查答案了。': 'ㄎㄜˇ ㄧˇ ㄐㄧㄢˇ ㄔㄚˊ ㄉㄚˊ ㄢˋ ㄌㄜ˙'/);
  assert.match(renderer, /const hasLowGradeAssembleCount = lowGradeAssembleResponse && Number\.isInteger\(stage\.requiredSelectionCount\)/);
  assert.match(renderer, /remainingCount = stage\.requiredSelectionCount - session\.selection\.length/);
  assert.match(renderer, /remainingCount > 0 \? `還要選 \$\{remainingCount\} 張。` : '可以檢查答案了。'/);
  assert.match(renderer, /appendAssembleUiText\(readiness, '可以檢查答案了。', appendStudentText\)/);
  assert.doesNotMatch(renderer, /還要選 0 張/);

  const hasResponseStart = renderer.indexOf('const hasResponse =');
  const hasResponseEnd = renderer.indexOf('const submitLabel =', hasResponseStart);
  const hasResponseSection = renderer.slice(hasResponseStart, hasResponseEnd);
  assert.ok(hasResponseStart >= 0 && hasResponseEnd > hasResponseStart);
  assert.match(hasResponseSection, /stage\.interaction === 'assemble_response' && Number\.isInteger\(stage\.requiredSelectionCount\)[\s\S]*?session\.selection\.length === stage\.requiredSelectionCount/);
  assert.match(hasResponseSection, /: session\.selection\.length > 0;/);
  assert.match(renderer.slice(hasResponseEnd), /submit\.disabled = !hasResponse/);
  assert.match(engine, /interaction === 'assemble_response'\) correct = response\.length === stage\.correctOptionIds\.length && response\.every\(\(id, index\) => id === stage\.correctOptionIds\[index\]\)/);

  const activity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G4-INTEGRATIVE-STUDY-METHOD-CANDIDATE');
  const stage = activity?.stages.find(({ stageId }) => stageId === 'plan-leaf-observation');
  assert.ok(stage);
  let session = dispatchLearningTask(createLearningTaskSession(activity, 'assemble-response-ux-test'), activity, 'start').session;
  const chosenIds = stage.tokens.slice(0, 2).map(({ id }) => id);
  for (const tokenId of chosenIds) {
    session = dispatchLearningTask(session, activity, 'add_phrase_token', { tokenId }).session;
  }
  assert.deepEqual(session.selection, chosenIds, 'the existing selection state retains the order in which options were selected');
  session = dispatchLearningTask(session, activity, 'remove_phrase_token', { tokenId: chosenIds[0] }).session;
  assert.deepEqual(session.selection, [chosenIds[1]], 'the existing remove action can correct the assembled response');
  assert.equal(session.phase, 'active');
});

test('collect_evidence 區分題目資料、證據選擇與目前選取狀態', () => {
  const dataStart = renderer.indexOf('const stage = activity.stages[session.stageIndex]');
  const dataEnd = renderer.indexOf('const responseGuidance =', dataStart);
  const sourceRenderer = renderer.slice(dataStart, dataEnd);
  const collectStart = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'collect_evidence')");
  const collectEnd = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'classify_observations')", collectStart);
  const collectRenderer = renderer.slice(collectStart, collectEnd);
  assert.ok(dataStart >= 0 && dataEnd > dataStart);
  assert.ok(collectStart >= 0 && collectEnd > collectStart);

  const observationActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G2-LIVING-CAMPUS-OBSERVATION-CANDIDATE');
  const observationStage = observationActivity?.stages.find(({ stageId }) => stageId === 'collect-rough-surface-evidence');
  const noSourceActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G3-MATH-CIRCLE-PATTERN-CANDIDATE');
  const noSourceStage = noSourceActivity?.stages.find(({ stageId }) => stageId === 'identify-shape-pattern-rule');
  const contextActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G4-INTEGRATIVE-STUDY-METHOD-CANDIDATE');
  const contextStage = contextActivity?.stages.find(({ stageId }) => stageId === 'review-map-practice-record');
  const passageActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G3-CHINESE-STORY-CLUE-RESCUE-CANDIDATE');
  const passageStage = passageActivity?.stages.find(({ stageId }) => stageId === 'seedling-care-clues');
  const moneyActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE');
  const moneyStage = moneyActivity?.stages.find(({ stageId }) => stageId === 'pay-market-basket-one-hundred');
  assert.ok(observationStage?.evidenceRecords?.length);
  assert.ok(noSourceStage && !noSourceStage.context?.length && !noSourceStage.evidenceRecords?.length && !noSourceStage.passageId && !noSourceStage.tableView);
  assert.ok(contextStage?.context?.length);
  assert.ok(passageStage?.passageId);
  assert.ok(moneyStage?.options.every(({ valueAmount }) => Number.isFinite(valueAmount)));

  assert.match(sourceRenderer, /if \(stage\.context\?\.length\)[\s\S]*?dialogue\.append\(element\('h3', 'candidate-source-heading', '情境資料'\)\)/);
  assert.match(sourceRenderer, /if \(stage\.evidenceRecords\?\.length\)[\s\S]*?evidence\.append\(element\('h3', 'candidate-source-heading', '觀察資料'\)\)/);
  assert.match(sourceRenderer, /if \(stage\.passageId && activity\.passages\?\.\[stage\.passageId\]\)[\s\S]*?'閱讀資料'/);
  assert.match(sourceRenderer, /candidate-table-wrap[\s\S]*?題目提供的表格資料/);
  assert.doesNotMatch(sourceRenderer, /else\s*\{[^}]*candidate-evidence-records/);
  assert.match(renderer, /stage\.evidenceRecords\?\.length[\s\S]*?看觀察資料/);
  assert.match(renderer, /stage\.context\?\.length \|\| stage\.passageId[\s\S]*?看題目提供的資料/);
  assert.match(renderer, /: '操作方式：① 看清楚題目 → ② 選出符合題目的證據 → ③ 檢查「我的選擇」 → ④ 完成後檢查答案'/);
  assert.match(renderer, /看清楚付款需求 → ② 選擇錢幣 → ③ 確認目前合計/);

  assert.match(collectRenderer, /'選擇證據'/);
  assert.match(collectRenderer, /isMoneySelection \? '選擇錢幣' : '選擇證據'/);
  assert.match(collectRenderer, /aria-label', isMoneySelection \? '選擇錢幣' : '選擇證據'/);
  assert.match(collectRenderer, /appendStudentText\(choice, option\.text, option\.pronunciationTokens\)/);
  assert.match(collectRenderer, /aria-label', `\$\{selected \? '取消選擇' : '選擇'\}\$\{isMoneySelection \? '錢幣' : '證據'\}「\$\{option\.text\}」`/);
  assert.match(collectRenderer, /choice\.setAttribute\('aria-pressed', String\(selected\)\)/);
  assert.match(collectRenderer, /choice\.className|element\('button', `candidate-category candidate-evidence-option\$\{selected \? ' is-selected' : ''\}`\)/);
  assert.match(collectRenderer, /optionId: option\.id/);
  assert.match(collectRenderer, /dispatch\('toggle_evidence', \{ optionId: option\.id \}\)/);
  assert.match(collectRenderer, /const isMoneySelection = stage\.options\.every\(\(option\) => Number\.isFinite\(option\.valueAmount\)\)/);
  assert.match(collectRenderer, /session\.selection\.length/);
  assert.match(collectRenderer, /我的選擇：已選 \$\{session\.selection\.length\} 項/);
  assert.match(collectRenderer, /我的選擇：\$\{isMoneySelection \? '還沒有選擇錢幣。' : '還沒有選擇證據。'\}/);
  assert.doesNotMatch(collectRenderer, /correctOptionIds|已選[^\n]*\/[^\n]*答案|答案數/);
  assert.match(collectRenderer, /stage\.options\.filter\(\(option\) => session\.selection\.includes\(option\.id\)\)\.reduce\(\(sum, option\) => sum \+ option\.valueAmount, 0\)/);

  let session = dispatchLearningTask(createLearningTaskSession(observationActivity, 'collect-evidence-ux-test'), observationActivity, 'start').session;
  assert.equal(observationActivity.stages[session.stageIndex].interaction, 'collect_evidence');
  const evidenceId = observationStage.options[0].id;
  session = dispatchLearningTask(session, observationActivity, 'toggle_evidence', { optionId: evidenceId }).session;
  assert.deepEqual(session.selection, [evidenceId]);
  session = dispatchLearningTask(session, observationActivity, 'toggle_evidence', { optionId: evidenceId }).session;
  assert.deepEqual(session.selection, [], 'toggling the same evidence off uses the existing selection behavior');

  const hasResponseStart = renderer.indexOf('const hasResponse =');
  const hasResponseEnd = renderer.indexOf('const submitLabel =', hasResponseStart);
  const hasResponseSection = renderer.slice(hasResponseStart, hasResponseEnd);
  assert.match(hasResponseSection, /: session\.selection\.length > 0;/);
  assert.match(renderer.slice(hasResponseEnd), /submit\.disabled = !hasResponse/);
  assert.match(engine, /state\.selection = state\.selection\.includes\(payload\.optionId\)[\s\S]*?\? state\.selection\.filter\(\(id\) => id !== payload\.optionId\)/);
  assert.match(engine, /correct = sortedResponse\.length === sortedExpected\.length && sortedResponse\.every\(\(id, index\) => id === sortedExpected\[index\]\)/);
});

test('collect_evidence 只依公開 requiredSelectionCount 顯示進度、限制選取並控制提交', () => {
  const activity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G3-CHINESE-STORY-CLUE-RESCUE-CANDIDATE');
  const stage = activity.stages.find(({ stageId }) => stageId === 'seedling-care-clues');
  assert.match(stage.prompt, /小禾不是只照顧小苗一次.*每天做了哪些事.*請選 2 個/);
  assert.equal(stage.requiredSelectionCount, 2);
  assert.equal(stage.interaction, 'collect_evidence');

  const explicitCountStageIds = [
    'seedling-care-clues', 'collect-before-after-evidence', 'collect-main-idea-evidence',
    'select-evidence-for-next-action', 'collect-change-and-demand-records', 'collect-vine-classification-evidence',
    'select-structure-evidence', 'choose-special-structure-evidence', 'choose-supported-comparison',
    'collect-bounded-impact-evidence', 'select-beak-food-evidence',
  ];
  const registeredCountStages = CATALOG_CANDIDATE_TASKS.flatMap((task) => task.stages)
    .filter(({ stageId }) => explicitCountStageIds.includes(stageId));
  assert.equal(registeredCountStages.length, explicitCountStageIds.length);
  assert.ok(registeredCountStages.every((candidateStage) => candidateStage.requiredSelectionCount === 2));
  const collectEvidenceStages = CATALOG_CANDIDATE_TASKS.flatMap((task) => task.stages).filter(({ interaction }) => interaction === 'collect_evidence');
  assert.equal(collectEvidenceStages.length, 44);

  const countUiStart = renderer.indexOf('const hasRequiredSelectionCount =');
  const countUiEnd = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'classify_observations')", countUiStart);
  const countUi = renderer.slice(countUiStart, countUiEnd);
  assert.ok(countUiStart >= 0 && countUiEnd > countUiStart);
  assert.match(countUi, /\$\{session\.selection\.length\} \/ \$\{stage\.requiredSelectionCount\}/);
  assert.match(countUi, /const selectionComplete = hasRequiredSelectionCount && session\.selection\.length === stage\.requiredSelectionCount;/);
  assert.match(countUi, /\$\{selectionComplete \? ' ✓' : ''\}/);
  assert.match(countUi, /已完成要求的選擇數量/);
  assert.doesNotMatch(countUi, /correctOptionIds|correctAnswers|stage\.prompt.*match|parseInt/);
  assert.doesNotMatch(countUi, /答對|正確/);

  const hasResponseStart = renderer.indexOf('const hasResponse =');
  const hasResponseEnd = renderer.indexOf('const submitLabel =', hasResponseStart);
  const hasResponseSection = renderer.slice(hasResponseStart, hasResponseEnd);
  assert.match(hasResponseSection, /stage\.interaction === 'collect_evidence'[\s\S]*?session\.selection\.length === stage\.requiredSelectionCount[\s\S]*?session\.selection\.length > 0/);
  assert.match(renderer, /stage\.requiredSelectionCount - session\.selection\.length/);
  assert.match(renderer, /還差 \$\{remainingCount\} 項，完成後就可以檢查答案。/);
  assert.match(renderer, /taskKind === 'chinese' \? '檢查答案'/);
  assert.doesNotMatch(renderer, /檢查閱讀線索/);
  assert.equal(CATALOG_CANDIDATE_TASKS.filter(({ subjectId }) => subjectId === 'chinese-language').length, 17);
  assert.match(engine, /state\.selection\.length === stage\.requiredSelectionCount/);
  assert.match(engine, /required_selection_count_reached/);
  assert.match(engine, /stage\.requiredSelectionCount !== undefined[\s\S]*?Number\.isInteger\(stage\.requiredSelectionCount\)[\s\S]*?stage\.requiredSelectionCount < 1/);
  assert.doesNotMatch(engine, /requiredSelectionCount[^\n]*correctOptionIds|correctOptionIds[^\n]*requiredSelectionCount/);

  let session = dispatchLearningTask(createLearningTaskSession(activity, 'required-selection-count-test'), activity, 'start').session;
  const [firstId, secondId, thirdId] = stage.options.map(({ id }) => id);
  session = dispatchLearningTask(session, activity, 'toggle_evidence', { optionId: firstId }).session;
  assert.equal(session.selection.length, 1);
  const incompleteSubmit = dispatchLearningTask(session, activity, 'submit');
  assert.equal(incompleteSubmit.error, 'response_required');
  assert.equal(incompleteSubmit.session.attempts.length, 0);

  session = dispatchLearningTask(session, activity, 'toggle_evidence', { optionId: secondId }).session;
  assert.equal(session.selection.length, 2);
  const overLimit = dispatchLearningTask(session, activity, 'toggle_evidence', { optionId: thirdId });
  assert.equal(overLimit.error, 'required_selection_count_reached');
  assert.equal(overLimit.session.selection.length, 2);
  session = dispatchLearningTask(session, activity, 'toggle_evidence', { optionId: firstId }).session;
  assert.deepEqual(session.selection, [secondId], 'a selected choice can still be cancelled at the limit');
  session = dispatchLearningTask(session, activity, 'toggle_evidence', { optionId: thirdId }).session;
  assert.deepEqual(session.selection, [secondId, thirdId], 'cancelling one choice allows replacing it');
  const completeSubmit = dispatchLearningTask(session, activity, 'submit');
  assert.notEqual(completeSubmit.error, 'response_required');
  assert.equal(completeSubmit.session.attempts.length, 1);

  const unboundedActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G2-LIVING-CAMPUS-OBSERVATION-CANDIDATE');
  let unboundedSession = dispatchLearningTask(createLearningTaskSession(unboundedActivity, 'unbounded-evidence-test'), unboundedActivity, 'start').session;
  const unboundedStage = unboundedActivity.stages[unboundedSession.stageIndex];
  assert.equal(unboundedStage.requiredSelectionCount, undefined);
  unboundedSession = dispatchLearningTask(unboundedSession, unboundedActivity, 'toggle_evidence', { optionId: unboundedStage.options[0].id }).session;
  const unboundedSubmit = dispatchLearningTask(unboundedSession, unboundedActivity, 'submit');
  assert.notEqual(unboundedSubmit.error, 'response_required');
  assert.equal(unboundedSubmit.session.attempts.length, 1);

  const invalidCount = structuredClone(activity);
  invalidCount.stages[0].requiredSelectionCount = 0;
  assert.ok(validateLearningTask(invalidCount).includes('invalid_required_selection_count:seedling-care-clues'));
  const unsupportedInteraction = structuredClone(activity);
  unsupportedInteraction.stages[0].interaction = 'choose_response';
  assert.ok(validateLearningTask(unsupportedInteraction).includes('invalid_required_selection_count:seedling-care-clues'));

  const spacingStart = css.indexOf('.candidate-task-screen .reading-passage-card');
  const spacingEnd = css.indexOf('.candidate-answer-selection', spacingStart);
  const readingSpacing = css.slice(spacingStart, spacingEnd);
  assert.ok(spacingStart >= 0 && spacingEnd > spacingStart);
  assert.match(readingSpacing, /\.candidate-evidence-selection/);
  assert.doesNotMatch(readingSpacing, /font-size/);
  assert.match(renderer, /appendTeacherDetails\(\)/);
});

test('choose_response 以單選語意呈現並保留既有選取與提交行為', () => {
  const chooseStages = CATALOG_CANDIDATE_TASKS.flatMap((activity) => activity.stages
    .filter(({ interaction }) => interaction === 'choose_response')
    .map((stage) => ({ activity, stage })));
  assert.equal(chooseStages.length, 64);
  assert.ok(chooseStages.every(({ stage }) => stage.correctOptionIds?.length === 1));

  const guidanceStart = renderer.indexOf('const responseGuidance =');
  const guidanceEnd = renderer.indexOf('host.append(responseGuidanceNode)', guidanceStart);
  const guidance = renderer.slice(guidanceStart, guidanceEnd);
  const chooseGuidanceStart = guidance.indexOf("stage.interaction === 'choose_response'");
  const chooseGuidanceEnd = guidance.indexOf(": stage.interaction === 'collect_evidence'", chooseGuidanceStart);
  const chooseGuidance = guidance.slice(chooseGuidanceStart, chooseGuidanceEnd);
  const chooseStart = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'choose_response')");
  const chooseEnd = renderer.indexOf("if (session.phase === 'active' && stage.interaction === 'collect_evidence')", chooseStart);
  const chooseRenderer = renderer.slice(chooseStart, chooseEnd);
  assert.ok(guidanceStart >= 0 && guidanceEnd > guidanceStart);
  assert.ok(chooseGuidanceStart >= 0 && chooseGuidanceEnd > chooseGuidanceStart);
  assert.ok(chooseStart >= 0 && chooseEnd > chooseStart);

  assert.match(chooseGuidance, /'作答方式：請選 1 個答案'/);
  assert.doesNotMatch(chooseGuidance, /correctOptionIds|correctOptionId|answerCount/);
  assert.match(chooseRenderer, /'選擇答案'/);
  assert.match(chooseRenderer, /const choice = element\('button', `candidate-category candidate-answer-option\$\{selected \? ' is-selected' : ''\}`, `\$\{selected \? '✓ 已選｜' : ''\}`\)/);
  assert.match(chooseRenderer, /appendStudentText\(choice, option\.text, option\.pronunciationTokens\)/);
  assert.match(chooseRenderer, /aria-label', `\$\{selected \? '目前已選答案' : '選擇答案'\}「\$\{option\.text\}」`/);
  assert.match(chooseRenderer, /aria-pressed', String\(selected\)/);
  assert.match(chooseRenderer, /dispatch\('select_option', \{ optionId: option\.id \}\)/);
  assert.doesNotMatch(chooseRenderer, /取消選擇|remove|toggle/);
  assert.match(css, /\.candidate-answer-option\.is-selected/);
  assert.match(css, /\.candidate-answer-option:focus-visible/);

  const { activity, stage } = chooseStages.find(({ activity, stage }) => activity.stages[0]?.stageId === stage.stageId && stage.options.length >= 2);
  assert.ok(activity && stage, 'a choose_response stage is available as the session entry point');
  let session = dispatchLearningTask(createLearningTaskSession(activity, 'choose-response-ux-test'), activity, 'start').session;
  assert.equal(activity.stages[session.stageIndex].interaction, 'choose_response');
  const firstId = stage.options[0].id;
  const secondId = stage.options[1].id;
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: firstId }).session;
  assert.deepEqual(session.selection, [firstId]);
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: secondId }).session;
  assert.deepEqual(session.selection, [secondId], 'choosing another option replaces the previous single selection');
  session = dispatchLearningTask(session, activity, 'select_option', { optionId: secondId }).session;
  assert.deepEqual(session.selection, [secondId], 'reselecting the chosen option does not cancel it');

  const hasResponseStart = renderer.indexOf('const hasResponse =');
  const hasResponseEnd = renderer.indexOf('const submitLabel =', hasResponseStart);
  const hasResponse = renderer.slice(hasResponseStart, hasResponseEnd);
  assert.match(hasResponse, /: session\.selection\.length > 0;/);
  assert.match(renderer.slice(hasResponseEnd), /submit\.disabled = !hasResponse/);
  assert.match(engine, /if \(action === 'select_option'\)[\s\S]*?state\.selection = \[payload\.optionId\]/);
});

test('學生冒險入口分成年級、科目、遊戲三層並只在三年級數學顯示冒險地圖', () => {
  const selectionStart = app.indexOf('function renderGradeSelection()');
  const selectionEnd = app.indexOf('\nfunction renderGrade3MathAdventureMap()', selectionStart);
  const selectionRenderer = app.slice(selectionStart, selectionEnd);
  assert.ok(selectionStart >= 0 && selectionEnd > selectionStart);

  assert.match(selectionRenderer, /const hasSelectedGrade = Boolean\(selectedGradeId\)/);
  assert.match(selectionRenderer, /grade-picker'\)\.hidden = hasSelectedGrade/);
  assert.match(selectionRenderer, /grade-preparation-panel'\)[\s\S]*?hidden = !hasSelectedGrade/);
  assert.match(selectionRenderer, /grade-subject-directory'[\s\S]*?hidden = hasSelectedSubject/);
  assert.match(selectionRenderer, /grade-subject-detail'[\s\S]*?hidden = !subject/);
  assert.match(selectionRenderer, /grade3-experience'\)\.hidden = !\(hasSelectedSubject && isGradeThree && selectedSubjectId === 'mathematics'\)/);
  assert.match(selectionRenderer, /getSubjectLaunchableActivities\(grade, subject\)/);
  assert.match(selectionRenderer, /找到 \$\{subjectActivities\.length\} 個可以挑戰的遊戲/);
  assert.match(selectionRenderer, /const isCandidateActivity = CATALOG_CANDIDATE_TASK_BY_ID\.has\(activity\.activityId\)/);
  assert.match(selectionRenderer, /activity\.entryRoute\?\.directLaunch === true && activity\.entryRoute\.targetScreen === 'reading-quest'/);
  assert.match(selectionRenderer, /grade-subject-open-reading'\)\.click\(\)/);
  assert.match(selectionRenderer, /launch\.textContent = isCandidateActivity \? '開始挑戰' : '開始閱讀任務'/);
  assert.match(selectionRenderer, /if \(isCandidateActivity\) startCatalogCandidateTask\(activity\.activityId\);[\s\S]*?else if \(activity\.entryRoute\?\.directLaunch === true && activity\.entryRoute\.targetScreen === 'reading-quest'\)[\s\S]*?grade-subject-open-reading'\)\.click\(\)/);
  assert.match(selectionRenderer, /grade-subject-open-reading'\)\.hidden = true/);
  assert.match(app, /grade-subject-open-reading'\)\.addEventListener\('click',[\s\S]*?readingQuestSession = createLearningTaskSession\(STORY_FOREST_READING_QUEST\)[\s\S]*?showScreen\('reading-quest'\)/);
  assert.match(selectionRenderer, /startCatalogCandidateTask\(activity\.activityId\)/);
  assert.match(selectionRenderer, /候選活動・待教師審查/);
  assert.match(selectionRenderer, /選擇遊戲/);
  assert.match(html, /<details id="grade-teacher-info" class="student-teacher-info">\s*<summary>👩‍🏫 教師／課綱資訊<\/summary>/);
  assert.match(html, /<details id="grade-subject-teacher-info" class="student-teacher-info">\s*<summary>👩‍🏫 教師／課綱資訊<\/summary>/);
  assert.match(app, /document\.querySelector\('\.brand'\)[\s\S]*?showScreen\('home'\)/);
  assert.doesNotMatch(selectionRenderer, /location\.reload/);

  const backToGradesStart = app.indexOf("document.getElementById('student-back-to-grades').addEventListener");
  const backToSubjectsStart = app.indexOf("document.getElementById('student-subject-back').addEventListener");
  const backToSubjectsEnd = app.indexOf("document.getElementById('grade-subject-open-reading').addEventListener", backToSubjectsStart);
  const backToGrades = app.slice(backToGradesStart, backToSubjectsStart);
  const backToSubjects = app.slice(backToSubjectsStart, backToSubjectsEnd);
  assert.match(backToGrades, /selectedGradeId = null;[\s\S]*selectedSubjectId = null;[\s\S]*renderGradeSelection\(\)/);
  assert.match(backToSubjects, /const previousSubjectId = selectedSubjectId;[\s\S]*selectedSubjectId = null;[\s\S]*renderGradeSelection\(\)/);
  assert.doesNotMatch(backToSubjects, /selectedGradeId\s*=/);

  const grade3 = GRADE_CATALOG.find(({ gradeId }) => gradeId === 'grade-3');
  const chinese = grade3.subjects.find(({ subjectId }) => subjectId === 'chinese-language');
  const math = grade3.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  const chineseActivities = getSubjectLaunchableActivities(grade3, chinese);
  assert.ok(chineseActivities.length > 0);
  const chineseCatalogActivities = chineseActivities.filter(({ activityId }) => CATALOG_CANDIDATE_TASK_BY_ID.has(activityId));
  const chineseDirectLaunchActivities = chineseActivities.filter(({ entryRoute }) => entryRoute?.directLaunch === true);
  assert.ok(chineseCatalogActivities.length > 0);
  assert.equal(chineseActivities.length, 6);
  assert.equal(chineseCatalogActivities.length, 5);
  assert.equal(chineseDirectLaunchActivities.length, 1);
  const renderedChineseCardEntries = chineseActivities.filter((activity) => CATALOG_CANDIDATE_TASK_BY_ID.has(activity.activityId) || (activity.entryRoute?.directLaunch === true && activity.entryRoute.targetScreen === 'reading-quest'));
  assert.equal(renderedChineseCardEntries.length, chineseActivities.length);
  assert.ok(chineseCatalogActivities.every(({ gradeId, subjectId }) => gradeId === grade3.gradeId && subjectId === chinese.subjectId));
  const dedicatedReadingActivity = chineseActivities.find(({ activityId }) => activityId === 'ACT-G3-CHINESE-READING-GARDEN-CANDIDATE');
  assert.equal(dedicatedReadingActivity?.entryRoute?.directLaunch, true);
  assert.equal(dedicatedReadingActivity?.entryRoute?.targetScreen, 'reading-quest');
  assert.equal(CATALOG_CANDIDATE_TASK_BY_ID.has(dedicatedReadingActivity.activityId), false);
  assert.ok(!chineseActivities.some(({ activityId }) => activityId === 'ACT-G3-MATH-DATA-TABLE-WORKSHOP-CANDIDATE'));
  assert.ok(getSubjectLaunchableActivities(grade3, math).some(({ activityId }) => activityId === 'ACT-G3-MATH-DATA-TABLE-WORKSHOP-CANDIDATE'));
  assert.ok(CATALOG_CANDIDATE_TASK_BY_ID.has('ACT-G3-CHINESE-STORY-CLUE-RESCUE-CANDIDATE'));
});
