---
name: api-doc-sync
description: >-
  改接口前先读 docs/api 模块真相并回写。Codex 不加载 .mdc 时用本 skill；
  触及 Controller / api-client / OpenAPI 相关路径时使用。
---

# 接口文档同步（api-doc-sync）

> 权威：`docs/api/modules/`；索引 `docs/api/api.md` 非 SSOT。  
> 总览纪律见 skill `contract-sync`。

## 读序

1. `docs/api/api.md`（索引）
2. `docs/api/modules/NN-*.md`（真相）
3. 相关 `docs/func/modules/`（能力语义一致）

## 须同步时

增删接口；改 URL/方法/鉴权；改请求/响应字段或错误码。

## 禁止

- 只读索引就改接口契约
- 把字段表写回 `api.md`
- 明文 Token / 密码写入契约
