# 📊 TY's Data Builder (TY的資料表計算器)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange.svg)](https://en.wikipedia.org/wiki/Progressive_web_app)
[![No Backend](https://img.shields.io/badge/Backend-None-blue.svg)](https://en.wikipedia.org/wiki/Serverless_computing)

一個強大、極輕量且**完全無需後端伺服器 (Serverless)** 的單頁式動態表格與資料視覺化應用。只需一個 HTML 檔案，點開瀏覽器即可開始使用！完美解決臨時資料收集、團購分帳、記帳統計與快速報價單生成等需求。

**🔗 立即使用 (Live Demo): [https://ty-db.pages.dev](https://ty-db.pages.dev)**

![TY's Data Builder - TY的資料表計算器](https://ty-db.pages.dev/databuilder.png)

---

## ✨ 核心特色 (Features)

* **⚡ 零依賴 & 免安裝**：採用 Vue 3 (Composition API) + Tailwind CSS 構建，下載單一 HTML 檔即可離線運行，無須 `npm install`。
* **📶 企業級 PWA 體驗**：支援 Service Worker 離線快取，可安裝至桌面或手機主畫面，並內建流暢的深色模式 (Dark Mode)。
* **📷 強大硬體擴充 (New!)**：
    * **雙引擎條碼掃描**：支援調用手機原生 `BarcodeDetector API`，秒解 1D 商品條碼與 2D QR Code。
    * **圖片附加**：支援為每一筆資料拍攝或上傳照片，自動壓縮並轉為 Base64 儲存。
* **🛠️ 動態自訂欄位 & 自動計算**：
    * 支援多種欄位型態：「文字」、「數字」、「日期」、「時間」、「照片」、「確認框」、「分類」。
    * 支援「計算 (A × B)」與「減法 (A - B)」欄位，自動即時算出小計與總額。
* **🔗 革命性的無伺服器分享**：
    * **整表分享**：將整張表格壓縮並進行 Base64 編碼，直接產生短連結或 QR Code。
    * **單筆分享 (New!)**：支援針對「特定一列資料」產生專屬 QR Code，對方掃描即可將該筆資料匯入他的設備。
* **📈 商業級動態圖表**：
    * 內建 Chart.js，根據分類與時間軸自動生成**圓餅圖**與**堆疊長條/趨勢圖**。
    * 支援雙擊圖例「孤立顯示」，並擁有智慧 Hover 統計與無縫縮放體驗。
* **🐙 GitHub Gist 雲端同步 (BYOD)**：
    * **Bring Your Own Database**：使用者可綁定私人的 GitHub Token，將資料加密備份至個人 Gist 空間，支援跨裝置還原，完全隱私且免費。
* **🧩 智慧品項合併**：一鍵將同名品項合併，自動加總數字欄位並無縫串接所有備註，團購對帳神器。
* **🗂️ 多工作區與國際化**：內建 LocalStorage 多工作區切換，並完整支援高達 22 國語言介面。
* **🖨️ 專業列印模式**：專屬 `@media print` 樣式，一鍵輸出乾淨、無按鈕干擾的 PDF 報表。

---

## 💡 適用情境 (Use Cases)

* **團購/便當/公費統計**：產生單筆 QR Code 讓同事掃描匯入，最後用「一鍵合併」算出總量與總金額。
* **快速報價單/派工單**：設定品項、單價、數量，拍照附上現場狀況，填寫完畢直接 `Ctrl+P` 輸出報表給客戶。
* **個人記帳/進銷存**：利用多工作區分開不同帳本，並透過 GitHub Gist 雲端同步，打造私有、高效的財務追蹤工具。

---

## ⌨️ 快捷鍵指南 (Keyboard Shortcuts)

| 快捷鍵 | 觸發情境 | 執行動作 |
| :--- | :--- | :--- |
| `↑` / `↓` | 非數值、日期框內 | 垂直移動到上一列 / 下一列的相同欄位 |
| `←` / `→` | 任何輸入框內 | 水平移動到上一個 / 下一個欄位 (游標需在最邊緣) |
| `Enter` | 任何輸入框內 | 移動到右邊下一個欄位 |
| `Enter` | 表格的最後一格 | **自動新增一列**，並將游標跳至新列的第一格 |
| `Backspace` | 空白列的第一格 | **自動刪除該列**，並將游標退回上一列 |

---

## 🛠️ 技術架構 (Tech Stack)

* **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API via CDN)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Charts**: [Chart.js](https://www.chartjs.org/)
* **Scanner**: Native `BarcodeDetector API` with [Html5Qrcode](https://github.com/mebjas/html5-qrcode) fallback
* **Storage**: IndexedDB (Local) & GitHub Gist API (Cloud)
* **Utilities**: [qrcode.js](https://github.com/soldair/node-qrcode), Service Worker (PWA)

---

# 📊 TY's Data Builder (English Version)

A powerful, ultra-lightweight, and **100% Serverless** single-page dynamic table and data visualization application. Just one HTML file, open it in your browser and start building! Perfect for temporary data collection, group buying statistics, expense tracking, and rapid invoice generation.

## ✨ Key Features

* **⚡ Zero Dependencies**: Built with Vue 3 and Tailwind CSS via CDN. No `npm install` required. Download the HTML file and run it anywhere.
* **📶 Enterprise PWA Experience**: Offline-ready via Service Workers. Install it as a desktop or mobile app with built-in Dark Mode.
* **📷 Hardware Integration (New!)**:
    * **Dual-Engine Barcode Scanner**: Uses native `BarcodeDetector API` for lightning-fast 1D/2D scanning, with JS fallback.
    * **Photo Attachments**: Take pictures or upload images for each row. Automatically compresses and converts to Base64.
* **🛠️ Dynamic Fields & Auto-Calculation**:
    * Supports multiple field types: Text, Number, Date, Time, Photo, Checkbox, Category.
    * Supports Math columns (A × B, A - B) to instantly calculate subtotals and grand totals.
* **🔗 Revolutionary Serverless Sharing**:
    * **Full Table**: Compress and encode the entire table into a URL Hash to generate sharing links or QR Codes.
    * **Single Row Share (New!)**: Generate a specific QR Code for a single row of data, allowing others to scan and import it directly into their device.
* **📈 Commercial-Grade Charts**:
    * Auto-generates Pie charts and Stacked Bar/Trend charts using Chart.js.
    * Features "Double-click to Isolate" legends and smart hover statistics.
* **🐙 GitHub Gist Sync (BYOD)**:
    * **Bring Your Own Database**: Securely backup and sync your data across devices using your own GitHub Token and Gist. Fully private and free.
* **🧩 Smart Merge**: One-click to merge duplicate items, summing up numeric fields while seamlessly concatenating all notes.
* **🗂️ Workspaces & i18n**: Built-in LocalStorage workspace switching and full support for up to 22 languages.
* **🖨️ Print-Ready**: Optimized `@media print` styles. Generate clean PDF reports with a single click.

## 🚀 Quick Start

1. Download `index.html` from this repository.
2. Open it with any modern browser (Chrome, Edge, Firefox, Safari).
3. Start building your table!

## ⚠️ Important Notes

* **URL Length**: Sharing large datasets (or rows with multiple photos) via URL Hash might exceed limits in older browsers. For large tables, use the **GitHub Gist Sync** or **JSON/CSV Export** features.
* **CSV Encoding**: Exports include a BOM (Byte Order Mark) to ensure compatibility with Microsoft Excel (no messy characters).

---
*Built with ❤️ via Vue 3 & Tailwind.*
