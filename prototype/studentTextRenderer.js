const HAN_CHARACTER = /^\p{Script=Han}$/u;
const TONE_MARKS = new Set(['ˊ', 'ˇ', 'ˋ', '˙']);

/** Grade 1–2 may use reviewed pronunciation metadata and prompt read-aloud UI. */
export function isLowGradeReadingAssistanceEnabled(gradeId) {
  return gradeId === 'grade-1' || gradeId === 'grade-2';
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

/**
 * Return safe inline character/reading pairs for reviewed annotations.
 * The original text remains authoritative; malformed or mismatched tokens fall
 * back to escaped plain text instead of changing what the student reads.
 */
export function renderStudentText(text, pronunciationTokens) {
  const plainText = String(text ?? '');
  if (!Array.isArray(pronunciationTokens) || pronunciationTokens.length === 0) return escapeHtml(plainText);

  const validTokens = pronunciationTokens.every((token) => (
    token
    && typeof token.text === 'string'
    && [...token.text].length === 1
    && (token.reading === undefined || typeof token.reading === 'string')
  ));
  if (!validTokens || pronunciationTokens.map(({ text: tokenText }) => tokenText).join('') !== plainText) {
    return escapeHtml(plainText);
  }

  return pronunciationTokens.map(({ text: tokenText, reading }) => {
    const safeText = escapeHtml(tokenText);
    if (reading && HAN_CHARACTER.test(tokenText)) {
      const readingCharacters = Array.from(reading);
      const toneMarks = readingCharacters.filter((character) => TONE_MARKS.has(character));
      const zhuyinGlyphs = readingCharacters.filter((character) => !TONE_MARKS.has(character));
      const glyphMarkup = zhuyinGlyphs.map((character) => `<span class="zhuyin-glyph">${escapeHtml(character)}</span>`).join('');
      const toneMarkup = toneMarks.map((character) => `<span class="zhuyin-tone${character === '˙' ? ' zhuyin-tone-neutral' : ''}">${escapeHtml(character)}</span>`).join('');
      return `<span class="zhuyin-pair"><span class="zhuyin-hanzi">${safeText}</span><span class="zhuyin-reading" aria-hidden="true"><span class="zhuyin-glyph-column">${glyphMarkup}</span>${toneMarkup}</span></span>`;
    }
    return safeText;
  }).join('');
}
