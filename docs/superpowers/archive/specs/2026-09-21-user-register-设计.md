# 设计 Spec — 用户注册（monorepo Full）

> slug: `2026-09-21-user-register`  
> 路径：`backend/` + `frontend/` 同仓；**非** sibling_repos 双仓。

## 1. 术语
- **注册**：公开创建账号；成功后签发 JWT（与登录同形）
- **会话存储（O13）**：前端会话态仅 **memory**（React state），不写 sessionStorage/localStorage
- **displayName**：新用户默认等于 username

## 2. API 契约（本仓 SSOT，路径相对 monorepo）

### POST `/api/auth/register`
- Auth：无（SecurityConfig permitAll，与 login 并列）
- Body：`{ "username": string, "password": string }`
- 校验：
  - username：非空，trim 后长度 3–32
  - password：非空，最少 6 位（与改密一致）
- 成功：**200** + 与 login 相同形状  
  `{ "accessToken", "tokenType":"Bearer", "expiresInMs" }`  
  （选型说明：优先返回 JWT，UX 可直接进入已认证视图；文档化于 README）
- 冲突：用户名已存在 → **409** `{ code, message: "用户名已存在" }`
- 校验失败 → **400**

### 既有接口不变
login / me / logout / change-password 行为保持。

## 3. 前端行为
- Login 表单提供「去注册」；Register 表单提供「去登录」
- 注册成功：`register` → `fetchMe` → ProfileView（与登录成功路径共享 `enterSession`）
- 失败：表单内 alert；停留在注册视图
- 客户端前置校验：空字段 / 用户名 <3 / 密码 <6（减少无效请求）
- `api_base_mode`（O14）：默认 **proxy**（Vite `/api` → `http://localhost:8080`）；CORS 仍保留

## 4. 测试
| 层 | 范围 |
|---|---|
| Java MockMvc | 成功+可 login/me；重复 409；短密码 400；空用户名 400 |
| Vitest client | register success / 409 / 400 |
| Vitest App | 成功进资料页；重复留表单；短密码客户端校验 |

## 5. 非目标
邮箱验证、DB 持久化、OAuth、邮箱唯一性。

## 6. monorepo 布局备注
feature-eng 当前无一等公民 `packages`/`layout` 字段。本轮在 progress `env_notes.monorepo` 记录：
```yaml
layout: [backend, frontend]
docs_root: docs/   # 典礼在仓库根，不在子包
```
**不**发明 `sibling_repos` 指向本仓两个子目录。
