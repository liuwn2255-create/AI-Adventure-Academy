# SEC-10 Worker 路由整合與本機端對端驗證

## 範圍與實作
- 新增獨立的 `scripts/cloudflare-integrated-worker.mjs`，精確路由至既有 SEC-09 教師審核與 PUB 發布 Worker。
- 教師路由：`POST /api/review/decisions`、`POST /api/review/approvals`。
- 發布者路由：`POST /api/questions/publish`、`POST /api/levels/publish`。
- 路由層拒絕未知路徑，不暴露候選來源匯入或直接核准入口；各 Worker 仍獨立驗證 JWT、角色及 D1。
- `test/sec-10-worker-route.test.mjs` 覆蓋教師/發布者越權、可信核准快照缺失、未知路由與資料庫缺失的 fail-closed 行為。
- CI 工作流程 `.github/workflows/sec-10-worker-route.yml` 覆蓋 SEC-10、SEC-09 與既有安全鏈測試。

## 非目標與安全限制
- **這是獨立、尚未部署的整合入口**；沒有修改既有正式 Worker entrypoint、Cloudflare routes、D1 或設定。
- 本輪測試使用 mock/in-memory 依賴；不是 Cloudflare runtime + 真實 D1 的完整端對端測試。
- 未建立付費資源，未合併 main，未操作正式資料。
- staging、真實 Access JWT、D1 migrations、發布資料驗證、正式路由設定及 CI run URL 均仍待驗證。

## 驗收狀態
- 程式與測試已提交，**實際測試是否 PASS 尚待 CI 或本機執行證據**。
- 檢查 `node --test test/sec-10-worker-route.test.mjs`。
- 若 CI 失敗，先依實際 log 最小修正；未驗證前不得宣稱 SEC-10 完成。
