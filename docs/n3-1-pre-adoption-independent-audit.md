# 千位數的秘密採用前獨立稽核

稽核日期：2026-10-22  
範圍：現有千位數正式原型資料、R2/R3 候選 JSON、補救候選、採用狀態總覽、教師清單、課綱對照、缺口稽核與相關自動測試。  
界線：本報告是工程與文件交叉稽核，不是教師審查、課綱適配核准、學生試教或採用決議。未修改正式題目或其他正式資料。

## 結果摘要

| 結果 | 數量 | 含義 |
|---|---:|---|
| PASS | 7 | 有目前檔案、程式或本輪實際測試支持。 |
| FINDING | 5 | 發現需要保留並交由教師／題目作者判斷的構念或可讀性風險；沒有因此改動候選題。 |
| NOT VERIFIED | 3 | 本輪未取得足以完成判斷的證據。 |

## 獨立稽核項目

| ID／結果 | 依據 | 實際觀察 | 影響 | 建議處理 |
|---|---|---|---|---|
| A01 — PASS：ID、版本與目錄隔離 | 五個 `artifacts/number-secret-round*.json`；`prototype/data/teacherReviewCatalog.js`；`docs/n3-1-candidate-adoption-status.md`；`docs/n3-1-teacher-adoption-checklist.md`；本輪 ID 交叉檢查 | 第一輪修訂 2 筆；R2 題 4 題；R3 題 3 題；R2 補救 2 稿；R3 補救修訂 2 稿。R3 每題的 `sourceQuestionId` 指向相應 R2 題。候選題、修訂、選項及補救 ID 在這些資料集內唯一；R2/R3 題目 ID 未與工作台 40 項目衝突；文件逐一列出全部 ID。 | 可分辨來源題、替代稿與補救修訂，未發現非預期 ID 碰撞。 | 維持分開存放；日後匯入或接入時繼續驗證 ID 與版本來源。 |
| A02 — PASS：狀態及數量分類 | `prototype/data/numberSecretLearningUnit.js`；`prototype/data/teacherReviewCatalog.js`；`curriculum/unit-registry.json`；Stage 0 清單 | 工作台的千位數 11 項：原有循序練習 3、引導草稿 1、候選檢核 3、V2 可作答候選 2、V2 唯讀預覽 1、V2 停用項目 1。另有文件候選 R2 4、R3 3、補救草案 4、第一輪修訂記錄 2。正式核准題目／候選採用數為 0；這些類別沒有混算。V2 Q3 `enabled:false`、`disabled_pending_teacher_confirmation`；Q4 `enabled:false`、`disabled_pending_teacher_approval` 且 `reviewable:false`。 | 沒有證據顯示 R2/R3 被自動加入遊戲或取代原項目。Q3 可供教師查看不等於可作答；Q4 維持不可審作答的停用狀態。 | 任何未來變更都應分開保留題目角色與教師可審閱性、學生可作答性。 |
| A03 — PASS：第一輪備份現況 | `artifacts/number-secret-round1-candidate-revisions.json` | 檔案可解析，schemaVersion 1，含 `REV-NSR1-Q1-20261022`、`REV-NSR1-Q2-20261022`，分別指向 V2 Q1/Q2。 | 備份目前仍存在且包含預期兩筆。 | 保留原檔，不匯入、不覆寫。 |
| A04 — NOT VERIFIED：第一輪備份歷史上未被覆寫 | 同上；本輪沒有先前雜湊／不可變快照 | 本輪讀到的現況符合預期識別碼與資料形狀，但沒有前一輪檔案雜湊或只讀快照可證明其位元內容自建立後從未變更。 | 只能確認現存檔案狀態，不能證明歷史上未改寫。 | 若需歷史完整性證明，後續保存可信任的版本控制提交或外部雜湊；本輪未建立此證明。 |
| A05 — PASS：四題答案獨立核算 | R2 `independentDerivation`、題幹與答案選項；R3 對照題資料；`test/number-secret-round2-candidate-design.test.mjs`、`test/number-secret-round3-review.test.mjs`；本輪另行計算 | Q1：5,206 的百位數字 2 為 2×100＝200。Q2：4,056＝4,000＋0＋50＋6；省略中間 0 後成 456，數值不同。Q3：3,042 與 3,402 千位相同，第一個不同位是百位，4＞0，因此 3,402 較大。Q4：6×1,000＋0×100＋3×10＋2＝6,032。正解 ID 均指向一個現有選項，選項文字無重複。 | 計算與資料答案一致；只證明數學資料核算，不證明題目教學效度或學生理解。 | 保留核算紀錄與教師審查分離；教學目的仍由教師判斷。 |
| A06 — FINDING：Q1 位值表支架與提示會降低獨立性 | R2/R3 Q1 JSON；R2/R3 Q1 hints；教師清單 | 正解 200 正確。題目直接提供千／百／十／個欄位與數字，學生需要把給定欄位轉成數量，但不能據此判斷其自行定位位名能力。第二層提示直接告知該欄單位值為 100，雖未寫出答案 200，已提供關鍵步驟。 | 看過提示後答對只能作提示後表現；不能計為無提示位值檢核。選項 2、20、200、2,000 也形成規則化倍數選擇，存在猜測可能。 | 若教師希望檢查獨立轉換，需另行核准撤除欄位／支架或改用新數字與表徵；分開記錄提示層級及理由。 |
| A07 — FINDING：Q2 測辨認解釋，不測自行產生解釋 | R2/R3 Q2 JSON、選項及 hints | 4,056 的中間 0 說明在數學上正確；題型要求挑選一段完整說明。干擾選項中有較明顯的錯誤表述，可能讓學生以排除法作答。提示已聚焦到中間空缺及相鄰數字位置。 | 答對不能證明學生能自行說明 0 的佔位作用或將原理遷移到新數字；選項也可能暴露預期原理。 | 教師可考慮另加口頭／建構式解釋及不同數字檢核；作為新證據欄，勿覆寫選擇題結果。 |
| A08 — FINDING：Q3 的策略證據限於辨認 | R2/R3 Q3 JSON；課綱對照文件；相關測試 | 數值比較正確。R2 只選較大數，未要求理由；R3 增加了答案與理由配對，但仍是辨認預製理由，不是自行產生或穩定使用策略。題目資料不指定課綱代碼，文件也保留待確認。 | 不得由 R2/R3 答對推論學生理解「第一個不同位」原理，亦不能據此指定 `N-3-1`。 | 教師需確認目標與適切課綱依據；若要評量策略，採口述或自行標示比較步驟的候選方式並另行審查。 |
| A09 — FINDING：Q4 語句及表徵需教師確認 | R2 Q4 JSON；教師採用清單 | 給定 6 個千、0 個百、3 個十、2 個一，唯一組成 6,032；沒有視覺圖像。題幹「2 個個積木」不如「2 個個位積木」清楚，且題目同時要求讀懂積木名稱、處理空位與轉寫數字。 | 可能由語句／積木單位理解影響作答，錯答未必只反映位值。 | 建議教師確認慣用積木名稱與讀題負荷；若修改措辭，保留候選版本並重核答案與選項。 |
| A10 — PASS：錯答線索及補救狀態標示相符 | R2/R3 題目與補救 JSON；`docs/n3-1-candidate-adoption-status.md`；專項測試 | 題目錯答回饋依各自 errorType 欄位提供引導；補救候選有 Q1 位名定位、Q2 位名／單位／數量連結及 R3 的新數字遷移操作草案。資料明確標記候選、未實作／未連結；錯誤類型使用 possible／待觀察界線。 | 目前資料不構成已證實學生迷思，也不構成實際補救教學。 | 保持補救為紙本／材料候選稿；經教師審查與另行實作、路由測試後，才可稱已連結。 |
| A11 — FINDING：補救草案尚無可執行路由 | 四份補救候選 JSON；`prototype/data/numberSecretLearningUnit.js`；`test/number-secret-v2-candidate.test.mjs` | R2/R3 補救設計皆明確標 `candidate_design_not_implemented_or_linked`；V2 Q1/Q2 沒有補救入口，相關測試驗證候選流程拒絕補救操作。 | 不能將資料欄位或教案步驟說成遊戲中可到達的補救活動。 | 教師若採紙本試做，記錄其為紙本候選流程；軟體接入需另行授權、實作及路由／返回測試。 |
| A12 — PASS：課綱文件內部對照及進度界線一致 | `docs/grade3-math-curriculum-mapping.md` 第 21 節；`docs/grade3-math-gap-audit.md`；R2/R3 JSON | 文件列 `N-3-1` 為官方三年級學習內容表 PDF 頁序 P25、關聯 `n-II-1`；R2 Q1/Q2/Q4、R3 Q1/Q2 只作候選參照且逐題適配待確認。R2 Q3、R3 Q3 的候選代碼為空／待專業對照。文件明示 `n-II-*` 是第二學習階段，不推定三年級上下學期；兩份候選 JSON 也保留教材／班級進度待確認。 | 文件對代碼與頁序沒有內部矛盾；逐題適配及實際進度仍非已核准。 | 沿用官方 PDF 既有核對紀錄及連結；正式採用前由課程專業人員核對逐題對照與班級教材證據。 |
| A13 — NOT VERIFIED：本輪未重新下載／逐頁檢視官方 PDF | `docs/grade3-math-curriculum-mapping.md`、`docs/grade3-math-gap-audit.md` 中的既有查核紀錄及 NAER 來源連結 | 本輪核對了文件間代碼、頁序與適用範圍的一致性；沒有再次取得官方 PDF 逐頁重核。因此，本稽核不把既有來源筆記描述成「本輪重新查證」。 | 對官方原文真實性，本報告承接既有記錄，未新增獨立的本輪原文證據。 | 保留官方連結與既有頁序；如採用前流程要求最新直接核對，另由指定人員開啟官方 PDF 並記錄核對日期。 |
| A14 — PASS：候選資料與正式狀態保護 | `prototype/learningUnitEngine.js`；`test/learning-unit-engine.test.mjs`；`test/number-secret-v2-candidate.test.mjs`；`curriculum/unit-registry.json`；`docs/10-stage0-signoff-checklist.md` | 專項測試確認共用候選引擎無正式進度持久化副作用、V2 wrapper 無正式進度寫入、候選行為不改正式成就狀態；單元登錄 `M3-NUM-01` 為 `candidate`，Stage 0 清單明示 `not_passed`。本輪只讀正式狀態，沒有執行採用或資料寫入。 | 有程式與測試支持候選流程隔離；不能由此推論所有部署環境或瀏覽器儲存均已全面審核。 | 維持隔離；任何日後採用需走獨立教師／正式發布流程，不可由自動測試觸發。 |
| A15 — NOT VERIFIED：視覺化實際呈現 | R2/R3 題目 JSON；程式資料與測試 | R2 Q1 使用結構化位值表、Q3 使用數字對，Q4 沒有視覺資產；本輪未執行瀏覽器或檢查渲染截圖。 | 只能核對表格／數字資料，無法確認實際尺寸下字體、視覺突出、裁切或無障礙呈現。 | 若教師採用視覺題面，另作 UI／列印版面檢視；本輪沒有因此操作既有瀏覽器。 |

