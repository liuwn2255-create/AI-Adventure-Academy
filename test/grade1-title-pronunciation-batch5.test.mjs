import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE1_LIVING_CHANGE_DETECTIVE } from '../prototype/data/grade1LivingChangeDetective.js';
import { GRADE1_HPE_EXPANSION_ACTIVITIES } from '../prototype/data/grade1HpeExpansionActivities.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const han = /^\p{Script=Han}$/u;
const activities = [
  [GRADE1_LIVING_CHANGE_DETECTIVE, '生活變化偵探：找出前後不同', 'ㄕㄥ ㄏㄨㄛˊ ㄅㄧㄢˋ ㄏㄨㄚˋ ㄓㄣ ㄊㄢˋ ㄓㄠˇ ㄔㄨ ㄑㄧㄢˊ ㄏㄡˋ ㄅㄨˋ ㄊㄨㄥˊ'],
  ...[
    ['ACT-G1-HPE-HYGIENE-HABITS-CANDIDATE', '健康小偵探：衛生習慣與洗手', 'ㄐㄧㄢˋ ㄎㄤ ㄒㄧㄠˇ ㄓㄣ ㄊㄢˋ ㄨㄟˋ ㄕㄥ ㄒㄧˊ ㄍㄨㄢˋ ㄩˇ ㄒㄧˇ ㄕㄡˇ'],
    ['ACT-G1-HPE-SAFE-WARMUP-MOVEMENT-CANDIDATE', '暖身安全小隊：運動前的準備', 'ㄋㄨㄢˇ ㄕㄣ ㄢ ㄑㄩㄢˊ ㄒㄧㄠˇ ㄉㄨㄟˋ ㄩㄣˋ ㄉㄨㄥˋ ㄑㄧㄢˊ ㄉㄜ˙ ㄓㄨㄣˇ ㄅㄟˋ'],
    ['ACT-G1-HPE-ACTIVITY-CHOICE-BENEFITS-CANDIDATE', '活力運動家：運動益處與活動選擇', 'ㄏㄨㄛˊ ㄌㄧˋ ㄩㄣˋ ㄉㄨㄥˋ ㄐㄧㄚ ㄩㄣˋ ㄉㄨㄥˋ ㄧˋ ㄔㄨˋ ㄩˇ ㄏㄨㄛˊ ㄉㄨㄥˋ ㄒㄩㄢˇ ㄗㄜˊ'],
    ['ACT-G1-HPE-FOOD-DIET-HABITS-CANDIDATE', '健康生活家：認識食物與飲食習慣', 'ㄐㄧㄢˋ ㄎㄤ ㄕㄥ ㄏㄨㄛˊ ㄐㄧㄚ ㄖㄣˋ ㄕˋ ㄕˊ ㄨˋ ㄩˇ ㄧㄣˇ ㄕˊ ㄒㄧˊ ㄍㄨㄢˋ'],
  ].map(([id, title, readings]) => [
    GRADE1_HPE_EXPANSION_ACTIVITIES.find(({ activityId }) => activityId === id), title, readings,
  ]),
];

function assertTokens(text, tokens, expectedReadings, label) {
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
  assert.deepEqual(actualReadings, expectedReadings.split(/\s+/u), `${label} readings match the reviewed sequence`);
}

function assertRuby(text, tokens, label) {
  const markup = renderStudentText(text, tokens);
  const hanCount = Array.from(text).filter((character) => han.test(character)).length;
  assert.equal((markup.match(/class="zhuyin-pair"/gu) ?? []).length, hanCount, `${label} has ruby for every Han character`);
  assert.equal((markup.match(/class="zhuyin-reading"/gu) ?? []).length, hanCount, `${label} has a reading column for every Han character`);
}

test('Batch 5 五個活動標題逐字對齊，且卡片標題、描述與開啟標題均產生 ruby', () => {
  assert.equal(activities.length, 5);
  for (const [activity, expectedTitle, expectedReadings] of activities) {
    assert.ok(activity, 'specified activity exists in production data');
    assert.equal(activity.title, expectedTitle, `${activity.activityId} keeps its original title`);
    assertTokens(activity.title, activity.titlePronunciationTokens, expectedReadings, activity.activityId);

    const chars = Array.from(activity.title);
    const colonIndex = chars.indexOf('：');
    assert.ok(colonIndex > 0, `${activity.activityId} has the full-width colon`);
    const titleText = chars.slice(0, colonIndex).join('');
    let descriptionStart = colonIndex + 1;
    while (/\s/u.test(chars[descriptionStart] ?? '')) descriptionStart += 1;
    let descriptionEnd = chars.length;
    while (descriptionEnd > descriptionStart && /\s/u.test(chars[descriptionEnd - 1])) descriptionEnd -= 1;
    const descriptionText = chars.slice(descriptionStart, descriptionEnd).join('');
    const titleTokens = activity.titlePronunciationTokens.slice(0, colonIndex);
    const descriptionTokens = activity.titlePronunciationTokens.slice(descriptionStart, descriptionEnd);
    const titleReadings = titleTokens.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' ');
    const descriptionReadings = descriptionTokens.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' ');
    assertTokens(titleText, titleTokens, titleReadings, `${activity.activityId} title segment`);
    assertTokens(descriptionText, descriptionTokens, descriptionReadings, `${activity.activityId} description segment`);
    assertRuby(titleText, titleTokens, `${activity.activityId} card title`);
    assertRuby(descriptionText, descriptionTokens, `${activity.activityId} card description`);
    assertRuby(titleText, titleTokens, `${activity.activityId} opened title`);
    assert.equal(activity.titlePronunciationTokens[colonIndex].text, '：');
    assert.equal(activity.titlePronunciationTokens[colonIndex].reading, undefined, `${activity.activityId} colon has no reading`);
  }
});

test('Batch 5 不改變一年級 26 個直接啟動入口', () => {
  const grade1 = getGradeById('grade-1');
  const directEntries = grade1.subjects.flatMap(({ existingYearLevelContent }) => (
    existingYearLevelContent.filter(({ entryRoute }) => entryRoute?.directLaunch === true)
  ));
  assert.equal(directEntries.length, 26);
  assert.equal(new Set(directEntries.map(({ activityId }) => activityId)).size, 26);
});
