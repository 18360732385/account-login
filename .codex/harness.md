# Codex · harness 入口说明

> **适配层（非 SSOT）**。Codex 请优先加载仓库根 `AGENTS.md`。  
> **不要**期望 `.cursor/rules/*.mdc` 被自动加载。

## SSOT

| 内容 | 路径 |
|---|---|
| 命令与红线 | `AGENTS.md`（及分册） |
| 功能/接口/表/Redis/jobs 契约 | `docs/func` · `docs/api` · `docs/db` · `docs/redis` · `docs/jobs` |
| 踩坑回流 | `docs/agent-kb/` |

本目录文件**不**承载业务红线正文。冲突以 `AGENTS.md` 与契约真相为准。

## 本目录

| 文件 | 用途 |
|---|---|
| `harness.md` | 本指针 |
| `contract-sync.md` | 契约 sync 薄指针（仅 L0–L2；L3+/L5 常 omit） |
| `hooks.json` | `PreToolUse` `^Bash$` + `mcp__mysql` + `Stop`；含 **`commandWindows`**（经 `codex-hook.cmd`）；须 `/hooks` 信任 |
| `rules/` | Starlark **命令政策**（≠ 自然语言开发规范） |
| `config.toml.example` | MCP 示例（无密钥；`enabled` 由 `mcp/policy.json`） |
| `policy.json`（SSOT） | 按 server / 启发式决定建议启用与审批模式 |

## MCP 启用仪式（项目级）

1. Workspace **trust**
2. 审阅 `.codex/config.toml.example` → 拷贝/合并为本机 `.codex/config.toml`（**gitignore**；勿提交密钥）
3. 会话 `/mcp` 验收；写库类保持 `enabled=false` 直至明确需要
4. **不要**假设根 `.mcp.json` 对 Codex 生效

## 入库约定

| 应入库 | 勿入库 |
|---|---|
| `hooks.json`、`.codex/hooks/*.js`、`rules/`、`config.toml.example`、`docs/agent-config/codex/**` | `.codex/config.toml`（真密本机） |

官方 skills：L5 同步 `.agents/skills/`（种子含 `contract-sync` / `api|db|redis|jobs-doc-sync` / `frontend-web`；见 `CODEX-PARITY` · `CODEX-MANUAL`）。
