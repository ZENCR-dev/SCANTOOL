# Spec：扫码主屏 UX + 本地清单乐观写表

Status: implemented（P0–P4）

## Problem Statement

挂载后批次选择区仍占 iPhone 上半屏，挤占扫码反馈与取景框。扫码仍慢：须等 Apps Script 返回才出最终色。需要挂载后进入「扫码主屏」，并用手机本地清单立刻判色、后台写表。

## Solution

1. **挂载成功后隐藏挂载区**；顶栏显示 Google 表文件名、已收/总数、【换批】（换批则停扫并重新显示挂载区）。
2. **`connect` 返回 `sheetTitle`（表格文件名）+ 本批 `lines`（单号与状态）**。
3. **乐观正确反馈**：解码后本地 `applyScan` 立刻展示；仅 **新已收** 异步调用 `scan` 写表；失败则红字、撤销本地已收与同码闩。
4. **同码闩保留**；冷却约 500ms；摄像头 fps 约 15。
5. 下拉仍用 config 短名；文件名仅挂载后顶栏展示。

## User Stories

1. As a 收货人, I want 挂载后不再看到大块选表界面, so that 反馈和取景框占主屏。
2. As a 收货人, I want 顶栏看到真实表文件名与进度, so that 确认挂对了批次。
3. As a 收货人, I want 一键换批, so that 能停扫并重新选表。
4. As a 收货人, I want 对准条码后几乎立刻看到对的颜色反馈, so that 手速不被网络拖住。
5. As a 收货人, I want 写表失败时被明确告知且本地状态回滚, so that 不会假已收。
6. As a 收货人, I want 连刷同码仍保持新已收绿反馈, so that 不误报已收过。

## Implementation Decisions

- connect 增加：`sheetTitle`、`lines: [{code,status}]`（及原有统计字段）。
- 客户端持有 `localState`；扫码路径：同码闩 → 本地 applyScan → 展示 →（若新已收）async scan API。
- 写失败：该码改回未收、清闩、错误提示。
- UI：`#mount-panel` hidden after connect；`#session-bar` visible。
- COOLDOWN_MS=500；fps=15。
- 不阻塞下一不同码的本地判定（写表进行中仍可扫其它码）；同码闩仍跳过。

## Testing Decisions

- 既有缝：applyScan、mount-validation、planScan/afterApiOutcome。
- 可选：写失败回滚的小纯函数（若抽出）；否则手工验。
- 不自动化真机/GAS 延迟。

## Out of Scope

- 保证写表本身 &lt;1s
- 离线队列
- 打开页时预取所有批次表名

## 步骤计划

| 步 | 内容 |
|----|------|
| P0 | 本 Spec + CONTEXT/constraints 补丁 |
| P1 | GAS connect 返回 sheetTitle + lines |
| P2 | web 引入 scan-outcome；本地乐观扫码 + 异步写 + 回滚 |
| P3 | 隐藏挂载区 + session 顶栏 + 换批；fps/冷却 |
| P4 | 测试全绿 + commit |
