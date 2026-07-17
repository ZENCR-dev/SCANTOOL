# 08 — 同码闩：连刷保持新已收

**What to build:** 同码连刷保持绿新已收且不打 API；异码（含不在清单）解除闩后再扫旧码才已收过。

**Blocked by:** None

**Status:** resolved

- [x] planScan / afterApiOutcome 可单测
- [x] 接入扫码页；识别中本地反馈
- [x] 同码 callApi=false

## Answer

`web/scan-feedback.js` + `src/receiving/scan-feedback.test.js`；`app.js` 已接入。
