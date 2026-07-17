# 04 — HTTPS 扫码页端到端可用

**What to build:** 收货人在 iPhone Safari 打开 HTTPS 静态扫码页，完成挂载后连续扫一维码，看见可区分的粗糙反馈，并把新已收写回收货表。

**Blocked by:** 03 — 真表 API：挂载并写成已收

**Status:** resolved

- [x] 摄像头不在 HtmlService iframe 内（静态 `web/`）
- [x] 页内挂载 + 已收/总数 + 未收入口
- [x] 三态反馈色块 + 不同提示音 + 1.5s 冷却
- [x] 一维码 formatsToSupport 已配置
- [ ] 真机 iPhone Safari E2E（部署后由操作者勾选 Spec 清单）

## Answer

实现于 `web/index.html` + `web/app.js`。真机验收依赖部署。
