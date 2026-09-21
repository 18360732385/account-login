# account-login（单体全栈）

将原 `account-login-java`（Spring Boot JWT API）与 `account-login-web`（Vite React UI）合并为 **同一仓库**：

```
account-login/
  README.md
  backend/          # Spring Boot
  frontend/         # Vite + React + TypeScript
  docs/             # feature-eng / requirements / superpowers（仓库根）
```

历史双仓 feature-eng 归档仍保留在各自旧仓库；本仓只跑 **新需求** 的典礼。

## 要求

- JDK 17+（本机常用 OpenJDK 21；`backend/pom.xml` 目标仍为 17）
- Maven 3.9+
- Node.js 20+、npm 9+

## 一键本地跑通

```bash
# 终端 1 — 后端 :8080
mvn -f backend spring-boot:run

# 终端 2 — 前端 :5173（Vite 代理 /api → http://localhost:8080）
cd frontend && npm install && npm run dev
```

打开 http://localhost:5173 。开发期默认相对路径 `/api/*`；亦可设 `VITE_API_BASE_URL=http://localhost:8080` 直连（后端已配 CORS）。

## 演示账号

| 用户名 | 密码 |
|---|---|
| `demo` | `demo123` |
| `admin` | `admin123` |

也可在 UI **注册**新用户（密码至少 6 位）。

> 改密会改写内存哈希；集成测试 `@AfterEach` 会恢复预置账号。手工改密后重启后端即可。

## API 摘要

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/auth/register` | 无 | `{username,password}` → 同登录 JWT |
| POST | `/api/auth/login` | 无 | `{username,password}` → JWT |
| GET | `/api/me` | Bearer | 当前用户 |
| POST | `/api/auth/logout` | Bearer | 吊销当前 token |
| POST | `/api/auth/change-password` | Bearer | `{oldPassword,newPassword}` |

## 测试

```bash
mvn -f backend test
cd frontend && npm test && npm run build
```

## 文档

- 需求：`docs/requirements/`
- feature-eng：`docs/runs/`
- Spec / Plan：`docs/superpowers/`
- 优化点：`docs/feature-eng-优化点-monorepo.md`

## License

MIT
