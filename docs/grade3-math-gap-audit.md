# 三年級數學課程地圖缺口盤點與一致性稽核

> 本報告是依目前專案資料進行的追溯與狀態盤點。它不代表教師簽核、課程核准、學生學習成效或全年課程完整。

## 1. 檢查範圍與判讀方式

本次檢查以下 11 份指定檔案，均實際存在：

- `docs/grade3-math-curriculum-mapping.md`
- `curriculum/learning-map.json`
- `curriculum/learning-objectives.json`
- `curriculum/student-progress-model.json`
- `curriculum/learning-activity-map.json`
- `prototype/data/curriculumGameCatalog.js`
- `prototype/data/numberSecretLearningUnit.js`
- `prototype/data/numberSecretQuestions.js`
- `prototype/data/numberComparisonQuestions.js`
- `prototype/data/mathLevelDirectory.js`
- `scripts/publication-guard.mjs`

狀態分四層判讀，彼此不可推導：

1. **課綱已核實**：官方來源、代碼與條文位置可追溯；不代表該遊戲已符合條文或三年級班級已教。
2. **遊戲已實作**：可執行的原型或可開啟的目錄項目；不代表內容品質已審查。
3. **教學品質已審查**：須有教師／課程專業人員對實際題目與教學設計的審查紀錄；目前多數為待審。
4. **學習成效已有證據**：須有核定檢核、可解釋的學習證據與教育專業判讀；目前沒有正式學生紀錄或達標證據。

## 2. 二十四個代碼逐項盤點

代碼在以下表格均可追溯至三年級範圍章節與課程地圖項目。`curriculum-map.json` 有 **3 筆已核對 focus**、**21 筆 pending focus**；其中 20 筆 pending 記錄承載 21 個代碼（角度一筆含 `N-3-13`、`S-3-1`），另有一筆 `math-broad-topic-scope` 沒有內容代碼。來源登錄列出全部 24 個三年級內容代碼及相關表現碼。這是資料追溯覆蓋，不是 24 項都已在地圖中完成核實或獲教師核准。

表中「目標」是 `learning-objectives.json` 的候選成果識別碼；它們仍是草稿／待教師審查。`—` 表示目前未找到特定遊戲對應，不表示該課綱內容可以省略。

