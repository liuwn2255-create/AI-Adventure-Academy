const SPEECH_PREFERENCE_KEY = 'ai-adventure-speech-enabled';
const DEFAULT_SPEECH_OPTIONS = Object.freeze({ lang: 'zh-TW', rate: 0.92, pitch: 1, volume: 1 });
let lastSpeech = null;
let volatileSpeechEnabled = true;

function getStorage() {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

function getSynthesis() {
  try {
    return globalThis.window?.speechSynthesis ?? globalThis.speechSynthesis ?? null;
  } catch {
    return null;
  }
}

function getUtteranceConstructor() {
  try {
    return globalThis.SpeechSynthesisUtterance ?? globalThis.window?.SpeechSynthesisUtterance ?? null;
  } catch {
    return null;
  }
}

export function isSpeechEnabled() {
  try {
    const stored = getStorage()?.getItem(SPEECH_PREFERENCE_KEY);
    if (stored === 'true') return (volatileSpeechEnabled = true);
    if (stored === 'false') return (volatileSpeechEnabled = false);
    return volatileSpeechEnabled;
  } catch {
    return volatileSpeechEnabled;
  }
}

export function stop() {
  try {
    getSynthesis()?.cancel();
  } catch {
    // Speech is an optional enhancement; playback failures must not affect the activity.
  }
}

export function setSpeechEnabled(enabled) {
  const nextEnabled = Boolean(enabled);
  volatileSpeechEnabled = nextEnabled;
  try {
    getStorage()?.setItem(SPEECH_PREFERENCE_KEY, String(nextEnabled));
  } catch {
    // Keep the in-memory/browser experience usable when storage is unavailable.
  }
  if (!nextEnabled) stop();
  return nextEnabled;
}

export function speak(text, options = {}) {
  if (!isSpeechEnabled()) return false;
  const normalizedText = String(text ?? '').trim();
  if (!normalizedText) return false;

  const synthesis = getSynthesis();
  const Utterance = getUtteranceConstructor();
  if (!synthesis || typeof synthesis.speak !== 'function' || typeof Utterance !== 'function') return false;

  const settings = { ...DEFAULT_SPEECH_OPTIONS, ...options };
  try {
    synthesis.cancel();
    const utterance = new Utterance(normalizedText);
    utterance.lang = settings.lang;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.onerror = () => {};

    let voices = [];
    try {
      voices = synthesis.getVoices?.() ?? [];
    } catch {
      // The browser's default voice remains a valid fallback.
    }
    const voice = voices.find(({ lang }) => lang?.toLowerCase() === 'zh-tw')
      ?? voices.find(({ lang }) => lang?.toLowerCase().startsWith('zh-') || lang?.toLowerCase() === 'zh');
    if (voice) utterance.voice = voice;

    lastSpeech = { text: normalizedText, options: settings };
    synthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function repeatLastSpeech() {
  if (!lastSpeech) return false;
  return speak(lastSpeech.text, lastSpeech.options);
}
