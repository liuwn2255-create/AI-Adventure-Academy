# 專案單元登錄檔規格

**文件性質：規格及目前實作邊界。** 本文件定義單元登錄資料的結構與治理規則。已有最小登錄、永久 ID 歷史檔及獨立 Node.js 驗證器；目前只建立候選單元，沒有核准任何單元。驗證器只執行本文件列明的結構、外鍵及發布引用檢查，不代替教育專業審查，也不代表題目／關卡發布流程已整合。階段 0 維持未通過。

## 1. 路徑與用途

實際資料檔路徑為 `curriculum/unit-registry.json`，歷史 ID 檔為 `curriculum/unit-id-history.json`。前者登錄專案自行規劃的教學單元，供題目 `unitId` 外鍵及關卡發布前檢查使用；後者保留已預留 ID，避免刪除後重用。它們與 `curriculum/curriculum-map.json` 職責不同：課綱地圖記錄官方學習重點與來源；單元登錄記錄專案單元的範圍、證據及專業審查。現有登錄只有 candidate，不代表核准。

單元登錄核准只表示該專案單元的描述與依據通過指定審查，不代表題目已核准或發布，也不代表任何班級已教過該單元。

## 2. 頂層格式與欄位

登錄檔為 UTF-8 JSON 物件，禁止註解、尾隨逗號及重複鍵。

| 欄位 | 型別 | 必填／允許值 | 驗證規則 |
| --- | --- | --- | --- |
| `schemaVersion` | 整數 | 必填；目前為 `1` | 不支援的版本拒絕整份檔案。 |
| `registryId` | 字串 | 必填；固定為 `project-units` | 全檔固定唯一識別；不得與課綱來源 ID 或地圖 ID 混用。 |
| `registryRevision` | 正整數 | 必填 | 登錄檔每次資料修訂遞增；不替代個別單元 revision。 |
| `units` | 物件陣列 | 必填 | 可為空；每個 `unitId` 只登錄一個單元身份。該單元目前 revision 放在本物件，過往 revision 以 `revisionHistory` 快照保留。 |
| `classroomUseRecords` | 物件陣列 | 必填 | 可為空；存放與單元主資料分離的指定班級授課／先備確認紀錄，格式依 4.1。不得把教材證據或課綱資料當作授課紀錄。 |

此文件是單元登錄欄位、狀態與轉換條件的唯一正式規格。其他文件只引用本規格，不另定單元 schema。

### 永久 ID 歷史登錄限制

單一 `unit-registry.json` 無法在檔案被刪除、回復舊版或重建時可靠證明某個 ID 從未使用。因此本專案另有 append-only `curriculum/unit-id-history.json`，記錄 `unitId`、`firstReservedAt`、`reason`、`lastKnownStatus`、`retiredAt`、`replacementUnitId`。`unitId` 一旦預留，不得從歷史登錄刪除或再分配；目前最小驗證器會將目前及歷史 ID 聯合比對。單一 JSON 檔仍不能防止人工或儲存層竄改；此機制不是防竄改保證。歷史檔缺失或無法解析時，驗證器拒絕有效性檢查。

## 3. 單元欄位定義

