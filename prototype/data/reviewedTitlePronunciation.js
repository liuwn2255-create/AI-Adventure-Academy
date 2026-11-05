/**
 * Build the existing studentTextRenderer token schema from manually reviewed
 * readings. Non-Han characters remain literal text with no pronunciation.
 */
export function reviewedTitlePronunciationTokens(text, readings) {
  const readingList = readings.trim() ? readings.trim().split(/\s+/u) : [];
  let readingIndex = 0;
  const tokens = Array.from(text, (character) => {
    if (!/\p{Script=Han}/u.test(character)) return Object.freeze({ text: character });
    const reading = readingList[readingIndex++];
    if (!reading) throw new Error(`Missing reviewed pronunciation for ${character} in ${text}`);
    return Object.freeze({ text: character, reading });
  });
  if (readingIndex !== readingList.length) throw new Error(`Extra reviewed pronunciation for ${text}`);
  return Object.freeze(tokens);
}
