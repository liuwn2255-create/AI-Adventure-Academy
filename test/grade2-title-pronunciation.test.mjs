import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const HAN = /^\p{Script=Han}$/u;

test('all 22 grade 2 launchable activities have aligned manually supplied title pronunciation tokens', () => {
  const activities = CATALOG_CANDIDATE_TASKS.filter((activity) => activity.gradeId === 'grade-2');
  assert.equal(activities.length, 22);

  for (const activity of activities) {
    const tokens = activity.titlePronunciationTokens;
    assert.ok(Array.isArray(tokens) && tokens.length > 0, `${activity.activityId} title tokens`);
    assert.equal(tokens.map(({ text }) => text).join(''), activity.title, `${activity.activityId} alignment`);
    assert.equal(tokens.filter(({ reading }) => Boolean(reading)).length, [...activity.title].filter((character) => HAN.test(character)).length, `${activity.activityId} Han coverage`);
    for (const token of tokens) {
      if (HAN.test(token.text)) assert.ok(token.reading, `${activity.activityId} missing reading for ${token.text}`);
      else assert.equal(token.reading, undefined, `${activity.activityId} non-Han token must not have reading`);
    }

    const markup = renderStudentText(activity.title, tokens);
    assert.equal((markup.match(/class="zhuyin-pair"/gu) ?? []).length, [...activity.title].filter((character) => HAN.test(character)).length, `${activity.activityId} rendered Hanzi pairs`);
    assert.ok(markup.includes(activity.title.includes('：') ? '：' : activity.title), `${activity.activityId} punctuation retained`);
  }
});

test('digit, punctuation and spacing tokens stay literal and unannotated', () => {
  const activities = CATALOG_CANDIDATE_TASKS.filter((activity) => activity.gradeId === 'grade-2');
  const nonHan = activities.flatMap(({ titlePronunciationTokens }) => titlePronunciationTokens).filter(({ text }) => !HAN.test(text));
  assert.ok(nonHan.length > 0);
  assert.ok(nonHan.some(({ text }) => /\d/u.test(text)));
  assert.ok(nonHan.some(({ text }) => /[：，、？]/u.test(text)));
  assert.ok(nonHan.every(({ reading }) => reading === undefined));
});
