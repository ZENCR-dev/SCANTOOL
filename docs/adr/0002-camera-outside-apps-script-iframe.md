# 摄像头不在 Apps Script HtmlService iframe 内运行

Google 官方与实作均表明：HtmlService 将页面置于沙箱 iframe，**阻止 `getUserMedia`（摄像头）**。因此「纯 Apps Script 页内连续扫码」不可作为 MVP 主路径。

**决定：** MVP 采用 **HTTPS 静态扫码页**（可用本仓库免费静态托管，如 GitHub Pages）负责摄像头与扫码 UI；**Apps Script Web App** 只做收货表 API（挂载校验、写已收、统计）。二者通过 Web App URL 的 `doGet`/`doPost`（或等价 JSON 接口）通信。收货表仍为唯一台账。

## Considered Options

- **HtmlService 页内直接开摄像头**（否决）— 沙箱拦截，iPhone 上不可用
- **`window.open` + `document.write` 绕过 iframe**（备选，不优先）— 可零外部托管，但脆、难维护
- **静态 HTTPS 扫码页 + Apps Script API**（采纳）— 符合官方建议，iPhone Safari 可行，仍免自建数据库

## Consequences

- ADR-0001「网页 SPA」修正为：**用户可感知的扫码 SPA 跑在静态 HTTPS 源**；Apps Script 是后端，不是摄像头宿主
- 部署多一步：发布静态页 + 部署 Web App；换批仍只改挂载链接
- 静态页须配置正确的 Web App URL；「有链接即可用」同时覆盖静态页与（若暴露的）API 链接
