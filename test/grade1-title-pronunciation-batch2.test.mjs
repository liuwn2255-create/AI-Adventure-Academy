import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE1_CHINESE_STORY_CARDS } from '../prototype/data/grade1ChineseStoryCards.js';
import { GRADE1_MATH_QUANTITY_GARDEN } from '../prototype/data/grade1MathQuantityGarden.js';
import { GRADE1_MATH_COUNTER_STORY } from '../prototype/data/grade1MathCounterStory.js';
import { GRADE1_MATH_CLASSIFICATION_WORKSHOP } from '../prototype/data/grade1MathClassificationWorkshop.js';
import { GRADE1_SHAPE_COPY_STUDIO } from '../prototype/data/earlyGradeCurriculumGapTasks.js';
import { GRADE1_CHINESE_SENTENCE_TRAIN } from '../prototype/data/grade1ChineseSentenceTrain.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const han = /^\p{Script=Han}$/u;
const batch2 = [
  [GRADE1_CHINESE_STORY_CARDS, 'ㄍㄨˋ ㄕˋ ㄎㄚˇ ㄆㄞˊ ㄆㄞˊ ㄉㄨㄟˋ ㄓㄠˇ ㄏㄨㄟˊ ㄒㄧㄠˇ ㄑㄧㄡˊ'],
  [GRADE1_MATH_QUANTITY_GARDEN, 'ㄕㄨˋ ㄗˋ ㄍㄨㄛˇ ㄩㄢˊ ㄕㄨˋ ㄌㄧㄤˋ ㄓㄨㄤ ㄒㄧㄤ'],
  [GRADE1_MATH_COUNTER_STORY, 'ㄏㄨㄚ ㄆㄧㄢˋ ㄍㄨˋ ㄕˋ ㄐㄩˋ ㄔㄤˇ ㄏㄜˊ ㄑㄧˇ ㄌㄞˊ ㄩˇ ㄋㄚˊ ㄗㄡˇ'],
  [GRADE1_MATH_CLASSIFICATION_WORKSHOP, 'ㄈㄣ ㄌㄟˋ ㄒㄧㄠˇ ㄒㄧㄠˇ ㄧㄢˊ ㄐㄧㄡˋ ㄓㄢˋ ㄊㄨㄥˊ ㄧˋ ㄗㄨˇ ㄨˋ ㄆㄧㄣˇ ㄌㄧㄤˇ ㄓㄨㄥˇ ㄈㄣ ㄈㄚˇ'],
  [GRADE1_SHAPE_COPY_STUDIO, 'ㄍㄜˊ ˙ㄗ ㄆㄧㄣ ㄆㄧㄣ ㄅㄢˇ ㄩㄥˋ ㄓㄥˋ ㄈㄤ ㄒㄧㄥˊ ㄊㄧㄢˊ ㄇㄢˇ ㄍㄜˊ ˙ㄗ'],
];

function checkTokens(text, tokens, expectedReadings, label) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `${label} has title pronunciation metadata`);
  assert.equal(tokens.map(({ text: tokenText }) => tokenText).join(''), text, `${label} token text aligns exactly`);
  const actualReadings = [];
  for (const token of tokens) {
    if (han.test(token.text)) {
      assert.ok(typeof token.reading === 'string' && token.reading.trim(), `${label}: ${token.text} has a reading`);
      actualReadings.push(token.reading);
    } else {
      assert.equal(token.reading, undefined, `${label}: ${token.text} has no fabricated reading`);
    }
  }
  assert.deepEqual(actualReadings, expectedReadings.trim().split(/\s+/u), `${label} readings match the reviewed sequence`);
}

function assertRuby(text, tokens, label) {
  const markup = renderStudentText(text, tokens);
  const hanCount = Array.from(text).filter((character) => han.test(character)).length;
  assert.equal((markup.match(/class="zhuyin-pair"/gu) ?? []).length, hanCount, `${label} renders ruby for every Han character`);
  assert.equal((markup.match(/class="zhuyin-reading"/gu) ?? []).length, hanCount, `${label} renders reading columns for every Han character`);
  return markup;
}

test('Batch 2 五個一年級活動標題 metadata 對齊並在標題、描述與開啟標題產生 ruby', () => {
  assert.equal(batch2.length, 5);
  for (const [activity, readings] of batch2) {
    checkTokens(activity.title, activity.titlePronunciationTokens, readings, activity.activityId);
    const chars = Array.from(activity.title);
    const colonIndex = chars.indexOf('：');
    assert.ok(colonIndex > 0, `${activity.activityId} has the expected full-width colon`);
    const titleText = chars.slice(0, colonIndex).join('');
    const descriptionText = chars.slice(colonIndex + 1).join('').trim();
    let descriptionStart = colonIndex + 1;
    while (/\s/u.test(chars[descriptionStart] ?? '')) descriptionStart += 1;
    let descriptionEnd = chars.length;
    while (descriptionEnd > descriptionStart && /\s/u.test(chars[descriptionEnd - 1])) descriptionEnd -= 1;
    const titleTokens = activity.titlePronunciationTokens.slice(0, colonIndex);
    const descriptionTokens = activity.titlePronunciationTokens.slice(descriptionStart, descriptionEnd);
    checkTokens(titleText, titleTokens, readingsFor(titleTokens), `${activity.activityId} card/open title`);
    checkTokens(descriptionText, descriptionTokens, readingsFor(descriptionTokens), `${activity.activityId} card description`);
    assertRuby(titleText, titleTokens, `${activity.activityId} card title`);
    assertRuby(descriptionText, descriptionTokens, `${activity.activityId} card description`);
    assertRuby(titleText, titleTokens, `${activity.activityId} opened title`);
    assert.equal(activity.titlePronunciationTokens[colonIndex].text, '：');
    assert.equal(activity.titlePronunciationTokens[colonIndex].reading, undefined);
  }
});

function readingsFor(tokens) {
  return tokens.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' ');
}

test('句子列車的「句子」使用教育部辭典所列輕聲，且一年級活動入口總數不變', () => {
  const activity = GRADE1_CHINESE_SENTENCE_TRAIN;
  const titleTokens = activity.titlePronunciationTokens;
  checkTokens(activity.title, titleTokens, 'ㄐㄩˋ ㄗ˙ ㄌㄧㄝˋ ㄔㄜ ㄘˊ ㄎㄚˇ ㄆㄞˊ ㄧˋ ㄆㄞˊ', activity.activityId);
  const grade1 = getGradeById('grade-1');
  const directLaunchEntries = grade1.subjects.flatMap(({ existingYearLevelContent }) => (
    existingYearLevelContent.filter(({ entryRoute }) => entryRoute?.directLaunch === true)
  ));
  assert.equal(directLaunchEntries.length, 26);
  assert.equal(new Set(directLaunchEntries.map(({ activityId }) => activityId)).size, 26);
});
