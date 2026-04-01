# 📊 TY's Data Builder (TY的資料表計算器)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange.svg)](https://en.wikipedia.org/wiki/Progressive_web_app)
[![No Backend](https://img.shields.io/badge/Backend-None-blue.svg)](https://en.wikipedia.org/wiki/Serverless_computing)

一個強大、輕量且**完全無需後端**的單頁式動態表格應用。只需一個 HTML 檔案，點開瀏覽器即可開始使用！完美解決臨時資料收集、團購統計、快速報價單生成等需求。

**🔗 立即使用 (Live Demo): [https://ty-db.pages.dev](https://ty-db.pages.dev)**

---

## ✨ 核心特色 (Features)

* **⚡ 零依賴 & 免安裝**：採用 Vue 3 (CDN) + Tailwind CSS 構建，下載單一 HTML 檔即可離線運行，無須 `npm install`。
* **📶 PWA 離線支援**：支援 Service Worker 技術，一次開啟後即可在無網路環境下作為桌面/手機 App 使用。
* **🛠️ 動態自訂欄位**：
    * 支援「文字 (Text)」、「數字 (Number)」欄位。
    * 支援「乘法計算 (A × B)」欄位，自動即時算出小計。
* **🐙 GitHub Gist 雲端同步 (BYOD)**：
    * **Bring Your Own Database**：使用者可設定自己的 GitHub Token，將資料加密備份至個人 Gist。
    * 支援跨裝置還原與版本紀錄，完全隱私且免費。
* **📈 即時動態圖表**：內建 Chart.js，根據表格分類自動生成圓餅圖與歷史趨勢圖，支援雙擊圖例「孤立顯示」的高級互動。
* **⌨️ 類 Excel 的極致鍵盤體驗**：
    * **方向鍵導航**：支援 `↑` `↓` `←` `→` 在儲存格間無縫穿梭。
    * **快速新增/刪除**：最後一格 `Enter` 自動新增；空白列首格 `Backspace` 自動刪除。
* **🔗 無伺服器分享**：資料透過 Base64 編碼打包進 URL Hash，直接產生分享連結或 QR Code，實現「無資料庫」資料交換。
* **🧩 智慧品項合併**：一鍵將同名品項合併，自動加總數量並串接備註，團購對帳神器。
* **🖨️ 專業列印模式**：專屬 `@media print` 樣式，一鍵輸出乾淨、無按鈕干擾的 PDF 報表。

---

## 💡 適用情境 (Use Cases)

* **團購/便當統計**：產生 QR Code 讓同事填寫，最後用「合併相同品項」一鍵算出總量。
* **快速報價單**：設定品項、單價、數量，填寫完畢後直接 `Ctrl+P` 輸出報表。
* **個人記帳/盤點**：利用 IndexedDB 與 GitHub Gist 同步，打造私有、高效的進銷存追蹤工具。

---

## ⌨️ 快捷鍵指南 (Keyboard Shortcuts)

| 快捷鍵 | 觸發情境 | 執行動作 |
| :--- | :--- | :--- |
| `↑` / `↓` | 任何輸入框內 | 垂直移動到上一列 / 下一列的相同欄位 |
| `←` / `→` | 任何輸入框內 | 水平移動到上一個 / 下一個欄位 (游標需在最邊緣) |
| `Enter` | 任何輸入框內 | 移動到右邊下一個欄位 |
| `Enter` | 表格的最後一格 | **自動新增一列**，並將游標跳至新列的第一格 |
| `Backspace` | 空白列的第一格 | **自動刪除該列**，並將游標退回上一列 |

---

## 🛠️ 技術架構 (Tech Stack)

* **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API via CDN)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Charts**: [Chart.js](https://www.chartjs.org/)
* **Storage**: IndexedDB (Local) & GitHub Gist API (Cloud)
* **Utilities**: [qrcode.js](https://github.com/soldair/node-qrcode), Service Worker (PWA)

---

# 📊 TY's Data Builder (English Version)

A powerful, lightweight, **backend-less** single-page dynamic table application. Just one HTML file, open it in your browser and start building! Perfect for temporary data collection, group buying statistics, and rapid invoice generation.

## ✨ Key Features

* **⚡ Zero Dependencies**: Built with Vue 3 and Tailwind CSS via CDN. No `npm install` required. Download the HTML file and run it anywhere.
* **📶 PWA Support**: Offline-ready via Service Workers. Install it as a desktop or mobile app.
* **🐙 GitHub Gist Sync (BYOD)**:
    * **Bring Your Own Database**: Backup and sync your data using your own GitHub Token and Gist.
    * Fully private, free, and supports cross-device restoration.
* **📈 Dynamic Charts**: Real-time Pie and Trend charts powered by Chart.js. Supports advanced interactions like "Double-click to Isolate" legends.
* **⌨️ Excel-like Experience**:
    * **Arrow Key Navigation**: Seamlessly move between cells using `↑` `↓` `←` `→`.
    * **Smart Add/Delete**: `Enter` on the last cell to add a row; `Backspace` on an empty first cell to delete.
* **🔗 Serverless Sharing**: Encode data into the URL Hash to generate sharing links or QR Codes without a database.
* **🧩 Smart Merge**: One-click to merge duplicate items, summing up numeric fields while concatenating notes.
* **🖨️ Print-Ready**: Optimized print styles. Generate clean PDF reports with a single click.

## 🚀 Quick Start

1. Download `index.html` from this repository.
2. Open it with any modern browser (Chrome, Edge, Firefox, Safari).
3. Start building your table!

## ⚠️ Important Notes

* **URL Length**: Sharing large datasets via URL Hash might exceed limits in older browsers. For large tables, use the **GitHub Gist Sync** or **JSON/CSV Export** features.
* **CSV Encoding**: Exports include a BOM (Byte Order Mark) to ensure compatibility with Microsoft Excel (no messy characters).

---
*Built with ❤️ via Vue 3 & Tailwind.*
