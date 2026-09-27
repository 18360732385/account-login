# backend — AI 协作规范（Spring 后端分册）

> 本文件供 AI 在 `backend/` 下工作时遵循（**分册厚 SSOT**）。  
> 仓库命令与红线见根 [AGENTS.md](../AGENTS.md)。根文件不写本模块编码细则。

## 模块定位

| 项 | 说明 |
|---|---|
| 职责 | 账号 REST API：注册 / 登录 / 当前用户 / 登出 / 改密 / 个人资料（查询与修改昵称、邮箱）；JWT（HS256）签发与吊销 |
| 边界 | **仅后端**；前端 / 静态资源勿放本模块 |
| 入口类 | `com.example.accountlogin.AccountLoginApplication` |
| API 前缀 / 端口 | `/api`（`AuthController @RequestMapping("/api")`、`UserController @RequestMapping("/api/users")`）· `:8080`（`application.yml server.port`） |
| 数据库 | **无**：用户存 `DemoUserStore`（内存 `ConcurrentHashMap`），吊销名单存 `TokenDenylist`（内存）；无 profile 文件 |

### 配置项（`src/main/resources/application.yml`，唯一配置文件）

| 键 | 说明 |
|---|---|
| `app.jwt.secret` | HS256 密钥（演示值；生产必须用环境变量 `APP_JWT_SECRET` 覆盖，≥32 字节） |
| `app.jwt.expiration-ms` | token 有效期毫秒（默认 3600000） |

## 构建纪律（Maven）

- 本仓**无根 pom / 非多模块**：`backend/pom.xml` 是独立工程（parent = `spring-boot-starter-parent 3.3.4`，Java 17）
- 在仓库根用 `-f backend`，或 `cd backend` 后直接 `mvn`；**禁止** `-pl backend -am` → P1

```bash
mvn -q -f backend test
mvn -f backend spring-boot:run
```

## 动手前检查

1. 读根 AGENTS 与本分册
2. 改业务：`docs/func` 索引 → 真相
3. 改接口：`docs/api` 索引 → 真相
4. 改表 / Redis / Cron：对应 `docs/db` / `docs/redis` / `docs/jobs`
5. 按上表用 `mvn -f backend …` 跑测试（`AuthApiIntegrationTest` 覆盖 5 个认证接口，`UserProfileApiIntegrationTest` 覆盖 2 个资料接口）

## 目录与职责

```text
com.example.accountlogin
├── AccountLoginApplication        # Spring Boot 入口
├── config/SecurityConfig          # 无状态安全链、放行名单、401 入口点、CORS(:5173)、BCrypt
├── controller/AuthController      # /api 下 5 个 REST 端点
├── controller/UserController      # /api/users/me GET/PUT 个人资料
├── controller/GlobalExceptionHandler  # ResponseStatusException / 校验失败 / FieldValidationException / 邮箱冲突 → ErrorResponse(+fieldErrors)
├── dto/                           # record DTO：*Request（带 Bean Validation；UpdateProfileRequest 在 Service 内校验）/ *Response / ErrorResponse(code,message,fieldErrors?)
├── security/JwtService            # HS256 签发/解析（jti、sub、tv、exp）
├── security/JwtAuthenticationFilter   # Bearer 解析 → denylist → tokenVersion 校验
├── security/JwtProperties         # app.jwt.* 绑定
└── service/                       # AuthService / UserProfileService 编排；FieldValidationException；DemoUserStore / TokenDenylist 内存存储；DemoUser record
src/test/java/.../AuthApiIntegrationTest         # MockMvc 认证全链路集成测试
src/test/java/.../UserProfileApiIntegrationTest  # MockMvc 个人资料集成测试（@AfterEach resetProfile）
```

**分层约定**：Controller（薄，只取 `Authentication` 与 DTO）→ `AuthService` / `UserProfileService`（编排 + 异常映射）→ `DemoUserStore` / `TokenDenylist` / `JwtService`。

## 编码约束（骨架）

- 统一响应：**无外壳**，成功直接返回 DTO；错误统一 `ErrorResponse(code, message)`——业务错误抛 `ResponseStatusException(HttpStatus, 中文 reason)`，由 `GlobalExceptionHandler` 转换（`code` = `"409 CONFLICT"` 形式）
- 当前用户经 `Authentication.getName()`（JWT `sub`）获取，原始 token 经 `getCredentials()`；**禁止**从请求体取用户名做鉴权
- 鉴权：`SecurityConfig` 白名单（`POST /api/auth/login|register`、`/error`）+ `JwtAuthenticationFilter`；新增公开端点必须显式加入 `requestMatchers(...).permitAll()`
- 日志与中文注释：若装 rule `21`（`21-observability-comments.mdc`）以其为准
- 使旧 token 失效用 `tokenVersion` 递增（全量）+ `TokenDenylist.revoke(jti)`（单个），不要另建会话表
- DTO 用 Java `record` + `jakarta.validation` 注解，错误文案中文且与前端提示一致
- 需「先 trim 再校验」或多字段聚合的校验放 Service，抛 `FieldValidationException(Map<字段, 文案>)` → 400 `fieldErrors`（见 `UserProfileService`）

## 库表迁移

- 迁移模式：**none**（本仓无数据库，db 域未启用）
- 若未来引入持久化：先启用 harness `db` 域（`docs/db/`）并选 flyway / manual_sql，再改 `DemoUserStore`

## 改动路径速查

| 需求 | 优先改动 |
|---|---|
| 新业务能力 | `service/`（编排进 `AuthService` 或新 Service）+ `docs/func/modules/01-account-login-backend.md` |
| 新 / 改 REST | `controller/AuthController` + `dto/` + `SecurityConfig`（公开端点）+ `docs/api/modules/01-account-login-auth.md` + `frontend/src/api/` |
| 鉴权 / token 规则 | `security/` + `config/SecurityConfig` + api 真相「公共约定」 |
| 错误码 / 文案 | `GlobalExceptionHandler` / `AuthService` + api 真相「错误与边界」 + 前端组件提示 |
| 个人资料字段 / 校验 | `service/UserProfileService` + `DemoUserStore.updateProfile` + `docs/api/modules/02-account-login-user.md` + `frontend/src/components/ProfilePage.tsx`（前端同口径校验） |
| 测试 | `src/test/java/.../AuthApiIntegrationTest`（改密类用例须恢复账号）· `UserProfileApiIntegrationTest`（改资料须 `resetProfile`） |

## 禁止事项

> 一句话在此；细节回链 `docs/agent-kb/pitfalls.md` 的 `Pn`。

- 提交密钥 / `application-secret.yml`
- 无文档同步地变更公开契约
- `mvn -pl backend -am spring-boot:run`（正确：不加 `-am`；Maven 必须在仓库根）
- 改密 / 注册 / 改资料类测试不清理内存仓 → P2
- REST 变更不同步 api 真相与前端类型 → P4
- 日志或响应中输出 JWT 原文 / 演示密钥 → P5

## 文档同步门禁（交付必做）

| 变更类型 | 必须同步 |
|---|---|
| 业务能力 | `docs/func/modules/…` |
| REST / API | `docs/api/modules/…` |
| 前端消费（字段 / 路径 / 错误文案） | `frontend/src/api/client.ts` · `types.ts` |
