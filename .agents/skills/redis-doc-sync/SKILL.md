---
name: redis-doc-sync
description: >-
  改 Redis Key / TTL / 读写方前先读 docs/redis 真相并回写 keys/。
  Codex 不加载 .mdc 时用本 skill；触及缓存 Key、Redis 客户端封装时使用。
---

# Redis 文档同步（redis-doc-sync）

> 权威：`docs/redis/keys/`；索引 `docs/redis/redis.md` 非 SSOT。  
> 总览纪律见 skill `contract-sync`。

## 读序

1. `docs/redis/redis.md`（索引）
2. `docs/redis/keys/NN-*.md`（Key 族真相）
3. 模板：`docs/redis/templates/`（若存在）

## 须同步时

Key 模式 / TTL / 数据结构 / value 语义 / 读写方变更。

## 禁止

- 只读索引就改 Key 相关代码或文档
- 把 value 字段表写回 `redis.md`
- 把 Redis 密码、Token 样例写入契约（连接参数放 local MCP 真密）
