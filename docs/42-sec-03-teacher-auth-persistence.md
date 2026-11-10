# SEC-03 — 教師 JWT 驗證與 D1 審核來源（隔離開發）

- `authenticateReviewer` 重用既有 Cloudflare Access RS256/JWKS 驗證器，但以獨立 `REVIEWER_EMAILS` allowlist 取得 `reviewer` 角色。發布者名單不等於教師名單。
- `createD1ReviewedQuestionStore` 只允許受信任審核者提交四項審核完整、審核者一致的已核准題目快照，並可供 SEC-02 `loadReviewedQuestion` 讀取。
- 新增不可變 `reviewed_questions` D1 migration SQL；只在 GitHub CI 以 SQLite 記憶體執行，沒有遷移真實 D1。
- **重要信任邊界限制**：此階段的 `saveApproved` 接收已核准的物件，仍不能證明四項審核是逐次由教師完成，因為教師提交的審核欄位尚未由伺服器端逐項保存／驗證。它只是一個隔離資料儲存元件，不可直接公開為 HTTP API 或視為正式教師簽核。正式使用必須先實作伺服器端逐項決策、審核證據、授權及稽核。
- 沒有設定真實 Cloudflare Access、沒有建立 D1 資源、沒有部署或修改正式資料。
