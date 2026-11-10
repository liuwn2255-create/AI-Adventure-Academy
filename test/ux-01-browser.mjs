import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { NUMBER_SECRET_LEARNING_UNIT as unit } from '../prototype/data/numberSecretLearningUnit.js';
import { LEARNING_PROGRESS_KEY } from '../prototype/learningProgressPilot.js';

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: process.env.CHROMIUM_EXECUTABLE ? ['--no-zygote', '--single-process', '--disable-gpu'] : [],
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const action = name => page.locator(`#learning-unit-actions [data-learning-action="${name}"]`).tap();
  const answer = (kind, optionId) => page.locator(`#learning-unit-content [data-learning-action="${kind}"][data-option-id="${optionId}"]`).tap();

  await page.goto(process.env.PROTOTYPE_URL ?? 'http://127.0.0.1:4175/');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), LEARNING_PROGRESS_KEY), null);
  await page.locator('#start-button').tap();
  await page.locator('#grade-options [data-grade-id="grade-3"]').tap();
  await page.locator('#grade-subject-directory [data-subject-id="mathematics"]').tap();
  await page.locator('#level-start-button').tap();
  await page.locator('#explore-guide-dismiss').tap();

  const stone = page.locator('[data-object-id="number-obelisk"]');
  assert.equal(await stone.isDisabled(), true);
  for (const direction of ['left', 'left', 'left', 'left', 'up', 'up', 'up']) {
    await page.locator(`[data-move="${direction}"]`).tap();
  }
  await stone.tap();
  await page.locator('#number-secret-learning-start').tap();
  await action('start');
  for (const lesson of unit.lessonSteps) {
    await page.getByRole('heading', { name: lesson.title, exact: true }).waitFor();
    await action('lesson_next');
  }
  for (const [index, question] of unit.practiceQuestions.entries()) {
    if (index === 0) {
      const wrong = question.options.find(({ optionId }) => optionId !== question.answerId);
      await answer('practice_answer', wrong.optionId);
      await page.locator('#learning-unit-feedback.is-wrong').waitFor();
      await action('retry');
    }
    await answer('practice_answer', question.answerId);
    await action('practice_next');
  }
  await action('check_start');
  for (const question of unit.candidateCheckQuestions) {
    await answer('check_answer', question.answerId);
    await action('check_next');
  }
  await action('review');
  await page.getByRole('heading', { name: '完成一次學習流程' }).waitFor();
  await action('close');

  const storage = () => page.evaluate(key => ({
    pilot: JSON.parse(localStorage.getItem(key)),
    other: Object.entries(localStorage).filter(([name]) => name !== key).sort(),
  }), LEARNING_PROGRESS_KEY);
  const { pilot, other } = await storage();
  assert.equal(pilot.sessions.length, 1);
  const [{ attempts, correct, completed }] = pilot.sessions;
  assert.equal(attempts, unit.practiceQuestions.length + 1);
  assert.equal(correct, unit.practiceQuestions.length);
  assert.equal(completed, true);
  assert.ok(other.length > 0, 'The map must have saved its actual exploration progress');

  await page.getByRole('link', { name: '我的學習回顧' }).tap();
  const summary = page.getByText(`練習已完成；練習 ${attempts} 次，正確 ${correct} 次。`, { exact: false });
  await summary.waitFor();
  await page.getByText('建議回顧位值與數字表示。', { exact: false }).waitFor();
  await page.reload();
  await summary.waitFor();
  assert.deepEqual(await storage(), { pilot, other });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '清除學習紀錄' }).tap();
  await page.getByText('目前沒有學習紀錄。').waitFor();
  assert.deepEqual(await storage(), { pilot: null, other });
  await page.getByRole('link', { name: '返回學園' }).tap();
  await page.getByRole('link', { name: '我的學習回顧' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(`UX-01 390×844 touch PASS: island → obelisk → lessons → ${attempts} practice attempts (${correct} correct) → candidate check → review → reload → clear → return`);
} finally {
  await browser.close();
}
