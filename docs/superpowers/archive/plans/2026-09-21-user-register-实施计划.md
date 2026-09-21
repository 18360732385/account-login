# 实施计划 — 用户注册

## 任务

| id | title | depends_on | 验收 |
|---|---|---|---|
| T1 | 合并 java/web → monorepo 布局 + 根 README | [] | backend/ frontend/ docs/ 就位；代理仍 8080 |
| T2 | Backend RegisterRequest + DemoUserStore.register + AuthService/Controller + Security permit | [T1] | POST /api/auth/register |
| T3 | Backend 集成测试（成功/重复/校验） | [T2] | mvn -f backend test 含注册用例 |
| T4 | Frontend types/client + RegisterForm + App 切换 | [T1] | UI 可注册并进资料页 |
| T5 | Vitest client + App 用例 | [T4] | npm test 绿；npm run build 绿 |
| T6 | feature-eng Full 收口 + 优化点 monorepo | [T3,T5] | archive + 优化点文档 |

## 顺序说明
同仓单 Spec：契约与 UI 同一次定稿，**不**再走跨仓 API-first 顺序闸（O15 对本练习 out of scope）。
