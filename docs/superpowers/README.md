# docs/superpowers — 规划 / 设计语料索引

> **本目录不是运行时 SSOT。** 冲突时以 `docs/func|api` 真相 + 代码为准。  
> **Agent 默认只读本页「进行中」表**；勿按「已交付」checkbox 改生产代码。  
> 已交付语料迁入 [`archive/`](./archive/)；追溯见 [`ARCHIVE.md`](./ARCHIVE.md)。  
> 写入方：feature-eng `start`（登记进行中行）/ `close`（移入 ARCHIVE）；骨架与软门禁说明由 harness-eng L3 提供。

## 状态枚举

| 状态 | 含义 | 存放 |
|---|---|---|
| 进行中 | 仍在实施或验收未收口 | `plans/`、`specs/` |
| 已交付 | 主功能已合入；默认只读 | `archive/plans/`、`archive/specs/` |
| 废弃 | 被替代或不再执行 | 同归档 |

## 主题索引（仅进行中）

| 日期 | 主题 | Spec | Plan | 提交 |
|---|---|---|---|---|
| 2026-09-27 | 个人资料查看与编辑 | — | — | — |

已交付 → [`ARCHIVE.md`](./ARCHIVE.md)（**默认勿打开**）。

## 软门禁（L3）

- 按 `ai_tools`（本仓 cursor + codex）：`.cursor/hooks.json`、`.codex/hooks.json`（由 `docs/agent-config/hooks/` 经 sync 生成）
- 通用兜底：`.githooks/pre-commit` — 需 `git config core.hooksPath .githooks`
- 均为软提醒，不拦截 commit

## 变更记录（索引级）

| 日期 | 事项及说明 | 状态 |
|---|---|---|
| 2026-09-27 | harness-eng 0.7.9 land：与 feature-eng 旧 README 合并为单页 | 已生效 |
