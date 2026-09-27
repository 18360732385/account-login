# 架构概览

> 仓库知识库（**非**契约 SSOT）。短文指针；细节以分册 `AGENTS.md` 为准。  
> 契约真相见 `docs/func|api|db|redis|jobs`；命令与红线见根 `AGENTS.md`。

## 系统上下文

```text
TODO(harness-eng): 客户端 → 服务 → 依赖（DB / 缓存 / 外部 HTTP）
```

## Monorepo / 模块边界

| 目录 | 职责 | 禁止 |
|---|---|---|
| backend, frontend | TODO | TODO |
| `docs/`（func / api / db / redis / jobs） | 契约 SSOT | 用 plan 覆盖契约 |
| `docs/agent-kb/` | 架构 / 踩坑 / 接受缺口 | 用本目录覆盖契约 |
| `docs/superpowers/` | 规划语料（若启用） | 已交付 plan 当任务清单 |

## 请求链路

```text
TODO(harness-eng): Controller → Service → Infra
```

## 关键边界

| 主题 | 要点 |
|---|---|
| 鉴权 | TODO |
| 配置 / 环境 | TODO |
