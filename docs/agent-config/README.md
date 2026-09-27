# docs/agent-config — AI 工具配置 SSOT

本目录是 rules / hooks / MCP / settings / skills 的**单一真相源**；`.cursor/` `.qoder/` `.claude/` `.trae/` `.codebuddy/`、`CLAUDE.md`、`.mcp.json` 均为生成物。

## 纪律

- **勿手改生成物**（带 GENERATED 标记）；手改会被下次 sync 覆盖
- 改配置只改本目录，改完必跑：`node scripts/agent-config/sync.mjs`
- CI / 提交前校验漂移：`node scripts/agent-config/sync.mjs --check`（有差异退出码 1）
- 生成物以外的运行时数据（如 `docs/harness-eng/harness-meta.yaml`、遗留 `.cursor/harness-meta.yaml`、`mcp.local.json`）不受管理

## 布局

| 路径 | 说明 |
|---|---|
| `rules/*.mdc` | Cursor 原生 frontmatter 规则；qoder/claude strip；trae/workbuddy 保留 FM |
| `hooks/hooks.config.json` | hook 资产与各工具事件映射；无等价事件机制的工具不生成、不降级模拟 |
| `hooks/*.js` | 统一 Cursor 协议脚本；Claude 族（claude/qoder/trae）经 `claude-adapter.js` 双向翻译 |
| `mcp/servers.json` | （可选）MCP server SSOT；**含密即 vendored_shared 团队约定**，example_only 仓勿建 |
| `mcp/servers.example.json` | 无密示例 → `.cursor/mcp.json.example` / 根 `.mcp.json.example` / `.trae/mcp.json.example` / `.codex/config.toml.example` |
| `mcp/policy.json` | Codex MCP **启用策略**（`enabled` / `approval_mode`；无密钥）；sync 写入 `config.toml.example` |
| `settings.json` | （可选）`.cursor/settings.json` 与 qoder settings 非 hooks 键的 SSOT |
| `skills/` | （可选）vendored skills，分发到各工具 `skills/` 与 Codex `.agents/skills/` |
| `codex/rules/*.rules` | Codex Starlark 命令策略 → `.codex/rules/`（**不是** `.mdc` 镜像） |

### sync 分发摘要（0.5.1+ / Codex 0.6.9）

| 工具 | rules | hooks | MCP |
|---|---|---|---|
| cursor | `.cursor/rules/*.mdc` | `.cursor/hooks.json` | `.cursor/mcp.json` |
| qoder | `.qoder/rules/*.md` | `.qoder/settings.json` hooks | 根 `.mcp.json` |
| trae | `.trae/rules/*.md` | `.trae/hooks.json` | `.trae/mcp.json` |
| claude | `.claude/rules/*.md` | `.claude/settings.json` | 根 `.mcp.json` |
| workbuddy | `.codebuddy/rules/<stem>.md`（保留 FM） | `.codebuddy/settings.json` | 根 `.mcp.json` |
| codex | `.codex/rules/*.rules`（Starlark） | `.codex/hooks.json` + adapter | `.codex/config.toml.example` |
