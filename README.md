# 台灣國小 AI 智慧探險學園

## 專案目標

以國小三年級為起點，將數學、國語文、自然科學與思考訓練融入明亮低多邊形風格的 3D 探險體驗。操作方式包含鍵盤與手機觸控；進度先使用瀏覽器 `localStorage` 本機保存。遊戲中的教學回饋以固定規則為優先，後續階段再評估整合 Cloudflare Worker AI。

## 開發階段

| 階段 | 範圍 | 狀態 |
| --- | --- | --- |
| 0 | 需求基線、架構、課綱追溯、題目與關卡規格、測試及部署計畫 | 第三輪報告為歷史審查紀錄；待辦依簽核清單持續追蹤。部分年級範圍、校本教材適切性及課程專家簽核待完成；未通過 |
| 1 | 最小可玩垂直切片 | 已建立第一個瀏覽器原型；正式遊戲與課程內容仍待審查 |
| 2 | 擴充課程內容與關卡 | 尚未開始 |
| 3 | 評估並整合 Cloudflare Worker AI | 尚未開始 |

## 目前狀態

初始盤點時專案目錄為空，且該目錄不是 Git repository。現有階段 0 文件之外，已新增一個無外部依賴的本機瀏覽器原型，包含互動地圖、非人物羅盤佔位、數字島 2D 探索場景、可移動角色位置標記、石碑／寶箱／場景星星互動、任務系統、數學示範關卡及容量互動原型。原型題目是獨立測試資料，不是正式題庫；地圖以 `localStorage` 保存本機示範進度，不保存學生姓名或其他個人資料。答題當次得分、關卡最佳星數、場景收藏與任務獎勵分開計算。專案目錄內沒有找到孫子照片、四面圖或 3D 模型，首頁原通用 SVG 人物已移除；正式題目／關卡發布流程尚未整合。本機原型不串接 AI、不部署，也未建立或初始化 Git。

已建立一至六年級的出版社中立資料骨架及年級選擇入口。只有三年級保留目前既有原型地圖；其他年級及未確認學期的學科、單元、關卡與題目欄位均保持空白並標示準備中。骨架不代表全年課綱、年級適用性或教學進度已核實。

課程資料模型另見 [`curriculum/learning-map.json`](curriculum/learning-map.json) 與[資料模型說明](docs/23-grade-learning-map-model.md)。六年級皆有上下學期與三領域架構；三年級目錄連結目前範圍盤點，未分配學期，缺少的課程內容、教材順序、教師審核及學習檢核仍明確待補。此課程骨架與遊戲原型的星星／通關進度分離；學生學習成效狀態目前只有資料規格，尚未實作。

章節目標欄位及獨立的學生章節進度狀態另見 [`curriculum/learning-objectives.json`](curriculum/learning-objectives.json)、[`curriculum/student-progress-model.json`](curriculum/student-progress-model.json) 與[模型說明](docs/24-learning-objective-and-progress-model.md)。目標資料仍是草稿候選，進度資料目前只有規格，尚未連接遊戲或保存任何學生紀錄。

「千位數的秘密」的學習目標、原型活動、題目練習證據、檢核與補強候選對應見 [`curriculum/learning-activity-map.json`](curriculum/learning-activity-map.json) 及[活動證據模型說明](docs/25-learning-activity-evidence-model.md)。此資料仍待教師審查，不會把活動通關或遊戲成績標記成學習目標達成。

「千位數的秘密」另有完整學習單元流程原型，含視覺化教學、循序練習、錯誤提示、候選補強、獨立候選檢核與回顧，見[完整學習單元原型說明](docs/26-number-secret-learning-unit-prototype.md)。新流程僅以記憶體保存當次作答事件，不寫入 `localStorage` 或正式學生進度；候選檢核不代表正式檢核通過，教師審查及課程範圍仍待確認。

## 本機遊戲原型

在專案根目錄執行：

```powershell
$env:PROTOTYPE_PORT='4175'
node scripts/serve-prototype.mjs
```

