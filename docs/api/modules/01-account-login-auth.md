# 认证与账号接口（AuthController）

**对应 Controller**：`backend/src/main/java/com/example/accountlogin/controller/AuthController.java`（`@RequestMapping("/api")`）  
**对应 Service**：`AuthService`（`backend/src/main/java/com/example/accountlogin/service/AuthService.java`）  
**前端调用方**：`frontend/src/api/client.ts`（类型见 `frontend/src/api/types.ts`）

### 公共约定

| 项 | 约定 |
|---|---|
| 鉴权 | 除 `POST /api/auth/login`、`POST /api/auth/register` 外均需 `Authorization: Bearer <accessToken>`（`SecurityConfig`） |
| 成功响应 | **无统一外壳**：直接返回 DTO（`LoginResponse` / `MeResponse` / `MessageResponse`），HTTP 200 |
| 错误响应 | `ErrorResponse { code, message }`；`ResponseStatusException` → `code` 为 `"<HTTP 状态> <原因短语>"`（如 `409 CONFLICT`）；Bean Validation 失败 → `code=BAD_REQUEST`；未认证 → HTTP 401 `code=UNAUTHORIZED`、`message=需要登录` |
| Token 失效 | JWT 携带 `jti` 与 `tv`（tokenVersion）；登出/改密把 `jti` 写入内存 `TokenDenylist`；改密递增 `tokenVersion` 使旧 token 全部失效 |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | harness-eng fill-truths-agents 精填 5 个接口（注册/登录/me/登出/改密），经 acceptance + fill-merge 合入 | 张健 | 2026-09-27 |

---

## 1. 用户注册

**功能描述：** 未登录访客在注册页提交用户名与密码创建新账号，注册成功后直接获得与登录一致的 Bearer JWT（免二次登录）。  
**接口地址：** `/api/auth/register`  
**请求方式：** POST  
**适用范围：** 普通 CRUD  
**evidence:** `backend/src/main/java/com/example/accountlogin/controller/AuthController.java#register`

### 前置条件
- 无需鉴权（`SecurityConfig` permitAll）
- 用户存储为进程内内存 `DemoUserStore`，重启后注册用户丢失

### 功能逻辑
1. `@Valid` 校验 `RegisterRequest`：`username` 非空且长度 3–32，`password` 非空且至少 6 位；失败返回 400 `BAD_REQUEST`，`message` 为首个字段错误文案。
2. `AuthService.register` 对 `username` 做 `trim()` 后调用 `DemoUserStore.register`；用户名已存在时抛 `IllegalStateException`，映射为 409 `用户名已存在`。
3. 新用户密码经 BCrypt 编码写入内存仓，`displayName` 默认等于用户名，`tokenVersion=0`。
4. `JwtService.generateToken(username, 0)` 签发 HS256 JWT（含 `jti`、`tv`、过期时间 `app.jwt.expiration-ms`），返回 `LoginResponse.bearer`。

### 请求参数

```json
{ "username": "alice", "password": "secret123" }
```

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| username | string | 是 | 注册用户名 | — | 3–32 位；服务端会 trim 首尾空白 | alice |
| password | string | 是 | 登录密码明文 | — | 至少 6 位；服务端 BCrypt 存储 | secret123 |

### 响应参数

```json
{ "accessToken": "eyJhbGciOiJIUzI1NiJ9...", "tokenType": "Bearer", "expiresInMs": 3600000 }
```

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| accessToken | string | 是 | JWT 访问令牌 | — | 后续请求放 `Authorization: Bearer` | eyJhbGciOiJIUzI1NiJ9... |
| tokenType | string | 是 | 令牌类型 | `Bearer` | 固定值 | Bearer |
| expiresInMs | long | 是 | 令牌有效期毫秒数 | — | 来自 `app.jwt.expiration-ms` | 3600000 |

### 错误与边界
| 场景 | 处理方式 | 说明 |
|---|---|---|
| 字段校验失败 | 400 `{code:"BAD_REQUEST"}` | message 如 `用户名长度须为 3–32` / `密码至少 6 位` |
| 用户名已存在 | 409 `{code:"409 CONFLICT", message:"用户名已存在"}` | 含预置 `demo` / `admin` |

