// Independent local prototype data; not a formal question bank.
export const numberComparisonQuestionSet = Object.freeze({
  datasetStatus: 'prototype_demo_pending_teacher_review',
  curriculumReviewStatus: 'pending_verification',
  label: '待教師審核的示範題・非正式題庫',
  questions: Object.freeze([
    Object.freeze({
      id: 'comparison-demo-01',
      prompt: '哪一個數比較大？',
      options: Object.freeze([
        Object.freeze({ optionId: 'cmp-01-a', text: '3,425' }),
        Object.freeze({ optionId: 'cmp-01-b', text: '3,245' }),
        Object.freeze({ optionId: 'cmp-01-c', text: '兩個一樣大' }),
      ]),
      answerId: 'cmp-01-a',
      explanation: '兩個數的千位都是 3；比較百位，4 個百比 2 個百多，所以 3,425 比較大。',
      hints: Object.freeze(['先比較兩個數最左邊的位數；相同時再看下一位。', '千位相同，請比較百位上的數字，再決定大小。']),
      wrongGuidance: '請從最高位開始逐位比較；兩數在某一位不同時，再觀察該位的數字大小。錯答只提供線索，不能單次判定原因。',
    }),
    Object.freeze({
      id: 'comparison-demo-02',
      prompt: '哪一個數比較小？',
      options: Object.freeze([
        Object.freeze({ optionId: 'cmp-02-a', text: '5,206' }),
        Object.freeze({ optionId: 'cmp-02-b', text: '5,260' }),
        Object.freeze({ optionId: 'cmp-02-c', text: '兩個一樣大' }),
      ]),
      answerId: 'cmp-02-a',
      explanation: '千位和百位相同；十位的 0 比 6 小，所以 5,206 比較小。',
      hints: Object.freeze(['由左到右找第一個不同的位數，留意中間的 0。', '千位、百位相同；接著只比較十位，想想 0 和 6 的先後。']),
      wrongGuidance: '比較時要保留中間的 0 所在位置，再找第一個不同位數。請回看十位的比較，錯答不代表已確定的迷思。',
    }),
    Object.freeze({
      id: 'comparison-demo-03',
      prompt: '哪一個數比較大？',
      options: Object.freeze([
        Object.freeze({ optionId: 'cmp-03-a', text: '2,999' }),
        Object.freeze({ optionId: 'cmp-03-b', text: '3,001' }),
        Object.freeze({ optionId: 'cmp-03-c', text: '兩個一樣大' }),
      ]),
      answerId: 'cmp-03-b',
      explanation: '3,001 有 3 個千，2,999 還不到 3 個千，所以 3,001 比較大。',
      hints: Object.freeze(['先看千位；若千位不同，通常不必先比較後面的位數。', '兩數的千位分別是 2 和 3，先判斷哪個千位數字較大。']),
      wrongGuidance: '這題跨過千位邊界。先比較千位，再看完整數字；不要只看末尾幾個數字。此題難度與先備仍待教師確認。',
    }),
  ]),
});
