# 功能资产模块真相模板（modules/NN-{name}.md）

> 本模板用于 `docs/func/modules/` 下**单个业务域**文档。  
> 模块真相是功能资产的 SSOT；索引见 `docs/func/func.md`。  
> AI 在生成该域业务代码前必须优先查阅对应模块文档。

## 文件命名（强制）

| 项 | 约定 |
|---|---|
| 文件路径 | `docs/func/modules/NN-{domain}.md` |
| 序号 `NN` | 两位数字，与 [`../func.md`](../func.md)「模块文档」表顺序一致；**新增模块**取当前最大序号 +1，并同步更新 `func.md` 与 `modules/README.md` |
| 正文子标题 | 统一用 `###`：`### 服务类`、`### 方法清单`、`### 数据实体` 等（**禁止**用 `## 服务类`，避免与模块级 `## 变更记录` 混淆层级） |
| 不编号 | 正文标题**不加** `N.` 序号（与 API 接口节编号不同） |

---

# {模块中文名}功能资产

**对应目录**：`com.example.accountlogin.module.xxx`

### 服务类

| 类名 | 说明 | 所在路径 |
|---|---|---|
| `XxxService` | … | `...service.XxxService` |

### 方法清单

**XxxService**

| 方法签名 | 功能说明 | 入参 | 出参 |
|---|---|---|---|
| `Result foo(Req req)` | … | req | Result |

### 数据实体 / 配置（按需）

| 实体或配置 | 说明 |
|---|---|
| `XxxEntity` / config key | … |

### 关联文档

| 类型 | 路径 |
|---|---|
| API | `docs/api/modules/NN-….md` |
| 表结构 | `docs/db/table/…` |
| 索引 | `docs/func/func.md` |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 创建 | 初始化本模块真相 | account-login | YYYY-MM-DD |
