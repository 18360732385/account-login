# MCP 使用说明（mcp-usage-guide）

面向本地 / 非生产环境：在当前 Agent 宿主中按 **环境** 连接 MySQL / Oracle / Redis 等。

## 命名约定

server 名：`{engine}-{profile}`（例：`mysql-dev`、`redis-test`）。  
`profile` 以仓库配置自动发现（如 `application-dev.yml` → `dev`），由 harness-eng detect / fill-mcp 生成矩阵；example 中的 `*-example` 后缀写入真密文件前去掉。

## 安全约定

- **本地可填**：复制 `mcp.json.example` → 本机真密 `mcp.json`（gitignore）后，按本仓各 profile 填入连接参数；或经 fill-mcp 从本仓配置抽取后确认写入
- **勿提交**：不要把含真实密码的 `mcp.json` 提交进仓库（`example_only` 默认；团队 `vendored_shared` 另议）
- 仅为已发现的非生产 profile 配置可写 MCP；**勿**对 pre/prod 配置可写 MCP
- Redis：避免 `FLUSHDB` / `FLUSHALL`；钉住 `mcp[cli]>=1.9.4,<2`（避免 fastmcp 缺失）
- 勿使用 npm 包名 `mcp-server-redis`（安全研究 canary）

## 启用步骤

1. 复制对应宿主的 `mcp.json.example` → 真密 `mcp.json`（Cursor：`.cursor/mcp.json`；Claude / Qoder / CodeBuddy：根 `.mcp.json`；Trae：`.trae/mcp.json`；或跑 fill-mcp 按矩阵生成）
2. 按本仓各 profile 填入连接参数；删掉仓库未使用的引擎/环境块
3. 在宿主的 MCP 设置中启用对应 server 后重启会话 / 窗口（菜单位置因工具而异）

## 验收（填充 MCP 闸）

- MCP 面板无报错；应有矩阵中的 server 已启用
- 主环境（优先 dev）只读探针：`SELECT 1` / Redis `PING`
- 会话仍无工具 → Reload，或改走 `fill-calibrate-live`；两路径皆失败则 **禁止进入填充战役**
