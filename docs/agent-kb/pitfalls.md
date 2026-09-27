# Agent 踩坑台账（pitfalls）

> 登记「智能体易再犯」的错误做法。**新增 / 修订后必跑**：`node scripts/agent-kb/lint-pitfalls.mjs`。
>
> **查询协议**：先看下方**路径速查**（按将要触碰的路径找 `Pn`），或 Grep 路径 / 关键词（例 `migration`、`scheduler`）；按域 Grep `| {域} |` 兜底；**禁止无筛选整表 Read**，勿把本表 alwaysApply。

## 路径速查

> 骨架行：落地后用本仓真实 `Pn` 替换「（待补）」；有活跃 Pn 时勿长期留空。

| 将要触碰的路径 / 关键词 | 相关坑 |
|---|---|
| `db/migration`、`*.sql` | P1 |
| `docs/api`、`controller`、`packages/api-client`、`packages/types`、`packages/queries` | （待补） |
| `docs/superpowers`、交付收口 | （待补） |
| `docs/agent-config`、`scripts/agent-config`、各宿主生成物 | （待补） |
| （按本仓实际补充：一行一路径族，只列 `Pn`） | |

## 域速查

| 域 | 坑 |
|---|---|
| Build | P1 |

## 台账（活跃）

| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |
|---|---|---|---|---|---|---|
| P1 | 活跃 | Build | `mvn`、`gradle`、构建命令 | 示例：在错误目录执行构建导致依赖解析失败 | 示例：在子模块目录直接构建 | [agent-kb README](README.md) |

## 已根治留档

| ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点 |
|---|---|---|---|---|---|---|

> 根治（根因已消除，如加了 lint / 模板 / 钩子）后把行**移动**到本区并改状态「已根治」；**ID 不复用**。

## 封闭域词表

「域」列只允许：`"Build", "Auth", "Docs", "Config", "API", "Backend", "Test", "Cache", "Jobs", "Frontend", "DB", "MCP", "Prompt", "Graph"`。
需要新域时，先改 `scripts/agent-kb/lint-pitfalls.mjs` 的 `DOMAINS` 词表（land 时由占位 `PITFALL_DOMAINS` 渲染），再使用。

## 书写要求

- **触发路径/关键词必填**：写会被 Grep 到的路径片段或关键词，供路径速查 / Grep 命中
- 「正确约束落点」只回链 AGENTS / rule / 契约真相文档，**不抄正文**（避免两处漂移）
- 「现象 / 错误做法」写可检索的事实，不写感想
- **根 AGENTS Never do**：新增红线必须带 `→ Pn`，且该 `Pn` 须出现在本台账 **与**「路径速查」（lint 会 warn 缺回链）
