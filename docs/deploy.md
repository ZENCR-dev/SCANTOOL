# 部署说明（收货扫码 MVP）

目标：把代码推到 GitHub，用 **GitHub Pages（HTTPS）** 打开扫码页，再配合 Apps Script 写回收货表。  
UI 可以粗糙；**不能**用 `http://局域网IP` 或 `file://` 测摄像头。

配置约定（ADR-0003 / [spec-preset-batches.md](../.scratch/iphone-sheet-receiving-scan/spec-preset-batches.md)）：

- **Web App URL** 与 **3～4 个批次**（名称 + 收货表链接）写在仓库 `web/config.js` 并提交  
- 现场主路径：**选批次 → 挂载 → 扫码**（不必每次填 API）

---

## 0. 你需要什么

| 项 | 说明 |
|----|------|
| GitHub 仓库 | 如 `ZENCR-dev/SCANTOOL`（Public 以便 Free 账号用 Pages） |
| Google Workspace | 与收货表同一账号（或对表有编辑权） |
| iPhone + Safari | 真机扫码 |
| 本机 Git | commit / push |

---

## 1. 提交并推到 GitHub

### 1.1 不要提交的内容

| 路径 | 原因 |
|------|------|
| `.clasp.json` / `.clasprc.json` | clasp 凭证 |
| `.env*` | 密钥 |
| `node_modules/` | 依赖 |

### 1.2 **要**提交的配置

| 路径 | 内容 |
|------|------|
| `web/config.js` | `apiUrl`（Web App `…/exec`）+ `batches`（约 3～4 项：`name` + `sheetUrl`） |

可从 `web/config.example.js` 复制后改真实值，再 `git add web/config.js`。  
公开仓库可见这些链接；用完请停用 Apps Script 部署。

### 1.3 提交与推送

```bash
cd "/Users/renjie/scan tool"
npm test
git add -A
git status
git commit -m "$(cat <<'EOF'
简述本次改动原因。

EOF
)"
git push -u origin HEAD
```

常用分支：`dev`。推送后应触发 Pages 工作流（若改了 `web/**`）。

### 1.4 更新预置批次

1. 编辑 `web/config.js` 里 `batches` 的 `name` / `sheetUrl`  
2. 需要时改 `apiUrl`  
3. commit + push → 等 Actions 绿 → 手机刷新 Pages  

---

## 2. GitHub Pages（HTTPS）

工作流：`.github/workflows/deploy-pages.yml`（发布 `web/`，保留仓库内 `config.js`）。

### 2.1 启用

1. **Settings → Pages → Source = GitHub Actions**  
2. **Environments → github-pages**：允许从 **`dev`**（及 `main`）部署  
3. Actions → **Deploy scanner to GitHub Pages** → 必要时 **Run workflow**

### 2.2 站点地址

Settings → Pages 顶部的 live URL，例如：

`https://zencr-dev.github.io/SCANTOOL/`

必须用 **https** 在 Safari 打开。

### 2.3 线上还要填 API 吗？

**主路径不用。** 配置已随站点发布。  
仅当实现里仍保留「高级/覆盖」输入框时，才临时改 API；日常选批次即可。

---

## 3. 部署 Apps Script API

1. [script.google.com](https://script.google.com) 新建项目，粘贴 `apps-script/Code.gs`  
2. 部署为网页应用：执行身份 **我**，访问 **任何人**  
3. 把得到的 `…/exec` 写入 `web/config.js` 的 `apiUrl` 并提交  
4. **以后改了 `Code.gs`（如 connect 增加 sheetTitle/lines）**：在编辑器里整文件覆盖粘贴 → **部署 → 管理部署 → 编辑 → 新版本**（勿只保存不发版）

---

## 4. 准备收货表

1. 每批一张表；单号贴 **A 列**  
2. 表头：`单号 | 状态 | 扫码时间`  
3. 把该表链接填进对应 `batches[].sheetUrl`  

---

## 5. 收货日（真机）

1. Safari 打开 Pages 的 **https** 扫码页  
2. **下拉选择批次** → **挂载** → 进入扫码主屏（顶栏：表文件名 · 已收 x/y · 换批）  
3. **开始扫码** → 允许摄像头  
4. 绿 = 新已收（立刻反馈，后台写表），橙 = 已收过，灰 = 不在清单；写表失败会红字并回滚  
5. 电脑筛空/`未收` = 漏收  
6. 全部收完：Apps Script → **停用** 网页应用  

摄像头仍失败时：确认不是 `http://192.168.…` / `file://`；需能访问 `unpkg.com`。

---

## 6. E2E

见母 Spec 手工清单 + [spec-preset-batches.md](../.scratch/iphone-sheet-receiving-scan/spec-preset-batches.md)（选预置批次可挂载）。

```bash
npm test
```

---

## 7. 架构备忘

- ADR-0001 Sheet 台账；ADR-0002 摄像头在静态 HTTPS；ADR-0003 配置进仓  
- `Code.gs` 与 `src/receiving/*.js` 规则手工同步  