| 欄位 | 型別 | 必填／允許值 | 驗證規則 |
| --- | --- | --- | --- |
| `unitId` | 字串 | 必填 | 大寫 ASCII 穩定識別碼，建議格式 `M3-NUM-01`；符合 `^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$`。首次建立後不得改名、轉給其他內容或重複使用；作廢單元保留為 `retired`。 |
| `revision` | 正整數 | 必填 | 單元範圍或依據實質改變時遞增；從 `1` 起算。 |
| `title` | 非空字串 | 必填 | 單元名稱；不得以空白或僅代碼充當名稱。 |
| `subject` | 字串列舉 | 必填 | 限 `mathematics`、`chinese_language`、`natural_science`、`thinking`。`thinking` 僅能表示跨域遊戲設計單元，不可虛構正式領域課綱代碼。 |
| `gradeScope` | 物件 | 必填 | 包含 `grades`（1–12 的非空整數、不重複遞增陣列）、`scopeType`（`proposed_grade` 或 `curriculum_stage`）及 `notes`（字串）。`proposed_grade` 是本專案目標年級提案，不是官方授課證明；階段範圍須以相應課綱證據說明。 |
| `curriculumMapIds` | 字串陣列 | 必填 | `candidate` 可為空但須說明缺口；送審至少一個 ID。ID 必須精確存在於 `curriculum/curriculum-map.json` 的學習重點或設計標籤 ID，不重複；不得以課綱代碼代替。核准通常須有適用且經審查支持的學習重點；非正式課綱設計單元依例外流程處理。 |
| `scopeDescription` | 非空字串 | 必填 | 說明納入的具體概念、學習目標及邊界；不得只寫「數與量」等無法檢核的總類。 |
| `exclusions` | 字串陣列 | 必填 | 每項為非空且不重複的範圍敘述；沒有排除項目時使用空陣列。不得有 null、空字串或重複值；不得把未知範圍默認納入。 |
| `textbookEvidence` | 物件陣列 | 必填 | 每筆依下節格式。若尚無教材材料可用空陣列，但須在 `evidenceNote` 說明缺口；聲稱適用特定版本／單元時，必須附可定位證據。 |
| `evidenceNote` | 字串或 `null` | 條件必填 | `textbookEvidence` 為空或不足以支撐範圍時，須說明待補資料；不能空白暗示已確認。 |
| `prerequisites` | 物件陣列 | 必填 | 每筆須含 `prerequisiteId`（單元內唯一非空字串）、`description`（可審查的能力描述）、`required`（布林值）。空陣列表示尚未列出先備，不能自動代表無先備；核准前由領域教師確認並在審查紀錄留下結論。 |
| `exceptions` | 物件陣列 | 必填 | 無例外時為空陣列；每筆需有例外識別碼、規則、理由、核准者、角色、日期、單元 revision 及證據引用。例外類型與不可豁免事項見下節。 |
| `status` | 字串列舉 | 必填 | 限 `candidate`、`in_review`、`approved`、`retired`；初始狀態必須為 `candidate`。 |
| `reviewRecords` | 物件陣列 | 必填 | 尚未送審可為空；送審及核准所需欄位見「審查紀錄」。不得以程式或代理人臆填簽核。 |
| `statusHistory` | 物件陣列 | 必填 | 每次轉換保留 `unitRevision`、`fromStatus`、`toStatus`、`changedAt`（具時區 ISO 8601）、`actor`、`actorRole`、`reason`、`reviewRecordIds`。初始紀錄 `fromStatus: null`、`toStatus: "candidate"`；不得為空或刪除歷史事件。 |
| `revisionHistory` | 物件陣列 | 必填 | revision 1 為空陣列；每次取代目前版本時，先追加完整且不可變的前版快照，欄位為 `revision`、`snapshot`。`snapshot` 含該版全部單元欄位、審查及狀態資料，但不含自身 `revisionHistory`；revision 必須從 1 連續遞增且不得重複。 |
| `createdAt`、`updatedAt` | ISO 8601 日期時間字串 | 必填 | `updatedAt` 不得早於 `createdAt`；變更時更新並保留版本紀錄。 |
| `supersedesRevision` | 正整數或 `null` | 必填 | revision 1 為 `null`；revision 大於 1 時指向同一 `unitId` 的前一版，且不得跳版。 |
| `changeSummary` | 字串或 `null` | 必填 | revision 1 可為 `null`；後續版須摘要變更及影響。 |

所有陣列均不得含 null 元素。除上述明定空陣列的情況外：`candidate` 的 `curriculumMapIds`、`textbookEvidence`、`prerequisites`、`reviewRecords`、`exceptions`、`revisionHistory` 可為空；送審時 `curriculumMapIds` 至少一項；核准時必須有完整必要審查紀錄。`statusHistory` 至少包含初始建立紀錄。所有識別碼陣列均須去重；字串陣列不得含空白項。任何違反條件均拒絕驗證，不自動去重或補值。

### 3.1 教材證據物件

每筆 `textbookEvidence` 必須含：`evidenceId`（單元內唯一非空字串）、`evidenceType`（只限 `textbook`、`teacher_guide`）、`publisher`、`academicYear`、`edition`、`volume`、`unitTitle`、`locator`（頁碼或教材單元／節次）及 `sourceTitle`；均為非空字串。可選欄位為 `sourceUrl`、`notes`。不得將 `lesson_record` 放在此陣列；教材證據只支持教材來源、版本、冊次、單元及頁次等主張，不代表教材內容已於指定班級教過。

