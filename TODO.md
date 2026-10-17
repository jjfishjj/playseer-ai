# PlaySeer AI MVP 待辦

- [x] **題目定位與誠實揭露**：README 清楚標示選擇 ASUS UGen AI League 的 Workplace AI 與 Battlefield Thunderstorm；說明 LiveOps 為工作場域決策案例；指出 deterministic demo 不等於 ASUS UGen Intel Arc Pro B70 或主辦方 SDV 實測。
- [x] **本地推論接頭與安全 fallback**：可透過環境變數設定 OpenAI 相容本地模型服務與模型名稱；可選 API Key 僅留在伺服器環境，不輸出到瀏覽器；四個專責 agent 平行產生結構化分析；未設定服務時仍能以確定性政策引擎完成分析，並於結果明確標示執行來源。
- [x] **MVP 決策台**：支援三個既有情境、營運指標編輯與驗證、風險脈衝、四個 agent 狀態、行動優先序、分群監看、證據、人工審核、本機歷史及 JSON 匯出；新增本地 runtime 狀態和分析來源提示。
- [x] **可重現驗證**：`npm test` 通過既有政策與驗證測試，以及本地推論接頭的平行呼叫／結構化輸出測試；`npm start` 使用 Node 內建服務提供 MVP，無第三方 runtime 依賴。
- [ ] **Stage II 硬體實測**：待取得主辦方 VM／SDV 或 ASUS Intel Arc Pro B70 環境後，實際執行並記錄模型、driver/runtime、延遲、throughput、結構化輸出通過率與品質比較；目前尚未驗證。
