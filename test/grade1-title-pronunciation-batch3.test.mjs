import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_GAP_CANDIDATE_TASKS } from '../prototype/data/officialGapCandidateTasks.js';
import { LEARNING_SUBITEM_EXPANSION_TASKS } from '../prototype/data/learningSubitemExpansionTasks.js';
import { MATH_CURRICULUM_GAP_TASKS } from '../prototype/data/mathCurriculumGapTasks.js';
import { getGradeById } from '../prototype/data/gradeCatalog.js';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

const han = /^\p{Script=Han}$/u;
const titleSpecs = [
  ['ACT-G1-MATH-NUMBER-LINE-POST-CANDIDATE', OFFICIAL_GAP_CANDIDATE_TASKS, '數字郵局：把信送到數線', 'ㄕㄨˋ ㄗˋ ㄧㄡˊ ㄐㄩˊ ㄅㄚˇ ㄒㄧㄣˋ ㄙㄨㄥˋ ㄉㄠˋ ㄕㄨˋ ㄒㄧㄢˋ'],
  ['ACT-G1-MATH-ZERO-PLACEHOLDER-EXPLORER-CANDIDATE', LEARNING_SUBITEM_EXPANSION_TASKS, '數字小工坊：看看個位的 0', 'ㄕㄨˋ ㄗˋ ㄒㄧㄠˇ ㄍㄨㄥ ㄈㄤ ㄎㄢˋ ˙ㄎㄢ ㄍㄜˋ ㄨㄟˋ ㄉㄜ˙'],
  ['ACT-G1-MATH-COMPARISON-DIFFERENCE-NUMBER-LINE-CANDIDATE', LEARNING_SUBITEM_EXPANSION_TASKS, '小小數線探險：多幾張', 'ㄒㄧㄠˇ ㄒㄧㄠˇ ㄕㄨˋ ㄒㄧㄢˋ ㄊㄢˋ ㄒㄧㄢˇ ㄉㄨㄛ ㄐㄧˇ ㄓㄤ'],
  ['ACT-G1-MATH-MONEY-COUNT-EXCHANGE-CANDIDATE', MATH_CURRICULUM_GAP_TASKS, '小小錢幣市集：數錢與找錢', 'ㄒㄧㄠˇ ㄒㄧㄠˇ ㄑㄧㄢˊ ㄅㄧˋ ㄕˋ ㄐㄧˊ ㄕㄨˇ ㄑㄧㄢˊ ㄩˇ ㄓㄠˇ ㄑㄧㄢˊ'],
  ['ACT-G1-MATH-LENGTH-COMPARE-ROPE-CANDIDATE', MATH_CURRICULUM_GAP_TASKS, '長度比較小徑：看哪條路較長', 'ㄔㄤˊ ㄉㄨˋ ㄅㄧˇ ㄐㄧㄠˋ ㄒㄧㄠˇ ㄐㄧㄥˋ ㄎㄢˋ ㄋㄚˇ ㄊㄧㄠˊ ㄌㄨˋ ㄐㄧㄠˋ ㄔㄤˊ'],
];

function assertTokens(text, tokens, readings, label) {
  assert.ok(Array.isArray(tokens) && tokens.length > 0, `${label} has titlePronunciationTokens`);
  assert.equal(tokens.map(({ text: tokenText }) => tokenText).join(''), text, `${label} tokens align with every original character`);
  const actualReadings = [];
  for (const token of tokens) {
    if (han.test(token.text)) {
      assert.ok(typeof token.reading === 'string' && token.reading.trim(), `${label}: ${token.text} has a reviewed reading`);
      actualReadings.push(token.reading);
    } else {
      assert.equal(token.reading, undefined, `${label}: non-Han ${JSON.stringify(token.text)} has no reading`);
    }
  }
  assert.deepEqual(actualReadings, readings.split(/\s+/u), `${label} readings are in the expected order`);
}

function assertRuby(text, tokens, label) {
  const markup = renderStudentText(text, tokens);
  const hanCount = Array.from(text).filter((character) => han.test(character)).length;
  assert.equal((markup.match(/class="zhuyin-pair"/gu) ?? []).length, hanCount, `${label} shows ruby for every Han character`);
}

test('Batch 3 五個數學活動完整標題對齊，並於卡片標題、描述及開啟標題呈現 ruby', () => {
  for (const [activityId, collection, expectedTitle, readings] of titleSpecs) {
    const activity = collection.find(({ activityId: id }) => id === activityId);
    assert.ok(activity, `${activityId} is present in its production data collection`);
    assert.equal(activity.title, expectedTitle, `${activityId} original title remains unchanged`);
    assertTokens(activity.title, activity.titlePronunciationTokens, readings, activityId);

    const chars = Array.from(activity.title);
    const separatorIndex = chars.indexOf('：');
    assert.ok(separatorIndex > 0, `${activityId} has the expected title-description separator`);
    let descriptionStart = separatorIndex + 1;
    while (/\s/u.test(chars[descriptionStart] ?? '')) descriptionStart += 1;
    let descriptionEnd = chars.length;
    while (descriptionEnd > descriptionStart && /\s/u.test(chars[descriptionEnd - 1])) descriptionEnd -= 1;
    const titleText = chars.slice(0, separatorIndex).join('');
    const descriptionText = chars.slice(descriptionStart, descriptionEnd).join('');
    const titleTokens = activity.titlePronunciationTokens.slice(0, separatorIndex);
    const descriptionTokens = activity.titlePronunciationTokens.slice(descriptionStart, descriptionEnd);
    assertTokens(titleText, titleTokens, titleTokens.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' '), `${activityId} card/open title segment`);
    assertTokens(descriptionText, descriptionTokens, descriptionTokens.filter(({ text }) => han.test(text)).map(({ reading }) => reading).join(' '), `${activityId} card description segment`);
    assertRuby(titleText, titleTokens, `${activityId} card title`);
    assertRuby(descriptionText, descriptionTokens, `${activityId} card description`);
    assertRuby(titleText, titleTokens, `${activityId} opened title`);
    assert.equal(activity.titlePronunciationTokens[separatorIndex].text, '：');
    assert.equal(activity.titlePronunciationTokens[separatorIndex].reading, undefined);
  }
});

test('一年級學生直接啟動活動仍是 26 個且無重複入口 ID', () => {
  const grade1 = getGradeById('grade-1');
  const directEntries = grade1.subjects.flatMap(({ existingYearLevelContent }) => (
    existingYearLevelContent.filter(({ entryRoute }) => entryRoute?.directLaunch === true)
  ));
  assert.equal(directEntries.length, 26);
  assert.equal(new Set(directEntries.map(({ activityId }) => activityId)).size, 26);
});
