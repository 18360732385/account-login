# feature-eng 摩擦记录 — 2026-09-21-user-register（monorepo）

> 只记 **同仓 FE+BE** 摩擦。跨仓 O15–O19 **本练习明确忽略/作废**。

## F1 — chef_mode 降级（O1 validated）
无厨师 skill → `controller_proxy`。

## F2 — 硬闸任务授权（O3 validated）
`authorized_by: user_task_2026-09-21-mono`，无伪造聊天。

## F3 — JDK 声明不一致（O4 validated）
runtime 21 / target 17；写入 env_notes。

## F4 — review_policy 降级（O5 validated）
无 Task → inline + 门禁清单。

## F5 — 中文过程态文件名（O6 validated）
回链 / 测试用例 / 设计笔记 / 门禁清单。

## F6 — close 双归档（O7 validated）
active→archive；Spec/Plan→superpowers/archive；徽章/README。

## F7 — api_base_mode / integration（O9/O14 validated）
同仓仍保留 proxy + CORS；preferred=proxy。jsdom 钉死（O11）；proto 轻量（O12）；memory 会话（O13）。

## F8 — **新** monorepo 布局字段缺失（→ M1）
progress 模板只有 `sibling_repos`，没有 `packages`/`layout`。本轮手写 `monorepo:` 非正式块，典礼无法校验「docs 在根而非 backend/docs」。

## F9 — **新** 同仓双命令 verify（→ M2）
Full verify 需同时 `mvn -f backend test` 与 `frontend` 下 npm；模板无 `verify_commands[]`，易只跑一边还标绿。

## F10 — **新** 单 Spec 覆盖 FE+BE 的章节约定（→ M3）
双仓时代靠 sibling + 消费契约节；同仓单 Spec 时「§API / §UI / §测试矩阵」无强制模板，容易漏一侧。

## F11 — **新** 根 README vs 子包 README 漂移（→ M4）
合并后根 README 成 SSOT，子包 README 易过期；close 无「根 README 含双端启动」检查。

## F12 — **新** 子包相对路径工作目录（→ M5）
agent 在 `/workspace/account-login` vs `backend/` vs `frontend/` 切换时，`mvn`/`npm` 工作目录易错；典礼未规定默认 cwd。

## F13 — **新** 合并时旧双仓 archive 污染（→ M6）
复制树时若把旧 `docs/runs` 带进子包，会与根典礼双源；本轮刻意剥离，但 feature-eng 无「monorepo bootstrap 剥离清单」。

## 非本轮（明确忽略）
O15–O19（跨仓顺序闸 / 双仓优化文档所有权 / sibling stage 等）— 已由 monorepo 合并 **supersede**，不作新证据。
