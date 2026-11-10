# SEC-09 教師審核 HTTP 整合（非正式環境）

## 本輪變更
- 新增 `scripts/cloudflare-review-worker.mjs`，提供 `POST /api/review/decisions` 及 `POST /api/review/approvals`。
- 教師請求必須通過 Cloudflare Access JWT 驗證及獨立 `REVIEWER_EMAILS` allowlist；發布者權限不能取代教師。
- 使用既有 SEC-04 決策服務及 SEC-05 稽核核准橋接；HTTP 請求只允許必要欄位，拒絕客戶端提供審核快照及稽核內容。
- **沒有建立候選來源匯入 HTTP 端點**；SEC-06 的候選來源仍必須由可信任後端管理。
- 新增 `test/sec-09-review-http.test.mjs` 及 `.github/workflows/sec-09-review-http.yml`。

## 邊界與未完成事項
- 本輪僅提供可組合的獨立 Worker 模組，**尚未接入正式 Worker entrypoint / routes，也未部署**。
- Cloudflare Access、D1 binding、migration、staging 及真實教師身分驗證均未驗證。
- 此 API 沒有提供候選題目匯入或自動發布功能；發布仍由原本 publisher-only Worker 處理。
- CI 測試結果尚待 GitHub Actions 執行確認；**不能宣稱測試通過**。
- 需要後續專項檢查 Cloudflare Access 路由保護、端點速率限制、監控及真實 D1 transaction 行為。
- 禁止合併 main、部署、建立付費資源、修改正式資料。

## 驗收
- `node --test test/sec-09-review-http.test.mjs`
- `node --test test/sec-07-security-chain.test.mjs test/sec-06-candidate-ingress.test.mjs test/sec-05-audited-chain.test.mjs test/sec-04-review-decisions.test.mjs test/sec-03-reviewer-persistence.test.mjs test/sec-02-approval-bridge.test.mjs test/sec-01-hardening.test.mjs test/cloudflare-publication.test.mjs`
- 上述測試均需取得實際 PASS 證據，才能標記 SEC-09 程式測試完成。
