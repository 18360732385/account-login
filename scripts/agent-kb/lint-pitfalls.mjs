#!/usr/bin/env node
/**
 * pitfalls.md 结构校验（agent-kb 台账门禁）。
 * 用法：node scripts/agent-kb/lint-pitfalls.mjs
 * 校验项：
 *  1. 行格式：7 列（ID | 状态 | 域 | 触发路径/关键词 | 现象 | 错误做法 | 正确约束落点）
 *  2. ID：^P\d+$、全局唯一、在文件中递增
 *  3. 状态：活跃区必须「活跃」，留档区必须「已根治」
 *  4. 域：必须来自封闭词表
 *  5. 触发路径/关键词：必填
 *  6. 落点列的相对 Markdown 链接：目标文件/目录必须存在
 *  7. 速查一致性：每个 Pn 须同时出现在「路径速查」与「域速查」；速查里的 Pn 必须存在
 *  8. Never do↔Pn（warn）：根 AGENTS Never do 的 → Pn 须在台账；无回链行 warn（不 fail）
 * 退出码：0 通过；1 有错误。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FILE = path.join(ROOT, "docs/agent-kb/pitfalls.md");

/** 封闭域词表（land 渲染默认通用词表；新增域先改这里再用） */
const DOMAINS = new Set(["Build", "Auth", "Docs", "Config", "API", "Backend", "Test", "Cache", "Jobs", "Frontend", "DB", "MCP", "Prompt", "Graph"]);
const STATUS = new Set(["活跃", "已根治"]);

const errors = [];
const err = (msg) => errors.push(msg);

const text = fs.readFileSync(FILE, "utf8");
const lines = text.split(/\r?\n/);

// 按章节切分：## 路径速查 / ## 域速查 / ## 台账（活跃） / ## 已根治留档
function sectionOf(heading) {
  const start = lines.findIndex((l) => l.trim().startsWith(heading));
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out;
}

function parseRows(sectionLines) {
  // 跳过表头与分隔行，只取 | Pn ... 数据行
  return sectionLines
    .filter((l) => /^\|\s*P\d+\s*\|/.test(l.trim()))
    .map((l) =>
      l
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    );
}

const activeRows = parseRows(sectionOf("## 台账"));
const archivedRows = parseRows(sectionOf("## 已根治留档"));
const allRows = [...activeRows, ...archivedRows];

if (allRows.length === 0) err("未解析到任何台账数据行（| Pn ... |）");

// 1-5：行级校验
const seen = new Map();
let lastId = 0;
for (const section of [
  { name: "台账（活跃）", rows: activeRows, expect: "活跃" },
  { name: "已根治留档", rows: archivedRows, expect: "已根治" },
]) {
  for (const cols of section.rows) {
    const [id, status, domain, trigger] = cols;
    if (cols.length !== 7) {
      err(`${id ?? "?"}：列数 ${cols.length} ≠ 7（${section.name}）`);
      continue;
    }
    if (!/^P\d+$/.test(id)) {
      err(`${id}：ID 须匹配 ^P\\d+$`);
      continue;
    }
    const n = Number(id.slice(1));
    if (seen.has(id)) err(`${id}：ID 重复（首次出现于第 ${seen.get(id)} 行区）`);
    seen.set(id, section.name);
    if (n <= lastId) err(`${id}：ID 未按递增顺序排列（上一个 P${lastId}）`);
    lastId = n;
    if (!STATUS.has(status)) err(`${id}：状态「${status}」非法（仅 活跃 / 已根治）`);
    if (status !== section.expect)
      err(`${id}：状态「${status}」与所在区「${section.name}」不符`);
    if (!DOMAINS.has(domain)) err(`${id}：域「${domain}」不在封闭词表内`);
    if (!trigger) err(`${id}：触发路径/关键词列为空（必填）`);
  }
}

// 6：落点列相对链接存在性
for (const cols of allRows) {
  const [id, , , , , , target] = cols;
  if (!target) continue;
  const links = [...target.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  for (let link of links) {
    if (/^https?:\/\//.test(link)) continue;
    link = link.split("#")[0];
    if (!link) continue;
    const abs = path.resolve(path.dirname(FILE), link);
    if (!fs.existsSync(abs)) err(`${id}：落点链接不存在 → ${link}`);
  }
}

// 7：速查一致性
const pathRef = sectionOf("## 路径速查").join("\n");
const domainRef = sectionOf("## 域速查").join("\n");
const refIds = (s) => new Set([...s.matchAll(/P\d+/g)].map((m) => m[0]));
const pathIds = refIds(pathRef);
const domainIds = refIds(domainRef);

for (const id of seen.keys()) {
  if (!pathIds.has(id)) err(`${id}：未登记到「路径速查」`);
  if (!domainIds.has(id)) err(`${id}：未登记到「域速查」`);
}
for (const id of new Set([...pathIds, ...domainIds])) {
  if (!seen.has(id)) err(`速查表引用了不存在的 ${id}`);
}

// 8：Never do ↔ Pn（warn only；缺回链不挡交付，避免老仓立刻挂死）
/** Scan root AGENTS.md Never do section for → Pn backlinks; warn if missing from ledger. */
function warnNeverDoPnBacklinks() {
  const agentsPath = path.join(ROOT, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) return;
  const agents = fs.readFileSync(agentsPath, "utf8");
  const neverIdx = agents.search(/^##\s+Never do\b/m);
  if (neverIdx < 0) return;
  const rest = agents.slice(neverIdx);
  const nextH2 = rest.search(/\n##\s+/);
  const block = nextH2 > 0 ? rest.slice(0, nextH2) : rest;
  const refs = [...block.matchAll(/→\s*(P\d+)/g)].map((m) => m[1]);
  const missing = [...new Set(refs)].filter((id) => !seen.has(id));
  if (missing.length) {
    console.warn(
      `pitfalls lint warn：AGENTS Never do 回链未在台账出现：${missing.join(", ")}`
    );
  }
  const bullets = block.split(/\r?\n/).filter((l) => /^-\s+/.test(l.trim()));
  const noBacklink = bullets.filter(
    (l) => !/TODO\(harness-eng\)/.test(l) && !/→\s*P\d+/.test(l)
  );
  if (noBacklink.length) {
    console.warn(
      `pitfalls lint warn：Never do 有 ${noBacklink.length} 行无「→ Pn」回链（格式：一句话 → Pn）`
    );
  }
}
warnNeverDoPnBacklinks();

if (errors.length > 0) {
  console.error(`pitfalls lint 失败（${errors.length} 项）：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `pitfalls lint 通过：活跃 ${activeRows.length} 行，已根治 ${archivedRows.length} 行。`
);
