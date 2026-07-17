# 部署说明（粗糙可用 MVP）

按下列步骤可从零挂起并收完一批货。UI 简陋没关系，以能扫、能写表为准。

## 你需要

- Google Workspace 账号（与收货表同一账号或对表有编辑权）
- 一台可访问 HTTPS 的静态托管（推荐 GitHub Pages；也可用任意静态服务器）
- iPhone + Safari

## 1. 准备收货表

1. 新建 Google 表格  
2. 将应收单号粘贴到 **A 列**（可从第二行开始；若第一行不是表头，挂载时会尝试补齐）  
3. 表头最终应为：`单号 | 状态 | 扫码时间`  
4. 状态列：空或 `未收` = 未收；不要写其它怪值；不要重复单号  

## 2. 部署 Apps Script API

1. 打开 [script.google.com](https://script.google.com) → 新建项目  
2. 将仓库中 `apps-script/Code.gs` 内容贴进编辑器（可删掉默认 `myFunction`）  
3. （可选）项目设置里时区与 `appsscript.json` 一致  
4. **部署 → 新建部署 → 类型选「网页应用」**  
   - 执行身份：**我**  
   - 具有访问权限的用户：**任何人**（符合「有链接即可用」；用完请停用）  
5. 授权，复制 **Web App URL**（形如 `https://script.google.com/macros/s/.../exec`）

无摄像头自检（可选）：用任意能发 POST 的工具，Body 为 JSON，`Content-Type: text/plain`：

```json
{"action":"connect","sheetUrl":"你的表格链接"}
```

应返回 `"ok": true` 与 `sheetId`。再：

```json
{"action":"scan","sheetId":"...","code":"某个应收单号"}
```

表中对应行应变为 `已收` 并有扫码时间。

## 3. 发布静态扫码页

1. 复制 `web/config.example.js` → `web/config.js`  
2. 在 `config.js` 填入上一步的 Web App URL：  
   `window.RECEIVING_API_URL = 'https://script.google.com/macros/s/.../exec';`  
3. 将 `web/` 目录发布到 **HTTPS** 静态托管（GitHub Pages / Netlify / Cloudflare Pages 等）  
4. 用 iPhone Safari 打开该站点（不要指望在 Apps Script HtmlService 页内开摄像头）

本地临时 HTTPS 可用（开发机）：

```bash
npx --yes serve web -p 5173
```

（若无 HTTPS，iPhone 真机摄像头可能被拦；请优先真 HTTPS 托管。）

## 4. 收货日操作

1. Safari 打开扫码页 → 确认 Web App URL → 粘贴收货表链接 → **挂载**  
2. **开始扫码** → 允许摄像头 → 连续扫  
3. 看色块：绿=新已收，橙=已收过，灰=不在清单  
4. 电脑打开同一张表，筛状态为空/`未收` = 漏收清单  
5. 用完后：Apps Script **部署管理 → 停用** 该网页应用  

## 5. E2E 验收（交付门）

在真机 + 真表上勾选 [.scratch/.../spec.md](../.scratch/iphone-sheet-receiving-scan/spec.md)「手工 E2E 验收清单」。

## 架构备忘

- 摄像头在静态页（ADR-0002）；API 在 Apps Script（ADR-0001）  
- 纯逻辑单测：`npm test`（扫码结果 + 挂载校验）  
- `apps-script/Code.gs` 内逻辑须与 `src/receiving/*.js` 保持同规则（改一处记得改另一处）
