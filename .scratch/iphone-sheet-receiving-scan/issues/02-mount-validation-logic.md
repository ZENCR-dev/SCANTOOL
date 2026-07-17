# 02 — 挂载校验可单测

**What to build:** 给定收货表式的行列数据，系统能在挂载前校验：合法则得到应收清单；非法状态或重复单号则整表失败并带上可展示的错误明细；空行跳过。行为有自动化测试可证明。

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] 状态仅允许空 / `未收` / `已收`；其它值 → 整表失败，含行号、单号、原值
- [x] A 列 trim 后非空单号重复 → 整表失败，含重复单号及行号
- [x] A 列空行跳过，不计入应收、不报错
- [x] 空与 `未收` 均视为未收；`已收` 视为已收进入清单状态
- [x] 校验成功时可得到总数，且 0 条应收也允许成功

## Answer

已实现 `src/receiving/mount-validation.js` + `mount-validation.test.js`。
