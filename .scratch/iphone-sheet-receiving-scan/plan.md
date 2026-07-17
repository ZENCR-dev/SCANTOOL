# MVP 开发计划：iPhone 扫码核对收货表

Parent spec: [spec.md](./spec.md)

原则：垂直切片（tracer bullet）；每张票可独立验证；UI 允许粗糙，E2E 必须可用。  
工作方式：只做 **frontier**（阻塞已清的票）；建议一次只开一张，用 `/implement`。

## 依赖图

```text
01 扫码结果纯逻辑 ──┐
                    ├──► 03 真表 API（无摄像头） ──► 04 扫码页 E2E ──► 05 部署与验收收口
02 挂载校验纯逻辑 ──┘
```

## 票一览

| # | 标题 | Blocked by | 交付 |
|---|------|------------|------|
| [01](./issues/01-scan-outcome-logic.md) | 扫码结果判定可单测 | 无 | 新已收/已收过/不在清单/忽略 行为可验证 |
| [02](./issues/02-mount-validation-logic.md) | 挂载校验可单测 | 无 | 非法状态/重复单号拒绝、空行跳过可验证 |
| [03](./issues/03-sheet-api-without-camera.md) | 真表 API：挂载并写成已收 | 01, 02 | 无摄像头即可对真收货表挂载、扫写、统计 |
| [04](./issues/04-https-scanner-page-e2e.md) | HTTPS 扫码页端到端可用 | 03 | iPhone 连续扫一维码并写回，三态可区分 |
| [05](./issues/05-deploy-docs-and-e2e-gate.md) | 部署说明与 E2E 验收收口 | 04 | 按说明从零挂起；Spec 验收清单全过 |

## 约束与 ADR

- [CONTEXT.md](../../CONTEXT.md)
- [docs/constraints.md](../../docs/constraints.md)
- [ADR-0001](../../docs/adr/0001-apps-script-spa-sheet-ledger.md)
- [ADR-0002](../../docs/adr/0002-camera-outside-apps-script-iframe.md)
- [ADR-0003](../../docs/adr/0003-commit-api-url-and-batch-presets.md)

## 后续

- 预置批次：[spec-preset-batches.md](./spec-preset-batches.md) → issues 06–07  
- 同码闩反馈：[spec-scan-feedback-latch.md](./spec-scan-feedback-latch.md) → [issue 08](./issues/08-same-code-latch-feedback.md)
