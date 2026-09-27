---
name: contract-sync
description: >-
  改业务/接口/表/缓存前先读契约真相并回写文档。Codex 不加载 .cursor/rules/*.mdc 时用本 skill
  承接同步纪律。触及 docs/func|api|db|redis|jobs 或对应代码路径时使用。
---

# 契约同步（contract-sync）

> **适配层 skill**。权威仍是根 `AGENTS.md` + `docs/func|api|db|redis|jobs`。  
> **禁止**把 Never do / Pn 业务正文复制进本 skill。

## 何时使用

- 改接口、表结构、Redis key、功能模块、定时任务契约相关代码
- Codex / 非 Cursor 宿主：不要期望 `.cursor/rules/*-*-sync*.mdc` 自动注入

## 读序（强制）

1. 根 `AGENTS.md`（及改动路径上的分册 `AGENTS.md`）
2. 先读**索引**再读**真相**：`docs/func` → `api` → `db` → `redis` → `jobs`（按已启用域）
3. 改后回写对应 `modules/` / `table/` / `keys/` / `tasks/`

## 域速查

| 域 | 真相目录 | 索引 |
|---|---|---|
| func | `docs/func/modules/` | `docs/func/` |
| api | `docs/api/modules/` | `docs/api/api.md` |
| db | `docs/db/table/` | `docs/db/db.md` |
| redis | `docs/redis/keys/` | `docs/redis/` |
| jobs | `docs/jobs/tasks/` | `docs/jobs/jobs.md` |

## 禁止

- 只读索引不读真相就改契约相关代码
- 把字段表 / 完整 CREATE TABLE / 完整 Cron 写回索引文件
- 明文密码 / Token 写入契约或本 skill

## 交付提醒

业务代码有改动时：按 `docs/agent-kb` 三问自检 pitfalls；未获用户确认前不要 `git commit` / `push`。
