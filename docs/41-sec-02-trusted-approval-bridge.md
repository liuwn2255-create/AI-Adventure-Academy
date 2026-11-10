# SEC-02 — 教師審核到發布核准快照的隔離橋接

- `scripts/trusted-approval-bridge.mjs` 只接受經可信任 `authorize` 核可的審核者，從伺服器端 `loadReviewedQuestion(id, revision)` 取得已核准題目，不接受使用者傳入的審核結論。
- 檢查四項審核均為 approved 且有審核者、角色、時間；將核准快照寫入 SEC-01 `publication_approvals`，供發布服務唯讀使用。
- 新增模擬資料庫端到端測試（先無核准拒絕，寫入後可發布）、SQLite 記憶體遷移與不可變 trigger 測試。
- **限制**：尚未將 PUB-04 示範介面接到真實 Cloudflare Access 教師登入，也沒有正式持久化的題目審核來源；`loadReviewedQuestion` 仍需由受保護的後端實作。未建立對外審核 API，未執行正式 D1 migration。SQLite 測試不等於 Cloudflare D1 驗收。
- 本次沒有任何真實教師簽核；教育專業待簽核項目不變。
- 不合併 main、不部署、不建立付費資源、不修改正式資料。
