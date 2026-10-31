export const numberSecretChallenge = Object.freeze({
  questId: 'thousands-secret',
  title: '千位數的秘密',
  datasetStatus: 'prototype_demo_pending_teacher_review',
  intro: '石碑留下了三道數字線索。完成挑戰後，寶箱就會打開！答錯也沒關係，看看解析後繼續前進。',
  questions: Object.freeze([
    Object.freeze({
      id: 'secret-thousands-01',
      prompt: '在數字 3,000 中，數字 3 表示幾個千？',
      options: Object.freeze([
        Object.freeze({ optionId: 'secret-01-a', text: '3 個千' }),
        Object.freeze({ optionId: 'secret-01-b', text: '3 個百' }),
        Object.freeze({ optionId: 'secret-01-c', text: '3 個十' }),
      ]),
      answerId: 'secret-01-a',
      explanation: '3 在千位，表示 3 個千；3 個千就是 3,000。',
    }),
    Object.freeze({
      id: 'secret-thousands-02',
      prompt: '4 個千合起來是多少？',
      options: Object.freeze([
        Object.freeze({ optionId: 'secret-02-a', text: '400' }),
        Object.freeze({ optionId: 'secret-02-b', text: '4,000' }),
        Object.freeze({ optionId: 'secret-02-c', text: '40,000' }),
      ]),
      answerId: 'secret-02-b',
      explanation: '1 個千是 1,000，所以 4 個千是 1,000＋1,000＋1,000＋1,000＝4,000。',
    }),
    Object.freeze({
      id: 'secret-thousands-03',
      prompt: '2,000 和 500 合起來是多少？',
      options: Object.freeze([
        Object.freeze({ optionId: 'secret-03-a', text: '2,050' }),
        Object.freeze({ optionId: 'secret-03-b', text: '2,500' }),
        Object.freeze({ optionId: 'secret-03-c', text: '7,000' }),
      ]),
      answerId: 'secret-03-b',
      explanation: '2,000＋500＝2,500；500 是 5 個百。',
    }),
  ]),
});
