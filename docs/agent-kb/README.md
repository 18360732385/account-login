# Agent knowledge base

> **非契约 SSOT**。契约真相见 `docs/func|api|db|redis|jobs`；命令与红线见根 `AGENTS.md`。  
> 触碰本目录时注入 `.cursor/rules/19-agent-kb.mdc`。  
> 本目录**文件名用英文**；正文仍优先中文。

## 怎么选（三问）

1. **产品/研发明确接受、当前不修？** → [accepted-gaps.md](./accepted-gaps.md)（`Gn`）
2. **智能体不该再犯的错误做法？** → [pitfalls.md](./pitfalls.md)（`Pn`；先按**域**筛）
3. **分层 / 模块边界 / 环境指针变了？** → [architecture-overview.md](./architecture-overview.md)

都不像 → 只改契约 SSOT 或分册 AGENTS；**不要**往本目录堆契约正文。  
**施工报告 / 评分快照**（0.2.12+）→ [`docs/harness-eng/`](../harness-eng/README.md)，勿再写入本目录。

| 你要… | 读 |
|---|---|
| 分层 / 模块边界 / 环境指针 | [architecture-overview.md](./architecture-overview.md) |
| 智能体高频翻车 | [pitfalls.md](./pitfalls.md) |
| 明确接受的行为缺口 | [accepted-gaps.md](./accepted-gaps.md) |
| 打分报告 / 施工进度 | [`../harness-eng/`](../harness-eng/README.md) |

规划语料（若启用）见 `docs/superpowers/README.md`（非 SSOT）。
