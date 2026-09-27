# 认证与账号（backend）功能资产

**对应目录**：`com.example.accountlogin`（`service/`、`security/`、`config/`）  
**模块根**：`backend/`（Spring Boot 3.3 · Java 17 · 无数据库，用户与吊销名单均为进程内内存）

### 服务类

| 类名 | 说明 | 所在路径 |
|---|---|---|
| `AuthService` | 账号业务编排：注册、登录、查询当前用户、登出、改密；把领域异常映射为 HTTP 状态 | `com.example.accountlogin.service.AuthService` |
| `DemoUserStore` | 演示用户内存仓（`ConcurrentHashMap`），预置 demo/admin，负责密码哈希与 tokenVersion 递增 | `com.example.accountlogin.service.DemoUserStore` |
| `TokenDenylist` | 按 JWT `jti` 记录已吊销 token 直到其过期（内存，重启失效） | `com.example.accountlogin.service.TokenDenylist` |
| `JwtService` | HS256 JWT 签发与解析（`jti` / `sub` / `tv` / `exp`） | `com.example.accountlogin.security.JwtService` |
| `DemoUser` | 用户不可变记录（用户名、BCrypt 哈希、显示名、tokenVersion、昵称、邮箱、注册时间） | `com.example.accountlogin.service.DemoUser` |
| `UserProfileService` | 个人资料编排：查询 / 修改昵称与邮箱；trim + 字段校验聚合为 `FieldValidationException`，邮箱冲突映射 409 | `com.example.accountlogin.service.UserProfileService` |
| `FieldValidationException` | 字段级校验异常（`Map<字段, 文案>`，保持插入顺序），由 `GlobalExceptionHandler` 转 400 `fieldErrors` | `com.example.accountlogin.service.FieldValidationException` |

### 数据实体 / 配置（按需）

| 实体或配置 | 说明 |
|---|---|
| `app.jwt.secret` | HS256 签名密钥（`application.yml` 为演示值，生产须用环境变量覆盖；≥256 bit） |
| `app.jwt.expiration-ms` | token 有效期毫秒，默认 3600000 |
| `JwtAuthenticationFilter` | 每请求解析 Bearer token；校验签名/过期 → denylist → `tv` 与用户当前 tokenVersion 一致才建立认证 |
| `SecurityConfig` | 无状态会话；放行 `POST /api/auth/login|register` 与 `/error`；401 入口点输出 `ErrorResponse(UNAUTHORIZED, 需要登录)`；CORS 允许 `localhost:5173` |
| `GlobalExceptionHandler` | `ResponseStatusException` → `ErrorResponse("<状态>", reason)`；Bean Validation 失败 / `FieldValidationException` → `ErrorResponse("BAD_REQUEST", 首个字段错误, fieldErrors)`；邮箱冲突 → 409 带 `fieldErrors.email` |

### 关联文档

| 类型 | 路径 |
|---|---|
| 关联 API | `docs/api/modules/01-account-login-auth.md`、`docs/api/modules/02-account-login-user.md` |
| 关联表 | 无（本仓无数据库；db 域未启用） |
| 前端调用 | `frontend/src/api/client.ts`、`frontend/AGENTS.md` |
| 索引 | `docs/func/func.md` |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | harness-eng fill-truths-agents 精填 5 个服务类方法清单，经 acceptance + fill-merge 合入 | 张健 | 2026-09-27 |
| v0.2 | 修改 | 新增 `UserProfileService` / `FieldValidationException`；`DemoUser` 增 nickname/email/createdAt；`DemoUserStore` 增 `updateProfile` / `resetProfile`（feature-eng 主题 2026-09-27-profile） | 张健 | 2026-09-27 |

---

## 1. JwtService

**evidence:** `backend/src/main/java/com/example/accountlogin/security/JwtService.java`

### 服务类

`JwtService`（`com.example.accountlogin.security.JwtService`）

基于 jjwt 0.12 的 HS256 签发/解析；密钥来自 `app.jwt.secret`，有效期来自 `app.jwt.expiration-ms`。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `String generateToken(String username, int tokenVersion)` | 签发 JWT：随机 UUID 作 jti，subject=用户名，claim `tv`=tokenVersion，带签发与过期时间 | 用户名、tokenVersion | 紧凑 JWT 字符串 |
| `String extractUsername(String token)` | 验签后读取 subject（用户名）；签名无效抛异常 | token | 用户名 |
| `String extractJti(String token)` | 读取标准 jti，缺失时回退自定义 `jti` claim | token | jti 或 null |
| `int extractTokenVersion(String token)` | 读取 `tv` claim，非数字时视为 0 | token | tokenVersion |
| `Instant extractExpiration(String token)` | 读取过期时间，供 denylist 保留期使用 | token | 过期时刻 |
| `boolean isValid(String token)` | 验签成功且未过期返回 true，任何解析异常返回 false | token | 是否有效 |
| `long getExpirationMs()` | 返回配置的有效期毫秒，填入登录响应 `expiresInMs` | 无 | 有效期毫秒 |

## 2. AuthService

**evidence:** `backend/src/main/java/com/example/accountlogin/service/AuthService.java`

### 服务类

`AuthService`（`com.example.accountlogin.service.AuthService`）

