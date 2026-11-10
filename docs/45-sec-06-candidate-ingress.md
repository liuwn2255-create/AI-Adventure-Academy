# SEC-06 候選題目入口收斂

- SEC-03 `saveApproved` 直接提交已核准快照的舊入口現在一律拒絕（`direct_approval_disabled`），避免繞過 SEC-04/05 逐項稽核。
- `createCandidateIngress` 只允許經授權 `curriculum_editor`，依 id/revision 從伺服器端不可變 `candidate_source` 載入草稿，再建立版本 1、空審核紀錄的候選題目。
- 新增 SQL migration 與 SQLite 記憶體驗證；未執行正式 D1 遷移。
- **重要限制**：SEC-03 歷史測試仍預期舊入口成功，需在新契約下改寫測試。正式來源匯入權限、教師登入、真實 D1 staging、前端與 Worker 路由均未完成。候選來源匯入不得對外公開。
- 不合併 main、不部署、不建立付費資源、不修改正式資料。