### 联调示例
```bash
curl -X POST 'http://localhost:8080/api/auth/register' -H 'Content-Type: application/json' -d '{"username":"alice","password":"secret123"}'
```

## 2. 用户登录

**功能描述：** 已注册用户在登录页提交用户名与密码换取 Bearer JWT，用于访问需鉴权的账号接口。  
**接口地址：** `/api/auth/login`  
**请求方式：** POST  
**适用范围：** 普通 CRUD  
**evidence:** `backend/src/main/java/com/example/accountlogin/controller/AuthController.java#login`

### 前置条件
- 无需鉴权；演示账号 `demo`、`admin`（见根 README）

### 功能逻辑
1. `@Valid` 校验 `LoginRequest`：`username`、`password` 均非空，否则 400 `BAD_REQUEST`。
2. `DemoUserStore.findByUsername` 查不到用户 → 401 `用户名或密码错误`（不区分用户不存在与密码错，防枚举）。
3. `PasswordEncoder.matches` 比对 BCrypt 哈希，不匹配同样 401 `用户名或密码错误`。
4. 以用户当前 `tokenVersion` 签发 JWT 并返回 `LoginResponse`。

### 请求参数

```json
{ "username": "demo", "password": "demo123" }
```

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| username | string | 是 | 登录用户名 | — | 不做 trim | demo |
| password | string | 是 | 登录密码明文 | — | — | demo123 |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| accessToken | string | 是 | JWT 访问令牌 | — | 含 `jti`、`tv` claim | eyJhbGciOiJIUzI1NiJ9... |
| tokenType | string | 是 | 令牌类型 | `Bearer` | 固定值 | Bearer |
| expiresInMs | long | 是 | 令牌有效期毫秒数 | — | — | 3600000 |

### 错误与边界
| 场景 | 处理方式 | 说明 |
|---|---|---|
| 字段为空 | 400 `BAD_REQUEST` | `username 不能为空` / `password 不能为空` |
| 用户不存在或密码错误 | 401 `{code:"401 UNAUTHORIZED", message:"用户名或密码错误"}` | 统一文案 |

### 联调示例
```bash
curl -X POST 'http://localhost:8080/api/auth/login' -H 'Content-Type: application/json' -d '{"username":"demo","password":"demo123"}'
```

## 3. 查询当前用户

**功能描述：** 已登录用户在个人资料页用 JWT 查询自己的用户名与显示名，前端据此判断登录态是否仍有效。  
**接口地址：** `/api/me`  
**请求方式：** GET  
**适用范围：** 普通 CRUD  
**evidence:** `backend/src/main/java/com/example/accountlogin/controller/AuthController.java#me`

### 前置条件
- 需 `Authorization: Bearer <accessToken>`；token 须未过期、`jti` 未被吊销、`tv` 与用户当前 `tokenVersion` 一致（`JwtAuthenticationFilter`）

### 功能逻辑
1. `JwtAuthenticationFilter` 校验签名与过期；若 `jti` 在 `TokenDenylist` 或 `tv` 与用户 `tokenVersion` 不一致，则不建立认证，由入口点返回 401 `需要登录`。
2. 认证通过后 `AuthService.me(authentication.getName())` 按用户名查内存仓；用户已不存在 → 401 `用户不存在`。
3. 返回 `MeResponse(username, displayName)`。

### 请求参数

无请求体；仅请求头。

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| Authorization | header string | 是 | Bearer 访问令牌 | — | 格式 `Bearer <jwt>` | Bearer eyJhbGciOiJIUzI1NiJ9... |

### 响应参数

```json
{ "username": "demo", "displayName": "演示用户" }
```

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| username | string | 是 | 当前登录用户名 | — | 即 JWT `sub` | demo |
| displayName | string | 是 | 用户显示名 | — | 预置用户为中文名；注册用户默认等于用户名 | 演示用户 |

### 错误与边界
| 场景 | 处理方式 | 说明 |
|---|---|---|
| 无 token / token 无效 / 已吊销 / 版本过期 | 401 `{code:"UNAUTHORIZED", message:"需要登录"}` | 由 `SecurityConfig` 入口点输出 |

