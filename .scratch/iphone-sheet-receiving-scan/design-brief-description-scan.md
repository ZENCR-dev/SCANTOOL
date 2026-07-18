# Design brief：货品描述色块 + 取景辅助

Status: confirmed

## 1. Feature Summary

仓口一人手持 iPhone 13 Pro：扫完要一眼看到「这是什么货」，结果类型靠配色与半透明结果水印；取景用更扁的横向 ROI + 一句距离/对焦提示，帮助对准褶皱面单。不换解码引擎。

## 2. Primary User Action

对准条码 → 余光读色块上的**货品描述**（同时靠颜色知道新已收/已收过/不在清单）。

## 3. Design Direction

- **Color strategy：** Restrained（壳层）+ 色块 Committed 语义色（沿用 DESIGN flash-*）。
- **Scene：** 门口/仓口站立、单手持机、亮或半亮环境、赶时间；暗底高对比。
- **Anchors：** 仓口色块（本项目 North Star）；工业扫码枪「绿/橙一眼」；面单上一维码的扁长形态（驱动 ROI）。
- **Probe：** 跳过（既有色块精炼，非全新视觉方向）。

## 4. Scope

- Fidelity：production-ready（落在现有 `web/` 扫码主屏）
- Breadth：扫码主屏色块层级 + 取景辅助；挂载 API 透传描述
- Interactivity：shipped 静态页行为
- Time intent：可审核后上线一轮

## 5. Layout Strategy

- `#flash` 仍为第一答案区：全宽 slab；内部分三层——结果水印（大、~45% 透明）→ 主文案货品描述（醒目）→ 次要单号（小、低对比）。
- 色块随描述变高；不硬截断。
- `#reader` 上方或紧挨：一行 `scanHint`（扫描态可见）。
- 底栏仍为停止 / 继续 / 换批（无手电筒按钮）。

## 6. Key States

| 状态 | 用户应看到 |
|------|------------|
| 新已收 | 绿 slab；水印「新已收」；主文案描述或「（无货品描述）」；次要单号 |
| 已收过 | 橙 slab；同上结构，水印「已收过」 |
| 不在清单 | 灰 slab；水印「不在清单」；主文案=扫到的码 |
| 忽略 | 色块不更新 |
| 写表失败 | 红字错误 + 回滚（可单层文案） |
| 开摄中 / 停止 | 短状态文案；hint 在 scanning 时可见 |

## 7. Interaction Model

挂载并开扫 → 主屏 → 连续扫；同码闩下连刷仍绿+描述。ROI 随 html5-qrcode 配置更扁。无新手势；无点色块展开（全文直接显示）。

## 8. Content Requirements

- 占位：「（无货品描述）」
- 水印词：新已收 / 已收过 / 不在清单
- hint 例：「横向对准条码；略拉开距离对焦更稳。」
- deploy 软上限文案：≤20 汉字或 ≤40 字符

## 9. Recommended References (impeccable)

- `reference/product.md`（已用）
- 实现时可参考 `typeset` / `layout` 微调三层字阶；勿 `delight` / 花哨 motion

## 10. Open Questions

无阻塞项。默认：水印 opacity 0.45；主文案约 1.75rem；次要用 label 阶 0.85rem 低对比。

---

确认或覆盖本 brief 后，再执行 `plan-description-scan.md`。
