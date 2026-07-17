# 06 — 配置进仓：apiUrl + 批次列表

**What to build:** 仓库内前端配置携带默认 Web App URL 与约 3～4 个批次（name + sheetUrl），随 Pages 发布。

**Blocked by:** None

**Status:** resolved

- [x] config 形状含 apiUrl + batches
- [x] Pages workflow 不覆盖已有 config
- [x] example 展示形状
- [x] .gitignore 不再排除 config.js

## Answer

见 `web/config.js` / `config.example.js`；workflow 仅在缺失时回退 example。
