# SEC-11 Cloudflare Workers + D1 本機隔離驗證

## 新增內容
- `wrangler.sec11.json`：僅供本機驗證的 Worker entrypoint、D1 binding 與測試用虛擬 database_id；**不是正式 D1 ID**。
- `.github/workflows/sec-11-local-worker-d1.yml`：使用 Wrangler v4 在 GitHub runner 的 `.tmp/sec11-d1` 建立隔離本機 D1，逐份套用五份 SQL migration，執行既有安全鏈與 SQLite 測試，再啟動 `wrangler dev --local`。
- HTTP probe 驗證未知路由為 404、未認證教師及發布者 POST 為 401、候選題目匯入路由未暴露。

## 明確限制
- 未呼叫 `wrangler deploy`、未使用 `--remote`、未讀寫正式 D1、未建立付費資源。
- 這是 **本機 Worker runtime + 本機 D1 的未認證路徑 smoke test**，並非真實 Access JWT、完整教師審核至發布的端對端測試。
- 使用 Wrangler CLI 動態安裝套件，測試結果以 CI 實際執行為準；**目前未取得 CI PASS 證據**。
- 不合併 main、不部署、不修改正式資料。
- 完整審核到發布的真實 D1 交易驗證與 staging 應另案進行，且需額外授權。

## 驗收閘門
1. SEC-11 workflow 顯示 success，保留 run URL 及 migration / runtime log。
2. 若失敗，只修復本輪測試與相容性問題，不擴大修改範圍。
3. 成功後僅能宣稱「本機隔離 Worker/D1 smoke test 通過」，不得宣稱 staging 或正式部署驗收。
