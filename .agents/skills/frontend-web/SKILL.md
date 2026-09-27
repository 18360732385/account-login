---
name: frontend-web
description: >-
  改前端应用 / 共享包前先读分册 AGENTS 与契约。Codex 不加载 .mdc 时用本 skill；
  触及 ui / theme / api-client / types / 前端页面时使用。
---

# 前端协作（frontend-web）

> **协作包，非契约域。** 权威：前端分册 `AGENTS.md`（若有）+ `docs/api` / `docs/func`。  
> 接口字段真相仍走 skill `api-doc-sync`；总览见 `contract-sync`。

## 读序

1. 前端分册 `AGENTS.md` 与前端 `README` / 主题文档（若有）
2. 改 API：`docs/api` 索引 → 真相 → 前端 `types` → `api-client`
3. 改业务语义：`docs/func` 索引 → 真相
4. 改视觉：只动主题 token / 设计文档

## 须同步时

改接口响应结构 → `docs/api` + `types` + `api-client`（必要时 queries）；禁库/字体/静态资源边界见分册 Never do。

## 禁止

- 重新引入仓内已禁用的 UI / 样式库（以前端分册为准）
- 运行时加载外网字体（须自托管）
- 改接口却不同步契约与 `api-client`
- 在后端模块内放前端静态资源
