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
| `DemoUser` | 用户不可变记录（用户名、BCrypt 哈希、显示名、tokenVersion） | `com.example.accountlogin.service.DemoUser` |

### 数据实体 / 配置（按需）

| 实体或配置 | 说明 |
|---|---|
| `app.jwt.secret` | HS256 签名密钥（`application.yml` 为演示值，生产须用环境变量覆盖；≥256 bit） |
| `app.jwt.expiration-ms` | token 有效期毫秒，默认 3600000 |
| `JwtAuthenticationFilter` | 每请求解析 Bearer token；校验签名/过期 → denylist → `tv` 与用户当前 tokenVersion 一致才建立认证 |
| `SecurityConfig` | 无状态会话；放行 `POST /api/auth/login|register` 与 `/error`；401 入口点输出 `ErrorResponse(UNAUTHORIZED, 需要登录)`；CORS 允许 `localhost:5173` |
| `GlobalExceptionHandler` | `ResponseStatusException` → `ErrorResponse("<状态>", reason)`；校验失败 → `ErrorResponse("BAD_REQUEST", 首个字段错误)` |

### 关联文档

| 类型 | 路径 |
|---|---|
| 关联 API | `docs/api/modules/01-account-login-auth.md` |
| 关联表 | 无（本仓无数据库；db 域未启用） |
| 前端调用 | `frontend/src/api/client.ts`、`frontend/AGENTS.md` |
| 索引 | `docs/func/func.md` |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | harness-eng fill-truths-agents 精填 5 个服务类方法清单，经 acceptance + fill-merge 合入 | 张健 | 2026-09-27 |

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

不可变 `record`；`tokenVersion` 嵌入 JWT `tv`，改密时递增以使旧 token 全部失效。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `DemoUser(String username, String passwordHash, String displayName, int tokenVersion)` | 构造用户快照（record 规范构造器；字段只读，更新需整体替换） | 用户名、BCrypt 哈希、显示名、tokenVersion | 用户记录 |

## 4. DemoUserStore

**evidence:** `backend/src/main/java/com/example/accountlogin/service/DemoUserStore.java`

### 服务类

`DemoUserStore`（`com.example.accountlogin.service.DemoUserStore`）

演示用户内存仓；构造时预置 `demo/demo123`（演示用户）与 `admin/admin123`（管理员）。改密会改写共享内存哈希，集成测试须用 `resetCredentials` 恢复。

### 方法清单

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `Optional<DemoUser> findByUsername(String username)` | 按用户名精确查找用户（区分大小写，不 trim） | username | 可空用户记录 |
| `DemoUser updatePassword(String username, String newRawPassword)` | 以 BCrypt 重新编码新密码并 tokenVersion+1；用户不存在抛 IllegalArgumentException | username、新密码明文 | 更新后的用户记录 |
| `void resetCredentials(String username, String rawPassword)` | 测试辅助：把密码重置为已知明文且 tokenVersion 归零 | username、明文密码 | 无 |
| `DemoUser register(String username, String rawPassword)` | 新建用户（显示名=用户名，tokenVersion=0）；重名抛 IllegalStateException | username、明文密码 | 新用户记录 |
| `void removeIfPresent(String username)` | 测试辅助：删除非预置用户（demo/admin 受保护不删） | username | 无 |

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

