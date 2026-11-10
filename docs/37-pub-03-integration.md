# PUB-03 — 本機模擬整合測試

- 測試 Worker 的實際 HTTP `fetch` 路由、可信任發布者身分、題目／關卡發布前驗證、版本衝突、D1 交易寫入及稽核紀錄。
- 修正 PUB-02 發布前以 `approved` 物件呼叫 AUTO-02 驗證器的問題：現在先建立含可信任 `publisher`、`publishedAt`、`revision` 的 **published** 物件，並驗證與寫入同一份資料，避免驗證後資料變形。
- 測試採用記憶體 D1 模擬器與受信任身分注入；不使用 Cloudflare 帳號、不建立 D1、不執行 migration、不部署。
- 模擬器不等於真實 D1 SQLite。正式 staging 仍需測試資料庫 migration、併發寫入原子性、JWT 驗證及 Cloudflare Access 設定。
- 程式中 `createCloudflarePublicationWorker` 的測試注入只能用於測試；正式入口的 default export 一律使用真實 Access 驗證及 AUTO-02 驗證器。
- 本輪不代替教師審核、課綱核實或正式發布簽核。
