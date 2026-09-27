# backend — AI 协作规范（Spring 后端分册）

> 本文件供 AI 在 `backend/` 下工作时遵循（**分册厚 SSOT**）。  
> 仓库命令与红线见根 [AGENTS.md](../AGENTS.md)。根文件不写本模块编码细则。

## 模块定位

| 项 | 说明 |
|---|---|
| 职责 | TODO(harness-eng): 账号登录全栈示例：Spring Boot 3 JWT API（backend/）+ Vite React TS UI（frontend/） |
| 边界 | **仅后端**；前端 / 静态资源勿放本模块 |
| 入口类 | TODO(harness-eng): `Application` 全限定类名 |
| API 前缀 / 端口 | TODO(harness-eng) |
| 数据库 | TODO(harness-eng): 按 profile 配置；以 `application-{profile}.yml` 的 datasource 为准 |

### 各环境库名（骨架）

| Profile | 配置文件 | MySQL 库名 |
|---|---|---|
| local / dev / test / uat / … | TODO(harness-eng) | TODO(harness-eng): 勿硬编码单一库名 |

## 构建纪律（Maven）

- Maven 命令**必须在仓库根**执行（`${revision}` 等只从根解析）
- 构建 / 测试可用 `-am` 带依赖模块；**`spring-boot:run` 禁止 `-am`**（父 POM 无 mainClass）

```bash
mvn -pl backend -am test
mvn -pl backend spring-boot:run -Dspring-boot.run.profiles=dev
```

## 动手前检查

1. 读根 AGENTS 与本分册
2. 改业务：`docs/func` 索引 → 真相
3. 改接口：`docs/api` 索引 → 真相
4. 改表 / Redis / Cron：对应 `docs/db` / `docs/redis` / `docs/jobs`
5. 在**仓库根**执行上表 Maven 命令

## 目录与职责

```text
TODO(harness-eng): 列出 controller / service / domain / infrastructure / resources 等与一句话职责
```

**分层约定**：Controller → Service → Mapper/Infrastructure；业务编排优先在 Service 扩展。

## 编码约束（骨架）

- 统一响应包装 / 业务异常码：TODO(harness-eng) 按仓内现有类型
- 用户上下文经仓内上下文持有者获取，**禁止**硬编码 userId
- 鉴权注解 / 拦截器：TODO(harness-eng)
- 日志与中文注释：若装 rule `21`（`21-observability-comments.mdc`）以其为准
- TODO(harness-eng): 本模块特有编码红线（一句话；细节 → Pn）

## 库表迁移

- 迁移模式：TODO(harness-eng): flyway / manual_sql / none（与 `docs/db/db.md` 声明一致）
- **禁止**修改已发布迁移脚本；新变更只追加下一版本
- manual_sql 模式：发版 / 新环境须人工按序执行；勿伪造 `flyway_schema_history`
- 版本号 SSOT：TODO(harness-eng): 迁移目录与命名约定（勿采信 plan 正文「当前最高 Vn」）

## 改动路径速查

| 需求 | 优先改动 |
|---|---|
| 新业务能力 | TODO(harness-eng): service 包 + `docs/func/modules/…` |
| 新 / 改 REST | TODO(harness-eng): `…/controller` + `docs/api/modules/…` |
| 表结构 | migration / entity + `docs/db/table/…` |
| Redis Key | cache/redis 包 + `docs/redis/keys/…` |
| 定时任务 | scheduler + `docs/jobs/tasks/…` |

## 禁止事项

> 一句话在此；细节回链 `docs/agent-kb/pitfalls.md` 的 `Pn`。

- 提交密钥 / `application-secret.yml`
- 无文档同步地变更公开契约
- `mvn -pl backend -am spring-boot:run`（正确：不加 `-am`；Maven 必须在仓库根）
- TODO(harness-eng): 域禁令 → Pn

## 文档同步门禁（交付必做）

| 变更类型 | 必须同步 |
|---|---|
| 业务能力 | `docs/func/modules/…` |
| REST / API | `docs/api/modules/…` |
| 表结构 | `docs/db/table/…` |
| Redis Key | `docs/redis/keys/…` |
| Cron / 定时任务 | `docs/jobs/tasks/…` |
