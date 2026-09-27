# 架构概览

> 仓库知识库（**非**契约 SSOT）。短文指针；细节以分册 `AGENTS.md` 为准。  
> 契约真相见 `docs/func|api|db|redis|jobs`；命令与红线见根 `AGENTS.md`。

## 系统上下文

```text
浏览器 SPA（frontend :5173）──/api（Vite 代理或 CORS 直连）──▶ Spring Boot（backend :8080）──▶ 进程内内存（DemoUserStore / TokenDenylist）
无数据库、无缓存、无外部 HTTP 依赖。
```

## Monorepo / 模块边界

| 目录 | 职责 | 禁止 |
|---|---|---|
| `backend/` | Spring Boot 3 JWT REST API（独立 pom） | 放前端资源；引入持久化却不启用 db 契约域 |
| `frontend/` | Vite + React 19 SPA，经 `src/api/client.ts` 调后端 | 组件内直接 fetch；绕过 `types.ts` 手写字段 |
| `docs/`（func / api / db / redis / jobs） | 契约 SSOT | 用 plan 覆盖契约 |
| `docs/agent-kb/` | 架构 / 踩坑 / 接受缺口 | 用本目录覆盖契约 |
| `docs/superpowers/` | 规划语料（若启用） | 已交付 plan 当任务清单 |

## 请求链路

```text
JwtAuthenticationFilter（Bearer → 验签/过期 → denylist(jti) → tokenVersion）→ AuthController → AuthService → DemoUserStore / TokenDenylist / JwtService
异常：ResponseStatusException / MethodArgumentNotValidException → GlobalExceptionHandler → ErrorResponse(code, message)
```

## 关键边界

| 主题 | 要点 |
|---|---|
| 鉴权 | 无状态 JWT HS256；放行 `POST /api/auth/login|register`；登出吊销 jti，改密递增 tokenVersion 使全部旧 token 失效 |
| 配置 / 环境 | 仅 `backend/src/main/resources/application.yml`（无 profile）；前端 `.env.development` / `.env.example`（`VITE_API_BASE_URL`、`VITE_API_PROXY_TARGET`） |
