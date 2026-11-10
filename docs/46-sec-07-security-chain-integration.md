# SEC-07 安全鏈整合驗收紀錄

## 範圍
- 以 SEC-06 分支為基礎，保留 SEC-01 至 SEC-06 累積的變更。
- 使用 `test/sec-07-security-chain.test.mjs` 驗證候選來源、逐項教師決策、稽核鏈與核准快照。
- 使用 `.github/workflows/sec-07-integration.yml` 執行 Node 回歸測試與 SQLite migration 測試。
- 所有驗證只允許測試資料；不得連接正式 D1 或部署。

## 已確認
- SEC-07 分支已建立。
- 跨階段測試與 CI workflow 已提交。
- SEC-03 直接核准入口在 SEC-06 契約下已禁用。
- SEC-01 至 SEC-06 的變更在 SEC-06 分支中呈累積關係。

## 尚未確認（不可標記 PASS）
- GitHub Actions 實際工作流程結論與逐項測試數量。
- 真實 D1 staging、正式教師身分驗證、實際 Worker 路由。
- 教育專業簽核及正式發布授權。

## 驗收閘門
1. GitHub Actions 中 SEC-07 workflow 結論必須為 success，且取得可查驗的 run URL。
2. Node 測試與四組 SQLite migration 均成功；若失敗，只修復實際失敗項目並重新驗證。
3. 保留拒絕未授權、稽核竄改、版本衝突、重複核准等負向測試。
4. 未通過上述閘門前，SEC-07 維持 pending_validation，不得宣稱完成。
5. 不合併 main、不部署、不建立付費資源、不修改正式資料。

## 注意
GitHub commit status 為空、PR workflow 查詢無結果，都不足以證明 workflow 未執行或已通過。