接著以瀏覽器開啟 `http://127.0.0.1:4175`。停止伺服器請在執行終端按 `Ctrl+C`。原型示範題與遊戲星星只供操作體驗，不代表正式題目或學習評量。

課綱地圖區分已定位的正式條文與待核項；文件定位不代表課程專家簽核或校本教學進度核准。每題正式發布前，必須完成課綱對應、答案、解釋與年級適切性審核。孫子角色設定只作為未來素材需求；目前未發現照片、四面圖或 3D 模型，不能視為已完成角色素材。

第三輪審查紀錄見 [docs/08-stage0-review-report.md](docs/08-stage0-review-report.md)，三年級課程範圍矩陣見 [docs/09-grade3-scope-matrix.md](docs/09-grade3-scope-matrix.md)。文件審查及條文定位不等於課程專家簽核，也未核定單校三年級授課進度。

## 文件導覽

- [系統架構](docs/01-architecture.md)
- [課綱追溯](docs/02-curriculum-traceability.md)
- [題目資料規格](docs/03-question-data-spec.md)
- [關卡規格](docs/04-level-spec.md)
- [測試計畫](docs/05-test-plan.md)
- [部署計畫](docs/06-deployment-plan.md)
- [階段 0 檢查清單](docs/07-stage0-review-checklist.md)
- [階段 0 第三輪審查報告](docs/08-stage0-review-report.md)
- [三年級課程範圍矩陣與思考標籤表](docs/09-grade3-scope-matrix.md)
- [階段 0 簽核清單](docs/10-stage0-signoff-checklist.md)
- [三年級數學首批題目候選規格](docs/11-grade3-math-question-candidates.md)
- [三年級數學候選規格逐項稽核報告](docs/12-grade3-math-candidate-audit.md)
- [M3-NUM-01 教師審查表草稿](docs/13-m3-num-01-teacher-review.md)
- [M3-CAP-02 教師審查表草稿](docs/14-m3-cap-02-teacher-review.md)
- [M3-NUM-01 第一批候選題目規格](docs/15-m3-num-01-question-candidates.md)
- [M3-NUM-01 六項候選課綱追溯稽核](docs/16-m3-num-01-curriculum-traceability-audit.md)
- [CAND-M3-NUM-01-03 位值辨識教師審查準備表](docs/17-cand-m3-num-01-03-teacher-review.md)
- [單元登錄規格、候選登錄與驗證器](docs/18-unit-registry-spec.md)
- [M3-NUM-01 位值辨識教師審查題組（草稿）](docs/19-m3-place-value-teacher-review-set.md)
- [M3-NUM-01 位值辨識教師審查前置證據清單](docs/20-m3-place-value-review-evidence-checklist.md)
- [容量互動原型教師審查準備資料](docs/21-capacity-prototype-teacher-review.md)
- [小小探險家角色素材規格與缺口](docs/22-adventurer-character-asset-spec.md)
- [一至六年級資料骨架](prototype/data/gradeCatalog.js)
- [一至六年級全年學習地圖資料](curriculum/learning-map.json)
- [全年學習地圖資料模型說明](docs/23-grade-learning-map-model.md)
- [學習地圖建置與驗證](scripts/learning-map.mjs)
- [章節學習目標與學生進度模型說明](docs/24-learning-objective-and-progress-model.md)
- [章節學習目標候選資料](curriculum/learning-objectives.json)
- [學生章節進度資料模型（規格，尚未實作）](curriculum/student-progress-model.json)
- [學習目標與進度模型驗證器](scripts/learning-model.mjs)
- [學習活動、檢核與補強對應驗證器](scripts/learning-activity-map.mjs)
- [千位數的秘密活動與學習證據對應資料](curriculum/learning-activity-map.json)
- [學習目標至補強活動證據模型說明](docs/25-learning-activity-evidence-model.md)
- [「千位數的秘密」完整學習單元原型](docs/26-number-secret-learning-unit-prototype.md)
- [本機可玩瀏覽器原型](prototype/index.html)
- [課綱來源登錄](curriculum/sources.json)
- [初步學習重點地圖](curriculum/curriculum-map.json)
