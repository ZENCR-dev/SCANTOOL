# 执行步骤方案：货品描述反馈 + 取景辅助

Status: **approved-for-execution**

依据：`.scratch/iphone-sheet-receiving-scan/spec-description-feedback-scan.md`  
设计 brief：`design-brief-description-scan.md`  
Grill 锁定：本轮 **无 WASM、无手电筒**；仅横向 ROI + 距离/对焦短提示。

## 测试缝（请审核确认）

| 缝 | 作用 | 说明 |
|----|------|------|
| **新增** `composeScanFlash(outcome, code, description)` | 组合水印 / 主文案 / 次要单号 | 纯函数；含 `忽略`→不更新；node:test；UI 只渲染 |
| 既有 `applyScan` | 台账 outcome | **不改语义**；行上 description 透传 |
| 既有 `mount-validation` / GAS `validateSheet_` | 非法状态、重复单号 | 扩展读 D 列；空描述允许；非法/重复仍拒 |
| 既有 `planScan` | 同码闩 | 展示层改用 compose；闩逻辑不变 |

权威源：`src/receiving/*.js`；`web/` 为发布副本，改逻辑后 `cp` 同步。GAS 与 `src` 手工对齐。

**推荐：本轮只新增上述一条 compose 缝。** 若审核要改缝，改本表后再执行。

## 步骤

| 步 | 内容 | 产出 | 依赖 |
|----|------|------|------|
| **D0** | 对齐 constraints / deploy / DESIGN / PRODUCT（描述主阅读、D 列、软上限、换批在底栏、允许 compose 测缝）；**禁止**把 WASM 写回范围 | 文档 | — |
| **P1** | `composeScanFlash` + 测试（新已收/已收过/不在清单/空描述/忽略）；同步 web 副本 | 单测绿 | — |
| **P2** | GAS：读/补 D 列；`lines[].description`；空描述允许 | `Code.gs` | — |
| **P3** | Web：本地清单 description；渲染水印(~45%)+主文案+次要单号；色块随文增高、不硬截断 | `web/` | P1+P2 |
| **P4** | 扫码 UX：更扁横向 `qrbox`；扫描态短提示文案 | `web/` | **P3 后**（避免同屏抢改） |
| **P5** | `npm test`；deploy E2E 备注；真机手工（ROI/提示主观，非 CI） | 门禁 | P1–P4 |
| **P6** | commit（勿 skill 树）；push Pages；**重发 Apps Script 新版本** | 上线 | P5 |

## UI/UX 实现要点（对照 brief）

1. `#flash` DOM 三层：`.flash-watermark` / `.flash-primary` / `.flash-secondary`  
2. DESIGN 增补 flash-primary / watermark / secondary 字阶；PRODUCT 原则改为「货是什么 + 结果」  
3. `qrbox` 改为更横向（例如宽≥高×2.5 量级，实现时微调）；`#scanHint` 仅 `body.scanning` 显示  
4. **禁止**再引入 `@undecaf/barcode-detector-polyfill` 或覆盖 `window.BarcodeDetector`

## 保持既有（回归）

- 同码闩：连刷同码保持新已收色 + 描述，不误报已收过、不重复写表  
- 乐观写表失败：红字 + 本地回滚  
- 未收列表可折叠；顶栏表名+进度；换批在底栏  

## 明确不做

- WASM / ZBar / 强制 polyfill  
- 手电筒  
- 描述硬截断 / 超字数拒挂载  
- 换批确认、写表进行态  

## 审核清单

- [ ] 测试缝：同意唯一新增 `composeScanFlash`  
- [ ] 范围：无 WASM、无手电筒  
- [ ] 软上限：20 汉字 / 40 字符  
- [ ] design brief：三层色块 + 横向 ROI + 短提示  
- [ ] 审核通过后改 Status 为 `approved-for-execution` 再实现  