教材證據說明某版本教材或教學材料包含什麼；它不等同指定班級已完成授課。出版社公開簡介可記為背景材料，但不能單獨作為課堂教學完成的證據。

### 3.2 審查紀錄

每筆 `reviewRecords` 必須含 `reviewId`（單元及 revision 內唯一非空字串）、`reviewType`、`decision`、`reviewer`、`reviewerRole`、`reviewDate`（ISO 日期）、`unitRevision`、`evidenceRefs`（字串陣列）及 `notes`（字串）。`reviewType` 僅限四類：`curriculum_alignment`（課綱對應）、`textbook_scope_version`（教材範圍與版本）、`grade_scope_prerequisites`（年級適切性與先備知識）、`scope_and_exclusions`（單元範圍及排除項）。`decision` 限 `pending_review`、`returned`、`approved`。核准紀錄須具名、日期、角色及本 revision 的有效證據引用；自動化格式檢查不能代替教育專業判斷。

### 3.3 `evidenceRefs` 與例外紀錄

`evidenceRefs` 每項為非空字串，使用且只使用以下可解析命名空間：`curriculum-map:<mapId>`、`textbook-evidence:<evidenceId>`、`prerequisite:<prerequisiteId>`、`scope:<unitId>@<revision>`、`exception:<exceptionId>`。陣列不得重複；每個引用必須解析至該單元 revision 的實際項目或存在的 `curriculum-map.json` ID。核准審查不得空引用：無可直接附證時，須引用已核准的例外紀錄；失效、格式錯誤或跨 revision 的引用均使審查不成立。

每筆 `exceptions` 必須含唯一非空 `exceptionId`、`ruleId`（限 `curriculum_mapping_nonformal_design`、`textbook_evidence_not_claimed`、`no_prerequisites_required`）、非空 `reason`、`approver`、`approverRole`、`approvedAt`（具時區 ISO 8601 日期時間）、`unitRevision`（正整數）、非空且可解析的 `evidenceRefs`。例外 ID 不得重複；`unitRevision` 必須指向本版本。例外只可用於：明確非正式課綱設計單元且有課程專業人員理由；該單元不作任何特定教材主張且由教材審查者確認；教師確認沒有必要先備。每一例外須由具權責的課程專業人員或領域教師具名核准並記錄日期與依據。例外不得豁免外鍵存在、年級適切性審查、實際班級授課證據、唯一 ID、歷史完整性或題目自身的發布審查。

核准前四種 `reviewType` 都是必須項目：每種類型在同一 `unitRevision` 均須有最新一筆 `decision: "approved"` 的紀錄；最新紀錄按 `reviewDate` 及唯一 `reviewId` 排序，較早的 `returned` 紀錄保留但由後續核准結論取代。課綱對應由課程專業人員或該領域課綱審查者簽核；教材範圍與版本由領域教師／教材審查者簽核（不作教材主張時須有上述例外）；年級適切性與先備由目標年級領域教師簽核；範圍與排除項須有兩筆核准紀錄，分別由課程專業人員及領域教師簽核。核准紀錄須有 reviewer、reviewerRole、reviewDate、decision 及有效 `evidenceRefs`。若任一必要類型缺漏或其最新結論不是 approved，不得核准。角色兼任規則仍須治理者決定；決定前，同一人不得同時簽核課綱與年級／教材兩類審查。

例外不是免審。適用例外時仍須完成對應 reviewType，審查者應檢查例外紀錄、理由與適用範圍，並在 `evidenceRefs` 引用該例外。只有上述 allowlist 可用；其他豁免一律拒絕。`reviewRecords.unitRevision` 必須等於被審查版本。

## 4. 課綱地圖外鍵及證據邊界

`curriculumMapIds` 是到 `curriculum/curriculum-map.json` 項目 `id` 的外鍵，不是到課綱條文代碼的外鍵。自動驗證器須檢查 ID 存在、唯一、領域相容，且該項目狀態與單元所作主張相符。若 ID 不存在、重複或指向錯誤領域，拒絕單元進入 `in_review`／`approved`，保留 `candidate` 並列出錯誤；不得猜測、補造或以名稱相似的項目代替。待核對課綱項目不得當成已核實證據。

