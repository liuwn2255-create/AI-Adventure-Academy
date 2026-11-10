import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import evidence from '../curriculum/edu-01-candidate-evidence.json' with { type: 'json' };

async function respond(panel, stage, wrong) {
  if (stage.interaction === 'complete_calculation_steps') {
    for (const [index, step] of stage.calculationSteps.entries()) {
      const choice = step.choices.find(({ value }) => (value !== step.expectedValue) === (wrong && index === 0));
      await panel.locator('.calculation-step-row').nth(index).getByRole('button', { name: String(choice.label ?? choice.value), exact: true }).tap();
    }
  } else if (stage.interaction === 'place_number_line_marker') {
    const tick = stage.numberLine.targetTick + Number(wrong);
    await panel.locator('input[type="range"]').evaluate((slider, value) => {
      slider.value = String(value);
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }, tick);
  } else if (stage.interaction === 'compose_shape') {
    const ids = stage.shapeRules.correctPieceIds;
    const selected = wrong ? [...ids.slice(0, -1), stage.pieces.find(({ id }) => !ids.includes(id)).id] : ids;
    for (const id of selected) {
      const { label } = stage.pieces.find(piece => piece.id === id);
      await panel.getByRole('button', { name: label, exact: true }).tap();
    }
  } else {
    assert.equal(stage.interaction, 'choose_response');
    const option = stage.options.find(({ id }) => stage.correctOptionIds.includes(id) !== wrong);
    await panel.getByRole('button', { name: `選擇答案「${option.text}」`, exact: true }).tap();
  }
  await panel.locator('.reading-task-controls .button-primary').tap();
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: process.env.CHROMIUM_EXECUTABLE ? ['--no-zygote', '--single-process', '--disable-gpu'] : [],
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  assert.equal(evidence.teacherReview, 'pending');
  assert.equal(evidence.supplements.length, 2);
  for (const definition of evidence.supplements) {
    const task = CATALOG_CANDIDATE_TASK_BY_ID.get(definition.activityId);
    const stageIds = task.stages.map(({ stageId }) => stageId);
    assert.deepEqual(definition.evidenceStageIds, stageIds.slice(-2));
    assert.ok(task.curriculumCodes.includes(definition.curriculumCode));
    assert.ok(task.learningSubitemClaims.includes(definition.subitemId));
    assert.equal(definition.status, 'candidate_partial_interaction');
    assert.equal(task.teacherReview.status, 'not_reviewed');

    await page.goto(process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:4175/');
    await page.locator('#start-button').tap();
    await page.locator(`#grade-options [data-grade-id="${task.gradeId}"]`).tap();
    await page.locator('#grade-subject-directory [data-subject-id="mathematics"]').tap();
    const entry = task.gradeId === 'grade-3' ? '#grade3-math-adventure-regions button' : '.catalog-task-launch';
    await page.locator(`${entry}[data-activity-id="${task.activityId}"]`).tap();

    const panel = page.locator('#catalog-task-content');
    const before = await page.evaluate(() => Object.entries(localStorage).sort());
    await panel.getByRole('button', { name: '開始挑戰', exact: true }).tap();
    for (const stage of task.stages) {
      await panel.locator('.reading-stage-prompt').filter({ hasText: stage.prompt }).waitFor();
      const supplement = definition.evidenceStageIds.includes(stage.stageId);
      if (supplement) {
        await panel.getByRole('button', { name: '查看提示', exact: true }).tap();
        await panel.locator('.reading-hint').filter({ hasText: '提示 1：' }).waitFor();
        await panel.getByRole('button', { name: '查看提示', exact: true }).tap();
        await panel.locator('.reading-hint').filter({ hasText: '提示 2：' }).waitFor();
        await respond(panel, stage, true);
        await panel.locator('.reading-task-feedback.is-incorrect').waitFor();
        await panel.getByRole('button', { name: '重新觀察並重試', exact: true }).tap();
      }
      await respond(panel, stage, false);
      await panel.locator('.reading-task-feedback.is-correct').waitFor();
      await panel.getByRole('button', { name: '繼續下一個挑戰', exact: true }).tap();
    }
    await panel.getByRole('heading', { name: '挑戰完成！' }).waitFor();
    assert.equal(await panel.locator('.candidate-attempt-list > li').count(), task.stages.length + 2);
    assert.deepEqual(await page.evaluate(() => Object.entries(localStorage).sort()), before);
    await panel.getByRole('button', { name: '再玩一次', exact: true }).tap();
    await panel.getByRole('button', { name: '開始挑戰', exact: true }).waitFor();
    console.log(`EDU-01 ${definition.curriculumCode} PASS: ${task.stages.length} stages, two supplements tested with hints, incorrect response and retry; storage unchanged`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
