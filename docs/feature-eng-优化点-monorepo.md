# feature-eng 优化点（monorepo 同仓 FE+BE）

> 证据：`docs/runs/archive/2026-09-21-user-register/feature-eng-friction.md`  
> 主题：用户注册 · `authorized_by: user_task_2026-09-21-mono` · Path F Full · **单仓** `backend/`+`frontend/`  
> **O15–O19（跨仓）**：本练习 **明确忽略 / supersede**，不重列。  
> 编号自 **M1** 起，专指同仓摩擦。

## 已验证（O1–O14，若踩中仅标 validated）

| 编号 | 本轮 | 说明 |
|---|---|---|
| O1 | ✅ | `chef_mode: controller_proxy` |
| O3 | ✅ | `user_task_2026-09-21-mono` |
| O4 | ✅ | JDK21 vs target 17；env_notes |
| O5 | ✅ | review_policy → inline |
| O6 | ✅ | 中文过程态文件名 |
| O7 | ✅ | close 双归档 runs + superpowers |
| O9 | ✅ | integration_ready cors\|proxy；preferred=proxy |
| O11 | ✅ | jsdom@24.1.3 钉死 |
| O12 | ✅ | proto → 设计笔记草图+3 步 |
| O13 | ✅ | 会话 memory |
| O14 | ✅ | api_base_mode=proxy |

未再触发：O2（非空仓绿地）、O8（刻意不用 sibling_repos）、O10。

## P0（净新增 M）

### M1 — monorepo layout / packages 一等字段
- **摩擦**：F8
- **问题**：progress 仅有 `sibling_repos`；同仓 `backend/`+`frontend/`+根 `docs/` 无 schema。Agent 只能手写 informal `monorepo:`，无法 lint「典礼是否误放在子包 docs」。
- **复现**：本轮 progress 增加非契约 `monorepo.packages`；若仍填 sibling_repos 指向本仓两目录会语义错误。
- **建议**：
  1. progress 增加可选 `layout: monorepo | multi_repo`
  2. `packages: [{ path, role: api|web|other }]`；`docs_root` 默认仓库根 `docs/`
  3. 当 `layout=monorepo` 时 **禁止** sibling_repos 指向同 remote

### M2 — 同仓多命令 verify 清单
- **摩擦**：F9
- **问题**：Full verify 须 `mvn -f backend test` **且** `frontend` npm test/build；模板无 `verify_commands[]`，易只跑一端仍写 verify 时间戳。
- **复现**：测试报告并列两行命令；缺一则注册 FE 或 BE 回归可能漏检。
- **建议**：
  1. progress.env_notes.verify_commands: string[]
  2. verify L1：每条命令 exit 0 才允许写 gates.verify
  3. QUICKSTART 增加 monorepo 双端验收示例

## P1

### M3 — 单 Spec 的 FE+BE 强制章节
- **摩擦**：F10
- **问题**：双仓靠「消费契约」节；同仓单 Spec 无强制 `## API` / `## UI` / `## 测试矩阵`，易漏一侧仍过 design_confirmed。
- **建议**：artifacts Spec 模板增加 monorepo profile 章节 checklist；L1 勾选两侧路径存在（如 `backend/src/...` 与 `frontend/src/...` 变更或声明）

### M4 — 根 README 双端启动 SSOT 闸
- **摩擦**：F11
- **问题**：合并后根 README 负责「两端怎么跑」；子包 README 易漂移。close 无检查根 README 含 backend+frontend 启动。
- **建议**：close L1：`README.md` 含 `backend` 与 `frontend` 启动命令；子包 README 仅短链到根

### M5 — 默认工作目录 / `-f` 与 `cd` 约定
- **摩擦**：F12
- **问题**：仓库根 vs `backend/` vs `frontend/`；`mvn -f backend` 与 `cd frontend && npm` 混用，典礼未规定默认 cwd。
- **建议**：env_notes.workdir_policy: `repo_root`；所有文档命令从根书写；CLI selfcheck 抽测相对根的路径

## P2

### M6 — monorepo bootstrap 剥离旧双仓 archive
- **摩擦**：F13
- **问题**：从旧仓 `cp` 树时易带入子包 `docs/runs`，与根典礼双源。
- **建议**：start/init 增加 `monorepo_bootstrap` 清单：剥离子包 docs/runs|superpowers；可选 `docs/HISTORY-split-repos.md` 指针

## 主题归纳（给父代理）

**再次验证**：O1/O3–O7/O9/O11–O14。

**O15–O19**：out of scope / superseded by merge。

**净新增（M1+）**：
1. **monorepo layout 字段**（M1，P0）
2. **多命令 verify**（M2，P0）
3. **单 Spec FE+BE 章节**（M3，P1）
4. **根 README SSOT**（M4，P1）
5. **workdir 约定**（M5，P1）
6. **bootstrap 剥离旧 archive**（M6，P2）
