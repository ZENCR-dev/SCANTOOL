# 公开仓库可预置 Web App URL 与批次列表

临时收货工具需要扫码页打开即可用：Apps Script Web App URL 在项目生命周期内固定，真正变化的是每批收货表。决定：**将默认 Web App URL 与约 3～4 个批次（名称 + 收货表链接）写入仓库前端配置并随 GitHub Pages 发布**；现场主路径为「选批次 → 挂载」，不再强制每次手填 API。

## Considered Options

- **API URL 永不提交、线上手填**（否决）— 对固定 exec 链接过重，易导致可用路径被操作步骤拖垮
- **仅本地 config、Pages 用空配置**（否决）— 与「打开就能挂载」冲突
- **配置进仓 + 批次下拉**（采纳）— 与「有链接即可用」一致；用完停用 Web App 控制暴露面

## Consequences

- 公开仓库读者可见 Web App URL（及预置表链接）；须接受并用「停用部署」收尾
- Pages / 部署文档须停止「禁止提交 config」的绝对表述
- 母 Spec 的挂载校验与扫码规则不变；仅默认值与选表 UX 变化
