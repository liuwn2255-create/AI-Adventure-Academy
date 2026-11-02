import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStudentText } from '../prototype/studentTextRenderer.js';

test('plain student text remains escaped and unchanged when pronunciation tokens are absent', () => {
  assert.equal(renderStudentText('普通題目與答案'), '普通題目與答案');
  assert.equal(renderStudentText('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});

test('reviewed Zhuyin tokens generate ruby for characters while punctuation stays plain', () => {
  const tokens = [
    { text: '天', reading: 'ㄊㄧㄢ' },
    { text: '空', reading: 'ㄎㄨㄥ' },
    { text: '，' },
    { text: '雨', reading: 'ㄩˇ' },
    { text: '？' },
  ];
  const rendered = renderStudentText('天空，雨？', tokens);
  assert.equal(rendered, '<ruby><rb>天</rb><rt>ㄊㄧㄢ</rt></ruby><ruby><rb>空</rb><rt>ㄎㄨㄥ</rt></ruby>，<ruby><rb>雨</rb><rt>ㄩˇ</rt></ruby>？');
  assert.equal((rendered.match(/<ruby>/g) ?? []).length, 3);
});

test('mismatched tokens fall back to escaped original text and readings cannot inject markup', () => {
  assert.equal(renderStudentText('天空', [{ text: '雨', reading: 'ㄩˇ' }]), '天空');
  assert.equal(renderStudentText('天', [{ text: '天', reading: '</rt><img src=x>' }]), '<ruby><rb>天</rb><rt>&lt;/rt&gt;&lt;img src=x&gt;</rt></ruby>');
});