| 代碼 | 課程地圖 ID／章節 | 候選目標 ID | 現有遊戲對應與狀態 | 課綱狀態 | 教師／教材狀態 | 教學品質審查 | 學習成效證據 |
|---|---|---|---|---|---|---|---|
| `N-3-1` | `math-number-place-value-m3-num-01`／一萬以內的數與位值 | `LO-M3-NUM-PLACE-VALUE-01..03` | `math-place-value-demo`（5 題）、`number-secret-challenge`（3 題）可玩原型；候選、待審 | 官方來源／focus 已核對 | 學期、教材與先備待確認 | 題目逐題審查未完成；第 3 項目標另涉數量合成／加法 | 無核准學習檢核；無正式成效證據 |
| `N-3-2` | `math-grade3-n-3-2-add-sub`／加減直式計算 | `LO:chapter-scope-m3-math-addition-subtraction:01` | `ACT-M3-ADD-SUB-VERTICAL-CANDIDATE`；`ADD-SUB-DRAFT-M3-N32-01..04`（計算結果）及 `ADD-SUB-DRAFT-M3-N32-05-STRATEGY`（已給定情境的策略說明選擇），共用引擎記憶體作答、候選 | N-3-2 原文及表現欄 `n-II-2` 已對官方 PDF 核對；n-II-2 屬第二學習階段 | 教材版本、班級進度、位值表與含 0 跨欄退位、策略題先備待教師確認 | 4 題結果選擇加 1 題局部策略說明選擇；不證明實際策略表現或穩定理解 | 無正式學習檢核或成效證據；無連結補強 |
| `N-3-3` | `math-grade3-n-3-3-one-digit-multiplication`／一位數乘法 | `LO:chapter-scope-m3-math-one-digit-multiplication:01` | — | pending focus；來源條文列為已核對 | 待教師／教材確認 | 未審 | 無 |
| `N-3-4` | `math-division-meaning-application-m3-ops-03`／除法意義與應用 | `LO:chapter-scope-m3-math-division:01` | —；只有候選範圍記錄 | pending focus；來源條文列為已核對 | 等分／包含題型分類與教學進度待確認 | 未審 | 無 |
| `N-3-5` | `math-grade3-n-3-5-one-digit-division`／一位數除法計算 | `LO:chapter-scope-m3-math-one-digit-division:01` | — | pending focus；來源條文列為已核對 | 待教師／教材確認 | 未審 | 無 |
| `N-3-6` | `math-grade3-n-3-6-mult-div-application`／乘除應用與未知數 | `LO:chapter-scope-m3-math-multiplication-division-application:01` | — | pending focus；來源條文列為已核對 | 單元是否獨立及先備待確認 | 未審 | 無 |
| `N-3-7` | `math-grade3-n-3-7-two-step-problems`／兩步驟應用問題 | `LO:chapter-scope-m3-math-two-step-problems:01` | — | pending focus；來源條文列為已核對 | 題型範圍及先備待確認 | 未審 | 無 |
| `N-3-8` | `math-grade3-n-3-8-estimation`／四則估算與合理性 | `LO:chapter-scope-m3-math-estimation:01` | — | pending focus；來源條文列為已核對 | 數值、除法估算限制待確認 | 未審 | 無 |
| `N-3-9` | `math-grade3-n-3-9-common-denominator-fractions`／同分母分數 | `LO:chapter-scope-m3-math-common-denominator-fractions:01` | `ACT-M3-FRACTION-TREASURE-SAME-DENOMINATOR-CANDIDATE`／`FRACTION-DRAFT-M3-N39-01..05`：候選活動，僅部分等分圖形讀取及同分母比較 | 年級內容表與官方來源位置已核對；不代表完整涵蓋 | 分母範圍、表徵、先備及實際進度待教師確認 | 題目未經教師審查 | 無正式學習成效證據 |
| `N-3-10` | `math-grade3-n-3-10-one-decimal`／一位小數與十分位 | `LO:chapter-scope-m3-math-decimals-tenths:01` | — | pending focus；來源條文列為已核對 | 小數位值先備與教材順序待確認 | 未審 | 無 |
| `N-3-11` | `math-integer-number-line-m3-num-04`／整數數線 | `LO:chapter-scope-m3-math-integer-number-line:01` | `math-integer-number-line-candidate`，目錄候選、無題目、未開放 | 官方來源／focus 已核對 | 年級表內容明列；學期、教材與實際授課待確認 | 未審 | 無 |
| `N-3-12` | `math-grade3-n-3-12-millimeter`／長度：毫米 | `LO:chapter-scope-m3-math-length-millimeter:01` | — | pending focus；來源條文列為已核對 | 量具、換算及先備待確認 | 未審 | 無 |
| `N-3-13` | `math-grade3-n-3-13-s-3-1-angle`／角與角度 | `LO:chapter-scope-m3-math-angle-measure:01` | — | pending focus；官方對應表現為 `n-II-9` | 教材與操作條件待確認 | 未審 | 無 |
| `N-3-14` | `math-grade3-n-3-14-area`／面積：平方公分 | `LO:chapter-scope-m3-math-area-square-centimeter:01` | — | pending focus；來源條文列為已核對 | 面積操作先備待確認 | 未審 | 無 |
| `N-3-15` | `math-capacity-measurement`／容量：公升與毫升 | `LO:chapter-scope-m3-math-capacity:01` | `math-capacity-candidate` 目錄候選；另有開發測試用互動原型，非正式關卡 | 官方來源／focus 已核對 | 實際教材、刻度／估測授課證據待補 | 待教師審查 | 無核准學習檢核或學生成效證據 |
| `N-3-16` | `math-grade3-n-3-16-weight`／重量：公斤與公克 | `LO:chapter-scope-m3-math-weight-kg-g:01` | — | pending focus；來源條文列為已核對 | 秤具、換算及進度待確認 | 未審 | 無 |
| `N-3-17` | `math-grade3-n-3-17-time`／時間單位與計算 | `LO:chapter-scope-m3-math-time-units:01` | — | pending focus；來源條文列為已核對 | 時間換算與加減範圍待確認 | 未審 | 無 |
| `S-3-1` | `math-grade3-n-3-13-s-3-1-angle`／與 `N-3-13` 共用角度章節 | `LO:chapter-scope-m3-math-angle-measure:01` | — | pending focus；作為 `N-3-13` 的共同主題追溯，不能丟失此代碼 | 待教師確認合併呈現 | 未審 | 無 |
| `S-3-2` | `math-grade3-s-3-2-square-rectangle`／正方形與長方形的性質 | `LO:chapter-scope-m3-math-square-rectangle-properties:01` | — | pending focus；來源條文列為已核對 | 教材與先備待確認 | 未審 | 無 |
| `S-3-3` | `math-circle-elements-m3-geo-02`／圓的元素 | `LO:chapter-scope-m3-math-circle-elements:01` | —；只有候選範圍記錄 | pending focus；來源條文列為已核對 | 圓規操作與作圖範圍待確認 | 未審 | 無 |
| `S-3-4` | `math-grade3-s-3-4-geometry-operations`／平面分割重組與立體展開 | `LO:chapter-scope-m3-math-geometry-compose-decompose:01` | — | pending focus；來源條文列為已核對 | 操作素材與活動形式待確認 | 未審 | 無 |
| `R-3-1` | `math-grade3-r-3-1-mult-div-inverse`／乘除互逆關係 | `LO:chapter-scope-m3-math-multiplication-division-inverse:01` | —；與乘除應用有關聯，但非現有遊戲 | pending focus；來源條文列為已核對 | 是否獨立呈現待課程規劃 | 未審 | 無 |
| `R-3-2` | `math-grade3-r-3-2-pattern`／一維變化模式與推理 | `LO:chapter-scope-m3-math-pattern-reasoning:01` | — | pending focus；來源條文列為已核對 | 模式難度與說明要求待確認 | 未審 | 無 |
| `D-3-1` | `math-grade3-d-3-1-data-tables`／一維與二維資料表 | `LO:chapter-scope-m3-math-data-tables:01` | — | pending focus；來源條文列為已核對 | 表格型態、資料情境與先備待確認 | 未審 | 無 |

