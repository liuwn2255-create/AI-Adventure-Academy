# 台灣國小 AI 智慧探險學園

## 專案目標

以國小三年級為起點，將數學、國語文、自然科學與思考訓練融入明亮低多邊形風格的 3D 探險體驗。操作方式包含鍵盤與手機觸控；原型規劃以瀏覽器 `localStorage` 保存部分示範進度；最新資料處理行為仍須驗證。遊戲中的教學回饋以固定規則為優先，後續階段再評估整合 Cloudflare Worker AI。

## 開發階段

**截至 2026-11-09 的儲存庫唯讀盤點。** 技術原型、測試與網站部署狀態，不等於教育專業簽核或正式課程發布。

| 工作面向 | 已有內容／可核實狀態 | 尚待完成或驗證 |
| --- | --- | --- |
| 階段 0：需求與教育審查 | 已建立架構、課綱追溯、題目及關卡規格、簽核清單；目前仍為 **`not_passed`** | `EDU-01`～`EDU-16` 所列各項待辦，須依個別項目核對與簽核 |
| 瀏覽器互動原型 | `prototype/` 內已有地圖、任務、活動與互動程式 | 最新版本的完整瀏覽器操作驗收及可用性評估 |
| 一至六年級課程與活動 | 已有跨年級資料骨架、候選活動、相關驗證與測試檔 | 各年級完整涵蓋率、逐題正確性及教師核准；候選不等於正式發布 |
| 3D 角色 | 已有 Three.js／GLB 角色載入程式與模型檔 | 瀏覽器載入、外觀一致性、素材使用授權及四面圖等實際驗收 |
| 教師審查支援 | 已有教師審查工作台與相關檔案 | 實際具名教師審查、教材證據、試教與核准紀錄 |
| 測試 | 已有自動化測試及驗收腳本 | 本次唯讀盤點未執行測試，不宣稱目前全部通過 |
| 網站部署 | 依先前唯讀盤點，GitHub Actions 設定在推送 `main` 後發布 `prototype`；2026-11-05 有成功的部署執行紀錄 | 公開網站最新內容及互動功能仍須另行驗收 |
| AI 整合 | 已規劃固定規則優先、未來評估 Cloudflare Worker AI | 本次未核實正式 AI 整合，不宣稱已完成 |

## 目前狀態

專案目前已存在 GitHub 儲存庫，並持續發展瀏覽器互動原型、跨年級候選活動、課程追溯、教師審查支援及 3D 角色。這些成果應與教育簽核分開理解：**可執行原型、候選教材、已建立測試、教師審查通過及正式發布，是不同的狀態。**

一至六年級的課程資料骨架及部分跨年級候選活動已建立；不能因資料或程式存在，就推定各年級課綱、學期進度、教材適切性或所有題目均已核實。三年級「千位數的秘密」已有學習活動、候選檢核與補強流程等原型及相關文件；候選檢核不代表學生已達成學習目標，也不等於正式評量。

3D 角色程式及 GLB 模型已納入專案，但不表示孫子專屬角色的外貌、照片使用授權、四面圖及模型品質已完成確認。教師審查工作台與發布檢查函式亦已存在，但工具或規則存在不能取代具名教育專業審查，亦不能證明已完整接入所有正式發布流程。

**學生資料與隱私：** 早期原型的 `localStorage` 及當次記憶體保存敘述僅適用於當時已檢查的功能。由於功能已持續擴充，本次尚未逐項驗證最新版本的所有資料保存、識別資料、傳輸及刪除行為；不得據舊版文字宣稱目前完全不保存學生資料或已完成隱私驗收。正式使用前須另行核對。

**教育審查限制：** [`docs/10-stage0-signoff-checklist.md`](docs/10-stage0-signoff-checklist.md) 仍將階段 0 判定為 `not_passed`。`EDU-01` 至 `EDU-16` 的各項待辦與審查證據，仍須依個別項目確認完成情形。任何程式實作、測試檔或部署成功，都不能自動解除這些限制。

### 課程資料與學習證據（保留原有文件脈絡）

課程資料模型另見 [`curriculum/learning-map.json`](curriculum/learning-map.json) 與[資料模型說明](docs/23-grade-learning-map-model.md)。六年級皆有上下學期與三領域架構；三年級目錄連結目前範圍盤點，未分配學期，缺少的課程內容、教材順序、教師審核及學習檢核仍明確待補。此課程骨架與遊戲原型的星星／通關進度分離；學生學習成效狀態在原有設計說明中只有資料規格；最新程式實作及保存行為尚待另行驗證。

章節目標欄位及獨立的學生章節進度狀態另見 [`curriculum/learning-objectives.json`](curriculum/learning-objectives.json)、[`curriculum/student-progress-model.json`](curriculum/student-progress-model.json) 與[模型說明](docs/24-learning-objective-and-progress-model.md)。目標資料仍是草稿候選，原文件將進度資料描述為僅有規格、尚未連接遊戲；最新程式是否已實作或保存學生紀錄尚待另行驗證。

「千位數的秘密」的學習目標、原型活動、題目練習證據、檢核與補強候選對應見 [`curriculum/learning-activity-map.json`](curriculum/learning-activity-map.json) 及[活動證據模型說明](docs/25-learning-activity-evidence-model.md)。此資料仍待教師審查。依原有資料模型設計，不應將活動通關或遊戲成績直接視為學習目標達成；最新程式是否遵循此規則仍待驗證。

「千位數的秘密」另有完整學習單元流程原型，含視覺化教學、循序練習、錯誤提示、候選補強、獨立候選檢核與回顧，見[完整學習單元原型說明](docs/26-number-secret-learning-unit-prototype.md)。原設計說明記載該流程僅以記憶體保存當次作答事件、不寫入 `localStorage` 或正式學生進度；此為歷史功能描述，最新版本須另行驗證；候選檢核不代表正式檢核通過，教師審查及課程範圍仍待確認。

### 歷史里程碑（非目前狀態）

早期盤點曾記錄專案目錄尚未建立 Git、未找到 3D 模型，以及原型尚未部署。這些是**早期階段的歷史紀錄**，不再適用於本次盤點的 GitHub 儲存庫現況。現已有 GitHub 儲存庫、角色模型及 GitHub Pages 部署工作流程；惟是否完成正式課程、角色驗收及網站端對端測試，仍須分別判定。

## 本機遊戲原型

在專案根目錄執行：

```powershell
$env:PROTOTYPE_PORT='4175'
node scripts/serve-prototype.mjs
```

接著以瀏覽器開啟 `http://127.0.0.1:4175`。停止伺服器請在執行終端按 `Ctrl+C`。原型示範題與遊戲星星只供操作體驗，不代表正式題目或學習評量。

課綱地圖區分已定位的正式條文與待核項；文件定位不代表課程專家簽核或校本教學進度核准。每題正式發布前，必須完成課綱對應、答案、解釋與年級適切性審核。孫子角色設定仍須另外確認照片使用範圍、角色外貌、四面圖與 3D 模型品質；模型檔存在不代表已完成孫子專屬角色驗收。

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