## 課綱與版本採用判讀

官方 PDF 既有記錄為：`N-3-1` 位於三年級學習內容表 P25，對應欄為 `n-II-1`；`n-II-1` 是第二學習階段表現標準。這只支持課綱來源與範圍追溯，不足以證明每題與條文逐題對齊、某冊某頁已教，或本班已具備先備。教材出版社、版次、冊別、頁碼、學期／週次及授課紀錄均未核實。

R2 題集狀態為 `candidate_pending_teacher_review`；R3 題集狀態為 `candidate_revision_proposal_not_applied`，各題仍 `candidate_pending_teacher_review`。R2/R3 補救資料及修訂均為 `candidate_design_not_implemented_or_linked`。第一輪兩筆修訂只存在於備份 JSON，不代表已匯入工作台、已採用或已套用正式遊戲。

## 測試結果

| 命令 | 實際結果 |
|---|---|
| `node --test test/number-secret.test.mjs test/number-secret-v2-candidate.test.mjs test/number-secret-round1-revisions.test.mjs test/number-secret-round2-candidate-design.test.mjs test/number-secret-round3-review.test.mjs test/learning-unit-engine.test.mjs` | 34 PASS、0 FAIL。涵蓋 JSON schema／ID、四題答案推導、R3 替代關係、補救未連結狀態、Q3 唯讀、Q4 停用及候選進度隔離。 |
| `node --test test/*.test.mjs` | 263 PASS、0 FAIL。 |
| `node scripts/learning-map.mjs` | 通過；6 grades、12 semester slots、26 grade 3 scope entries。 |
| `node scripts/learning-activity-map.mjs` | 通過；候選活動回應不作正式精熟判定。 |
| 本輪 ID／答案交叉檢查 | 通過：候選與選項識別碼唯一，候選題與工作台無題目 ID 碰撞，預期候選 ID 均出現在總覽／清單，四題答案與獨立計算相符。 |

