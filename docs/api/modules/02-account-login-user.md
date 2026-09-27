# 用户资料接口（UserController）

**对应 Controller**：`backend/src/main/java/com/example/accountlogin/controller/UserController.java`（`@RequestMapping("/api/users")`）  
**对应 Service**：`UserProfileService`（`backend/src/main/java/com/example/accountlogin/service/UserProfileService.java`）  
**前端调用方**：`frontend/src/api/client.ts`（`fetchProfile` / `updateProfile`；类型见 `frontend/src/api/types.ts`）

### 公共约定

| 项 | 约定 |
|---|---|
| 鉴权 | 两个接口均需 `Authorization: Bearer <accessToken>`（`SecurityConfig` `anyRequest().authenticated()`）；token 校验规则同 [01 公共约定](./01-account-login-auth.md) |
| 当前用户 | 取自 `Authentication.getName()`（JWT `sub`）；**不**从请求体取用户名，用户名不可修改 |
| 成功响应 | 无外壳，直接返回 `UserProfileResponse`，HTTP 200 |
| 错误响应 | `ErrorResponse { code, message, fieldErrors? }`；`fieldErrors` 为 `{字段名: 中文文案}`，仅字段校验失败（400）与邮箱冲突（409）时出现，其余错误省略该键 |
| 存储 | 进程内内存 `DemoUserStore`；重启后资料丢失；已有用户（预置 demo/admin）`nickname`、`email` 初始为 `null`，`createdAt` 为进程启动时刻 |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 新增个人资料查询 / 修改 2 个接口（feature-eng 主题 2026-09-27-profile） | 张健 | 2026-09-27 |

---

## 1. 查询个人资料

**功能描述：** 已登录用户进入「个人资料」页时查询自己的用户名、昵称、邮箱与注册时间，不返回密码哈希等敏感字段。  
**接口地址：** `/api/users/me`  
**请求方式：** GET  
**适用范围：** 普通 CRUD  
**evidence:** `backend/src/main/java/com/example/accountlogin/controller/UserController.java#getMe`

### 前置条件
- 需有效 Bearer token（未过期、`jti` 未吊销、`tv` 与当前 `tokenVersion` 一致）

### 功能逻辑
1. `JwtAuthenticationFilter` 建立认证；失败由入口点返回 401 `需要登录`。
2. `UserProfileService.get(username)` 按 JWT `sub` 查内存仓；用户已不存在 → 401 `用户不存在`。
3. 映射为 `UserProfileResponse(username, nickname, email, createdAt)` 返回（不含 `passwordHash`、`displayName`、`tokenVersion`）。

### 请求参数

无请求体；仅请求头。

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| Authorization | header string | 是 | Bearer 访问令牌 | — | 格式 `Bearer <jwt>` | Bearer eyJhbGciOiJIUzI1NiJ9... |

### 响应参数

```json
{ "username": "demo", "nickname": "小明", "email": "demo@example.com", "createdAt": "2026-09-27T13:00:00.123Z" }
```

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| username | string | 是 | 用户名 | — | 只读，不可修改 | demo |
| nickname | string \| null | 是 | 昵称 | — | 未设置时为 `null` | 小明 |
| email | string \| null | 是 | 邮箱 | — | 未设置时为 `null` | demo@example.com |
| createdAt | string | 是 | 注册时间 | — | ISO-8601 UTC（`Instant`）；预置用户为进程启动时刻 | 2026-09-27T13:00:00.123Z |

### 错误与边界
| 场景 | 处理方式 | 说明 |
|---|---|---|
| 无 token / token 无效 / 已吊销 / 版本过期 | 401 `{code:"UNAUTHORIZED", message:"需要登录"}` | 由 `SecurityConfig` 入口点输出 |
| 用户已从内存仓移除 | 401 `{code:"401 UNAUTHORIZED", message:"用户不存在"}` | — |

### 联调示例
```bash
curl 'http://localhost:8080/api/users/me' -H 'Authorization: Bearer <token>'
```

## 2. 修改个人资料

**功能描述：** 已登录用户在「个人资料」页修改自己的昵称与邮箱；字段缺省表示不修改，空串表示清空；成功返回更新后的资料。  
**接口地址：** `/api/users/me`  
**请求方式：** PUT  
**适用范围：** 普通 CRUD  
**evidence:** `backend/src/main/java/com/example/accountlogin/controller/UserController.java#updateMe`

### 前置条件
- 需有效 Bearer token

### 功能逻辑
1. `UserProfileService.update` 逐字段处理（字段缺省或 `null` → 保持原值；去首尾空格后为空串 → 清空为 `null`）：
   - `nickname`：去首尾空格后按 Unicode 码点计 1–20，超出 → 字段错误 `昵称长度须为 1–20 个字符`
   - `email`：去首尾空格后须匹配 `^[^\s@]+@[^\s@]+\.[^\s@]+$` 且 ≤100 字符，否则字段错误 `邮箱格式不正确`
2. 收集全部字段错误后若非空 → 400 `{code:"BAD_REQUEST", message:<首个错误>, fieldErrors:{...}}`。
3. `DemoUserStore.updateProfile` 在同步块内做邮箱唯一校验（**不区分大小写**，排除本人）并写入；被其他用户占用 → 409 `{code:"409 CONFLICT", message:"该邮箱已被使用", fieldErrors:{email:"该邮箱已被使用"}}`。
4. 请求体中的 `username` 等未知字段被忽略；返回更新后的 `UserProfileResponse`。

### 请求参数

```json
{ "nickname": "小明", "email": "demo@example.com" }
```

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| nickname | string \| null | 否 | 新昵称 | — | 缺省/`null` 不修改；空串清空；trim 后 1–20 字符 | 小明 |
| email | string \| null | 否 | 新邮箱 | — | 缺省/`null` 不修改；空串清空；合法格式、≤100 字符、全局唯一（忽略大小写） | demo@example.com |

### 响应参数

同「1. 查询个人资料」响应（更新后的值）。

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| username | string | 是 | 用户名 | — | 不因请求体变化 | demo |
| nickname | string \| null | 是 | 昵称 | — | 已 trim | 小明 |
| email | string \| null | 是 | 邮箱 | — | 已 trim，保留原大小写 | demo@example.com |
| createdAt | string | 是 | 注册时间 | — | 不变 | 2026-09-27T13:00:00.123Z |

### 错误与边界
| 场景 | 处理方式 | 说明 |
|---|---|---|
| 昵称超长（trim 后 >20） | 400 `{code:"BAD_REQUEST", fieldErrors:{nickname:"昵称长度须为 1–20 个字符"}}` | `message` 同首个字段错误 |
| 邮箱格式错误 / 超 100 字符 | 400 `{code:"BAD_REQUEST", fieldErrors:{email:"邮箱格式不正确"}}` | 多字段同时错误时一并返回 |
| 邮箱被其他用户占用 | 409 `{code:"409 CONFLICT", message:"该邮箱已被使用", fieldErrors:{email:"该邮箱已被使用"}}` | 本人重复提交自己的邮箱不算冲突 |
| 未登录 / token 失效 | 401 `{code:"UNAUTHORIZED", message:"需要登录"}` | 同接口 1 |
| 请求体带 `username` | 忽略 | 用户名不可修改 |

### 联调示例
```bash
curl -X PUT 'http://localhost:8080/api/users/me' -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"nickname":"小明","email":"demo@example.com"}'
```
