const HAN_CHARACTER = /^\p{Script=Han}$/u;

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
 * Return safe inline markup for optional, reviewed pronunciation annotations.
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
      return `<ruby><rb>${safeText}</rb><rt>${escapeHtml(reading)}</rt></ruby>`;
    }
    return safeText;
  }).join('');
}
