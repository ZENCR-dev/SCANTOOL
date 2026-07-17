# 04 — HTTPS 扫码页端到端可用

**What to build:** 收货人在 iPhone Safari 打开 **HTTPS 静态扫码页**（非 HtmlService iframe 内摄像头），完成挂载后连续扫一维码，看见可区分的粗糙反馈，并把新已收写回已挂载的收货表；冷却防止连刷。

**Blocked by:** 03 — 真表 API：挂载并写成已收

**Status:** ready-for-agent

- [ ] 摄像头不在 Apps Script HtmlService iframe 内启动（符合 ADR-0002）
- [ ] iPhone Safari 可授权摄像头并连续识别一维样例码
- [ ] 页内可粘贴收货表链接完成挂载并显示已收/总数
- [ ] 新已收 / 已收过 / 不在清单反馈可明显区分（允许极简色块/声音）
- [ ] 成功类结果后约 1.5s 冷却再生效
- [ ] 新已收后收货表状态与扫码时间正确；已收过与不在清单不改表
- [ ] UI 允许丑陋；路径必须在真机上可走通
