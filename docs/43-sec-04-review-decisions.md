# SEC-04 — 逐項教師審核、版本鎖與稽核

- 新增 `review_candidates` 伺服器端題目候選儲存模型（題目由可信任後端預先建立；本階段不新增公開寫入端點）。
- `createD1ReviewDecisionService` 僅接受授權教師提交「題目 ID、revision、審核面向、approve/return、理由、expectedVersion」；題幹與審核者身分一律由伺服器決定。
- 逐次寫入不可變審核稽核紀錄，使用版本鎖；全部四項核准才轉成 approved。退回必須附理由。
- 本機模擬 D1 與 SQLite 記憶體 migration 測試，未操作真實 D1。
- **尚未完成**：Cloudflare Access 實際登入驗證、真實 D1 staging、候選題目安全建檔、審核決策 HTTP API、正式教師簽核、SEC-03 `reviewed_questions` 的可信任來源綁定。SEC-03 直接提交已核准物件的 API **不得對外開放**；必須改由本服務持久化的四項決策作為唯一來源。
- 不合併 main、不部署、不建立付費資源、不修改正式資料。
