---
name: db-doc-sync
description: >-
  改表结构 / 迁移前先读 docs/db 真相并回写 table + _change.sql。
  Codex 不加载 .mdc 时用本 skill；触及 migration、建表、字段变更时使用。
---

# 数据库文档同步（db-doc-sync）

> 权威：`docs/db/table/` + `_change.sql`；索引 `docs/db/db.md` 非 SSOT。  
> 总览纪律见 skill `contract-sync`。

## 读序

1. `docs/db/db.md`（索引）
2. `docs/db/table/NN-*.md` + 同序号 `_change.sql`
3. 模板：`docs/db/templates/`（若存在）

## 须同步时

新建/删表；改字段/索引/主键外键；数据订正 SQL。

## 禁止

- 只读索引就改表或迁移
- 把完整 CREATE TABLE 写回 `db.md`
- 改已发布 migration（以根 AGENTS Never do 为准）