### 代碼覆蓋結論

- **課程章節／地圖追溯：24/24 代碼均可在三年級章節範圍及課程地圖（verified 或 pending focus）找到對應。**其中 `N-3-13`、`S-3-1` 共用角度 focus，仍保留兩個內容代碼。此結果是資料關聯完整，不是全部 focus 都已核實。
- **來源登錄：**指定的 `mathematics` source `verifiedClauses` 含 24 個內容代碼及對應表現代碼。來源欄位標記 verified 是官方文字／來源追溯狀態，不是教師審查。
- **已核對地圖項目：**僅 `N-3-1`、`N-3-11`、`N-3-15` 三個 focus；其餘 21 個內容代碼目前落在 pending focus。
- **正式課程核准：**沒有因資料對照而轉為 approved 的單元；`M3-NUM-01` 保持 candidate。

## 3. 遊戲 ID、目標 ID 與資料追溯

### 有遊戲或原型對應

| 對應 | ID 與關聯 | 一致性判定 |
|---|---|---|
| 位值示範 | `math-place-value-demo` → `N-3-1`；目錄 5 題 | 目錄指出官方來源及 map 已記錄，但題目仍待教師審查、未核准。該目錄沒有 `learningObjectiveIds` 欄位；目標的明確連結在 picker 與 activity map，不是此目錄資料。 |
| 千位數的秘密 | `number-secret-challenge` → `N-3-1`；`ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET` → 3 個候選目標與 `secret-thousands-01..03` | 三個 question IDs 可在題目模組找到。活動狀態是 candidate pending teacher review；learning check 為未設計。第 3 題「2,000+500」還包含數量合成／加法，不能單靠課程名稱宣告為純位值能力。 |
| Picker 入口 | `picker-prototype-number-secret` → `number-secret-challenge` → `math-number-place-value-m3-num-01`；3 個 `LO-M3-NUM-PLACE-VALUE-*` | 對照的 `N-3-1` 和 `n-II-1` 類型有標記。目標候選、學期未指定、教師待審、publication `not_approved`、unit `candidate`、無 direct launch，規則彼此一致。 |
| 數的大小比較 | `math-number-comparison-candidate`；3 道示範題 | 關卡目錄沒有 curriculum map ID／代碼；因此尚無直接課綱追溯。雖然可在原型中遊玩，不應把它併入 `N-3-1` 的核准覆蓋。 |
| 容量 | `math-capacity-candidate` → `N-3-15`／`n-II-9` | 目錄是 `catalog_candidate`、0 題、`catalog_only`；開發測試用水壺／刻度模式不等於正式關卡。教師需以實際教材和教學紀錄核對估測、刻度讀值等要求。 |
| 整數數線 | `math-integer-number-line-candidate` → `N-3-11`／`n-II-8` | 目錄候選、0 題、`catalog_only`；與 M3-NUM-04 相關的定位已記載，仍無正式題目或進度證據。 |

