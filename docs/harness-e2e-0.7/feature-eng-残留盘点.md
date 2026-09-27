# feature-eng 残留盘点（harness-eng 0.7.9 冷启动前）

- 日期：2026-09-27
- 分支：`harness-e2e-0.7`（自 `main@7c8b4f3`）
- 目的：在 V0.7.X `harness-eng` 多轮施工前，记录仓内 feature-eng（0.2.x）历史过程产物，便于第 5 阶段分析两 skill 的冲突 / 重叠。

## 盘点

| 路径 | 写入方 | 性质 | harness-eng 是否会读 / 写 |
|---|---|---|---|
| `docs/runs/README.md` | feature-eng（runs-README 模板） | 过程态索引 | 否（harness 无 runs 概念） |
| `docs/runs/archive/2026-09-21-user-register/`（`progress.yaml` / `回链.md` / `测试用例.md` / `测试报告.md` / `设计笔记.md` / `门禁清单.md` / `feature-eng-friction.md`） | feature-eng 控制器 + 子 skill | 已收口主题归档 | 否 |
| `docs/superpowers/README.md` · `ARCHIVE.md` · `archive/{specs,plans}/` | superpowers（经 feature-eng 调度）+ feature-eng close | 规划语料 | **是**：harness L3 `sp-readme` / `sp-archive` 模板会 merge 同一文件；detect 记 `S_SP` |
| `docs/requirements/*.md` | 人工 / 早期需求 | 业务需求 | 否（非契约域） |
| `docs/feature-eng-优化点.md` · `docs/feature-eng-优化点-monorepo.md` | 上一轮 skill 验证人工记录 | skill 元笔记（非本仓业务） | 否 |
| `docs/HISTORY-split-repos.md` | 人工 | 历史说明 | 否 |
| `.feature-eng*` 元文件 | — | **不存在** | — |
| 根 `AGENTS.md` / `.cursor/rules` / `docs/{func,api,db,redis,jobs}` / `docs/agent-kb` / hooks | — | **不存在** | harness 将新建 |

## 决策

**不清理，原地保留**（不做「chore：清理旧 feature-eng 过程产物」提交）。理由：

1. 仓内无任何 harness 指纹（无 AGENTS / rules / 契约目录 / agent-kb / hooks / harness-meta），残留不会让 detect 误判为 MATURE，harness 冷启动仍有意义。
2. 残留均为已收口过程态 / 规划语料，不影响业务代码与测试。
3. 保留可真实观察 harness 与 feature-eng 在 `docs/superpowers/`、`docs/agent-kb/pitfalls.md`、契约目录等共享区域的碰撞（第 5 阶段所需证据）。

唯一模糊点：detect.md 类型判定「PARTIAL = 有任一 harness 信号」，`S_SP=是` 时字面可判 PARTIAL；但 `scripts/lib/detect-signals.mjs` 不计 `S_SP`，且 superpowers 语料非 harness 产出，本轮按 **NEW_CODE_NO_HARNESS** 处理（详见验证日志）。
