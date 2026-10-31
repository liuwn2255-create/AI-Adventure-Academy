// Prototype-only local test content. This is not the formal question bank,
// has no approved unitId/unitRevision, and must not be published as official content.
export const demoQuestionSet = Object.freeze({
  datasetStatus: 'prototype_demo_only',
  label: '原型示範題・非正式題庫',
  questions: Object.freeze([
    {
      prototypeQuestionId: 'demo-place-value-01',
      prompt: '在數字 3,000 中，數字 3 表示幾個「千」？',
      options: [
        { optionId: 'pv01-a', text: '3 個千' },
        { optionId: 'pv01-b', text: '3 個百' },
        { optionId: 'pv01-c', text: '3 個十' },
        { optionId: 'pv01-d', text: '3 個一' },
      ],
      answerId: 'pv01-a',
      explanation: '3 在千位，表示 3 個千，也就是 3,000。',
      hint: '先從數字最右邊開始找位名，再確認題目問的是哪一個位置。',
    },
    {
      prototypeQuestionId: 'demo-place-value-02',
      prompt: '在數字 2,406 中，數字 4 表示幾個百？',
      options: [
        { optionId: 'pv02-a', text: '4 個千' },
        { optionId: 'pv02-b', text: '4 個百' },
        { optionId: 'pv02-c', text: '4 個十' },
        { optionId: 'pv02-d', text: '4 個一' },
      ],
      answerId: 'pv02-b',
      explanation: '2,406 的 4 在百位，表示 4 個百，也就是 400。',
      hint: '從右邊個位開始數位名，想想 4 的左、右位分別是什麼。',
    },
    {
      prototypeQuestionId: 'demo-place-value-03',
      prompt: '在數字 5,070 中，數字 7 表示幾個十？',
      options: [
        { optionId: 'pv03-a', text: '7 個千' },
        { optionId: 'pv03-b', text: '7 個百' },
        { optionId: 'pv03-c', text: '7 個十' },
        { optionId: 'pv03-d', text: '7 個一' },
      ],
      answerId: 'pv03-c',
      explanation: '5,070 的 7 在十位，表示 7 個十，也就是 70。',
      hint: '不要只看數字 7；先注意它在數字中的位置，再讀它旁邊的位名。',
    },
    {
      prototypeQuestionId: 'demo-place-value-04',
      prompt: '6 個百、2 個十和 4 個一，合起來是什麼數？',
      options: [
        { optionId: 'pv04-a', text: '624' },
        { optionId: 'pv04-b', text: '642' },
        { optionId: 'pv04-c', text: '264' },
        { optionId: 'pv04-d', text: '6,204' },
      ],
      answerId: 'pv04-a',
      explanation: '6 個百是 600，2 個十是 20，4 個一是 4；合起來是 624。',
      hint: '先分別想每種單位的數量，再依千、百、十、個位的順序組成數字。',
    },
    {
      prototypeQuestionId: 'demo-place-value-05',
      prompt: '在數字 3,508 中，數字 5 表示幾個百？',
      options: [
        { optionId: 'pv05-a', text: '5 個千' },
        { optionId: 'pv05-b', text: '5 個百' },
        { optionId: 'pv05-c', text: '5 個十' },
        { optionId: 'pv05-d', text: '5 個一' },
      ],
      answerId: 'pv05-b',
      explanation: '3,508 的 5 在百位，表示 5 個百，也就是 500。',
      hint: '先找出 5 所在的位名，不要把左邊的 3 或右邊的 0 當成 5 的位名。',
    },
  ]),
});
