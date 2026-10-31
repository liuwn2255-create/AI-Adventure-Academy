# 一至六年級學習地圖資料模型

## 用途與現況

[`../curriculum/learning-map.json`](../curriculum/learning-map.json) 是出版社中立的學習地圖骨架。六個年級各有上下學期、國語文／數學／自然科學科目入口、年級目標槽位及章節目錄欄位。只有三年級連結目前的範圍盤點資料；它整理既有項目，不代表三年級全年內容已完整核實。其餘年級保持架構空槽與待查狀態。

三年級章節以 `grade3-year-scope.json` 的穩定 `scopeItemId` 為依據，課綱地圖 ID、官方來源 ID、原有條文核對狀態、年級適用性、教材證據、教師審查及班級授課紀錄分欄保留。課綱地圖中 `verified` 類狀態只描述來源／條文記錄，不代表教師核准、教材教過或班級可以使用。第二學習階段指標仍保持階段層級。

## 關聯與學期安排

資料鏈為：年級 → 學期 → 科目 → 章節 → 學習目標／重點引用 → 遊戲活動建議 → 學習檢核與補強。章節先存於年級全年目錄；只有取得校本課程或教材順序證據後，才將 `chapterRefs` 指派至個別學期。現階段各學期 `chapterRefs` 為空，章節的 `semesterId` 為 `null`，不得據此推定上下學期順序。

章節的目的與核心重點引用現有範圍摘要及課綱地圖，避免複製成第二套課綱來源。先備知識、可觀察成效規準、錯誤診斷、複習與補強方案目前保留空欄及待設計狀態，不將遊戲構想冒充課程要求。

`gameDesign.candidateActivityTypes` 僅是設計建議；`existingPrototypeReferences` 只清點既有原型及其原狀，不會建立新的正式關卡或題目。數的大小比較因現有關卡目錄沒有課綱地圖引用，仍保持未追溯狀態。

## 學習進度狀態

骨架定義 `not_started`、`in_progress`、`activity_completed`、`needs_review`、`check_passed` 與 `objective_achieved`。目前只有狀態與建議紀錄欄位，沒有實作新的學習進度保存或狀態轉換。

單次答題、關卡完成、星星或徽章不能單獨推導章節掌握。`check_passed` 需先有審核過的學習檢核；`objective_achieved` 需有教育專業人員核定的目標規準與多項可追溯證據，實際門檻仍待專業人員決定。原型遊戲進度使用既有機制，與本課程進度骨架分離。

章節學習目標候選與獨立的學生進度資料模型，見[章節學習目標與學生進度模型](24-learning-objective-and-progress-model.md)。該目標資料目前僅沿用既有三年級章節摘要；學生進度資料檔只是規格，沒有真實學生紀錄，也尚未接入遊戲或儲存機制。

## 資料更新與驗證

目前由 [`../scripts/learning-map.mjs`](../scripts/learning-map.mjs) 從來源登錄、課綱地圖、三年級範圍及數學關卡目錄建立／檢查資料：

```powershell
node scripts/learning-map.mjs --build
node scripts/learning-map.mjs
```

建置只產生學習地圖檔；不核准單元、題目或關卡，也不寫入學生進度。新增年級、學期或章節資料前，應先補可追溯來源並由教師確認適用性，不得以空欄被誤讀為已完成。

目前資料保留 `Stage 0 = not_passed`。此模型不表示正式課程內容已全數建立、教師已簽核或遊戲進度功能已實作。
