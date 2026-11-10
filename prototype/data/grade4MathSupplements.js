// Three candidate supplements only; no official curriculum or teacher approval changes.
const supplements = {
  "ACT-G4-MATH-FRACTION-TILES-CANDIDATE": {
    "preservedStageCount": 3,
    "changes": {
      "revision": 2,
      "curriculumScope": "部分對應：以等分拼片表示 3/6、比較同分母真分數，並加入 7/4 與 1 又 3/4 的拼片對照及一題同分母加法遷移；未涵蓋多種轉換、減法與整數倍。官方內容列於四年級學習內容表；學習表現為第二學習階段，未推定學期。",
      "coverage": {
        "subitemId": "SUB-MATH-G4-N4-5-FRACTION-BAR-REPRESENT-COMPARE",
        "status": "partial",
        "limitation": "涵蓋真分數拼片、同分母比較、一例假分數與帶分數對照及一例同分母加法；未涵蓋減法、整數倍及更多轉換例。"
      },
      "learningObjective": {
        "objectiveId": "LO-G4-MATH-FRACTION-TILES-CANDIDATE-01",
        "statement": "用等大的單位拼片表示分數、比較分母相同的分數，並用四分之一拼片連結假分數、帶分數與一個同分母加法例。",
        "status": "candidate_pending_teacher_review"
      },
      "stages": [
        {
          "stageId": "build-seven-fourths",
          "interaction": "compose_shape",
          "prompt": "每一排是 1 條完整分數帶，分成 4 等份。用四分之一拼片拼出 7/4，再觀察完整的一排和剩下的片數。",
          "pieces": [
            {
              "id": "quarter-1",
              "label": "第 1 個等大分數片",
              "shape": "square"
            },
            {
              "id": "quarter-2",
              "label": "第 2 個等大分數片",
              "shape": "square"
            },
            {
              "id": "quarter-3",
              "label": "第 3 個等大分數片",
              "shape": "square"
            },
            {
              "id": "quarter-4",
              "label": "第 4 個等大分數片",
              "shape": "square"
            },
            {
              "id": "quarter-5",
              "label": "第 5 個等大分數片",
              "shape": "square"
            },
            {
              "id": "quarter-6",
              "label": "第 6 個等大分數片",
              "shape": "square"
            },
            {
              "id": "quarter-7",
              "label": "第 7 個等大分數片",
              "shape": "square"
            },
            {
              "id": "half-tile",
              "label": "二分之一拼片（不同單位）",
              "shape": "triangle"
            }
          ],
          "shapeRules": {
            "rows": 2,
            "columns": 4,
            "selectionCount": 7,
            "correctPieceIds": [
              "quarter-1",
              "quarter-2",
              "quarter-3",
              "quarter-4",
              "quarter-5",
              "quarter-6",
              "quarter-7"
            ]
          },
          "hints": [
            "7/4 表示七個四分之一。",
            "第一排放滿後，數一數第二排有幾個四分之一。"
          ],
          "incorrectFeedback": "先拿掉不同單位的片。用四分之一片放滿第一排，再放第二排。",
          "correctFeedback": "4 個四分之一是 1，還有 3 個四分之一，所以 7/4＝1 又 3/4。"
        },
        {
          "stageId": "transfer-mixed-number-addition",
          "interaction": "choose_response",
          "prompt": "已有 1 條完整分數帶和 1 個四分之一片，再加 2 個四分之一片。合起來是多少？",
          "options": [
            {
              "id": "one-and-two-quarters",
              "text": "1 又 2/4"
            },
            {
              "id": "one-and-three-quarters",
              "text": "1 又 3/4"
            },
            {
              "id": "three-quarters",
              "text": "3/4"
            }
          ],
          "correctOptionIds": [
            "one-and-three-quarters"
          ],
          "hints": [
            "先留下原有的一條完整分數帶。",
            "把原有的一片和新加的兩片四分之一合在一起。"
          ],
          "incorrectFeedback": "把同樣大的四分之一片合起來，並保留原來的一個整體。",
          "correctFeedback": "1 又 1/4＋2/4＝1 又 3/4。"
        }
      ]
    }
  },
  "ACT-G4-MATH-FRACTION-EQUIVALENCE-MODEL-CANDIDATE": {
    "preservedStageCount": 3,
    "changes": {
      "revision": 2,
      "curriculumScope": "部分對應 N-4-6：以相同大小的整體操作不同等分，建構並遷移辨認 1/2＝2/4、2/5＝4/10、1/2＝3/6，另用等值分數處理一個異分母加法例，並將 1/2 連結到 0.5。未涵蓋異分母比較、減法及更多互換例；螢幕拼片不等同實體操作。",
      "learningObjective": {
        "objectiveId": "LO-G4-MATH-FRACTION-EQUIVALENCE-MODEL-CANDIDATE-01",
        "statement": "在相同大小的整體上操作不同等分拼片，辨認不同片數可表示相同的量，並在加法與十分位數線上使用等值表示。",
        "status": "candidate_pending_teacher_review"
      },
      "instructions": "每一關都用同樣長的分數帶。參照帶已表示一個分數，請在另一條分數帶上選片，讓兩條表示相同的量，再用相同單位相加或把一半標在十分位數線上。",
      "coverage": {
        "subitemId": "SUB-MATH-G4-N4-6-EQUIVALENT-FRACTIONS-MODEL-TRANSFER",
        "status": "partial",
        "limitation": "涵蓋等值模型、1/2＋1/4 與 1/2＝0.5 的候選例；仍缺異分母比較、減法及更多互換例。"
      },
      "stages": [
        {
          "stageId": "add-half-and-quarter",
          "interaction": "compose_shape",
          "prompt": "一條分數帶分成 4 等份。先想 1/2 是幾個四分之一，再加 1/4，選出總共需要的四分之一片。",
          "pieces": [
            {
              "id": "sum-quarter-1",
              "label": "第 1 個等大分數片",
              "shape": "square"
            },
            {
              "id": "sum-quarter-2",
              "label": "第 2 個等大分數片",
              "shape": "square"
            },
            {
              "id": "sum-quarter-3",
              "label": "第 3 個等大分數片",
              "shape": "square"
            },
            {
              "id": "sum-half",
              "label": "二分之一拼片（不同單位）",
              "shape": "triangle"
            }
          ],
          "shapeRules": {
            "rows": 1,
            "columns": 4,
            "selectionCount": 3,
            "correctPieceIds": [
              "sum-quarter-1",
              "sum-quarter-2",
              "sum-quarter-3"
            ]
          },
          "hints": [
            "把一半想成四等份中的兩份。",
            "兩個四分之一再加一個四分之一。"
          ],
          "incorrectFeedback": "要用同一個單位表示總量。先把 1/2 換成兩個四分之一，再加上一片。",
          "correctFeedback": "1/2＋1/4＝2/4＋1/4＝3/4。"
        },
        {
          "stageId": "transfer-half-to-decimal",
          "interaction": "place_number_line_marker",
          "prompt": "把 1/2 標在 0 到 1 的十分位數線上。它對應哪個小數位置？",
          "numberLine": {
            "start": 0,
            "end": 1,
            "tickCount": 10,
            "targetTick": 5
          },
          "hints": [
            "整段分成 10 小格，每格是十分之一。",
            "把十格分成同樣多的兩組，再數一組有幾格。"
          ],
          "incorrectFeedback": "一半到 0 和 1 的距離相同。請從 0 起算等距小格。",
          "correctFeedback": "1/2＝5/10＝0.5，位於整段中央。"
        }
      ]
    }
  },
  "ACT-G4-MATH-ELAPSED-TIME-TRANSIT-CANDIDATE": {
    "preservedStageCount": 4,
    "changes": {
      "revision": 2,
      "curriculumScope": "部分對應官方 N-4-13：拆分時間間隔，處理跨午及跨日情境，並以 24 小時制讀寫結果。另用起訖時刻求經過時間，練習小時與分鐘換算。未涵蓋多類生活情境與實際班表資料。",
      "learningObjective": {
        "objectiveId": "LO-G4-MATH-ELAPSED-TIME-01",
        "statement": "把經過時間拆成容易計算的區段，求跨午或跨日的到達時刻，或依起訖時刻算出經過時間並換算單位。",
        "status": "candidate_pending_teacher_review"
      },
      "instructions": "車站班表是模擬資料。先拆分路程時間，再選出 24 小時制到站時間；也會由起訖時刻反求經過時間。",
      "coverage": {
        "subitemId": "SUB-MATH-G4-N4-13-CROSS-PERIOD-ELAPSED-TIME",
        "coveredByInteraction": [
          "complete_calculation_steps",
          "choose_response"
        ],
        "notCovered": [
          "更廣泛的時間單位換算",
          "各種類型的時間加減問題",
          "實際班表資料蒐集與生活行程規劃"
        ]
      },
      "stages": [
        {
          "stageId": "subtract-cross-hour-time",
          "interaction": "complete_calculation_steps",
          "calculationTitle": "13:45 至 14:20",
          "prompt": "班車 13:45 出發，14:20 到站。以 14:00 為分界，算出搭車時間。",
          "calculationSteps": [
            {
              "id": "before-hour",
              "label": "13:45 到 14:00",
              "expectedValue": 15,
              "choices": [
                {
                  "value": 10,
                  "label": "10 分"
                },
                {
                  "value": 15,
                  "label": "15 分"
                },
                {
                  "value": 20,
                  "label": "20 分"
                }
              ],
              "incorrectFeedback": "13:45 再過幾分鐘才滿 60 分？"
            },
            {
              "id": "after-hour",
              "label": "14:00 到 14:20",
              "expectedValue": 20,
              "choices": [
                {
                  "value": 15,
                  "label": "15 分"
                },
                {
                  "value": 20,
                  "label": "20 分"
                },
                {
                  "value": 25,
                  "label": "25 分"
                }
              ],
              "incorrectFeedback": "兩個時刻同在 14 點，直接比較分鐘數。"
            },
            {
              "id": "total",
              "label": "合計分鐘",
              "expectedValue": 35,
              "choices": [
                {
                  "value": 30,
                  "label": "30 分"
                },
                {
                  "value": 35,
                  "label": "35 分"
                },
                {
                  "value": 40,
                  "label": "40 分"
                }
              ],
              "incorrectFeedback": "合起來要包括 14:00 前後兩段。"
            }
          ],
          "hints": [
            "先求到 14:00，和 14:00 之後的時間。",
            "把整點前 15 分和整點後 20 分加起來。"
          ],
          "incorrectFeedback": "分別算整點前後的時間，再合計。",
          "correctFeedback": "13:45 到 14:20 共 15＋20＝35 分鐘。"
        },
        {
          "stageId": "transfer-elapsed-time-to-minutes",
          "interaction": "complete_calculation_steps",
          "calculationTitle": "15:10 至 16:25",
          "prompt": "另一班車 15:10 出發，16:25 到站。用 16:10 分段，把經過時間換成分鐘。",
          "calculationSteps": [
            {
              "id": "whole-hour",
              "label": "15:10 到 16:10 有幾分鐘？",
              "expectedValue": 60,
              "choices": [
                {
                  "value": 50,
                  "label": "50 分"
                },
                {
                  "value": 60,
                  "label": "60 分"
                },
                {
                  "value": 70,
                  "label": "70 分"
                }
              ],
              "incorrectFeedback": "兩個時刻的分鐘數相同，差一小時。"
            },
            {
              "id": "extra-minutes",
              "label": "16:10 到 16:25 有幾分鐘？",
              "expectedValue": 15,
              "choices": [
                {
                  "value": 10,
                  "label": "10 分"
                },
                {
                  "value": 15,
                  "label": "15 分"
                },
                {
                  "value": 25,
                  "label": "25 分"
                }
              ],
              "incorrectFeedback": "同在 16 點，用到站的 25 分減去 10 分。"
            },
            {
              "id": "total",
              "label": "搭車時間合計幾分鐘？",
              "expectedValue": 75,
              "choices": [
                {
                  "value": 65,
                  "label": "65 分"
                },
                {
                  "value": 75,
                  "label": "75 分"
                },
                {
                  "value": 85,
                  "label": "85 分"
                }
              ],
              "incorrectFeedback": "把一小時換成分鐘，再加上後段。"
            }
          ],
          "hints": [
            "兩個時刻都在整點後 10 分，先算完整的一小時。",
            "一小時是 60 分鐘，再加 16:10 到 16:25。"
          ],
          "incorrectFeedback": "分開算完整的一小時和剩下的分鐘。",
          "correctFeedback": "1 小時 15 分等於 60＋15＝75 分鐘。"
        }
      ]
    }
  }
};

export function applyGrade4MathSupplement(task) {
  const supplement = supplements[task.activityId];
  if (!supplement) return task;
  return {
    ...task,
    ...supplement.changes,
    stages: Object.freeze([
      ...task.stages.slice(0, supplement.preservedStageCount),
      ...supplement.changes.stages.map(stage => Object.freeze(stage)),
    ]),
  };
}
