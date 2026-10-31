import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MOVEMENT_KEYS, createMovementHoldController } from '../prototype/movementControls.js';

test('方向鍵與 WASD 對應上、下、左、右', () => {
  assert.deepEqual(MOVEMENT_KEYS, {
    arrowup: 'up', w: 'up',
    arrowdown: 'down', s: 'down',
    arrowleft: 'left', a: 'left',
    arrowright: 'right', d: 'right',
  });
});

test('觸控按住控制立即移動並定時連續移動，放開後停止', () => {
  const calls = [];
  const intervals = new Map();
  const cleared = [];
  let nextTimerId = 1;
  const controller = createMovementHoldController((direction) => calls.push(direction), {
    intervalMs: 100,
    setIntervalFn(callback, delay) {
      const id = nextTimerId++;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearIntervalFn(id) { cleared.push(id); intervals.delete(id); },
  });

  controller.start('left');
  assert.deepEqual(calls, ['left']);
  assert.equal(controller.isMoving(), true);
  const timer = [...intervals.values()][0];
  assert.equal(timer.delay, 100);
  timer.callback();
  assert.deepEqual(calls, ['left', 'left']);

  controller.stop();
  assert.equal(controller.isMoving(), false);
  assert.equal(intervals.size, 0);
  assert.deepEqual(cleared, [1]);
});

test('換方向時先清除舊連續移動，再以新方向開始', () => {
  const calls = [];
  const intervals = new Map();
  const cleared = [];
  let nextTimerId = 1;
  const controller = createMovementHoldController((direction) => calls.push(direction), {
    setIntervalFn(callback) { const id = nextTimerId++; intervals.set(id, callback); return id; },
    clearIntervalFn(id) { cleared.push(id); intervals.delete(id); },
  });

  controller.start('up');
  const firstTimer = intervals.get(1);
  controller.start('right');
  firstTimer();
  intervals.get(2)();
  assert.deepEqual(calls, ['up', 'right', 'right']);
  assert.deepEqual(cleared, [1]);
  controller.stop();
  assert.deepEqual(cleared, [1, 2]);
});

test('探索畫面清楚顯示方向鍵與 WASD 對照，並綁定按住連續移動', async () => {
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  for (const phrase of [
    '↑</kbd>／<kbd>W</kbd> 向上移動',
    '↓</kbd>／<kbd>S</kbd> 向下／後退',
    '←</kbd>／<kbd>A</kbd> 向左移動',
    '→</kbd>／<kbd>D</kbd> 向右移動',
    '按住方向按鈕可以連續移動',
  ]) assert.ok(html.includes(phrase), `missing movement instruction: ${phrase}`);
  assert.match(app, /button\.addEventListener\('pointerdown'/);
  assert.match(app, /button\.addEventListener\('pointerup'/);
  assert.match(app, /MOVEMENT_KEYS\[key\]/);
});
