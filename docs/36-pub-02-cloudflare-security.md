# PUB-02 — Cloudflare Workers + D1 發布安全整合（未部署）

本分支從 PUB-01 衍生，提供 Cloudflare Worker adapter、Cloudflare Access JWT RS256 驗簽、D1 SQL migration 與專項測試。**未建立任何正式 D1 資料庫、Cloudflare Access 應用程式或部署設定。**

## 安全架構
1. 管理端由 Cloudflare Access 保護；Worker 每次請求再次驗證 `Cf-Access-Jwt-Assertion` 簽章，要求 RS256、Access 公鑰 `kid`、正確 `iss`、`aud`、有效 `exp`／`iat`／`nbf`。
2. `PUBLISHER_EMAILS` 是獨立的發布者白名單；審查權限仍須由正式審查系統管理。此服務不會替任何教師自動簽核。
3. `REGISTRY_BUNDLE_JSON` 由可信任部署管理員提供，不能從發布請求覆寫。正式部署前應改成經版本控管的可信 registry 快照來源，並驗證來源更新流程。
4. D1 `batch` 將發布紀錄及稽核紀錄放在單一交易；唯一索引、單調 revision trigger 防止競態重複與舊版覆寫；不可變 trigger 阻止更新／刪除。
5. 題目與關卡發布均調用 AUTO-02 既有的 fail-closed 驗證器；關卡讀取已發布題目的固定版本。
6. 只暴露 POST `/api/questions/publish` 和 `/api/levels/publish`；不提供公開發布清單或管理 UI。

## 部署前必須完成（本次不授權部署）
- 建立 Cloudflare Access 應用，設定正確 `ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`、`PUBLISHER_EMAILS`，並限制可進入 Access 的身分。
- 建立獨立 D1 資料庫，審查後執行 `migrations/0001_publication.sql`；Worker D1 binding 名稱 `PUBLICATION_DB`。
- 設定可信任 `REGISTRY_BUNDLE_JSON`；確認官方課綱、單元、四項審查與簽核資料完整。
- 在隔離的 staging Cloudflare 環境進行 D1 原子交易、並行版本競爭、JWT key rotation、Cloudflare Access 政策與真實資料格式整合測試。
- 針對公開部署補上速率限制、監控、備份、災難復原、部署權限隔離與稽核保留政策。
- 確認 Cloudflare Worker runtime 與 node test runtime 的差異。

## 目前限制
- `REGISTRY_BUNDLE_JSON` 直接作為環境文字配置，可能受環境變數大小限制，不應直接作為正式大型 registry 載入方案。
- Worker 未提供完整管理端流程，也未建立正式審查系統。
- 這份提交不會合併 main、部署或變更正式資料。
