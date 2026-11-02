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
  assert.equal(rendered, '<span class="zhuyin-pair"><span class="zhuyin-hanzi">天</span><span class="zhuyin-reading" aria-hidden="true">ㄊㄧㄢ</span></span><span class="zhuyin-pair"><span class="zhuyin-hanzi">空</span><span class="zhuyin-reading" aria-hidden="true">ㄎㄨㄥ</span></span>，<span class="zhuyin-pair"><span class="zhuyin-hanzi">雨</span><span class="zhuyin-reading" aria-hidden="true">ㄩˇ</span></span>？');
  assert.equal((rendered.match(/class="zhuyin-pair"/g) ?? []).length, 3);
  assert.doesNotMatch(rendered, /<ruby|<rb|<rt/);
});

test('options use the same pair renderer and malformed tokens/readings remain safe', () => {
  const option = renderStudentText('雨傘', [
    { text: '雨', reading: 'ㄩˇ' }, { text: '傘', reading: 'ㄙㄢˇ' },
  ]);
  assert.equal((option.match(/class="zhuyin-pair"/g) ?? []).length, 2);
  assert.equal(option.includes('aria-hidden="true">ㄩˇ'), true);
  assert.equal(renderStudentText('天空', [{ text: '雨', reading: 'ㄩˇ' }]), '天空');
  assert.equal(renderStudentText('天', [{ text: '天', reading: '</span><img src=x>' }]), '<span class="zhuyin-pair"><span class="zhuyin-hanzi">天</span><span class="zhuyin-reading" aria-hidden="true">&lt;/span&gt;&lt;img src=x&gt;</span></span>');
});
