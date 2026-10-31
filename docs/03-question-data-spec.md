# 題目資料格式與驗證規則

本文件定義題目資料 schema v2 的規格草案。範例用於說明欄位，不代表其中的單元、課綱對應或題目已核准。規格文字尚待後續實作；文件完成不代表驗證器已存在。

## 題目資料格式（schemaVersion 2）

```json
{
  "schemaVersion": 2,
  "id": "example-question-001",
  "revision": 1,
  "unitId": "M3-NUM-01",
  "unitRevision": 1,
  "subject": "mathematics",
  "grade": 3,
  "language": "zh-Hant-TW",
  "prompt": "題目文字",
  "interaction": {
    "type": "single_choice",
    "options": [
      { "optionId": "option-a", "text": "選項甲" },
      { "optionId": "option-b", "text": "選項乙" }
    ],
    "answerId": "option-a"
  },
  "explanation": "經審核的解釋",
  "difficulty": "introductory",
  "prerequisites": [
    {
      "prerequisiteId": "PR-M3-NUM-PLACE-VALUE",
      "description": "辨認教師確認已教的位值表徵",
      "required": true
    }
  ],
  "curriculumMappings": [
    {
      "sourceId": "mathematics",
      "sourceUrl": "https://example.invalid/official-guideline.pdf",
      "documentTitle": "正式文件完整名稱",
      "publicationInfo": "版本或發布資訊",
      "locations": [
        {
          "kind": "content",
          "code": "N-3-1",
          "pageOrSection": "伍／二／學習內容／3年級；頁碼待核實",
          "gradeScope": "grade_level_content"
        }
      ],
      "verificationStatus": "pending_verification",
      "verifiedBy": null,
      "verifiedAt": null,
      "notes": null
    }
  ],
  "textbookEvidence": [],
  "review": {
    "curriculum": { "status": "pending_review", "reviewer": null, "reviewerRole": null, "reviewDate": null, "revision": 1, "unitRevision": 1, "notes": null },
    "gradeLevelFit": { "status": "pending_review", "reviewer": null, "reviewerRole": null, "reviewDate": null, "revision": 1, "unitRevision": 1, "notes": null },
    "answer": { "status": "pending_review", "reviewer": null, "reviewerRole": null, "reviewDate": null, "revision": 1, "unitRevision": 1, "notes": null },
    "explanation": { "status": "pending_review", "reviewer": null, "reviewerRole": null, "reviewDate": null, "revision": 1, "unitRevision": 1, "notes": null }
  },
  "publicationStatus": "draft",
  "publicationRecord": { "publisher": null, "publishedAt": null, "revision": null }
}
```

範例中的 `M3-NUM-01` 只展示 `unitId` 位置，不代表該候選單元已登錄或核准；`.invalid` 網址是格式佔位文字，不是有效來源。正式資料必須以已登錄的真實單元與來源替換。

## 專案單元登錄與單元版本連結

單元登錄欄位、狀態、歷史及簽核條件的唯一正式規格為 [`docs/18-unit-registry-spec.md`](18-unit-registry-spec.md)。`curriculum/curriculum-map.json` 是官方課綱學習重點對照，不是專案單元登錄；不得以課綱地圖 `id` 代替題目 `unitId`。本規格只引用 docs/18 定義，不另列單元欄位或狀態清單。`curriculum/unit-registry.json` 及 ID 歷史檔已建立，但目前登錄的單元仍為 `candidate`；不得據此推定存在可供正式題目發布使用的核准單元。

每筆題目必須同時有 `unitId` 與 `unitRevision`：`unitId` 指向穩定的專案單元身份；`unitRevision` 是正整數，指向該身份在 `docs/18` 規定的目前版本或不可變歷史快照。它與題目自身 `revision` 完全分開：題目 `revision` 版本化題幹、選項、答案、解說等題目資料；`unitRevision` 固定此題目所依據的單元範圍版本。兩者不可互相替代。