### ID 與流程一致性

- `learning-objectives.json` 目前包含 23 個三年級數學 learning units；每個範圍至少有一項 `candidate_pending_teacher_review` 的候選成果。只有 `N-3-1` 範圍使用 3 個具名 `LO-M3-NUM-PLACE-VALUE-01..03`；其他項目使用 `LO:chapter-scope-...:01` 型式。這些目標都有 map ID 參照，但仍是候選，不應視為已核定成果。
- `learning-activity-map.json` 有 5 個位值活動記錄，其中 1 個連結正式原型 level 和 3 題，4 個是 levelId 為 null 的補強活動設計候選。候選目標、活動完成與正式 learning check 有清楚界線。
- `numberComparisonQuestions.js` 的 3 個 question IDs 與目錄的 3 題一致；但課綱 map、objective ID、先備條件尚未建立成可靠鏈結。
- `mathLevelDirectory.js` 的 5 個 level IDs 均唯一；其 `textbookEvidence` 全為 `not_provided`。該目錄本身未記錄 learning objective IDs。Picker 目前只列入千位數的秘密一款候選遊戲。
- `learning-map.json` 的三年級上、下學期 `chapterRefs` 空白，兩者 `sequenceStatus` 為 `pending_school_and_textbook_evidence`。無法由目前資料確定 24 項內容的學期順序或授課週次。

## 4. 缺漏、差異與可能誤讀

| 發現 | 證據與影響 | 建議（本輪不修改資料） |
|---|---|---|
| 前一份 mapping 報告把「pending」和「未映射」混用 | 實際上 24 個代碼全都能在章節／地圖記錄找到；3 個 verified focus 加 21 個 pending focus，代碼全集完整。pending 是尚未完成核對狀態，不等於沒有 map ID。 | 後續若更新 mapping 文件，用「已建立追溯但待核對」描述這 21 個，不要稱為未映射。 |
| `math-broad-topic-scope` 沒有內容代碼 | `curriculum-map.json` 額外有一筆數學 pending focus，`contentCodes` 與 `performanceCodes` 都為空；它不是上述 24 個代碼之一，也沒有對應章節項目。 | 由課程資料負責人確認它是刻意保留的 broad topic、應補明確範圍，或應維持非代碼設計標籤；不要用它代替代碼追溯。 |
| verified focus 數量和官方來源 verifiedClauses 容易混淆 | source 登錄列出 24 個代碼為已核對；map 只有 3 筆數學 focus 為 verified，其他仍 pending。這兩種狀態屬不同資料層。 | UI 或報表須分開顯示 source clause review 與 curriculum-map focus status。 |
| 位值目標 03 不是純粹辨認位值 | 「2,000 和 500 合成 2,500」題目含數量合成／加法；objective 已備註須另審。 | 教師確認其先備、評量意圖及是否需跨目標標記，不將錯答直接診斷成位值迷思。 |
| 數的大小比較沒有課綱連結 | Questions 與目錄存在，但 `curriculumReferences` 的 map IDs、codes 為空且 review `pending_verification`。 | 先完成條文逐題對照與目標定義，再考慮 Picker 或課程地圖連接。 |
| 出版防護是共用檢查，不是已接入的發布流程 | `publication-guard.mjs` 將檢查交給 `unit-registry-validator.mjs`；新題驗證要求單元 `approved`、新關卡要求題目 `published` 並驗證單元。其 CLI 明確說 standalone validation 未整合題目／關卡發布流程。 | 保留 fail-closed 規則；正式整合前不宣稱 UI 發布功能已有防護。 |
| 教材及學期證據普遍缺少 | 目錄教材資訊全空；目標教材紀錄空、semesterId null；上／下學期章節引用尚空。 | 由學校提供實際版本、冊次、目錄、頁面及校本進度，教師記錄實際授課與先備能力。 |
| 進度資料模型仍是規格 | `student-progress-model.json` 的 `implementationStatus` 是 `specification_only_not_implemented`，並明確排除只用分數、星星、徽章、通關作為達標證據。 | 不以原型成績宣稱單元掌握；未來實作須有核定檢核及教育專業審查。 |

