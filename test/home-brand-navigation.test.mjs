import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG } from '../prototype/data/gradeCatalog.js';

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
  const startHandlerStart = app.indexOf("document.getElementById('start-button').addEventListener");
  const brandHandlerStart = app.indexOf("document.querySelector('.brand')?.addEventListener", startHandlerStart);
  assert.ok(startHandlerStart >= 0 && brandHandlerStart > startHandlerStart, 'home start handler is present before the brand handler');
  const startHandler = app.slice(startHandlerStart, brandHandlerStart);
  assert.match(startHandler, /selectedGradeId\s*=\s*null/);
  assert.match(startHandler, /selectedSubjectId\s*=\s*null/);
  assert.match(startHandler, /renderGradeSelection\s*\(\s*\)/);
  assert.match(startHandler, /showScreen\s*\(\s*['"]select['"]\s*\)/);
  const selectedGradeResetIndex = startHandler.search(/selectedGradeId\s*=\s*null/);
  const selectedSubjectResetIndex = startHandler.search(/selectedSubjectId\s*=\s*null/);
  const renderSelectionIndex = startHandler.search(/renderGradeSelection\s*\(\s*\)/);
  const showSelectionIndex = startHandler.search(/showScreen\s*\(\s*['"]select['"]\s*\)/);
  assert.ok(
    selectedGradeResetIndex >= 0 && selectedSubjectResetIndex >= 0
      && selectedGradeResetIndex < renderSelectionIndex
      && selectedSubjectResetIndex < renderSelectionIndex
      && renderSelectionIndex < showSelectionIndex,
    'the start handler clears selection, renders the grade picker, then shows it',
  );
  const selectionRendererStart = app.indexOf('function renderGradeSelection()');
  const selectionRendererEnd = app.indexOf('function ', selectionRendererStart + 1);
  const selectionRenderer = app.slice(selectionRendererStart, selectionRendererEnd);
  assert.match(selectionRenderer, /for\s*\(\s*const grade of GRADE_CATALOG\s*\)/);
  assert.equal(GRADE_CATALOG.length, 6, 'the existing catalog contains all six grades');
  assert.match(app, /startGrade3MathRepairMainline/);
  assert.match(app, /renderGrade3MathAdventureMap\(\)/);
  assert.match(app, /document\.getElementById\('curriculum-picker-button'\)\.addEventListener/);
  const handler = app.match(/document\.querySelector\('\.brand'\)\?\.addEventListener\('click', \(event\) => \{([\s\S]*?)\n\}\);/);
  assert.ok(handler);
  assert.doesNotMatch(handler[1], /speech|localStorage|setSpeechEnabled/i);
});
