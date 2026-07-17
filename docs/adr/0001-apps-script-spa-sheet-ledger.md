# 用 Apps Script + Google 表格作唯一台账（摄像头见 ADR-0002）

临时一人收货需要 iPhone 扫码并回电脑核对，又不想自建后端/数据库。决定：**收货表（Google Sheet）是唯一台账**；**Apps Script Web App 作为读写收货表的 API**。摄像头/连续扫码 UI **不**放在 HtmlService iframe 内（见 ADR-0002）。

## Considered Options

- **Apps Script API + Sheet 台账**（采纳）— 零自建库、吃现有 Workspace、电脑直接筛未收
- **纯本地网页 + 本地文件** — 无法方便回电脑交叉核对
- **自建后端 / Firebase 等** — 对临时 3～4 批过重
- **Sheets Add-on / 原生 App** — 手机连续扫码体验或分发成本不合适

## Consequences

- 实现与部署绑在 Google 生态；脚本「以部署者身份执行」时，挂载的表须对部署账号可编辑
- API「有链接即可用」（不强制登录）——链接等同能力边界，用完应停用部署
- 电脑端核对只看 Sheet，不依赖扫码页
- 摄像头宿主与 API 分离的细节以 ADR-0002 为准（修正早期「纯 HtmlService 内扫码」设想）
