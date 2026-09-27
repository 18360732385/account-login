---
name: jobs-doc-sync
description: >-
  改 Cron / Scheduler / task 开关前先读 docs/jobs 真相并回写 tasks/。
  Codex 不加载 .mdc 时用本 skill；触及定时任务、Registry、调度配置时使用。
---

# 定时任务文档同步（jobs-doc-sync）

> 权威：`docs/jobs/tasks/`；索引 `docs/jobs/jobs.md` 非 SSOT。  
> 调度契约以 jobs 为准；func/api 只保留业务与 REST，Cron 细节回链 jobs。  
> 总览纪律见 skill `contract-sync`。

## 读序

1. `docs/jobs/jobs.md`（索引）
2. `docs/jobs/tasks/NN-*.md`（任务真相）
3. 模板：`docs/jobs/templates/`（若存在）

## 须同步时

增删/重命名 task；改 Cron、enable 语义、默认参数、触发面、锁/错峰约定。

## 禁止

- 只读索引就改 Scheduler / Cron / Registry
- 把完整 Cron 表或默认参数表写回 `jobs.md`（错峰总览除外）
- 用含 `:` 的 task_code 做真相文件名；新建真相省略序号前缀
