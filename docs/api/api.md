# account-login API 文档索引

> **本文件是索引，不是 SSOT。** 单接口契约位于 [`modules/`](./modules/)。  
> 改接口前：先读本索引定位模块，再读对应真相；改后更新 `modules/NN-*.md`。

## 读文档说明

- **索引**：本文件（导航 + 全局约定）
- **真相**：`docs/api/modules/NN-*.md`
- **冲突裁决**：模块真相 > 本索引
- **禁止**在本文件展开单接口请求/响应字段表

## 服务概览

| 项 | 说明 |
|---|---|
| 服务名 | account-login |
| 统一前缀 | `/api`（后端 :8080；前端开发经 Vite 代理） |

## 模块文档

| 模块 | 真相路径 | 基础路径 | 接口数 |
|---|---|---|---|
| 认证与账号 | [`modules/01-account-login-auth.md`](./modules/01-account-login-auth.md) | `/api/auth/*`、`/api/me` | 5 |
| 用户资料 | [`modules/02-account-login-user.md`](./modules/02-account-login-user.md) | `/api/users/me` | 2 |

## 全局约定

| 项 | 约定 |
|---|---|
| 鉴权 Header | `Authorization: Bearer <accessToken>`；公开端点仅 `POST /api/auth/login`、`POST /api/auth/register` |
| 统一响应 | 无外壳，成功直接返回 DTO（HTTP 200） |
| 错误体 | `{ "code": string, "message": string, "fieldErrors"?: { [字段]: string } }`（`ErrorResponse`）；`code` 形如 `409 CONFLICT` / `BAD_REQUEST` / `UNAUTHORIZED`；`fieldErrors` 仅字段校验失败 / 字段冲突时出现 |
| 前端消费 | `frontend/src/api/client.ts` + `types.ts`（改契约须同步） |

### 字段表约定（模块真相强制）

新建/大改基线列：`| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |`。  
说明=中文含义；枚举/备注无则 `—`；示例值禁止空单元格；旧 5 列兼容。详见 [`templates/api-doc-template.md`](./templates/api-doc-template.md)。

## 变更记录（索引级）

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | harness-eng 初始化索引骨架 | harness-eng | 2026-09-27 |
| v0.2 | 修改 | 登记 01-account-login-auth（5 接口）与全局约定 | 张健 | 2026-09-27 |
| v0.3 | 修改 | 登记 02-account-login-user（2 接口）；错误体全局约定补 `fieldErrors` | 张健 | 2026-09-27 |
