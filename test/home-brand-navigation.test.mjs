import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');

test('品牌連結不只更新 hash，也透過共用 screen router 顯示首頁', () => {
  const handler = app.match(/document\.querySelector\('\.brand'\)\?\.addEventListener\('click', \(event\) => \{([\s\S]*?)\n\}\);/);
  assert.ok(handler, '品牌連結需要 click handler');
  assert.match(html, /<a class="brand" href="#home" aria-label="回到學園首頁">/);
  assert.match(handler[1], /event\.preventDefault\(\)/);
  assert.match(handler[1], /history\.replaceState\(window\.history\.state, '', '#home'\)/);
  assert.match(handler[1], /showScreen\('home'\)/);
  assert.match(app, /for \(const \[screenName, element\] of Object\.entries\(screens\)\) element\.hidden = screenName !== name/);
});

test('候選活動進行中或完成時都由同一首頁導覽離開活動畫面', () => {
  assert.match(html, /id="catalog-task-screen"/);
  assert.match(app, /showScreen\('catalog-task'\)/);
  const handler = app.match(/document\.querySelector\('\.brand'\)\?\.addEventListener\('click', \(event\) => \{([\s\S]*?)\n\}\);/);
  assert.ok(handler);
  assert.doesNotMatch(handler[1], /activeCatalogTaskSession|completed|stageIndex|return/);
  assert.match(handler[1], /showScreen\('home'\)/);
});

test('首頁主要入口、三年級路線與語音偏好不受品牌導覽影響', () => {
  assert.match(app, /document\.getElementById\('start-button'\)\.addEventListener\('click', \(\) => showScreen\('select'\)\)/);
  assert.match(app, /startGrade3MathRepairMainline/);
  assert.match(app, /renderGrade3MathAdventureMap\(\)/);
  assert.match(app, /document\.getElementById\('curriculum-picker-button'\)\.addEventListener/);
  const handler = app.match(/document\.querySelector\('\.brand'\)\?\.addEventListener\('click', \(event\) => \{([\s\S]*?)\n\}\);/);
  assert.ok(handler);
  assert.doesNotMatch(handler[1], /speech|localStorage|setSpeechEnabled/i);
});
