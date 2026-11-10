# SEC-12 本機 Worker + D1 端對端驗收

## 實際證據
- 驗證 commit: fea86bd82ad0bd07a3d0a531d7053b691fb19f89
- Run: https://github.com/liuwn2255-create/AI-Adventure-Academy/actions/runs/42793642882
- Job: 129753111625，success；回歸 49 PASS / 0 FAIL。
- 五份 SQL migration、Wrangler 本機 Worker、隔離 D1 實際執行均成功。
- 端對端輸出：{"ok":true,"checks":"candidate, four reviews, immutable audit, approval, question, level, game read, denial and duplicate"}

## 修正
- 審查紀錄由伺服器產生 reviewDate、revision、unitRevision。
- 題目發布驗證使用可信任發布者及時間產生的 publicationRecord，而非客戶端或尚未發布的快照紀錄。

## 驗收邊界
- 使用測試專用身分注入與合成課綱/題目資料；未驗證真實 Cloudflare Access。
- 關卡核准快照由測試直接寫入隔離 D1；未實作關卡審核流程。
- 遊戲讀取透過既有唯讀 handler；未部署或接入正式遊戲入口。
- 驗收包含候選匯入、四項審查、過期版本、未授權、不可竄改稽核、核准快照、發布、重複發布與遊戲讀取。
- 不合併 main、不部署、不建立付費資源、不讀寫正式資料。
- 結論：本機測試範圍 PASS；正式環境、真實身份與關卡審核仍待獨立驗收。
