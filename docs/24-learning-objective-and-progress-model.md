# 章節學習目標與學生進度模型

## 資料檔

- [`../curriculum/learning-objectives.json`](../curriculum/learning-objectives.json)：以 `learning-map.json` 的三年級章節目錄為來源，建立每章一筆的學習目標候選資料。`learningUnitId` 是本模型的穩定章節目標識別碼，**不是** `docs/18` 的正式 `unitId`。目前正式單元參照只有 `M3-NUM-01` rev 1，狀態仍是 `candidate`。
- [`../curriculum/student-progress-model.json`](../curriculum/student-progress-model.json)：只定義進度紀錄結構、狀態、合法轉換及證據規則；`records` 為空，不含真實學生資料。

## 目標資料與證據界線

目標檔涵蓋目前學習地圖內 26 個三年級章節候選。候選目的沿用既有章節摘要，不等於新核定的課程目標。課綱來源 ID、代碼、位置與核對狀態沿用學習地圖紀錄；本次沒有重新查閱或重新核實官方 PDF。年級／學期適用性、教材版本與頁碼、校本進度、班級授課、先備知識及教師簽核分別記錄。學期欄位保持 `null`，未取得證據的先備知識、錯誤診斷、補強活動及學習檢核保持空白或待設計。

學習目標與既有關卡、題目、錯誤假設、補強候選及證據分類的試點對應，見[學習活動與證據模型](25-learning-activity-evidence-model.md)。

`learningActivities.suggestedActivityTypes` 是遊戲設計建議，不是正式課綱代碼或已發布關卡。課綱來源標記為已核對，不會自動改變 `review.dataStatus`、教師審查、單元狀態或班級使用資格。

## 學習進度狀態與轉換

| 狀態 | 意義與最低證據 |
| --- | --- |
| `not_started` | 尚無學習活動紀錄。 |
| `in_progress` | 有開始活動或補強活動紀錄。 |
| `activity_completed` | 指定活動已完成；不代表學習檢核通過。 |
| `needs_review` | 檢核未通過、表現不穩，或教師／學生提出複習需求。 |
| `check_passed` | 通過一項已核定的檢核；不代表長期掌握。 |
| `objective_achieved` | 依教師核定的成果規準與多項證據，經教育專業人員確認達成。 |

合法轉換及各轉換的證據要求列於 `student-progress-model.json`。每次轉換都應追加狀態歷史與證據參照。`objective_achieved` 沒有預設題數、分數門檻或時間間隔，必須由專業人員決定。日後檢核顯示需要複習時，可由 `check_passed` 或 `objective_achieved` 回到 `needs_review`。

星星、徽章、分數或關卡通關不能單獨作為學習檢核或目標達成證據。進度資料模型目前**尚未連接遊戲、帳號或持久化儲存**，也未產生任何學生紀錄。

## 驗證

```powershell
node scripts/learning-model.mjs --build
node scripts/learning-model.mjs
node --test test/learning-model.test.mjs
```

`--build` 由現有章節資料重建兩個學習模型資料檔；一般檢查命令驗證唯一 ID、章節完整性、來源及地圖參照、正式單元參照、候選狀態、空白待審證據與進度轉換政策。驗證器是資料結構檢查，不會核准課程、判讀教育適切性或實作學生進度功能。Stage 0 仍為 `not_passed`。
