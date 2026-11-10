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

## 2026-11-10 Windows 本機測試證據（使用者提供 PowerShell 截圖）
- 工作目錄顯示為 `C:\AI工作區\AI-Adventure-AUTO02`；截圖未獨立顯示 `git rev-parse HEAD`，因此**尚未驗證測試執行時的精確 commit SHA**。
- `node --test test/sec-07-security-chain.test.mjs`：tests=2、pass=2、fail=0，約 183 ms。
- 安全及發布模組限定回歸測試：tests=43、pass=43、fail=0、skipped=0，約 537 ms。截圖顯示 SEC-07 正負向案例通過。
- `python test/sec-02-sqlite-migration.py`、`python test/sec-03-sqlite-migration.py`、`python test/sec-04-sqlite-migration.py`、`python test/sec-06-sqlite-migration.py`：四個命令皆返回提示字元，畫面未顯示錯誤；未記錄各自退出碼，故列為「執行無可見錯誤」，不列為已證實 PASS。
- 使用者另執行 `node --test test/*.test.mjs`，截圖出現 `official-learning-item-activity-crosswalk.test.mjs` 斷言失敗（實際 `not_verified`、預期 `directory_launch_and_return_verified`），另有一項 expected true/actual false；完整失敗數未提供。這屬全專案測試未通過，尚無證據可歸因 SEC-07。

### 當前判定
- **SEC-07 指定本機 Node 安全鏈回歸：PASS（依使用者截圖）。**
- **SQLite migration：初步無可見錯誤，待退出碼確認。**
- **GitHub CI：未取得成功 run URL，pending。**
- **完整專案回歸：有失敗，另案追蹤。**
- **正式環境／D1 staging／真實教師登入：未驗證。**
- **SEC-07 總體狀態：pending_validation**；不得以本機 43 PASS 代替 CI、部署或正式發布驗收。

### 最小後續確認
1. 在相同工作目錄執行 `git branch --show-current` 與 `git rev-parse HEAD`，綁定本機測試證據到確切版本。
2. 取得 GitHub Actions SEC-07 workflow 成功 run URL；如無 run，先核對 workflow 是否可見與 Actions 設定。
3. 必要時重新執行四組 Python migration 並記錄各自 `$LASTEXITCODE`；避免重跑已通過的 Node 測試。
