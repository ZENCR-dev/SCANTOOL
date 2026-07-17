# Spec：同码闩反馈 + 扫码体感

Status: ready-for-agent

## Problem Statement

第一版真机测试中：镜头对准条码后约 3～5 秒才看到成功反馈（同时收货表往往已写上已收与扫码时间）；成功闪过后又立刻变成「已收过」。原因是摄像头连续读同一码，第二次请求命中台账已收。收货人需要：连刷同一件时一直看绿色「新已收」；只有中间扫过别的码，再扫回旧码时，才报警「已收过」。并希望缩短「对准 → 看见反馈」的体感延迟。

## Solution

在扫码页引入 **同码闩** 与 **扫码展示反馈**（与台账上的扫码结果分离）：

1. 某码首次 **新已收** 成功后，闩住该码；在读到**其它非空码**之前，连续读出同一码 → 展示反馈保持绿色「新已收」，且 **不再请求 API**（避免无意义的已收过与延迟）。
2. 读到其它非空码后闩解除；若再扫到已是已收的旧码 → 展示并采用「已收过」警报。
3. 体感：解码成功后立即给出本地「处理中/已识别」反馈，再等 API；同码连刷零 API。台账规则（applyScan）不变。

## User Stories

1. As a 收货人, I want 对准条码后尽快看到反馈, so that 我知道机器已经跟上我的手速。
2. As a 收货人, I want 新已收成功后镜头仍对着同一码时继续显示绿色新已收, so that 不会误以为出错。
3. As a 收货人, I want 连刷同一码时不要反复报已收过, so that 现场不被橙色警报打扰。
4. As a 收货人, I want 中间扫过别的码后再扫回旧码时看到已收过警报, so that 我能发现拿重了包裹。
5. As a 收货人, I want 不在清单仍可立刻继续扫下一件, so that 误扫不拖节奏。
6. As a 收货人, I want 写表成功与屏幕反馈最终一致, so that 电脑核对仍然可信。
7. As a 收货人, I want 同码连刷不要反复打 API, so that 减少卡顿与配额压力。
8. As a 实现者, I want 台账判定仍用既有扫码结果纯函数, so that 同码闩只影响展示与是否调用 API。
9. As a 实现者, I want 同码闩规则可单测, so that 回归「连刷不变已收过、隔码再扫才警报」。
10. As a 收货人, I want 冷却与同码闩一起工作时仍符合上述直觉, so that 不会又慢又乱报。

## Implementation Decisions

- **台账不变**：`applyScan` / Apps Script 写表语义不变；已收过仍不改表。
- **同码闩（已冻结；「其它码」含不在清单等一切非空异码）**：
  - 变量：`latchedCode`（无则空）
  - 当 API 返回 **新已收** 且成功：设 `latchedCode = code`，展示「新已收」
  - 若新解码 `code === latchedCode`：**不调用 API**，展示反馈保持「新已收」（绿）
  - 若新解码非空且 `code !== latchedCode`：解除闩，再按正常路径调用 API；若结果为已收过则警报
  - 「其它码」= 一切 trim 后非空且不等于闩码的解码（**含不在清单**；产品方已确认）
- **展示 vs 结果**：屏幕用 **扫码展示反馈**；统计数字仍以 API 成功返回为准（同码跳过 API 时沿用上次 stats）。
- **体感延迟**：
  - 解码回调触发时先本地 flash「识别中…」（或等价），再 await API
  - 同码闩跳过网络，消除连刷二次延迟与误报
  - 首次写表仍受 Apps Script 延迟影响；可作为后续优化（不阻塞本 Spec）
- **冷却**：可保留；与同码闩并存。推荐：同码闩命中时不再延长冷却骚扰；换码后的已收过仍可短冷却。
- **文案**：绿色主成功文案继续用领域词 **新已收**（用户口述「已新收」视为同义）。

### 展示反馈纯函数（可测缝，来自本需求）

```text
decideClientFeedback(latchedCode, decodedCode, apiOutcome|null):
  // apiOutcome null = 未打 API（同码短路）
  if latchedCode && decodedCode === latchedCode:
    return { display: 新已收, callApi: false, nextLatch: latchedCode }
  if apiOutcome === 新已收:
    return { display: 新已收, callApi: true(already), nextLatch: decodedCode }
  if apiOutcome === 已收过:
    return { display: 已收过, nextLatch: empty }
  ...
```

（实现可调整形状；行为须满足上文规则。）

## Testing Decisions

- **新增自动化缝（已确认）**：同码闩 / 展示反馈决策的纯函数（输入：闩、解码串、可选 API 结果 → 是否 callApi、展示态、下一闩）。
- **保持**：扫码结果、挂载校验两缝不变。
- 不自动化：真机摄像头、Apps Script 首包延迟。
- 手工：连刷同一面单只见绿色新已收；扫 B 再扫回已收的 A → 已收过。

## Out of Scope

- 改变收货表已收/未收写入规则
- 服务端「忽略短时间重复扫」
- 保证首次 API 一定 <1s（网络/GAS 限制）；本 Spec 只要求去掉同码二次请求并改善本地反馈
- 二维码专用优化（用户口述可含二维码，MVP 仍以一维为主）

## Further Notes

- 词表：`CONTEXT.md`（同码闩、扫码展示反馈）
- 母 Spec / 批次 Spec 仍然有效；本文件覆盖扫码页反馈行为
- 实现票建议：`issues/08-same-code-latch-feedback.md`
- 与批次下拉（06/07）可并行；本票不依赖批次 UI

### 修订步骤计划

| 步 | 内容 |
|----|------|
| T1 | 文档：CONTEXT + 本 Spec + constraints 一句（本次） |
| T2 | 实现 `decideClientFeedback`（或等价）+ 单测 |
| T3 | 接入扫码页：同码跳过 API；解码后先本地反馈 |
| T4 | 真机回归：连刷同码 / 隔码再扫 / 表仍只写一次新已收 |
