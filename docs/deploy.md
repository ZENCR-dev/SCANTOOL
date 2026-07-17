# 部署说明（收货扫码 MVP）

目标：把代码推到 GitHub，用 **GitHub Pages（HTTPS）** 打开扫码页，再配合 Apps Script 写回收货表。  
UI 可以粗糙；**不能**用 `http://局域网IP` 或 `file://` 测摄像头（挂载可能成功，但会报 *Camera streaming not supported*）。

相关文档：`CONTEXT.md`、`docs/constraints.md`、`docs/adr/0001-*.md`、`docs/adr/0002-*.md`、`.scratch/iphone-sheet-receiving-scan/spec.md`。

---

## 0. 你需要什么

| 项 | 说明 |
|----|------|
| GitHub 仓库 | 本仓库远程一般为 `ZENCR-dev/SCANTOOL` |
| Google Workspace | 与收货表同一账号（或对表有编辑权） |
| iPhone + Safari | 真机扫码验收 |
| 本机 Git | 用于 commit / push |

---

## 1. 把开发进度正确提交并推到 GitHub

### 1.1 永远不要提交的内容

| 路径 | 原因 |
|------|------|
| `web/config.js` | 含你的 Apps Script Web App URL（已在 `.gitignore`） |
| `.clasp.json` / `.clasprc.json` | 本地 clasp 凭证 |
| `.env*` | 密钥 |
| `node_modules/` | 依赖 |

提交前自检：

```bash
cd "/Users/renjie/scan tool"   # 路径含空格，请加引号
git status
git diff
```

确认 **没有** `web/config.js` 出现在待提交列表里。

本地调试可以保留 `web/config.js`（从 `web/config.example.js` 复制并填入 URL）；GitHub Pages **不依赖** 该文件——线上请在页面输入框里粘贴 Web App URL（见 §2.3 与 §5）。

### 1.2 建议提交哪些

- 代码：`src/`、`web/`（除 `config.js`）、`apps-script/`
- 文档：`docs/`、`CONTEXT.md`
- 工作流：`.github/workflows/`
- 计划/票（可选）：`.scratch/`

### 1.3 提交（commit）

在仓库根目录：

```bash
cd "/Users/renjie/scan tool"
npm test                          # 应 9 passed
git add -A
git status                        # 再次确认无 config.js
git commit -m "$(cat <<'EOF'
简述本次改动的原因（一句话）。

EOF
)"
```

当前常用分支是 **`dev`**。

### 1.4 推送到 GitHub（push）

```bash
git push -u origin HEAD
```

若提示需登录，按 GitHub 提示完成（浏览器 / PAT / `gh auth login`）。

推送成功后，打开仓库网页应能看到最新 commit。

---

## 2. 用 GitHub Pages 发布扫码页（HTTPS）

仓库已包含工作流：`.github/workflows/deploy-pages.yml`。  
每次把 `web/`（或该 workflow 文件）推到 **`dev` 或 `main`**，会自动把 `web/` 发布为站点。

### 2.1 第一次启用 Pages

1. 打开 GitHub 仓库 → **Settings** → **Pages**  
2. **Build and deployment → Source** 选 **GitHub Actions**（不要选 “Deploy from a branch” 的 `/docs`）  
3. 若尚无成功运行记录：到 **Actions** 页，打开 **Deploy scanner to GitHub Pages**，点 **Run workflow**，选 `dev` 分支手动跑一次  

### 2.2 站点地址

启用成功后，地址一般为：

`https://zencr-dev.github.io/SCANTOOL/`

（大小写以仓库 Settings → Pages 显示的 URL 为准。）

用 **iPhone Safari** 打开该 **https://** 链接。地址栏必须是 `https`，否则不要测摄像头。

### 2.3 Pages 与 Web App URL

- 工作流会用 `config.example.js` 生成空的 `config.js` 再发布（**不会**上传你本机的密钥 URL）。
- 打开扫码页后，在 **「Apps Script Web App URL」** 输入框粘贴你的 `…/exec` 链接（可每次粘贴；本机若有 `config.js` 会自动预填，仅本地）。

---

## 3. 部署 Apps Script API（写收货表）

与 Pages 独立；两边都要有才能「扫码 → 写表」。

1. 打开 [script.google.com](https://script.google.com) → 新建项目  
2. 粘贴仓库里 `apps-script/Code.gs`（可删默认 `myFunction`）  
3. **部署 → 新建部署 → 网页应用**  
   - 执行身份：**我**  
   - 访问权限：**任何人**（临时工具；用完请停用）  
4. 授权后复制 Web App URL：`https://script.google.com/macros/s/…/exec`

无摄像头自检（可选），`Content-Type: text/plain`，Body：

```json
{"action":"connect","sheetUrl":"你的表格链接"}
```

再：

```json
{"action":"scan","sheetId":"上一步返回的id","code":"某个应收单号"}
```

---

## 4. 准备收货表

1. 新建 Google 表格  
2. 应收单号贴到 **A 列**  
3. 表头最终为：`单号 | 状态 | 扫码时间`（挂载时可自动补）  
4. 状态只能是：空、`未收`、`已收`；单号勿重复  

---

## 5. 收货日操作（真机）

1. Safari 打开 GitHub Pages 的 **https** 扫码页  
2. 粘贴 Web App URL → 粘贴收货表链接 → **挂载**  
3. **开始扫码** → 允许摄像头  
4. 反馈：绿 = 新已收，橙 = 已收过，灰 = 不在清单  
5. 电脑打开同一张表，筛空/`未收` = 漏收  
6. 用完后：Apps Script → 部署管理 → **停用** 网页应用  

### 若仍提示无法开摄像头

| 检查 | 正确做法 |
|------|----------|
| 地址是 `http://192.168.…` 或 `file://` | 改用 Pages 的 `https://…github.io/…` |
| 仅本机 `npx serve` 给手机用 | 不够；请用 Pages 或 `cloudflared` 隧道（见下） |
| 库未加载 | 手机需能访问 `unpkg.com`（扫码库 CDN） |

本地临时 HTTPS 隧道（调试，非长期方案）：

```bash
npx --yes serve web -p 5173
# 另一终端：
npx --yes cloudflared tunnel --url http://127.0.0.1:5173
```

用隧道打印的 **https://** 在 Safari 打开。

---

## 6. E2E 验收（交付门）

真机 + 真表勾选：`.scratch/iphone-sheet-receiving-scan/spec.md` 中的「手工 E2E 验收清单」。

本地逻辑回归：

```bash
npm test
```

---

## 7. 架构备忘

- 摄像头在 **GitHub Pages 静态页**（ADR-0002）；禁止指望 Apps Script HtmlService 页内开摄像头  
- 台账在 **Google 收货表**；API 在 **Apps Script**（ADR-0001）  
- `apps-script/Code.gs` 与 `src/receiving/*.js` 规则须手工保持一致  
