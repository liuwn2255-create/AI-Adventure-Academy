import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

test('plain student text remains escaped and unchanged when pronunciation tokens are absent', () => {
  assert.equal(renderStudentText('普通題目與答案'), '普通題目與答案');
  assert.equal(renderStudentText('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});

test('reviewed Zhuyin tokens generate accessible character pairs while punctuation stays plain', () => {
  const tokens = [
    { text: '天', reading: 'ㄊㄧㄢ' },
    { text: '空', reading: 'ㄎㄨㄥ' },
    { text: '，' },
    { text: '雨', reading: 'ㄩˇ' },
    { text: '？' },
  ];
  const rendered = renderStudentText('天空，雨？', tokens);
  assert.match(rendered, /class="zhuyin-pair"/);
  assert.match(rendered, /class="zhuyin-hanzi">天<\/span>/);
  assert.match(rendered, /class="zhuyin-reading" aria-hidden="true"><span class="zhuyin-glyph-column"><span class="zhuyin-glyph">ㄊ<\/span><span class="zhuyin-glyph">ㄧ<\/span><span class="zhuyin-glyph">ㄢ<\/span><\/span><\/span>/);
  assert.match(rendered, /class="zhuyin-tone">ˇ<\/span>/);
  assert.equal(rendered.includes('，'), true);
  assert.equal(rendered.includes('？'), true);
  assert.equal((rendered.match(/class="zhuyin-pair"/g) ?? []).length, 3);
  assert.doesNotMatch(rendered, /<ruby|<rb|<rt/);
});

test('平聲調、仄聲調與前置輕聲符號保留在同一組視覺注音中', () => {
  const rendered = renderStudentText('下雨了嗎', [
    { text: '下', reading: 'ㄒㄧㄚˋ' },
    { text: '雨', reading: 'ㄩˇ' },
    { text: '了', reading: '˙ㄌㄜ' },
    { text: '嗎', reading: 'ㄇㄚˊ' },
  ]);
  assert.match(rendered, /class="zhuyin-glyph">ㄒ<\/span><span class="zhuyin-glyph">ㄧ<\/span><span class="zhuyin-glyph">ㄚ<\/span><\/span><span class="zhuyin-tone">ˋ<\/span>/);
  assert.match(rendered, /class="zhuyin-glyph">ㄩ<\/span><\/span><span class="zhuyin-tone">ˇ<\/span>/);
  assert.match(rendered, /class="zhuyin-glyph-column"><span class="zhuyin-glyph">ㄌ<\/span><span class="zhuyin-glyph">ㄜ<\/span><\/span><span class="zhuyin-tone zhuyin-tone-neutral">˙<\/span>/);
  assert.match(rendered, /class="zhuyin-glyph">ㄇ<\/span><span class="zhuyin-glyph">ㄚ<\/span><\/span><span class="zhuyin-tone">ˊ<\/span>/);
  assert.equal((rendered.match(/aria-hidden="true"/g) ?? []).length, 4);
});

test('options use the same pair renderer and malformed tokens/readings remain safe', () => {
  const option = renderStudentText('雨傘', [
    { text: '雨', reading: 'ㄩˇ' }, { text: '傘', reading: 'ㄙㄢˇ' },
  ]);
  assert.equal((option.match(/class="zhuyin-pair"/g) ?? []).length, 2);
  assert.match(option, /class="zhuyin-pair"><span class="zhuyin-hanzi">雨<\/span><span class="zhuyin-reading" aria-hidden="true"><span class="zhuyin-glyph-column"><span class="zhuyin-glyph">ㄩ<\/span><\/span><span class="zhuyin-tone">ˇ<\/span><\/span><\/span>/);
  assert.equal(renderStudentText('天空', [{ text: '雨', reading: 'ㄩˇ' }]), '天空');
  const maliciousReading = `</span><img src=x onerror="alert(1)"'>&`;
  const safeOutput = renderStudentText('天', [{ text: '天', reading: maliciousReading }]);
  assert.match(safeOutput, /class="zhuyin-pair"/);
  assert.match(safeOutput, /&lt;/);
  assert.match(safeOutput, /&gt;/);
  assert.match(safeOutput, /&amp;/);
  assert.match(safeOutput, /&quot;/);
  assert.match(safeOutput, /&#39;/);
  assert.doesNotMatch(safeOutput, /<script\b|<img\b|onerror\s*=|<svg\b/i);
  assert.doesNotMatch(safeOutput, /onclick\s*=|javascript:/i);
  const openingTags = safeOutput.match(/<span\b[^>]*>/g) ?? [];
  assert.ok(openingTags.length > 0, 'renderer-owned span structure remains present');
  assert.ok(openingTags.every((tag) => /^<span class="zhuyin-(?:pair|hanzi|reading|glyph-column|glyph|tone)(?: zhuyin-tone-neutral)?"(?: aria-hidden="true")?>$/.test(tag)), 'malicious input cannot add HTML attributes or new elements');
  assert.doesNotMatch(safeOutput, /<\/?(?:script|img|svg)\b/i, 'data-derived markup remains escaped while trusted spans remain allowed');
});
