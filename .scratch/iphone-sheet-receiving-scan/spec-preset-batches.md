# Spec：预置 Web App URL + 批次下拉挂载

Status: ready-for-agent

## Problem Statement

收货人打开 HTTPS 扫码页时，不应每次手填固定的 Apps Script Web App URL。Web App 地址在本临时项目中是稳定的；真正每批会变的是「挂载哪一张收货表」。需要在仓库里预置 API 地址，并预置 3～4 个批次（名称 + 收货表链接），现场只需从下拉选择批次后挂载。

## Solution

静态扫码页从仓库内已提交的配置读取默认 **Web App URL**（页面上可隐藏或只读展示）。提供 **批次** 下拉（预置约 3～4 项：显示名 + 收货表链接/ID）；用户选择批次后一点挂载。仍允许「自定义表链接」作为后备。配置随 Git 发布到 GitHub Pages，不再要求线上手填 API URL。

## User Stories

1. As a 收货人, I want 打开扫码页时已带好 Web App 地址, so that 我不必每次复制 exec 链接。
2. As a 收货人, I want 从下拉选择本批收货（预置 3～4 批）, so that 我只关心挂载哪张收货表。
3. As a 收货人, I want 选中批次后一键挂载, so that 现场步骤最少。
4. As a 收货人, I want 下拉之外仍能粘贴自定义表链接, so that 临时多一张表也能用。
5. As a 收货人, I want Web App URL 默认不挡主界面, so that 主路径是选批次而非填 API。
6. As a 维护者, I want 在仓库配置文件里改 API URL 与批次列表并提交, so that Pages 发布后手机自动用到新默认值。
7. As a 维护者, I want 批次项包含可读名称与收货表链接, so that 下拉对人友好。
8. As a 维护者, I want 公开仓库提交 Web App URL 的风险可接受且用完可停用部署, so that 与「有链接即可用」模型一致。
9. As a 收货人, I want 选错批次时可重新选择并再挂载, so that 不会锁死在错误收货表上。
10. As a 收货人, I want 挂载成功后仍看到已收/总数与扫码反馈, so that 原有扫码核对体验不变。
11. As a 实现者, I want 不改动扫码结果与挂载校验纯逻辑缝, so that 本次只动配置与 UI。
12. As a 实现者, I want 部署文档说明如何编辑并提交批次配置, so that 非开发者也能改预置项。

## Implementation Decisions

- **配置进仓**：默认 Web App URL 与批次列表写入仓库内前端配置（随 Pages 发布）。不再把「API URL 绝不能提交」当作约束。
- **配置形状（逻辑）**：
  - `apiUrl`：字符串，Apps Script Web App `…/exec`
  - `batches`：数组，约 3～4 项；每项含 `name`（下拉显示）与 `sheetUrl`（表格链接或 ID）
- **UI 主路径**：批次下拉 → 挂载；API 输入框隐藏或折叠为高级选项（可改覆盖默认，非主路径）。
- **自定义表**：保留「其它/自定义」入口，粘贴任意收货表链接。
- **挂载语义不变**：仍只挂所选表的第一个工作表；校验与写回规则不变。
- **工作流**：Pages 构建直接使用仓库内配置，勿再覆盖成空 example 导致线上无默认 API（若需 example，则 example 仅作模板，真正发布用已填配置）。
- **安全**：公开仓可见 API URL；用完停用 Web App 部署。见 ADR-0003。

## Testing Decisions

- **测试缝（与既有一致，本次不新增自动化缝）**：
  1. 扫码结果纯函数
  2. 挂载校验纯函数
- 配置与下拉为静态数据 + UI 接线；以手工打开 Pages / 本地页验收「选批次 → 挂载成功」为准。
- 好测试标准不变：只测外部行为；不测真 Sheet/摄像头。

若你希望为「从 batches 解析出 sheetUrl」加纯函数单测，可另开小票；默认不做。

## Out of Scope

- 从 Google Drive 自动枚举表格
- 批次管理后台 / 云端改配置而不发版
- 多用户权限、登录后按人显示不同批次
- 改变收货表 schema 或扫码匹配规则
- 重新引入「必须手填 API 才能用」的主路径

## Further Notes

### 文档索引

- 词表：`CONTEXT.md`（含 **批次**）
- 约束：`docs/constraints.md`
- ADR-0003：公开仓库预置 Web App URL
- 部署：`docs/deploy.md`
- 母 Spec：`.scratch/iphone-sheet-receiving-scan/spec.md`（扫码核心仍有效；挂载 UX 以本 Spec 为准）

### 修订步骤计划（实现顺序）

| 步 | 做什么 | 完成标准 |
|----|--------|----------|
| **S1 文档落地** | 本 Spec + CONTEXT/constraints/deploy/ADR-0003 与本文一致 | 无「禁止提交 config」矛盾表述 |
| **S2 配置模型** | 仓库内配置含 `apiUrl` + `batches[3~4]`；调整 `.gitignore` / Pages workflow，使发布带上真实默认配置 | 克隆仓库即见预置结构；Pages 构建不清空 apiUrl |
| **S3 前端 UX** | 主界面：批次下拉 + 挂载；API 非主路径；自定义表链接可选 | 不选手填 API 也能挂载预置批次 |
| **S4 文档操作节** | deploy.md 写明如何改批次名/链接并 commit push | 维护者按文档能更新下拉 |
| **S5 真机验收** | Pages HTTPS + 选一批次挂载 + 扫一单 | 符合母 Spec E2E 清单相关项 |

**建议实现时先做 S2→S3，S1 文档已在本次完成；S4 可与 S3 同 PR；S5 人工。**

### 与旧行为差异

| 旧 | 新 |
|----|----|
| `web/config.js` gitignore，线上手填 API | 配置进仓并随 Pages 发布 |
| 主界面两个大输入：API + 表链接 | 主路径：选批次 → 挂载 |
| 无预置批次 | 预置约 3～4 个批次下拉 |
