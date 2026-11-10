# PUB-01 — 隔離式發布服務（開發版）

此分支提供 **Node.js 服務核心**、本機 HTTP adapter、交易式記憶體儲存與測試。**不是正式上線服務**；沒有正式身分供應者、持久化資料庫或部署設定。請勿公開開放 HTTP adapter。

## 發布規則
- 發布者身分必須由受信任的主機／驗證層提供，不能從題目或關卡 payload 自稱身分。
- 題目需先為 approved；關卡需先為 approved，且發布前分別執行 AUTO-02 的驗證函式。
- 驗證失敗時拒絕寫入；相同 id@revision 不可覆寫，較舊 revision 不可重新發布。
- 每次成功發布保留 actorId、時間、種類與版本；記憶體 adapter 在驗證錯誤時回滾。
- 課綱、審查與教師簽核資料不能由此服務自動產生。
- 只有已發布的題目才能被關卡引用；實際規則仍由 AUTO-02 驗證器決定。

## 開發版限制
- `createMemoryPublicationStore()` 僅供單程序本機測試，重啟後資料消失，不可作為正式資料庫。
- `createLocalPublicationApi()` 只可綁定 `127.0.0.1`；正式環境需另加受信任的身分驗證、角色管理、持久化原子交易、版本唯一索引、審計保留與備份。
- HTTP adapter 不提供獨立可執行的公開伺服器入口，避免誤部署。
- 不含資料遷移、正式發布按鈕、GitHub Pages 接入或 production secrets。
- 請以 `node --test test/publication-service.test.mjs` 執行 PUB-01 專項測試；CI 也會執行。
