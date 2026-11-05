import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE1_PLAYGROUND_SAFETY_ROUTE } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { CATALOG_CANDIDATE_TASK_BY_ID } from '../prototype/data/catalogCandidateTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const han = /^\p{Script=Han}$/u;
const expectedTitle = '安全路線小隊：遊戲場與上下學任務';
const expectedReadings = 'ㄢ ㄑㄩㄢˊ ㄌㄨˋ ㄒㄧㄢˋ ㄒㄧㄠˇ ㄉㄨㄟˋ ㄧㄡˊ ㄒㄧˋ ㄔㄤˇ ㄩˇ ㄕㄤˋ ㄒㄧㄚˋ ㄒㄩㄝˊ ㄖㄣˋ ㄨˋ';

function assertTokens(text, tokens, readings, label) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `${label} has titlePronunciationTokens`);
  assert.equal(tokens.map(({ text: tokenText }) => tokenText).join(''), text, `${label} token text aligns exactly`);
  const actualReadings = [];
  for (const token of tokens) {
    if (han.test(token.text)) {
      assert.ok(typeof token.reading === 'string' && token.reading.trim(), `${label}: ${token.text} has a reading`);
      actualReadings.push(token.reading);
    } else {
      assert.equal(token.reading, undefined, `${label}: non-Han ${JSON.stringify(token.text)} has no fabricated reading`);
    }
  }
  assert.deepEqual(actualReadings, readings.split(/\s+/u), `${label} readings match the reviewed sequence`);
}

function assertRuby(text, tokens, label) {
  const markup = renderStudentText(text, tokens);
  const hanCount = Array.from(text).filter((character) => han.test(character)).length;
  assert.equal((markup.match(/class="zhuyin-pair"/gu) ?? []).length, hanCount, `${label} renders ruby for each Han character`);
  assert.equal((markup.match(/class="zhuyin-reading"/gu) ?? []).length, hanCount, `${label} renders a reading column for each Han character`);
}

test('安全路線活動完整標題 tokens 對齊，卡片標題、描述與開啟標題皆產生 ruby', () => {
  const activity = GRADE1_PLAYGROUND_SAFETY_ROUTE;
  assert.equal(activity.activityId, 'ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE');
  assert.equal(activity.title, expectedTitle, 'original activity title remains unchanged');
  const tokens = activity.titlePronunciationTokens;
  assertTokens(activity.title, tokens, expectedReadings, activity.activityId);

  const chars = Array.from(activity.title);
  const colonIndex = chars.indexOf('：');
  assert.ok(colonIndex > 0, 'title contains the full-width colon');
  const titleText = chars.slice(0, colonIndex).join('');
  const descriptionText = chars.slice(colonIndex + 1).join('');
  const titleTokens = tokens.slice(0, colonIndex);
  const descriptionTokens = tokens.slice(colonIndex + 1);
  const readingsFor = (segment) => segment.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' ');
  assertTokens(titleText, titleTokens, readingsFor(titleTokens), 'card/open title segment');
  assertTokens(descriptionText, descriptionTokens, readingsFor(descriptionTokens), 'card description segment');
  assertRuby(titleText, titleTokens, 'card title');
  assertRuby(descriptionText, descriptionTokens, 'card description');
  assertRuby(titleText, titleTokens, 'opened activity title');
  assert.equal(tokens[colonIndex].text, '：');
  assert.equal(tokens[colonIndex].reading, undefined, 'colon has no reading');
});

test('一年級 26 個直接啟動活動均有逐字對齊的標題注音 metadata', () => {
  const grade1 = getGradeById('grade-1');
  const directEntries = grade1.subjects.flatMap(({ existingYearLevelContent }) => (
    existingYearLevelContent.filter(({ entryRoute }) => entryRoute?.directLaunch === true)
  ));
  assert.equal(directEntries.length, 26);
  assert.equal(new Set(directEntries.map(({ activityId }) => activityId)).size, 26);
  for (const { activityId } of directEntries) {
    const activity = CATALOG_CANDIDATE_TASK_BY_ID.get(activityId);
    assert.ok(activity, `${activityId} resolves to production activity data`);
    assertTokens(activity.title, activity.titlePronunciationTokens, activity.titlePronunciationTokens
      .filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' '), activityId);
  }
});