驗證器必須在單元登錄中找到相同 `unitId` 及 `unitRevision`，並確認所引用快照有效。新題目發布只接受單元目前 revision 且該版 `status: "approved"`；`candidate`、`in_review`、`retired` 或已被新版取代的歷史 revision 不得供新題目發布或新關卡使用。既有題目的歷史連結不得自動改綁；單元變更後須先做影響評估及相關題目審查。找不到該版本、歷史鏈不完整或狀態不符時，驗證失敗並拒絕發布／關卡使用。

## 證據與審查資料的責任界線

- **`curriculumMappings`** 記錄官方課綱來源、正式文件、條文位置與適用年級層級。`verificationStatus` 只表示這筆來源與條文資料是否已核對：`pending_verification`、`verified` 或 `rejected`。它不等於題目整體已通過課綱審查。
- **`textbookEvidence`** 記錄教材版本及可定位的冊次、單元、頁次等材料證據。公開簡介或單元名稱不得寫成目標班級已完成授課的證明；若未以教材或教學材料支持題目主張，可用空陣列並在審查意見說明。
- **教師確認授課進度** 是班級／學期層級的使用證據，不能併入全域題庫發布狀態。指定班級使用時，另須保存班級或 cohort、題目 ID 與 revision、已教先備知識、教材／授課紀錄位置、教師、日期及結果。題目在全域題庫發布，不表示每個班級均可使用。
- **`review`** 是對這一題目 revision 的內容審查結論。各面向狀態可為 `pending_review`、`returned` 或 `approved`，並記錄審查者、角色、日期、revision 及意見。`review.curriculum.status: "approved"` 表示審查者確認題目與其課綱對應相符；其前提是至少一筆相關 mapping 為 `verified`，不會改寫 mapping 狀態。
- 範例 `review.*.revision` 是題目自身的 `revision`，`review.*.unitRevision` 是該審查所依據的單元版本；兩者均須與題目本體的版本欄位相符，不得互換或由新單元版本回寫歷史審查。
- 四個必要面向為 `curriculum`、`gradeLevelFit`、`answer`、`explanation`。每項核准只對其記錄的 revision 有效。

`prerequisites` 必須是陣列；每筆為物件，包含唯一且非空的 `prerequisiteId`、非空 `description`、布林值 `required`。同一題內 ID 不得重複；空陣列表示尚未列出先備，發布前須由年級適切性審查確認是否確實不需要先備，不得以空值暗示已確認。描述應是可由教師核對的知識或能力，不可寫成推定學生已會的結論。

班級使用紀錄與題目資料分開保存，建議採下列物件格式；本例是欄位格式範本，並非真實班級確認：

```json
{
  "questionId": "example-question-001",
  "revision": 1,
  "unitId": "M3-NUM-01",
  "unitRevision": 1,
  "cohortId": "",
  "schoolYear": "",
  "status": "not_assessed",
  "prerequisiteChecks": [
    {
      "prerequisiteId": "PR-M3-NUM-PLACE-VALUE",
      "status": "not_assessed",
      "evidenceType": null,
      "evidenceLocator": null,
      "notes": null
    }
  ],
  "teachingEvidence": [],
  "teacher": { "name": null, "role": null },
  "confirmedAt": null,
  "notes": null
}
```

