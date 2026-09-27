# account-login 功能资产索引

> **本文件是索引，不是 SSOT。** 服务类/方法清单等真相位于 [`modules/`](./modules/)。  
> 改业务代码前：先读本索引定位模块，再读对应真相；改代码后：更新对应 `modules/NN-*.md`。

## 读文档说明

- **索引**：本文件（导航 + 项目概览）
- **真相**：`docs/func/modules/NN-*.md`
- **冲突裁决**：模块真相 > 本索引
- **禁止**在本文件展开方法清单或服务类正文

## 项目基本信息

| 项目 | 说明 |
|---|---|
| 项目名称 | account-login |
| 项目描述 | 账号登录全栈示例：Spring Boot 3 JWT API（backend/）+ Vite React TS UI（frontend/） |
| 技术栈 | 后端 Spring Boot 3.3.4 · Java 17 · Maven（`backend/pom.xml` 独立）· Spring Security · jjwt 0.12；前端 Vite 8 · React 19 · TS 6 · Vitest |

## 模块文档

| 模块 | 真相路径 | 代码目录 | 说明 |
|---|---|---|---|
| 认证与账号（backend） | [`modules/01-account-login-backend.md`](./modules/01-account-login-backend.md) | `backend/src/main/java/com/example/accountlogin/` | AuthService / DemoUserStore / TokenDenylist / JwtService / DemoUser |

## 变更记录（索引级）

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | harness-eng 初始化索引骨架 | harness-eng | 2026-09-27 |
| v0.2 | 修改 | 登记 01-account-login-backend 模块真相 | 张健 | 2026-09-27 |