須分開記錄並判讀：

1. **課綱證據**：由 `curriculumMapIds` 追到官方來源、正式條文、位置及課綱年級／學習階段。階段指標表示三、四年級整體要求時，不得推作三年級單獨教學安排。
2. **教材證據**：對應特定出版社、版本、學年度、冊次、單元及頁次／節次；不能替代課綱核對。
3. **專業審查**：`reviewRecords` 記載課程專業人員或領域教師對單元範圍、課綱對應、教材主張及先備要求的實際判斷；不能只靠資料欄位存在推定完成。
4. **指定班級授課紀錄**：與單元核准分開保存，至少連結 `unitId`、單元 `revision`、`cohortId`、`schoolYear`、實際教材／教學紀錄位置、授課週次或日期、已教先備、任課教師姓名／職務、確認日期及結果。只可由任課教師或學校指定人員確認；課綱或出版社公開簡介不得代替實際授課紀錄。

本規格不把班級授課紀錄併入單元核准狀態。登錄檔中的 `classroomUseRecords` 是獨立記錄集合；每筆須按 4.1 驗證，只連結到確切單元版本及 cohort，不表示單元或題目核准。

### 4.1 獨立班級授課與單元使用紀錄

班級使用紀錄不是 `textbookEvidence`，目前存放於登錄檔頂層的 `classroomUseRecords` 陣列，與 `units` 分開驗證。每筆紀錄的必要欄位如下：`classroomUseRecordId`（全域唯一非空字串）、`unitId`（非空字串，必須存在於單元登錄）、`unitRevision`（正整數，必須精確指向存在且核准的單元版本）、`cohortId`（非空字串）、`schoolYear`（非空字串；學年度編碼慣例待治理者決定）、`status`、`teachingRecords`、`prerequisiteChecks`、`teacherConfirmation`。上述欄位不得缺漏或以 null 代替；紀錄不得重複 cohort／學年度／單元版本組合而不說明修訂歷史。

- `status` 限 `not_assessed`、`not_ready`、`ready_for_class`；缺證據時只能是前兩者。
- `teachingRecords` 是實際授課紀錄物件陣列；未確認前可為空，`ready_for_class` 時不得為空。每筆含唯一非空 `lessonRecordId`、非空 `sourceTitle`、非空可定位字串 `locator`、`taughtAt`（ISO 日期）、`teachingWeek`（非空字串或 `null`）、非空教師姓名與職務、`prerequisitesCovered`（不重複的有效 prerequisite ID 字串陣列）。不可用出版社簡介或單元名稱代替 lesson record；來源標題及位置須可由審查者實際查驗。
- `prerequisiteChecks` 須逐項且恰好涵蓋該單元版本所有 `required: true` 先備；每筆含 `prerequisiteId`（有效 ID）、`status`（`not_assessed`、`not_taught`、`confirmed`）、`teachingRecordIds`（解析至本紀錄的實際 lesson record ID 陣列）、`teacherNote`（字串或 `null`）。不得漏列、重複、額外列入或引用不存在的先備／紀錄；非 `confirmed` 項目不可支持 `ready_for_class`。
- `teacherConfirmation` 是物件，含 `teacherName`、`teacherRole`、`confirmedAt`（ISO 日期時間，含時區）、`decision`（上述班級狀態之一）及 `notes`（字串或 `null`）。未就緒紀錄可有空字串／null 的待填確認欄位，但不可因此視為已審；`ready_for_class` 時各欄位均須有效且 `decision` 必須同為 `ready_for_class`。確認者須為任課教師或學校指定人員。

只有單元目前 revision 已核准、所有必要先備均為 `confirmed`、各項均可連結至實際授課紀錄、教師與日期完整時，狀態才能是 `ready_for_class`。其他狀態下，陣列可空或欄位尚未確認，但不得以缺值當成通過。課綱階段指標、教材版本或出版社公開簡介均不能單獨滿足此條件。班級單元紀錄只表示該 cohort 對該 `unitRevision` 的授課準備，不自動批准題目；題目仍須依題目 schema 的班級使用紀錄檢查自己的先備。缺少紀錄或欄位時維持未確認，不推定通過。

