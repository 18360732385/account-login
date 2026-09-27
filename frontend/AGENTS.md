# frontend — AI 协作规范（前端分册）

> 本文件供 AI 在 `frontend/` 下工作时遵循（**分册厚 SSOT**）。  
> 仓库命令与红线见根 [AGENTS.md](../AGENTS.md)。与 path rule `17-frontend-web` 对齐；细则以本分册为准。

## 模块定位

| 项 | 说明 |
|---|---|
| 职责 | TODO(harness-eng): 前端 SPA / 包职责 |
| 边界 | **仅前端**；勿把后端静态资源塞进后端模块 |
| 技术栈 | TODO(harness-eng): 框架 / 包管理器 / UI 体系 |
| 开发端口 | TODO(harness-eng) |

## 动手前检查

1. 读根 AGENTS 与本分册
2. 改接口消费：先读 `docs/api` 索引 → 真相，再改 api-client / types / queries
3. 触碰 UI：确认禁用清单（见下）仍有效
4. 跑本模块 typecheck / test（见下）

## 常用命令

```text
TODO(harness-eng): install / dev / test / typecheck（可复制命令）
```

## 栈与禁用清单

- **推荐栈**：TODO(harness-eng)
- **禁用**（勿重新引入）：TODO(harness-eng): 列出已禁用的 UI / 样式库 / 模式
- 完整禁用说明：本分册为准；rule `17` 只提醒路径

## api-client / 契约同步

| 变更 | 必须同步 |
|---|---|
| 后端 REST 契约 | `docs/api/modules/…`（SSOT）+ 本模块 api-client / types / queries |
| 仅前端展示 | 本模块组件；**勿**反向改契约真相 |

TODO(harness-eng): 写明 api-client / types / queries 的包路径。

## 改动路径速查

| 需求 | 优先改动 |
|---|---|
| 页面 / 路由 | TODO(harness-eng): apps/… |
| 共享 UI | TODO(harness-eng): packages/… |
| 接口类型 / 请求封装 | TODO(harness-eng): api-client / types / queries |
| 契约正文 | `docs/api/modules/…`（先真相后代码） |

## 禁止事项

> 一句话在此；细节回链 `docs/agent-kb/pitfalls.md` 的 `Pn`。

- 提交密钥 / `.env` 真密
- 重新引入仓内已禁用的 UI / 样式库
- 无文档同步地变更公开契约消费层
- TODO(harness-eng): 域禁令 → Pn

## 文档同步门禁（交付必做）

| 变更类型 | 必须同步 |
|---|---|
| REST 消费 / 类型 | `docs/api/modules/…` + api-client/types/queries |
| 仅前端行为 | 本分册改动路径；不必改后端契约 |
