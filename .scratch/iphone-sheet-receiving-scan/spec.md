# MVP Spec：iPhone 扫码核对收货表

Status: ready-for-agent

## Problem Statement

收货人要独自接收大批包裹，逐一核对应收单号，但没有第二人可交叉核对。需要用 iPhone 快速扫面单，并在电脑上清楚看到本批哪些已收、哪些未收，同时避免把同一单误当成收了两次。

## Solution

交付一个**端到端可用**（允许 UI 粗糙）的临时工具：

1. 收货人把应收单号贴进 Google **收货表**。
2. 在 **HTTPS 静态扫码页**（非 Apps Script iframe）粘贴表格链接完成**挂载**，授权摄像头后**连续扫描一维码**。
3. 扫码页调用 **Apps Script Web App API** 写回收货表：命中未收 → **已收** + **扫码时间**；**已收过** / **不在清单** 可区分提示且不改表。
4. 电脑打开同一张收货表筛选未收，完成一人交叉核对。

> 挂载 UX 更新见 [spec-preset-batches.md](./spec-preset-batches.md)（预置 API + 批次下拉）。本文件仍描述扫码核心与 E2E 清单。


## User Stories

1. As a 收货人, I want 从 Excel/邮件复制单号粘贴到收货表 A 列, so that 本批有唯一台账而无须上传文件。
2. As a 收货人, I want 每批使用一张独立的收货表, so that 3～4 批台账互不混淆。
3. As a 收货人, I want 在扫码页粘贴 Google 表格链接或 ID 完成挂载, so that 工具写到正确的收货表。
4. As a 收货人, I want 挂载只作用于该文件的第一个工作表, so that 我不必选择 Tab。
5. As a 收货人, I want 挂载时若缺少「单号/状态/扫码时间」表头则自动补齐, so that 我不必先学表格结构。
6. As a 收货人, I want 挂载时跳过 A 列空行, so that 粘贴多出的空行不会导致失败。
7. As a 收货人, I want 挂载时若状态列出现非法值则整表失败并列出坏行（行号、单号、原值）, so that 开扫前就能改对表。
8. As a 收货人, I want 挂载时若单号重复则整表失败并列出重复项及行号, so that 台账不会一对多对不齐。
9. As a 收货人, I want 挂载成功后看到应收总数, so that 我确认挂对了批次。
10. As a 收货人, I want 用部署账号有编辑权的 Workspace 表格, so that 挂载与写回不会因权限失败。
11. As a 收货人, I want 在 iPhone Safari 打开 HTTPS 扫码页并授权摄像头后连续扫一维码, so that 双手能快速过件。
12. As a 收货人, I want 匹配只认 trim 后与应收单号完全一致, so that 规则简单、对不上时好改表。
13. As a 收货人, I want 命中未收时立刻把状态写成「已收」并写入原生日期时间的扫码时间, so that 台账实时可核对。
14. As a 收货人, I want 新已收时看到明确的成功反馈（与已收过可区分）, so that 我知道这件已确认。
15. As a 收货人, I want 已收过时看到不同提示且状态与扫码时间不变, so that 我不会误以为又收了一件。
16. As a 收货人, I want 不在清单时收到轻提示且不记已收, so that 误扫/脏码不污染台账。
17. As a 收货人, I want 扫到空白/无效空串时被忽略且不改表, so that 误触发不会捣乱。
18. As a 收货人, I want 写表失败时得到明确报错且本次不成立为已收, so that 手机进度与收货表不会对不上。
19. As a 收货人, I want 主界面显示已收数/总数, so that 扫货中能瞥一眼进度。
20. As a 收货人, I want 可选小入口查看未收列表, so that 收尾时手机上也能瞄缺哪些。
21. As a 收货人, I want 新已收或已收过后有短冷却再接受下一码, so that 摄像头对着同一面单不会连刷。
22. As a 收货人, I want 回电脑在收货表筛选空白或「未收」状态, so that 一人也能交叉核出漏收。
23. As a 收货人, I want 换下一批时只换挂载的表格链接, so that 临时多批足够轻。
24. As a 收货人, I want 用完后能停用 Apps Script Web App 部署, so that API 链接风险可收住。
25. As a 收货人, I want 不在清单时仍可立即继续扫下一件, so that 现场节奏不被打断。
26. As a 收货人, I want 即使界面很简陋也能完成一整批收货核对, so that 临时工具以「能用完」为先。
27. As a 实现者, I want 扫码结果与挂载校验为可单测的纯逻辑, so that 核心行为不依赖真 Sheet/摄像头。
28. As a 实现者, I want 摄像头跑在静态 HTTPS 页而非 HtmlService iframe, so that iPhone 上 getUserMedia 不被沙箱拦截。
29. As a 实现者, I want 遵守 ADR-0001/0002 与 docs/constraints, so that 架构不滑回不可行路径。

