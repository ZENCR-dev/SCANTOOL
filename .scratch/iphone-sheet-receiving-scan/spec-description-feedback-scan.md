# Spec：货品描述反馈 + 取景辅助（iPhone 13 Pro）

Status: ready-for-agent

## Problem Statement

收货人扫面单后，色块只强调结果词与单号；真正要核对的是货品是什么。单号已在面单上可见，不应占主视觉。同时手机摄像头面对褶皱、近距时，取景区与提示不足会拖慢对准，但本轮**不**更换解码引擎（避免 WASM polyfill 与 format 列表冲突导致无法开摄）。

## Solution

1. 收货表增加 **D 列「货品描述」**；挂载后进入本地清单。
2. **新已收 / 已收过**：色块配色仍表达结果；主文案为货品描述（空则「（无货品描述）」）；结果词约 45% 透明度作结果水印；应收单号以小字低对比挂在描述下。色块随全文变高。
3. **不在清单**：主文案为扫到的码；「不在清单」作结果水印。
4. `docs/deploy.md` 规定货品描述 **建议 ≤20 汉字或 ≤40 字符**（软上限，前端不硬截断）。
5. 同轮 UX 辅助（目标机 iPhone 13 Pro Safari）：**横向条码 ROI** + **距离/对焦短提示**。不引入手电筒；不引入 WASM / ZBar polyfill；保留现有 html5-qrcode 路径。

## User Stories

1. As a 收货人, I want 新已收时一眼看到货品描述, so that 我知道这票货是什么而不用盯单号。
2. As a 收货人, I want 已收过时也能看到货品描述, so that 重复扫时仍能认出是哪件货。
3. As a 收货人, I want 用色块颜色区分新已收与已收过, so that 余光仍能分辨结果类型。
4. As a 收货人, I want 结果词以半透明水印垫底, so that 不抢货品描述的阅读。
5. As a 收货人, I want 单号以小字低对比显示, so that 查错时仍能对上码但不当主角。
6. As a 收货人, I want 货品描述为空时看到「（无货品描述）」, so that 色块不会空白无信息。
7. As a 收货人, I want 长描述完整显示且色块变高, so that 不被前端截断误导。
8. As a 收货人, I want 不在清单时主显扫到的码, so that 我知道扫进了什么杂码。
9. As a 收货人, I want 不在清单也有结果水印, so that 与命中反馈同一套视觉语法。
10. As a 备表人, I want deploy 文档写明货品描述建议字数, so that 我粘贴描述时控制长度方便仓口扫视。
11. As a 收货人, I want 挂载后本地清单带上货品描述, so that 乐观反馈不必等二次读表。
12. As a 收货人, I want 同码闩下连刷仍保持新已收色与描述, so that 不误报已收过。
13. As a 收货人, I want 写表失败仍红字并回滚, so that 不会假已收。
14. As a 收货人, I want 横向条码取景区更贴面单条码形态, so that 更容易对准。
15. As a 收货人, I want 距离/对焦类简短提示, so that 我知道何时拉远或稳住。
16. As a 开发者, I want 色块文案组合有可测纯函数, so that 不靠真机断言主文案/水印/单号层级。
17. As a 开发者, I want 挂载校验仍拒绝非法状态与重复单号, so that 台账规则不变。
18. As a 收货人, I want 未收列表仍可折叠查看, so that 漏收排查不丢。
19. As a 收货人, I want 开摄路径不被新解码库打断, so that 挂载后摄像头仍能启动。

## Implementation Decisions

- 遵守 ADR-0001/0002/0003；收货表仍为唯一台账；摄像头仍在静态 HTTPS 页。
- 表头约定：`单号 | 状态 | 扫码时间 | 货品描述`（D 列）。缺 D 列时可补表头；描述空允许。
- `connect` 返回的 `lines` 每项含 `description`（trim 后字符串，可空）。
- 本地清单行形状扩展为含货品描述；`applyScan` 结果语义不变（仍产出 outcome + code）；透传时用对象展开保留 description。
- **新测试缝（优先唯一新增缝）**：纯函数组合扫码展示反馈文案（输入：扫码结果、应收单号、货品描述 → 输出：结果水印文案、主文案、次要单号文案）。UI 只渲染该结果。
- 展示规则（冻结）：
  - 新已收 / 已收过：水印 = 结果词；主文案 = 非空货品描述否则「（无货品描述）」；次要 = 应收单号（小字低对比）。
  - 不在清单：水印 = 「不在清单」；主文案 = 扫到的码；次要可空。
  - 忽略：不更新展示。
- 结果水印视觉约 45% 透明度，垫于主文案之下；配色 class 仍按 outcome。
- 长描述：前端全文显示、色块增高；deploy 软上限 **20 汉字或 40 字符**。
- 扫码辅助（本轮，目标 iPhone 13 Pro Safari）：
  - 横向 ROI/qrbox（比正方形更扁，贴一维条码）。
  - 取景附近短提示：略拉开距离 / 对焦更稳（可含褶皱换角度一句）。
  - **不做**手电筒；**不做** WASM / ZBar / 强制替换 `BarcodeDetector`。
  - 现有 `html5-qrcode` + 既有 `useBarCodeDetectorIfSupported` 行为可保留；不得引入会因不支持 format 而在 `start` 阶段抛错的 polyfill。
- 同码闩、乐观写表、失败回滚行为保持既有规格。
- 顶栏仅表名+进度；换批在底栏拇指区。

## Testing Decisions

- 好测试只断言外部行为：给定 outcome/code/description，组合函数产出的水印/主文案/次要单号符合上表；挂载校验对描述空/非空不误杀。
- **测**：新展示组合纯函数；必要时扩展挂载校验对 D 列的读取（空描述通过）。
- **不测**：真机摄像头、ROI 像素几何、Apps Script 延迟、褶皱样本成功率。
- Prior art：`scan-outcome` / `mount-validation` / `scan-feedback` 的 node:test 风格。

## Out of Scope

- WASM / ZBar / barcode-detector polyfill 或任何强制替换原生 `BarcodeDetector` 的路径
- 手电筒 / torch 控件
- 硬截断货品描述或挂载因超字数失败
- 模糊匹配单号、OCR 货品名
- 原生 iOS App / 商业扫码 SDK
- 写表进行态、换批二次确认（另案）
- 保证达到手持红光枪成功率

## Further Notes

- 领域词：货品描述、结果水印；结果词仍用「新已收」非「新收件」。
- 设计方向见同目录 `design-brief-description-scan.md`。
- 执行前须审核 `plan-description-scan.md`；上一轮「同轮 WASM」已作废，因 polyfill 与 format 列表冲突曾导致无法开摄。