## 5. 狀態及合法轉換

| 目前狀態 | 合法下一狀態 | 必要條件 |
| --- | --- | --- |
| `candidate` | `in_review`、`retired` | 送審前必填結構與外鍵檢查通過；或具理由作廢。 |
| `in_review` | `candidate`、`approved`、`retired` | 退回須記錄原因；核准須符合本文件全部核准簽核及證據條件；作廢須留理由。 |
| `approved` | `retired` | 停用須保留歷史及影響紀錄。範圍或課綱對應變更不得直接改寫已核准版，須建立新 revision 回到 `candidate`。 |
| `retired` | 無 | 終止狀態。不得重新啟用或重用 ID；相似新單元須使用新 `unitId` 並記錄關聯。 |

每次轉換均須在 `statusHistory` 寫入該 revision、操作者／職務、時間、理由及支持轉換的審查紀錄 ID；事件需形成連續狀態鏈，前一事件 `toStatus` 必須等於下一事件 `fromStatus`。`approved` 需第 3.2 節四類必要審查全部對同一 `unitRevision` 為 `approved`，例外（若有）已依 3.3 核准，無未解決的 `returned`／`pending_review` 結論，課綱外鍵有效，範圍與排除明確，教材主張有證據或已核准例外。`in_review` 只代表送審中，不是核准；`candidate`、`in_review`、`retired` 均不得供新題目發布或新關卡使用。不得以地圖的 `verified` 標籤、單元名稱、候選清單或自動 JSON 檢查代替專業簽核。

## 6. 修訂、追溯及既有題目影響

`unitId` 是穩定身份；`revision` 記錄範圍快照。單元範圍、學習目標、年級範圍、課綱映射、先備知識或作為核准依據的教材證據有實質變更時：

1. 將目前完整 revision（包括核准與審查紀錄）追加至 `revisionHistory` 的 `snapshot`；歷史快照不可修改或刪除。
2. 建立遞增 revision，填 `supersedesRevision`、`changeSummary`，新 revision 從 `candidate` 開始並重新走審查。
3. 列出引用該 `unitId` 的所有題目及關卡，判定哪些題目映射、年級適切性、答案或解說需重審。
4. 受影響題目須依題目 schema v2 建立新題目 revision、重做相關審查及重新發布；關卡固定引用題目 revision，需另行重新驗證與發布。
5. 在相容性影響確認前，受影響題目不得新增至關卡；若既有單元依據已不再支持某題，暫停該題新引用或將其作廢，直到審查完成。

題目必須同時保存 `unitId` 及 `unitRevision`；後者必須等於單元目前物件的 `revision` 或 `revisionHistory` 中完整存在的 `revision`，其歷史快照須記錄當時狀態與審查資料。題目自身 `revision` 是另一個獨立整數，不得拿來代替 `unitRevision`。找不到目標、快照不完整、版本重複／跳號或引用紀錄狀態不符時，驗證失敗。

## 7. 與題目發布及班級使用的關係

- 題目必須同時引用有效 `unitId` 與 `unitRevision`。新題目發布及新關卡發布／使用只接受該單元的目前 revision 且其狀態為 `approved`；`candidate`、`in_review`、`retired` 或已被新版取代的歷史 revision 均不得新引用。歷史題目保留舊連結，不得自動改綁；欲重新發布或加入新關卡時，須依目前核准單元 revision 建立新題目 revision 並完成重審。
- 單元 `approved` 不會自動核准任何題目；題目 `approved` 不等於正式 `published`。關卡只能引用符合關卡規格、已 `published` 且固定題目 revision 的題目。
- 單元或題目全域核准／發布，不代表某班已教。指定班級使用前須另有該班授課與先備能力確認；未確認時不得指派該班，即使單元與題目均已核准／發布。
- AI 不得決定或覆寫單元審查、題目答案、分數或通關狀態；上述狀態由具名審查流程或固定規則控制。

## 8. 自動驗證器已實作範圍與缺口