`cohortId`、`schoolYear`、題目 ID、題目 `revision`、`unitId` 及 `unitRevision` 必須有效；狀態限 `not_assessed`、`not_ready`、`ready_for_class`。`prerequisiteChecks` 必須逐項對應題目中所有 `required: true` 的先備 ID，不能遺漏、重複或額外引用；各項狀態限 `not_assessed`、`not_ready`、`confirmed`。要設為 `ready_for_class`，題目所需先備及單元先備均須有具名教師確認及可查驗的實際授課證據，且教師姓名、職務、確認日期完整。`teachingEvidence` 是班級實際授課紀錄，不是教材目錄；每筆須記錄唯一 `evidenceId`、`evidenceType: "lesson_record"`、`sourceTitle`、`locator`、`taughtAt`、授課教師及所涵蓋先備 ID。教材版本、冊次與頁次使用獨立 `textbookEvidence`。出版社公開簡介和課綱階段指標不得作為班級已授課證據；缺證據時維持未確認。`not_assessed` 或 `not_ready` 時未完成的確認欄位可為 null。此紀錄只適用該 cohort、schoolYear、題目 revision 及單元 revision，不因全域發布而自動產生。本文件僅定義資料規格，不建立班級紀錄檔或驗證程式。

## 狀態與發布門檻

`publicationStatus` 僅可為 `draft`、`pending_review`、`returned`、`approved`、`published` 或 `void`。

| 目前狀態 | 合法下一狀態 | 條件 |
| --- | --- | --- |
| `draft` | `pending_review`、`void` | 提交審查或作廢 |
| `pending_review` | `returned`、`approved`、`void` | 審查退回、所有必要內容審查完成，或作廢 |
| `returned` | `draft`、`pending_review`、`void` | 編輯修訂、重新送審，或作廢 |
| `approved` | `published`、`returned`、`void` | 獨立發布者完成發布檢核，或退回／作廢 |
| `published` | `void` | 已發布版本不可直接編輯；停用時保留紀錄並停止新引用 |
| `void` | 無 | 終止狀態；恢復內容須建立新 revision／紀錄，不得復活已作廢版本 |

內容審查者負責四個審查面向；正式發布者是另一個職責，負責確認核准 revision、登錄、資料驗證及發布紀錄。不得由發布者代替缺漏的內容審查。

全域題庫發布前，至少必須符合：

1. 必填欄位及所有跨欄位驗證通過；`unitId`／`unitRevision` 在單元登錄中存在且指向目前 `approved` revision。
2. 所有列為題目依據的課綱 mapping 均有有效來源 ID，且為 `verified`；待核對或遭拒的 mapping 不得作為發布資料，應先補證或移除該項主張。
3. `curriculum`、`gradeLevelFit`、`answer`、`explanation` 四面向均為 `approved`，各有審查者、角色、日期，且審查 revision 與待發布 revision 相同。
4. 發布者不同於內容審查紀錄中的審查者，並填入 `publicationRecord.publisher`、`publishedAt` 及 `revision`。
5. 所有題型、答案引用及來源關聯均由驗證器成功檢查；任何缺欄、重複 ID、無效來源、未核准狀態或答案引用錯誤均拒絕發布，不得忽略或降級處理。

班級使用另行檢查該班的教材與實際教師授課紀錄、題目及單元先備知識、年級適切性，以及被題目固定引用的 `unitId`／`unitRevision`。缺少確認時不可指派該班，即使題目已全域發布。

## 版本與不可變發布

`id` 在題目生命週期中保持穩定，題目 `revision` 為正整數。已發布版本不可覆寫。題幹、選項、答案、解說、`unitId`、`unitRevision`、課綱連結或教材證據有實質修改時，建立同一題目 ID 的新題目 `revision`，狀態從 `draft` 開始，重新執行受影響審查；題幹、選項、答案或解說變更須重做四項審查，單元連結／版本或教材證據變更至少重做課綱、年級適切性及相關教材審查，並由發布者重新檢核後發布。不得因單元 revision 更新而自動改綁題目。舊題目及其審查、發布紀錄保留。關卡須固定引用特定題目 ID 與題目 `revision`；題目資料另固定 `unitId` 與 `unitRevision`。若任一引用不存在或失效，拒絕發布／載入。

## 驗證規則

