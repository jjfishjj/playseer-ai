# PlaySeer AI MVP 計畫

## 題目選擇與範圍

- ASUS UGen AI League：Workplace AI（工作場域）
- Battlefield Thunderstorm：ASUS UGen Intel Arc Pro B70 32GB 高效能開發賽道
- 使用情境：遊戲 LiveOps 團隊同時處理留存、付費、玩家信任與穩定性訊號，需要跨職能快速形成可追溯、可由人員核准的營運決策。
- MVP：保留三個可編輯情境、風險分數、行動建議、分群監看、稽核證據與本機歷史；新增 OpenAI 相容本地推論接頭，平行呼叫四個專責 agent。若尚未設定本地推論服務，使用原確定性引擎並在 UI 清楚標記，不宣稱已使用 ASUS 硬體。
- Stage II 邊界：Thunderstorm 最終驗證須在主辦方提供的虛擬環境或 SDV 系統實際操作；本機 MVP 的成功啟動不等於硬體驗證。

## 架構與目錄

- `index.html`、`styles.css`：命令中心與代理人工作流介面。
- `app.js`：表單、API 呼叫、結果呈現、匯出與本機歷史。
- `analysis-engine.js`：可重現的政策基線、輸入驗證和可測試的 fallback。
- `server.js`：Node 內建 HTTP 靜態伺服器及 `/api/runtime`、`/api/analyze`。
- `local-ai.js`：無外部套件的 OpenAI 相容本地模型接頭；四個專責 agent 平行推論，API 金鑰只讀伺服器環境變數。
- `tests/`：政策基線與本地模型接頭測試。

## 設計

沿用既有的深色指揮中心與螢光黃綠色信號色，搭配淺底工作區。核心原則是讓風險、證據、人工核准狀態可快速掃讀；保留現有區塊式 LiveOps 儀表板，不引入裝飾圖片或新的視覺系統。互動以清楚呈現分析中、推論來源、fallback 原因與核准狀態為主，不把模擬結果偽裝成硬體實測。

## 專案結構

現有靜態前端架構擴充為零第三方依賴的 Node HTTP 服務。產品 UI、確定性政策引擎和本地模型接頭分離；伺服器僅提供靜態檔與同源 API，API Key 不送至瀏覽器。