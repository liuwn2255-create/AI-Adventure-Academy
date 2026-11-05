import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE1_LIVING_EXPANSION_ACTIVITIES } from '../prototype/data/grade1LivingExpansionActivities.js';
import { GRADE1_LIVING_OBJECT_SORT } from '../prototype/data/grade1LivingObjectSort.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const han = /^\p{Script=Han}$/u;
const specs = [
  ['ACT-G1-LIVING-SHARED-PLAY-RULES-CANDIDATE', '輪流小隊：大家一起讀故事', 'ㄌㄨㄣˊ ㄌㄧㄡˊ ㄒㄧㄠˇ ㄉㄨㄟˋ ㄉㄚˋ ㄐㄧㄚ ㄧˋ ㄑㄧˇ ㄉㄨˊ ㄍㄨˋ ㄕˋ'],
  ['ACT-G1-LIVING-CAMPUS-CLUE-HUNT-CANDIDATE', '校園觀察隊：找出角落線索', 'ㄒㄧㄠˋ ㄩㄢˊ ㄍㄨㄢ ㄔㄚˊ ㄉㄨㄟˋ ㄓㄠˇ ㄔㄨ ㄐㄧㄠˇ ㄌㄨㄛˋ ㄒㄧㄢˋ ㄙㄨㄛˇ'],
  ['ACT-G1-LIVING-SMALL-PROBLEM-SOLVER-CANDIDATE', '小小解決隊：照線索排步驟', 'ㄒㄧㄠˇ ㄒㄧㄠˇ ㄐㄧㄝˇ ㄐㄩㄝˊ ㄉㄨㄟˋ ㄓㄠˋ ㄒㄧㄢˋ ㄙㄨㄛˇ ㄆㄞˊ ㄅㄨˋ ㄗㄡˋ'],
  ['ACT-G1-LIVING-OBSERVATION-MINI-INQUIRY-CANDIDATE', '觀察記錄小隊：比較兩個地方', 'ㄍㄨㄢ ㄔㄚˊ ㄐㄧˋ ㄌㄨˋ ㄒㄧㄠˇ ㄉㄨㄟˋ ㄅㄧˇ ㄐㄧㄠˋ ㄌㄧㄤˇ ㄍㄜˋ ㄉㄧˋ ㄈㄤ'],
  ['ACT-G1-LIVING-OBJECT-SORT-CANDIDATE', '生活探索隊：自然物與人造物', 'ㄕㄥ ㄏㄨㄛˊ ㄊㄢˋ ㄙㄨㄛˇ ㄉㄨㄟˋ ㄗˋ ㄖㄢˊ ㄨˋ ㄩˇ ㄖㄣˊ ㄗㄠˋ ㄨˋ'],
];

function checkTokens(text, tokens, expectedReadings, label) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `${label} has titlePronunciationTokens`);
  assert.equal(tokens.map(({ text: tokenText }) => tokenText).join(''), text, `${label} tokens align with original text`);
  const actualReadings = [];
  for (const token of tokens) {
    if (han.test(token.text)) {
      assert.ok(typeof token.reading === 'string' && token.reading.trim(), `${label}: ${token.text} has a reading`);
      actualReadings.push(token.reading);
    } else {
      assert.equal(token.reading, undefined, `${label}: non-Han ${JSON.stringify(token.text)} has no reading`);
    }
  }
  assert.deepEqual(actualReadings, expectedReadings.split(/\s+/u), `${label} readings are contextually correct`);
}

function assertRuby(text, tokens, label) {
  const markup = renderStudentText(text, tokens);
  const expectedPairs = Array.from(text).filter((character) => han.test(character)).length;
  assert.equal((markup.match(/class="zhuyin-pair"/gu) ?? []).length, expectedPairs, `${label} has ruby for every Han character`);
}

test('五個生活活動標題 tokens 對齊，並在卡片標題、描述與開啟標題產生 ruby', () => {
  const expansionById = new Map(GRADE1_LIVING_EXPANSION_ACTIVITIES.map((activity) => [activity.activityId, activity]));
  const activities = specs.map(([activityId]) => activityId === GRADE1_LIVING_OBJECT_SORT.activityId
    ? GRADE1_LIVING_OBJECT_SORT
    : expansionById.get(activityId));
  assert.equal(activities.filter(Boolean).length, 5);

  for (const [index, activity] of activities.entries()) {
    const [, expectedTitle, expectedReadings] = specs[index];
    assert.equal(activity.title, expectedTitle, `${activity.activityId} keeps its original title`);
    checkTokens(activity.title, activity.titlePronunciationTokens, expectedReadings, activity.activityId);

    const chars = Array.from(activity.title);
    const separatorIndex = chars.indexOf('：');
    assert.ok(separatorIndex > 0, `${activity.activityId} has a full-width title separator`);
    let descriptionStart = separatorIndex + 1;
    while (/\s/u.test(chars[descriptionStart] ?? '')) descriptionStart += 1;
    let descriptionEnd = chars.length;
    while (descriptionEnd > descriptionStart && /\s/u.test(chars[descriptionEnd - 1])) descriptionEnd -= 1;
    const titleText = chars.slice(0, separatorIndex).join('');
    const descriptionText = chars.slice(descriptionStart, descriptionEnd).join('');
    const titleTokens = activity.titlePronunciationTokens.slice(0, separatorIndex);
    const descriptionTokens = activity.titlePronunciationTokens.slice(descriptionStart, descriptionEnd);
    checkTokens(titleText, titleTokens, titleTokens.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' '), `${activity.activityId} card/open title segment`);
    checkTokens(descriptionText, descriptionTokens, descriptionTokens.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' '), `${activity.activityId} card description segment`);
    assertRuby(titleText, titleTokens, `${activity.activityId} card title`);
    assertRuby(descriptionText, descriptionTokens, `${activity.activityId} card description`);
    assertRuby(titleText, titleTokens, `${activity.activityId} opened title`);
    assert.equal(activity.titlePronunciationTokens[separatorIndex].text, '：');
    assert.equal(activity.titlePronunciationTokens[separatorIndex].reading, undefined);
  }
});

test('生活探索隊入口加入注音不改變一年級 26 個直接啟動入口', () => {
  const grade1 = getGradeById('grade-1');
  const directEntries = grade1.subjects.flatMap(({ existingYearLevelContent }) => (
    existingYearLevelContent.filter(({ entryRoute }) => entryRoute?.directLaunch === true)
  ));
  assert.equal(directEntries.length, 26);
  assert.equal(new Set(directEntries.map(({ activityId }) => activityId)).size, 26);
});
