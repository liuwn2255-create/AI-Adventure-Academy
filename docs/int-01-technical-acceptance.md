# INT-01 整合版技術驗收

## 驗收範圍

此驗收由 .github/workflows/int-01-integration.yml 執行，僅在 int-01-academy-integration 分支的 push 或該分支手動執行。工作流程使用 Node.js 22、Linux Runner、Playwright Chromium、Wrangler 及僅存於 Runner 暫存目錄的 SEC-14 本機 D1；不連接正式資料庫、不部署、不寫入正式教材。

每次執行均會產生與該次 commit SHA 綁定的 Actions Step Summary 及 int-01-technical-acceptance-<SHA> artifact。應以該 run 的摘要與日誌作為測試數量及瀏覽器操作結果的權威紀錄，不以本文件或本機歷史測試數字代替當次結果。

## 驗收項目

- 全量 node --test --test-reporter=spec，同時啟動 prototype 伺服器及 SEC-14 隔離 Worker/D1。
- 全專案 prototype、scripts、test JavaScript/MJS 語法檢查。
- SEC-14 真實瀏覽器流程：教師審核決策、過期版本衝突、核准快照、稽核歷史、發布者發布題目與關卡、匿名存取拒絕。
- GAME-01 Grade 3/4 桌面與手機路線瀏覽器流程。
- EDU-01 五項候選教材瀏覽器流程。
- UX-01 390px 行動裝置學習進度流程。

SEC-14 瀏覽器流程由完整測試中的現有 test/sec-14-browser.mjs 執行，並使用 workflow 先套用 migrations 建立的隔離本機 D1。CI 結束時 Runner 會丟棄此資料。

## 結果解讀限制

- 全自動測試通過不代表教師或課綱專家核准教材。
- 候選活動仍維持待教師審查，數位作答不代表學生精熟。
- 本驗收不證明官方全國課綱清冊完整，也不代表正式網站已部署。
- 若某項失敗，應以同一 run 的 job log 定位；不得跳過或刪除失敗測試。