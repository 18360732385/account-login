#!/usr/bin/env node
/**
 * afterFileEdit 实时提醒（harness-eng hooks 家族 · after-edit）。软门禁，fail-open。
 * 提醒时机（改文件当下）比 commit 软门禁更早，覆盖「不 commit 只跑服务」场景：
 * 1. migration SQL：命名规范 / DDL·DML 混写 / 文件头注释；环境同步由 commit 门禁覆盖
 * 2. 含 cron / task_code 等关键词的 yml：提醒 jobs 四件套（rule 20）
 *
 * 渲染占位：DB_MIGRATION_DIR、MIGRATION_NAME_RE、JOBS_YML_RE（与 domains.yaml hook 段一致）。
 */
const MIGRATION_DIR = "db/migration/";
function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const MIGRATION_RE = new RegExp("^" + escapeRe(MIGRATION_DIR) + "(V[^/]+\\.sql)$");
const MIGRATION_NAME_RE = new RegExp("^V[0-9]{4}__(DDL|DML)__[a-z0-9_]+\\.sql$");
const JOBS_YML_RE = new RegExp("(application[^/]*\\\\.ya?ml|config/.*\\\\.ya?ml)$");
const JOBS_KEYWORD_RE =
  /\b(cron|task[-_]?code|sync[-_]?task|scheduler|fixed[-_]?rate|fixed[-_]?delay)\b/i;
/** 文件头必含要素（对齐 db 契约 rule：时间 / 撰写人 / 目的 / 类型） */
const HEADER_KEYS = ["时间", "撰写", "目的", "类型"];

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        process.stdin.pause();
      } catch {
        /* ignore */
      }
      resolve(Buffer.concat(chunks).toString("utf8").replace(/^﻿/, ""));
    };
    const timer = setTimeout(done, 2000);
    process.stdin.on("data", (c) => chunks.push(Buffer.from(c, "utf8")));
    process.stdin.on("end", done);
    process.stdin.on("error", done);
  });
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}
const allow = () => out({ permission: "allow" });

function toRelative(filePath, roots) {
  const p = String(filePath || "").replace(/\\/g, "/");
  for (const r of roots || []) {
    const rr = String(r).replace(/\\/g, "/").replace(/\/+$/, "") + "/";
    if (p.startsWith(rr)) return p.slice(rr.length);
  }
  // 多工作区 / 绝对路径兜底：取迁移目录锚点之后的相对段
  const idx = p.indexOf("/" + MIGRATION_DIR);
  if (idx >= 0) return p.slice(idx + 1);
  return p;
}

function isDdl(l) {
  return /^\s*(create|alter|drop|truncate|rename)\b/i.test(l);
}
function isDml(l) {
  return /^\s*(insert|update|delete|replace|merge)\b/i.test(l);
}

(async () => {
  try {
    const raw = await readStdin();
    const payload = JSON.parse(raw || "{}");
    const rel = toRelative(payload.file_path, payload.workspace_roots);
    const newText = (payload.edits || [])
      .map((e) => e.new_string || "")
      .filter(Boolean)
      .join("\n");

    const mig = rel.match(MIGRATION_RE);
    if (mig) {
      const fname = mig[1];
      const lines = [];
      if (!MIGRATION_NAME_RE.test(fname)) {
        lines.push(
          `migration 命名不规范：${fname}（规范见 db 契约 rule，当前正则 ${MIGRATION_NAME_RE.source}）`
        );
      }
      if (newText) {
        const hasDdl = newText.split(/\r?\n/).some(isDdl);
        const hasDml = newText.split(/\r?\n/).some(isDml);
        if (hasDdl && hasDml) {
          lines.push("migration 禁止同一文件混写 DDL 与 DML，请拆成连续版本号");
        }
        const head = newText.split(/\r?\n/).slice(0, 10).join("\n");
        const missing = HEADER_KEYS.filter((k) => !head.includes(k));
        if (missing.length) {
          lines.push(`migration 文件头注释缺少：${missing.join(" / ")}（模板见 db 契约 rule）`);
        }
      }
      if (lines.length) {
        out({
          permission: "allow",
          additional_context: ["【migration 即时提醒】", ...lines.map((l) => `  - ${l}`)].join("\n"),
        });
      }
      allow();
    }

    if (JOBS_YML_RE.test(rel) && newText && JOBS_KEYWORD_RE.test(newText)) {
      out({
        permission: "allow",
        additional_context:
          "【jobs 即时提醒】yml 含 cron / task_code 相关配置：若新增/调整定时任务，请同步四件套（SyncTaskCode · Scheduler · yml cron · Registry）与 docs/jobs/tasks/（rule 20）",
      });
    }

    allow();
  } catch {
    allow();
  }
})();