測試只驗證工程行為與資料，不證明教學效度、課綱適用性、教師認可或學生學習成效。本輪未執行瀏覽器驗收或學生試教。

## 尚待教師／專業人員決定

1. 實際教材出版社、版本／印次、年級學期、冊別、單元、頁碼、校本課程安排及目標班已教進度。
2. 位名／位值數量、中間 0、由高位比較、積木單位及讀表先備是否已教，及是否適合目標學生。
3. Q2 是否需另用學生自產說明測量中間 0；Q3 是否需自行產生比較理由；Q4 的積木名稱是否清楚。
4. 在每一題中選擇保留 R2、改用 R3、修訂或暫緩；R3 不會自動取代 R2。
5. 四份補救候選稿的教學適切性、材料可及性及新數字檢核方式；目前尚未實作、未連結。
6. 是否及如何進行學生試教；須先依學校規範取得必要同意，並採匿名、最少資料原則。

## 安全狀態

- `M3-NUM-01`：`candidate`。
- Stage 0：`not_passed`。
- R2、R3 題及所有補救稿：未自動採用；補救仍未實作、未連結。
- 本輪修改：僅新增本稽核文件；沒有修改正式題目、遊戲、學生資料、成績、掌握度、解鎖狀態或正式教師審查紀錄。
