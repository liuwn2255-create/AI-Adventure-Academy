# SEC-01 安全與契約修正

1. AUTO-02 `validateQuestionPublication` 預期 `approved` 輸入：發布服務以可信任已核准快照驗證，通過後才產生 `published` 紀錄。關卡亦以已核准快照驗證。
2. PUB-05 遊戲讀取器使用正式 `level.interactions[].questionRefs`，拒絕空互動、缺引用與不完整引用。
3. 發布 API 不再信任請求內的審核結論、審核者或題目內容，而是從 D1 `publication_approvals` 讀取完整已核准快照。無紀錄拒絕發布；資料庫無表或異常 fail closed。
4. `migrations/0002_publication_approvals.sql` 只提交 SQL，不執行。PUB-04 教師示範介面尚未寫入可信任快照；**因此在真正的教師身分驗證與簽核持久化完成之前，發布 API 會拒絕所有沒有可信任核准快照的發布要求。**
5. 測試為本機模擬，不等同 Cloudflare D1、教師專業簽核或正式部署驗收。
