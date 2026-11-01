import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../prototype/styles.css', import.meta.url), 'utf8');
const engine = await readFile(new URL('../prototype/learningTaskEngine.js', import.meta.url), 'utf8');
const rendererStart = app.indexOf('function renderReusableCandidateTask(');
const rendererEnd = app.indexOf('\nfunction renderCandidateRoutes(', rendererStart);
const renderer = app.slice(rendererStart, rendererEnd);

test('候選活動介紹先顯示學生任務、挑戰數與開始按鈕，教師資訊預設收合且資料仍保留', () => {
  const intro = renderer.match(/if \(session\.phase === 'intro'\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(intro, /activity\.stages\[0\]\?\.prompt/);
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

test('挑戰畫面以任務提示和互動方式為主，材料分類進度取自觀察數與 assignments', () => {
  const materialActivity = CATALOG_CANDIDATE_TASK_BY_ID.get('ACT-G4-SCIENCE-MATERIAL-SORT-CANDIDATE');
  const materialStage = materialActivity.stages.find(({ stageId }) => stageId === 'sort-absorption');
  assert.equal(materialStage.interaction, 'classify_observations');
  assert.equal(materialStage.observations.length, 3);
  assert.deepEqual(materialStage.correctAssignments, { cloth: 'absorbs', plastic: 'stays', paper: 'absorbs' });
  assert.match(renderer, /這一關要做什麼：\$\{stage\.prompt\}/);
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
  const taskPromptIndex = renderer.indexOf('這一關要做什麼：${stage.prompt}');
  const interactionIndex = renderer.indexOf("stage.interaction === 'classify_observations'", taskPromptIndex);
  const submitIndex = renderer.indexOf("const submit = element('button'", interactionIndex);
  assert.ok(taskPromptIndex >= 0 && interactionIndex > taskPromptIndex && submitIndex > interactionIndex);
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
  assert.match(submitFlow, /if \(!hasResponse && !hasSpecificReadiness\)/);
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
  assert.match(assembleRenderer, /還沒有加入內容。請從「可選內容」依順序點選。/);
  assert.match(assembleRenderer, /session\.selection\.includes\(token\.id\)/);
  assert.match(assembleRenderer, /dispatch\(isSelected \? 'remove_phrase_token' : 'add_phrase_token', \{ tokenId: token\.id \}\)/);
  assert.match(assembleRenderer, /for \(const \[index, tokenId\] of session\.selection\.entries\(\)\)/);
  assert.match(assembleRenderer, /String\(index \+ 1\)/);
  assert.match(assembleRenderer, /將「\$\{token\.text\}」加入我的答案/);
  assert.match(assembleRenderer, /從我的答案移除「\$\{token\.text\}」/);
  assert.match(assembleRenderer, /aria-label', `第 \$\{index \+ 1\} 項：\$\{tokenText\}`/);
  assert.match(assembleRenderer, /aria-label', '我的答案，依點選順序排列'/);
  assert.doesNotMatch(assembleRenderer, /作答進度|correctOptionIds|X \/ N/);

  const hasResponseStart = renderer.indexOf('const hasResponse =');
  const hasResponseEnd = renderer.indexOf('const submitLabel =', hasResponseStart);
  const hasResponseSection = renderer.slice(hasResponseStart, hasResponseEnd);
  assert.ok(hasResponseStart >= 0 && hasResponseEnd > hasResponseStart);
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
