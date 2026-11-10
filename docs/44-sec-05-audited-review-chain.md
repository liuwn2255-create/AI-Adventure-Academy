# SEC-05：經稽核的教師審核到發布鏈

- `createAuditedReviewSource` 從 D1 `review_candidates` 及 `review_decision_audit` 讀取題目和逐項稽核紀錄，確認四項最後決策均為核准，審核者、時間、版本及逐次稽核相符。
- `createAuditedApprovalBridge` 將這個受驗證來源接入 SEC-02 的核准快照橋接，避免信任由呼叫者直接傳入的 `approved` 物件。
- 資料缺漏或不一致時拒絕提升，不執行任何資料寫入。
- **限制**：SEC-03 的 `saveApproved(question, actor)` 仍存在作為歷史隔離模組，不能作為正式對外端點；正式路徑必須只使用本階段稽核來源。SEC-04 的候選題目建檔信任邊界、真正教師登入、Cloudflare D1 staging、正式教育簽核仍待驗證。
- 僅 GitHub CI 模擬測試，沒有合併 main、部署、付費資源或正式資料修改。