本輪未能由指定資料確認：實際教材版次／頁碼、各校上下學期安排、特定班級完成教學、學生先備能力、教師審查結果及任何正式學習成效。這些均不應從缺值推定為完成。

## 10. 第六輪官方來源與教師採用清單整合（2026-10-22）

本輪再次直接核對國教院官方數學領域課綱 PDF「三年級學習內容表」與「依學習階段排序之學習表現」：`N-3-1`／`n-II-1`、`N-3-2`／`n-II-2` 位於 PDF 解析頁序 P25；`N-3-9`／`n-II-6`、`N-3-11`／`n-II-8` 位於 P26；`N-3-12`／`n-II-9` 為 P26–P27 跨頁；`N-3-14`、`N-3-15`、`N-3-16`／`n-II-9` 位於 P27。對應表現碼文字位於 P11。頁序不是印刷頁碼。條文摘要、限制與逐題候選追溯現整合於[課綱對照文件第 21 節](grade3-math-curriculum-mapping.md#21-第六輪官方課綱核對及逐題候選追溯2026-10-22)。

此核對確認的是官方條文、所在年級內容表與表格內對應表現碼，不是候選題逐題符合、特定出版社教材編排、學期順序或教師核准。PDF 編碼說明指出同一學習階段的教科用書不必依流水號順序編寫；第二學習階段表現碼不構成三年級某學期進度。數的大小比較仍無直接代碼證據，維持待課程專業人員／教師確認。

新增[九類活動及 N-3-1 版本教師採用審查表](n3-1-teacher-adoption-checklist.md)，以空白欄位分開列出 R2 四題、R3 三題、Q1/Q2 的 R2/R3 補救候選稿，以及其他八組活動 29 題。這是獨立人工工作表，不接入正式工作台、不預填教師決定、不修改既有審查草稿。四個補救 ID 仍標示尚未實作、未連結。候選／正式混淆、R2/R3 版本、選答與提示的證據限制、單次試教限制、教材進度、補救狀態及匿名代碼再識別風險均列入採用前檢查。

本輪未修改題庫、遊戲、正式學生資料、正式教師審查紀錄、課程核准狀態或解鎖規則；未執行學生試教或瀏覽器操作。`M3-NUM-01` 仍為 `candidate`，Stage 0 仍為 `not_passed`。新工作表的教師欄位全部留空，並非審查完成或採用建議。

## 5. 教學品質審查與學習成效缺口

### 教學品質審查

- 24 個內容條目中，沒有一項可由目前資料證明已完成教師逐題品質審查。
- 位值的 5 題 demo、3 題「千位數的秘密」及 3 題大小比較都標示示範／候選；題目可運作不是教學品質審查證據。
- 容量、數線、除法、圓等主題有候選章節或目錄項目，沒有可供逐題審查的完整正式題組。
- 其餘數學範圍沒有遊戲關卡，故尚無遊戲內容可審；這不表示課程條文未存在。

### 學習成效證據

- `learning-check`/通過條件尚未在候選單元中核定；activity map 明確把現有三題活動標為練習，不是正式檢核。
- 學生進度模型尚未實作，且專案沒有可核實的真實學生紀錄。
- 沒有資料能支持任何一個三年級數學章節已達成學習目標或學生已精熟。

## 6. 建議優先處理的前三個單元

這是工程與審查順序建議，不是正式課程範圍核准。

1. **一萬以內的數與位值（`N-3-1`）—先完成教師審查**：官方條文與地圖來源最完整，已有候選目標、教學流程及兩個示範入口。先解決題目涵蓋界線、目標 03 的加法混入、教材／先備及獨立檢核缺口，才能安全判斷是否進入小規模試用。
2. **容量：公升與毫升（`N-3-15`）—補教材證據及審查互動**：已具互動原型，可針對刻度、量感與估測做聚焦審查；但必須取得實際教材或授課紀錄，不能從單元名稱推定估測或特定刻度已教。
3. **整數數線（`N-3-11`）—先核對範圍與設計檢核，再開發**：官方地圖已核對、目錄有候選項目但沒有題目，是補足數與量不同表徵的自然下一個研究單元。先確認數線起點、範圍、比較／加減活動界線及課堂先備，再決定是否製作原型。

不建議在缺少課綱 map 與教材證據時優先把「數的大小比較」接成正式課程；它可保留為封閉的待審原型。

## 7. 下一步需教師／課程專業人員確認

1. 目標學校採用的教材出版社、學年度、版本／印次、冊別、單元、頁碼及校本課程計畫。
2. 上／下學期與實際授課週次；哪些概念在目標班級已教、正在教或未教。
3. 每單元的先備能力、數值／單位範圍、可用表徵與適齡用語。
4. 位值候選題是否只評量 `N-3-1` 所涵蓋的位值，以及合成題是否另涉加法先備。
5. 容量互動是否忠實反映教材的估測／刻度教學；不能只看「公升、毫升」標題簽核。
6. 數線、比較大小與其他候選主題各自適當的課綱對應、年級適切性及先備界線。
7. 每題的答案、干擾選項、提示、解說、語文難度和公平性；審查者角色、日期、結論與理由。
8. 正式 learning check 的能力覆蓋、證據要求及達標規準；單題正答、遊戲通關、分數、星星或徽章均不足以單獨認定目標達成。

## 8. 稽核範圍與狀態聲明

本次只新增此報告，沒有修改課程地圖、課綱來源、題目、關卡、教師審查、學生進度或發布規則。未執行遊戲測試或部署。`M3-NUM-01` 仍為 `candidate`；Stage 0 仍為 `not_passed`。

## 9. 九類候選活動逐題稽核欄位補充（2026-10-22）

教師工作台候選目錄現包含九類活動共 40 個可審視題目／預覽項目的逐題品質稽核資料：38 個一般候選題、1 個唯讀預覽、1 個停用項目。資料依真實候選題庫建立，不包含教師結論；所有逐題 review 預設尚未審查。詳細活動題數、題目能力範圍、課綱來源狀態與逐類缺口見[課綱對照表第 19 節](grade3-math-curriculum-mapping.md#19-九類候選活動逐題品質稽核資料2026-10-22)；逐題獨立答案／資料核驗與教師工作台補驗結果見[課綱對照表第 20 節](grade3-math-curriculum-mapping.md#20-九類候選活動最終品質核驗與工作台補驗2026-10-22)。

本輪重新直接核對國家教育研究院官方數學領域課綱 PDF 的三年級學習內容表：`N-3-1`／`n-II-1`（PDF 頁序 P25）、`N-3-2`／`n-II-2`（P25）、`N-3-9`／`n-II-6`（P26）、`N-3-11`／`n-II-8`（P26）、`N-3-12`／`n-II-9`（P26–P27）、`N-3-14`、`N-3-15`、`N-3-16`／`n-II-9`（P27）。此處 PDF 頁序不是印刷頁碼。課綱原文及對應欄核對狀態與逐題符合程度分開呈現；數的大小比較仍無直接代碼依據，維持待核對。第二學習階段表現碼不得推定為三年級學期進度。教材版本、冊別、頁碼及實際授課進度皆待教師提供。

逐題工作台分析涵蓋選項與答案 ID 一致性、選項重複、解析是否存在、題目能力及題目專屬風險、先備／認知負荷、未涵蓋範圍、提示／錯答引導／實際補強路由是否存在，以及候選使用角色。這些自動呈現的內容不是正式課程審查，也不能證明課堂可讀性或教學效度。沒有補強連結的項目繼續如實顯示未提供；錯誤選項解讀只作待試用驗證的假設。教師逐題決定、修改理由及意見仍由教師親自編輯。

此次只修改候選教師工作台目錄與顯示及相應測試、文件；未寫入教師審查資料集、學生資料、正式成績／精熟度或解鎖規則。九類活動仍維持候選，`M3-NUM-01` 仍為 `candidate`，Stage 0 仍為 `not_passed`。程式／資料檢查通過不等於教師審查、試教或正式核准。