## Implementation Decisions

### 摄像头 / Web App 可行性（已冻结）

| 项 | 决定 |
|----|------|
| HtmlService iframe 内开摄像头 | **禁止作为主路径**（沙箱拦截 `getUserMedia`） |
| 扫码 UI 宿主 | **HTTPS 静态页**（推荐：本仓库 GitHub Pages 或等价免费静态托管） |
| 收货表读写 | **Apps Script Web App**（`doGet`/`doPost` JSON API；执行身份为部署者） |
| 通信 | 静态页 `fetch` 调用 Web App URL；须处理 Apps Script 重定向/CORS 实作细节（实现时选可工作的调用方式，如 `redirect=follow` + 正确 Content-Type，或表单 POST 等已验证模式） |
| 扫码库 | 任选能在 iOS Safari 连续认一维码的方案（如 html5-qrcode / ZXing 等）；`video` 须满足 iOS：`playsinline`、HTTPS、用户手势后启动 |
| 冷却 | 默认约 1～2 秒（可调常量即可） |
| 备选（不优先） | `window.open` + `document.write` 顶层页扫码——仅当无法使用任何静态托管时才考虑，并须单独手工验收 |

### 模块边界

1. **挂载校验**（纯逻辑，可单测）
2. **扫码结果判定**（纯逻辑，可单测；见下方原型摘要）
3. **Apps Script 适配器**：URL/ID 解析、读第一个工作表、补表头、写已收与原生日期时间、暴露 API
4. **静态扫码页**：挂载表单、摄像头连续扫、大反馈、计数、未收入口、调用 API（允许粗糙）

### API 形状（逻辑）

- `connect(sheetUrl)` → 校验并挂载；失败返回坏行/重复等
- `scan(rawCode)` → 扫码结果；仅新已收持久化
- `stats()` → 已收数/总数/未收列表（或未收可另接口）
- 错误信息须可直接展示给收货人

### 收货表与匹配

- Schema：`单号 | 状态 | 扫码时间`；第一工作表；A 列粘贴
- 状态：写入 `已收`；未收 = 空或 `未收`
- 挂载：非法状态/重复单号 → 整表拒绝；空行跳过
- 匹配：trim 后完全一致；一维码保证

### 扫码结果判定（来自原型）

```text
applyScan(state, rawCode):
  code = trim(rawCode)
  if code empty → outcome 忽略, state unchanged
  if no line with code → outcome 不在清单
  if line.status == 已收 → outcome 已收过
  else → mark line 已收, outcome 新已收
```

持久化仅在「新已收」且 API 写表成功后对用户成立；写失败须报错且保持未收。

## Testing Decisions

- **自动化（仅两缝）**：扫码结果纯函数；挂载校验纯函数。
- **手工 E2E（交付必过）**：见下方验收清单。不自动化摄像头与真 Sheet。
- 好测试：只测外部行为，不测实现细节。

## Out of Scope

