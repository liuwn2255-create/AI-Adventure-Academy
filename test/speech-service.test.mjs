import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isSpeechEnabled, repeatLastSpeech, setSpeechEnabled, speak, stop } from '../prototype/speechService.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';
import { createLearningTaskSession, dispatchLearningTask } from '../prototype/learningTaskEngine.js';

function installSpeechMock(t, { supported = true, voices = [{ lang: 'zh-TW' }] } = {}) {
  const previousWindow = globalThis.window;
  const previousUtterance = globalThis.SpeechSynthesisUtterance;
  const calls = { spoken: [], cancellations: 0, stored: new Map() };
  class MockUtterance {
    constructor(text) { this.text = text; }
  }
  const speechSynthesis = supported ? {
    cancel() { calls.cancellations += 1; },
    speak(utterance) { calls.spoken.push(utterance); },
    getVoices() { return voices; },
  } : undefined;
  globalThis.window = {
    speechSynthesis,
    localStorage: {
      getItem(key) { return calls.stored.has(key) ? calls.stored.get(key) : null; },
      setItem(key, value) { calls.stored.set(key, String(value)); },
    },
  };
  globalThis.SpeechSynthesisUtterance = MockUtterance;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousUtterance === undefined) delete globalThis.SpeechSynthesisUtterance;
    else globalThis.SpeechSynthesisUtterance = previousUtterance;
  });
  setSpeechEnabled(true);
  calls.spoken.length = 0;
  calls.cancellations = 0;
  return calls;
}

test('speech service defaults on and speaks Traditional Chinese at a child-friendly pace', (t) => {
  const calls = installSpeechMock(t);
  assert.equal(isSpeechEnabled(), true);
  assert.equal(speak('觀察結果：物品移向磁鐵。'), true);
  assert.equal(calls.spoken.length, 1);
  assert.equal(calls.spoken[0].lang, 'zh-TW');
  assert.equal(calls.spoken[0].rate, 0.92);
  assert.equal(calls.spoken[0].pitch, 1);
  assert.equal(calls.spoken[0].volume, 1);
  assert.equal(calls.spoken[0].voice.lang, 'zh-TW');
});

test('speech service uses the browser default when no Chinese voice is listed', (t) => {
  const calls = installSpeechMock(t, { voices: [] });
  assert.equal(speak('觀察結果：物品沒有移動。'), true);
  assert.equal(calls.spoken.length, 1);
  assert.equal(calls.spoken[0].lang, 'zh-TW');
  assert.equal(calls.spoken[0].voice, undefined);
});

test('speech service preference is saved and disabled speech is not queued', (t) => {
  const calls = installSpeechMock(t);
  assert.equal(setSpeechEnabled(false), false);
  assert.equal(calls.stored.get('ai-adventure-speech-enabled'), 'false');
  assert.equal(isSpeechEnabled(), false);
  assert.equal(speak('不可播放'), false);
  assert.equal(calls.spoken.length, 0);
  assert.equal(setSpeechEnabled(true), true);
  assert.equal(calls.stored.get('ai-adventure-speech-enabled'), 'true');
  assert.equal(isSpeechEnabled(), true);
});

test('speech service cancels previous speech and repeat replays only the latest phrase', (t) => {
  const calls = installSpeechMock(t);
  const stateBeforeRepeat = { testedObjectIds: ['iron-nail'], assignments: { 'iron-nail': 'attracted' } };
  assert.equal(speak('觀察結果：物品移向磁鐵。'), true);
  assert.equal(speak('觀察結果：物品沒有移動。'), true);
  assert.equal(calls.cancellations, 2);
  assert.equal(repeatLastSpeech(), true);
  assert.deepEqual(calls.spoken.map(({ text }) => text), [
    '觀察結果：物品移向磁鐵。',
    '觀察結果：物品沒有移動。',
    '觀察結果：物品沒有移動。',
  ]);
  assert.deepEqual(stateBeforeRepeat, { testedObjectIds: ['iron-nail'], assignments: { 'iron-nail': 'attracted' } });
  stop();
  assert.equal(calls.cancellations, 4);
});

test('magnet material test action speaks its rendered observation once and repeat is a speech-only button', async (t) => {
  installSpeechMock(t);
  const appSource = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.ok(appSource.includes("const observationText = material.attracted ? '觀察結果：物品移向磁鐵。' : '觀察結果：物品沒有移動。';"));
  assert.ok(appSource.includes('if (result.changed) speak(observationText);'));
  assert.ok(appSource.includes("repeat.addEventListener('click', () => speak(observationText))"));
  assert.ok(appSource.includes('if (tested) {'));
});

test('speech service gracefully degrades when speechSynthesis is unavailable while magnet actions still work', (t) => {
  installSpeechMock(t, { supported: false });
  assert.equal(speak('觀察結果：物品移向磁鐵。'), false);

  const activity = CATALOG_CANDIDATE_TASKS.find(({ activityId }) => activityId === 'ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE');
  let session = dispatchLearningTask(createLearningTaskSession(activity, 'speech-unavailable-magnet'), activity, 'start').session;
  session = dispatchLearningTask(session, activity, 'flip_magnet').session;
  session = dispatchLearningTask(session, activity, 'submit', { submissionId: 'speech-unavailable-poles' }).session;
  session = dispatchLearningTask(session, activity, 'next').session;
  const result = dispatchLearningTask(session, activity, 'test_magnet_material', { materialId: 'iron-nail' });
  assert.equal(result.changed, true);
  assert.deepEqual(result.session.magnetModel.testedObjectIds, ['iron-nail']);
});