目前的 `scripts/unit-registry-validator.mjs` 與 `node:test` 測試已實作登錄及 ID 歷史 JSON 解析、基本欄位／狀態／唯一性、來源與課綱地圖外鍵、版本歷史及狀態鏈、候選／核准門檻、班級紀錄結構、題目新發布引用與關卡新發布引用的獨立檢查。此為最小驗證器，不含題庫／關卡載入器整合、重複 JSON 鍵偵測、永久儲存防竄改或教育語意審查。尚未涵蓋規則仍須依本文件列為後續驗收；不得由目前測試通過推定全部規格已自動化。

共用發布檢查入口 `scripts/publication-guard.mjs` 提供題目及關卡發布前檢查函式。呼叫端收到任何錯誤時必須拒絕發布；目前沒有題目／關卡載入器或正式發布流程呼叫此入口，因此尚未接入網站。檢查只驗資料完整性，不替代教師或課程專業人員判斷。未涵蓋規則仍是後續驗收要求，不能由目前測試通過推定全部規格已自動化。

## 9. 規格示例（非正式資料）

以下僅示範結構。`status` 為 `candidate`、審查紀錄及教材證據尚空，不代表實際建立、教材已核實或單元已核准；所列 curriculum map ID 只示範與目前地圖項目的連結。

```json
{
  "schemaVersion": 1,
  "registryId": "project-units",
  "registryRevision": 1,
  "units": [
    {
      "unitId": "M3-CAP-02",
      "revision": 1,
      "title": "容量量感與估測（規格示例）",
      "subject": "mathematics",
      "gradeScope": {
        "grades": [3],
        "scopeType": "proposed_grade",
        "notes": "專案候選年級，不表示該校已教或已核准。"
      },
      "curriculumMapIds": ["math-capacity-measurement"],
      "scopeDescription": "候選範圍：以容量量感與估測為可能學習目標；實際題型、數值界線及年級適切性待教師與課程專業人員確認。",
      "exclusions": ["未經教材或教師確認的刻度精度與估測容許誤差"],
      "textbookEvidence": [],
      "evidenceNote": "未附康軒實際教材頁次或教學紀錄；公開單元簡介不能證明估測已教。",
      "prerequisites": [
        {
          "prerequisiteId": "CAPACITY-UNIT-EXPERIENCE",
          "description": "能依目標教材已教的容量單位及量感經驗進行估測；具體要求待教師確認。",
          "required": true
        }
      ],
      "exceptions": [],
      "status": "candidate",
      "reviewRecords": [],
      "statusHistory": [
        {
          "unitRevision": 1,
          "fromStatus": null,
          "toStatus": "candidate",
          "changedAt": "2026-10-20T00:00:00+08:00",
          "actor": "規格示例",
          "actorRole": "文件範例",
          "reason": "僅示範初始候選紀錄格式；非真實審查或單元建立。",
          "reviewRecordIds": []
        }
      ],
      "revisionHistory": [],
      "createdAt": "2026-10-20T00:00:00+08:00",
      "updatedAt": "2026-10-20T00:00:00+08:00",
      "supersedesRevision": null,
      "changeSummary": null
    }
  ]
}
```

## 10. 尚待教師或課程專業人員決定

- `unitId` 命名規則是否採用本文件建議的正規表示式，以及不同年級、領域、跨域單元的代碼慣例。
- 哪些課綱地圖狀態可作核准依據；思考訓練標籤是否可作單元連結，或僅能作設計備註。
- 領域教師、課程專業人員、教材審查者與發布者的資格、簽核分工及是否允許同一人兼任。
- 單元核准時是否要求目標教材版本已確定；若教材證據缺席，哪些內容可保留為候選，哪些不得核准。
- 單元 revision 變更時，既有題目及已發布關卡的停用、緩衝期、家長／教師通知及回復政策。
- 指定班級授課紀錄的實際檔案路徑、隱私與保存期限；本規格未定義學生個資欄位，亦不應將學生姓名放入登錄。
- 題目及審查紀錄的跨版本顯示與查詢方式；題目 schema v2 已要求以 `unitId`／`unitRevision` 固定所依據的單元版本，實際驗證器及稽核介面仍待實作。
- 跨學期、跨教材版本或一個題目對應多個單元時的使用政策及交叉引用規則。

