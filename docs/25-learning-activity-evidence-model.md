# 學習目標、活動、檢核、補強與進度對應

## 資料與用途

[`../curriculum/learning-activity-map.json`](../curriculum/learning-activity-map.json) 是獨立的活動對應資料，連接 `learning-objectives.json` 的學習目標候選、既有遊戲活動、檢核欄位、補強候選及 `student-progress-model.json` 的進度狀態。它不替代課綱、教材、單元或題目登錄。

本試點對應「千位數的秘密」既有數字島原型，使用既有關卡 ID `number-secret-challenge`、既有解鎖條件 `task-find-number-obelisk` 及 `numberSecretQuestions.js` 的 3 個題目 ID。另有獨立的完整學習單元流程原型，位於 `prototype/learningUnitFlow.js`，並以 `prototype/data/numberSecretLearningUnit.js` 管理視覺教學、候選補強及候選檢核內容。原三題遊戲挑戰與新單元學習流程分開啟動；兩者仍是本機待教師審查示範內容。沒有建立正式題目、正式檢核、學生紀錄或新可玩關卡。

## 三題目前可觀察的練習範圍

| 題目 | 候選目標 | 目前只可支持的描述 |
| --- | --- | --- |
| `secret-thousands-01` | `LO-M3-NUM-PLACE-VALUE-01` | 選擇 3,000 中數字 3 表示 3 個千。 |
| `secret-thousands-02` | `LO-M3-NUM-PLACE-VALUE-02` | 選擇 4 個千對應 4,000。 |
| `secret-thousands-03` | `LO-M3-NUM-PLACE-VALUE-03` | 選擇 2,000 與 500 合成 2,500。此題同時涉及數量合成／加法，課綱支持範圍待教師審查。 |

這三題不能單獨證明學生能在不同數字、位值表、積木或圖像表徵間遷移，也未檢核 0 佔位、其他數值範圍、延後保持或整章掌握。錯誤選項只列為可能的錯誤假設；一次選錯不構成學生診斷。

## 活動完成與學習判定分開

| 紀錄層 | 含義 | 本試點狀態 |
| --- | --- | --- |
| 活動完成 | 原型發出三題任務完成事件。 | 可由既有遊戲流程表達；不是檢核通過。 |
| 題目作答 | 記錄題目、提交、嘗試次數、是否使用提示及結果。 | 完整學習單元原型在記憶體 session 內記錄，不持久化；舊三題遊戲挑戰仍使用其原有計分保存流程。 |
| 學習檢核 | 使用教師審查過的獨立檢核工具與門檻。 | 加入三題獨立作答的檢核設計候選與 session 結果；仍非正式檢核，`passCondition` 仍為 null。 |
| 目標達成 | 依核定成果規準、多項證據與專業判定。 | `not_assessed`；不得從此關卡推導。 |
| 章節進度 | 依 `student-progress-model.json` 追加狀態與證據歷史。 | 僅有規格；尚未連接遊戲、帳號或儲存。 |

完整學習單元流程的記憶體作答事件使用唯一 `submissionId` 作為冪等鍵；重複提交會被拒絕，不會重複累計。首次獨立答對、提示後答對、未用提示但重試後答對及答錯分開分類。不同次重試是練習事件，不會自動形成多份獨立檢核證據。這些 session 事件在離開或重新整理後不保留，也不建立學生紀錄。

`activity_completed` 不等於 `check_passed`；`check_passed` 不等於 `objective_achieved`。檢核未通過可以導向補強候選活動，再以新的、可追溯檢核重測。補強活動目前只有設計候選，尚無實作入口或核准內容。星星、分數、徽章、關卡完成都不能單獨更新學習目標達成狀態。

## 課綱、教材及審查邊界

試點保留既有 `mathematics` 來源、`math-number-place-value-m3-num-01` 地圖項目，以及 `N-3-1`、`n-II-1` 記錄。這些是既有專案追溯資料，不是本輪重新直接查閱官方原文的聲明；`n-II-1` 是第二學習階段表現參照，不能證明指定班級已授課。教材版本、冊次、單元頁碼、學期順序、先備能力和教師審查尚缺。`M3-NUM-01` 仍為 `candidate`。

## 驗證

```powershell
node scripts/learning-model.mjs
node scripts/learning-activity-map.mjs
node --test test/learning-activity-map.test.mjs test/learning-model.test.mjs
node --test test/*.test.mjs
```

活動驗證器檢查活動 ID、學習單元與目標參照、現有關卡及題目 ID、既有解鎖條件、補強參照、候選狀態、檢核門檻空缺及作答證據冪等規則，並核對完整單元原型的候選題及補強參照。新流程為獨立記憶體狀態機，不接入正式學生進度或保存流程。驗證器不會產生學生紀錄或替代教師審查。Stage 0 仍為 `not_passed`。