### 联调示例
```bash
curl 'http://localhost:8080/api/me' -H 'Authorization: Bearer <token>'
```

## 4. 退出登录

**功能描述：** 已登录用户点击「退出」时吊销当前 JWT（服务端 denylist），使该 token 立即不可再用；接口幂等。  
**接口地址：** `/api/auth/logout`  
**请求方式：** POST  
**适用范围：** 普通 CRUD  
**evidence:** `backend/src/main/java/com/example/accountlogin/controller/AuthController.java#logout`

### 前置条件
- 需有效 Bearer token（否则 401 `需要登录`，不进入业务逻辑）

### 功能逻辑
1. Controller 从 `Authentication.getCredentials()` 取原始 token 字符串。
2. `AuthService.logout` → `revokeToken`：token 为空则跳过；否则解析 `jti` 与过期时间写入 `TokenDenylist`（保留到 token 过期，顺带清理已过期项）。
3. 解析异常被吞掉（登出视为成功，幂等），返回 `{"message":"已登出"}`。

### 请求参数

无请求体。

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| Authorization | header string | 是 | 待吊销的 Bearer 令牌 | — | 同时用于鉴权 | Bearer eyJhbGciOiJIUzI1NiJ9... |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| message | string | 是 | 操作结果提示 | — | 固定文案 | 已登出 |

### 错误与边界
| 场景 | 处理方式 | 说明 |
|---|---|---|
| token 已吊销后再次调用 | 401 `需要登录` | 过滤器阶段即拒绝 |
| 进程重启 | denylist 丢失 | 内存实现；未过期旧 token 重新可用（演示限制） |

### 联调示例
```bash
curl -X POST 'http://localhost:8080/api/auth/logout' -H 'Authorization: Bearer <token>'
```

## 5. 修改密码

**功能描述：** 已登录用户在修改密码页提交旧密码与新密码完成改密，成功后该用户所有旧 JWT 失效，需重新登录。  
**接口地址：** `/api/auth/change-password`  
**请求方式：** POST  
**适用范围：** 普通 CRUD  
**evidence:** `backend/src/main/java/com/example/accountlogin/controller/AuthController.java#changePassword`

### 前置条件
- 需有效 Bearer token

### 功能逻辑
1. `@Valid` 校验 `ChangePasswordRequest`：`oldPassword` 非空；`newPassword` 非空且至少 6 位，否则 400 `BAD_REQUEST`。
2. 新旧密码相同 → 400 `新密码不能与旧密码相同`。
3. 查当前用户（不存在 → 401 `用户不存在`）；BCrypt 比对旧密码失败 → 400 `旧密码不正确`。
4. `DemoUserStore.updatePassword` 写入新哈希并 `tokenVersion + 1`（所有旧 token 因 `tv` 不匹配失效）。
5. 同时把当前 token 的 `jti` 写入 `TokenDenylist`，返回 `{"message":"密码已修改，请重新登录"}`。

### 请求参数

```json
{ "oldPassword": "demo123", "newPassword": "newpass456" }
```

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| oldPassword | string | 是 | 当前密码明文 | — | 与存储哈希比对 | demo123 |
| newPassword | string | 是 | 新密码明文 | — | 至少 6 位；不得与旧密码相同 | newpass456 |

### 响应参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| message | string | 是 | 操作结果提示 | — | 前端据此提示并清除本地 token | 密码已修改，请重新登录 |

### 错误与边界
| 场景 | 处理方式 | 说明 |
|---|---|---|
| 新密码过短 / 字段为空 | 400 `BAD_REQUEST` | `新密码至少 6 位` 等 |
| 新旧密码相同 | 400 `400 BAD_REQUEST` | `新密码不能与旧密码相同` |
| 旧密码错误 | 400 `400 BAD_REQUEST` | `旧密码不正确` |

### 联调示例
```bash
curl -X POST 'http://localhost:8080/api/auth/change-password' -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"oldPassword":"demo123","newPassword":"newpass456"}'
```

