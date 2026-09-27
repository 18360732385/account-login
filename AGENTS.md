# account-login — AGENTS.md

> AI 协作总入口。分册约定见各模块 `AGENTS.md`；契约真相见 `docs/func|api|db|redis|jobs`（按已启用域）。

> **分册真相（避免三处漂移）**  
> - 后端 / 服务模块约定 → 对应分册 `**/AGENTS.md`（定位、编码、迁移、改动路径）  
> - 前端模块约定 → 前端分册 `AGENTS.md`（栈禁令、api-client 同步）  
> - **本文件只保留**：仓库命令、Never do（一句话 + Pn 回链）、Planning corpus 摘要、rules 索引；文档优先级见 alwaysApply `00`

## Critical

TODO(harness-eng): 写明本仓最易踩的构建/运行命令红线（例：必须在仓库根执行某工具）。

## Commands

| Task | Command |
|---|---|
| TODO | TODO(harness-eng): 填真实命令 |

## Repo structure

```text
account-login/
├── backend, frontend          # 见分册 AGENTS
├── docs/func|api|db|redis|jobs/  # 契约：索引 + 真相（按已启用域）
├── docs/agent-kb/           # architecture / pitfalls / accepted-gaps
├── docs/releases/           # 发版过程域（非契约 SSOT；若启用）
└── docs/superpowers/        # 规划语料（非 SSOT；若启用 L3）
```

## 给智能体的文档优先级

1. 本文件 — 命令与红线
2. 分册 `**/AGENTS.md`（按改动路径）
3. 宿主 rules / 必读索引（见下「Rules 索引」）— **Codex 不自动加载** `.cursor/rules/*.mdc`；须按索引 Read 或用 `.agents/skills`
4. `docs/func` → `docs/api` → `docs/db` → `docs/redis` → `docs/jobs`（先索引再真相；按已启用域）
5. `docs/agent-kb/` — 定向与踩坑回流（非契约 SSOT）
6. `docs/superpowers/README.md` — 仅进行中；不覆盖上列 SSOT
7. `docs/releases/` — 发版过程域（若启用；非契约 SSOT）

> **冲突裁决**：分册 AGENTS / 契约真相以**磁盘最新文件**为准；动手前 Read 重读，勿沿用会话早期摘要。

## 协作约定

- Commit / MR 标题与描述优先中文（可夹杂 `fix` / `docs` 等意图词）
- `docs/agent-kb/**` 文件名固定英文；规划文档文件名尽量中文

## 踩坑回流

时机见 alwaysApply `00`「交付收口」与 [agent-kb README](docs/agent-kb/README.md) **三问**；格式见 path rule `19`。  
根 Never do **只写一句话 + `→ Pn`**；现象 / 排障细节只写 [pitfalls](docs/agent-kb/pitfalls.md)，**勿双写**。新 `Pn` 须同步「路径速查」与「域速查」，并跑 `node scripts/agent-kb/lint-pitfalls.mjs`。

## Never do

> 红线**一句话**写在此；现象 / 排障细节以 [pitfalls](docs/agent-kb/pitfalls.md) 对应 `Pn` 为正文，**勿在两处各写细节**。格式：`一句话 → Pn`。

- Commit API keys、生产密码、含密配置
- 勿手改各宿主生成物（`.cursor/` / `.claude/` / `.trae/` 等 rules·hooks·mcp）；SSOT 为 `docs/agent-config/`（若 L5）→ 改后跑 sync
- TODO(harness-eng): 追加本仓域红线（鉴权、迁移、SSOT 边界等）— 格式：`一句话 → Pn`；**勿抄他仓业务条**

## Rules 索引

> 权威仍是本文件 + `docs/**`。下表只说明各宿主如何发现同步/行为约束。

**Cursor（若启用）：** alwaysApply `00-project-docs-overview` · `karpathy-guidelines`；path-scoped 见 `.cursor/rules/`（func/api/db/redis/jobs sync、agent-kb、superpowers 等）。

**Codex（若启用）：**
- 主指令：本文件 + 分册 AGENTS；**不要**期望 `.mdc` 自动注入
- 命令政策（非自然语言规范）：`.codex/rules/*.rules`（experimental）
- 触及契约/前端前优先用 `.agents/skills`：`contract-sync`（总览）、`api-doc-sync`、`db-doc-sync`、`redis-doc-sync`、`jobs-doc-sync`、`frontend-web`；再 Read `docs/**` 索引→真相
- MCP：trusted 后本机 `.codex/config.toml`（gitignore）← 审阅 `config.toml.example`；`/mcp` 验收；写库默认 `enabled=false`
- Hooks：`/hooks` 信任；fail-open；须含 `commandWindows`