账号业务编排层；被 `AuthController` 调用，依赖 `DemoUserStore`、`PasswordEncoder`（BCrypt）、`JwtService`、`TokenDenylist`。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `LoginResponse register(RegisterRequest request)` | 注册新用户：trim 用户名后写入内存仓并立即签发 JWT；用户名冲突映射 409「用户名已存在」 | request：用户名（3–32）、密码（≥6） | Bearer 令牌 + 有效期 |
| `LoginResponse login(LoginRequest request)` | 校验用户名与 BCrypt 密码，成功按当前 tokenVersion 签发 JWT；用户不存在或密码错统一 401「用户名或密码错误」 | request：用户名、密码 | Bearer 令牌 + 有效期 |
| `MeResponse me(String username)` | 按已认证用户名查询资料；用户已被移除时 401「用户不存在」 | username：JWT subject | 用户名 + 显示名 |
| `MessageResponse logout(String rawToken)` | 吊销当前 token 的 jti（幂等，解析失败也视为成功） | rawToken：Bearer 原文 | 「已登出」 |
| `MessageResponse changePassword(String username, String rawToken, ChangePasswordRequest request)` | 校验新旧密码不同且旧密码正确后更新哈希、递增 tokenVersion 使旧 token 全失效，并吊销当前 jti | username、rawToken、旧/新密码 | 「密码已修改，请重新登录」 |

## 3. DemoUser

**evidence:** `backend/src/main/java/com/example/accountlogin/service/DemoUser.java`

### 服务类

`DemoUser`（`com.example.accountlogin.service.DemoUser`）

不可变 `record`；`tokenVersion` 嵌入 JWT `tv`，改密时递增以使旧 token 全部失效。`nickname` / `email` 可为 `null`（预置与新注册用户均为 `null`）；`createdAt` 为创建时刻（预置用户=进程启动时刻）。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `DemoUser(String username, String passwordHash, String displayName, int tokenVersion, String nickname, String email, Instant createdAt)` | 构造用户快照（record 规范构造器；字段只读，更新需整体替换） | 用户名、BCrypt 哈希、显示名、tokenVersion、昵称、邮箱、注册时间 | 用户记录 |

## 4. DemoUserStore

**evidence:** `backend/src/main/java/com/example/accountlogin/service/DemoUserStore.java`

### 服务类

`DemoUserStore`（`com.example.accountlogin.service.DemoUserStore`）

演示用户内存仓；构造时预置 `demo/demo123`（演示用户）与 `admin/admin123`（管理员）。改密会改写共享内存哈希，集成测试须用 `resetCredentials` 恢复；改资料须用 `resetProfile` 恢复。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `Optional<DemoUser> findByUsername(String username)` | 按用户名精确查找用户（区分大小写，不 trim） | username | 可空用户记录 |
| `DemoUser updatePassword(String username, String newRawPassword)` | 以 BCrypt 重新编码新密码并 tokenVersion+1；用户不存在抛 IllegalArgumentException | username、新密码明文 | 更新后的用户记录 |
| `void resetCredentials(String username, String rawPassword)` | 测试辅助：把密码重置为已知明文且 tokenVersion 归零 | username、明文密码 | 无 |
| `DemoUser register(String username, String rawPassword)` | 新建用户（显示名=用户名，tokenVersion=0）；重名抛 IllegalStateException | username、明文密码 | 新用户记录 |
| `void removeIfPresent(String username)` | 测试辅助：删除非预置用户（demo/admin 受保护不删） | username | 无 |
| `DemoUser updateProfile(String username, String nickname, String email)` | `synchronized`：邮箱非空时不区分大小写检查是否被**其他**用户占用（占用抛 IllegalStateException），通过后整体替换昵称与邮箱（入参为最终值，可为 null）；用户不存在抛 IllegalArgumentException | username、昵称、邮箱 | 更新后的用户记录 |
| `void resetProfile(String username)` | 测试辅助：把昵称与邮箱置 null（同 P2，集成测试改共享账号后恢复） | username | 无 |

## 5. TokenDenylist

**evidence:** `backend/src/main/java/com/example/accountlogin/service/TokenDenylist.java`

### 服务类

`TokenDenylist`（`com.example.accountlogin.service.TokenDenylist`）

服务端 JWT 吊销名单；键为 `jti`，值为保留截止时间（= token 过期时间）。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `void revoke(String jti, Instant expiresAt)` | 记录 jti 吊销直到过期（缺省 now+1h；取较晚者），顺带清理已过期条目；空 jti 忽略 | jti、过期时刻 | 无 |
| `boolean isRevoked(String jti)` | 判断 jti 是否仍在吊销期内；过期条目惰性删除并返回 false | jti | 是否已吊销 |


## 6. UserProfileService

**evidence:** `backend/src/main/java/com/example/accountlogin/service/UserProfileService.java`

### 服务类

`UserProfileService`（`com.example.accountlogin.service.UserProfileService`）

个人资料编排层；被 `UserController`（`/api/users/me`）调用，依赖 `DemoUserStore`。校验口径：昵称 trim 后按码点 1–20；邮箱 trim 后匹配 `^[^\s@]+@[^\s@]+\.[^\s@]+$` 且 ≤100 字符；字段缺省/`null` 不修改，空串清空。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `UserProfileResponse get(String username)` | 按已认证用户名查询资料；用户已被移除时 401「用户不存在」 | username：JWT subject | 用户名 + 昵称 + 邮箱 + 注册时间 |
| `UserProfileResponse update(String username, UpdateProfileRequest request)` | 逐字段 trim/校验，错误聚合抛 `FieldValidationException`（400）；调用 `DemoUserStore.updateProfile` 写入，邮箱被他人占用映射 409「该邮箱已被使用」（带 `fieldErrors.email`） | username、request：nickname?、email? | 更新后的资料 |