- 只支援 `interaction.type: "single_choice"`。未在本文件定義格式與判定方式的題型一律拒絕發布；不得以任意字串或隱含慣例擴充。
- 單選題 `options` 至少兩項；每個選項必須有非空、同題唯一的穩定 `optionId` 及非空 `text`。`answerId` 必須精確指向同一題目的一個 `optionId`。評分只比對 ID，不得依選項文字、陣列順序、AI 或文字近似判定。
- `prerequisites` 必須為物件陣列；每筆必須有唯一非空字串 `prerequisiteId`、非空字串 `description` 及布林 `required`。空陣列仍須由年級適切性審查明確確認，不可視為自動通過。
- `schemaVersion` 必須為支援版本；`id`、題目 `revision`、`unitId`、`unitRevision`、subject、grade、prompt、interaction、explanation、prerequisites、`curriculumMappings`、`textbookEvidence`、四項審查、`publicationStatus` 及 `publicationRecord` 均為必填。`unitRevision` 為正整數，且必須與 `unitId` 在單元登錄中所指版本完全相符。草稿階段的證據陣列可為空，但發布條件另有要求。`subject` 僅接受 `mathematics`、`chinese_language`、`natural_science`、`thinking`；grade 為正整數。初期目標年級為 3。
- `curriculumMappings` 必須為陣列。草稿可為空；正式發布須至少一筆，且每筆列為依據的 mapping 都須為 `verified`。待核對 mapping 使用 `verificationStatus: "pending_verification"` 且不得作為已核實依據；來源 ID 必須存在於來源登錄。`verified` mapping 必須有正式來源 URL、文件名稱／發布資訊、條文代碼及可核對頁節、適用年級範圍、核對者與日期。第二學習階段碼不得單獨證明三年級實際授課。
- `textbookEvidence` 必須為陣列；每筆須有唯一非空 `evidenceId`、非空 `publisher`、`academicYear`、`edition`、`volume`、`unitTitle`、明確頁次／`locator`，以及 `evidenceType`（限 `textbook`、`teacher_guide`）；`sourceUrl`、`notes` 可選。不得以來源、版本與位置皆為 null 的物件當有效證據。沒有支持題目主張的教材材料時可用空陣列並說明，不得捏造資料。實際課堂授課紀錄只能放在獨立班級使用資料中，不得混入教材證據。
- 班級授課／先備確認必須是獨立紀錄，包含 `questionId`、題目 `revision`、`unitId`、`unitRevision`、`cohortId`、`schoolYear`、狀態、逐項必要先備檢核、可定位的實際 lesson record、教師姓名／職務、日期及意見。先備 ID 須與該題目及單元版本的必要 `prerequisites` 完整吻合；`ready_for_class` 必須每項必要先備均確認且有實際授課證據、教師與日期。課綱指標與出版社簡介不能代替授課紀錄；缺少證據維持未確認。此規格不表示已實作驗證器。
- 四項審查 status 只能為 `pending_review`、`returned`、`approved`；每項均須記錄 reviewer、reviewerRole、reviewDate、題目 `revision` 及 `unitRevision`。`approved` 時兩個版本均須與該題目本體及其單元快照完全相符。任何未完成、退回、缺欄或版本不符均禁止發布。
- JSON 使用 UTF-8 標準語法，不含註解、尾隨逗號或重複鍵；驗證須涵蓋結構、唯一性、來源／單元外鍵及跨欄位條件。
- 顯示文字按純文字處理，不得執行 HTML／腳本。引用圖片或音訊須有相對路徑、授權資訊及替代文字。

## schema v1 相容性

既有 schema v1 範例使用字串選項且沒有有效選項 ID，與 v2 不相容。不得僅以選項文字自動推導選項 ID，也不得把 v1 資料直接標成 v2。正式遷移須為每個選項配置穩定 ID、明確重建 `answerId`、補齊 `unitId` 及 `unitRevision`（須解析到 docs/18 所定義的實際單元 revision）、證據與審查紀錄，逐筆驗證後才可使用；遷移前的題目不得發布。此處定義遷移要求，不代表已執行資料轉換或建立程式驗證器。