- 原生 App / Sheets Add-on / Chrome 扩展交付
- 自建业务库、离线队列、CSV 导入器、模糊匹配、多 Tab、批次目录
- 错收主防流程、精致 UI/动效、无障碍打磨
- HtmlService iframe 内摄像头主路径
- 二维码保证支持
- 复制模板自动部署产品功能

## Further Notes

### 文档索引

- [CONTEXT.md](../../CONTEXT.md)
- [docs/constraints.md](../../docs/constraints.md)
- [ADR-0001](../../docs/adr/0001-apps-script-spa-sheet-ledger.md)
- [ADR-0002](../../docs/adr/0002-camera-outside-apps-script-iframe.md)
- 原型：`src/receiving/prototype-scan-outcome/`（throwaway）

### MVP 开发计划（成果必须完整可用，允许粗糙）

| 里程碑 | 交付物 | 完成定义 |
|--------|--------|----------|
| **M1 核心逻辑** | 扫码结果 + 挂载校验纯模块与单测 | 用例覆盖新已收/已收过/不在清单/忽略；非法状态与重复单号拒绝；空行跳过 |
| **M2 Sheet API** | Apps Script Web App：connect / scan / stats | 用电脑或 curl/临时 HTML **无摄像头**即可：挂载真表、把一单写成已收、统计正确；写失败返回明确错误 |
| **M3 扫码页 E2E** | HTTPS 静态扫码页 + 接 API | **iPhone Safari**：授权摄像头 → 连续扫样例一维码 → 表内已收/时间正确；已收过与不在清单可区分；冷却生效 |
| **M4 收尾** | 最短部署说明（部署 Web App、发布静态页、填 API URL、停用） | 按说明能从零挂起并用完一批；UI 仍可粗糙 |

**顺序约束：** M1 → M2 → M3 → M4。M3 未通过则 MVP **未交付**（不能只交纯逻辑）。M3 若静态托管受阻，可评估 ADR-0002 备选顶层窗方案，但仍须通过同一 E2E 清单。

### 手工 E2E 验收清单（交付门）

在**真实 iPhone Safari** + **真实收货表**上全部通过：

1. 粘贴仅含单号的表 → 挂载成功（自动补表头）→ 显示总数  
2. 状态列非法值 → 挂载失败并列出坏行  
3. 重复单号 → 挂载失败并列出重复  
4. 扫一个未收单号 → 反馈「新已收」→ 表中为 `已收` + 日期时间  
5. 再扫同一单号 → 反馈「已收过」→ 表不变  
6. 扫不在清单的码 → 轻提示 → 表不变 → 可继续扫  
7. 进度已收/总数正确；未收入口能看到剩余  
8. 电脑打开收货表可筛出未收  
9. （可选粗糙）断网或故意写失败时有报错且不出现「假已收」

### 开发门判断（更新）

| 门 | 状态 | 说明 |
|----|------|------|
| 产品与数据契约 | **通过** | 见前文冻结项 |
| 摄像头可行性方案 | **通过（已写入 ADR-0002）** | 主路径=静态 HTTPS + Apps Script API；禁止 iframe 内摄像头 |
| 交付定义 | **通过** | 完整 E2E 可用；UI 允许粗糙 |
| 自动化测试缝 | **通过** | 两块纯逻辑 |
| 实现与部署 | **未开工** | 按 M1–M4 执行 |
| 精致 UX | **不做** | 明确允粗糙 |

**结论：Spec 已达可开工的 ready-for-agent。**  
Agent 默认目标 = **跑通 M1–M4，使 E2E 验收清单全过**；不是只交付纯逻辑。UI 丑可以，扫不了/写不回不可以。

### 实现时默认值（未再 grilling 也可开干）

- 冷却：1500ms  
- 0 条应收：允许挂载  
- 静态托管：优先 GitHub Pages（若仓库无远程，实现时再选 Netlify 等免费 HTTPS）  
- 源码：仓库内同时放 `apps-script/` 与 `web/`（静态页），用 clasp 或手工复制部署均可
