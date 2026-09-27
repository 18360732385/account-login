#!/usr/bin/env node
/**
 * git commit/merge 软门禁（harness-eng hooks 家族 · commit-gate-extended）。
 * 五合一提醒：superpowers 收口 + agent-kb 回流 + agent-config 漂移 + 契约漏同步 + db/migration 环境同步。
 * 永不拦截（fail-open）；Cursor 协议仅 allow + agent_message；--git 模式输出到 stderr 并 exit 0。
 * 子进程必须 stdio ignore stdin，否则会与 hook stdin 管道互相等待。
 * 契约 docsHit 只认真相子目录（modules/table/keys/tasks），索引与 archive 不算；
 * jobs 的 yml 侧按暂存 diff 新增行关键词（cron/task_code 等）判定，避免改配置误报。
 *
 * 渲染占位：CONTRACT_CHECKS_JS（由 domains.yaml hook_* 段生成）、DB_MIGRATION_DIR、
 * MIGRATION_ENVS（空串=关闭环境提醒，flyway 仓用）、JOBS_YML_RE、CODE_PREFIXES。
 */
const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const STDIN_TIMEOUT_MS = 2000;
const MIGRATION_PREFIX = "db/migration/";
/** 迁移须人工同步的环境清单；空串 = 关闭本提醒（如 flyway 自动迁移仓） */
const MIGRATION_ENVS = "dev / test / uat";
const MIGRATION_NAME_RE = new RegExp("^V[0-9]{4}__(DDL|DML)__[a-z0-9_]+\\.sql$");

const CODE_PREFIXES = "backend/src/main/java/,frontend/src/"
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** @type {{ id: string, code: (f: string) => boolean, docs: (f: string) => boolean, tip: string }[]} */
const CONTRACT_CHECKS = [
  {
    id: "func",
    code: (f) => new RegExp("\\/service\\/").test(f) ||
      new RegExp("\\/plugin\\/tools\\/").test(f),
    docs: (f) => f.startsWith("docs/func/modules/"),
    tip: "rule 11：同步 docs/func/modules",
  },
  {
    id: "api",
    code: (f) => new RegExp("\\/controllers?\\/").test(f) ||
      new RegExp("packages\\/api-client\\/").test(f) ||
      new RegExp("packages\\/types\\/").test(f) ||
      new RegExp("packages\\/queries\\/").test(f),
    docs: (f) => f.startsWith("docs/api/modules/"),
    tip: "rule 12：先同步 docs/api/modules；前端契约包（api-client/types/queries）变更亦须先真相后代码",
  },
];

/** 可能含 cron / task_code 的 yml 路径（与 jobs 域 hook 段一致） */
const JOBS_YML_RE = new RegExp("(application[^/]*\\\\.ya?ml|config/.*\\\\.ya?ml)$");
/** 暂存 diff 新增行中的定时任务关键词 */
const JOBS_DIFF_KEYWORD_RE =
  /\b(cron|task[-_]?code|sync[-_]?task|scheduler|fixed[-_]?rate|fixed[-_]?delay)\b/i;

const argv = process.argv.slice(2);
const GIT_MODE = argv.includes("--git") || process.env.HARNESS_HOOK_MODE === "git";

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
        process.stdin.removeAllListeners("data");
        process.stdin.removeAllListeners("end");
        process.stdin.removeAllListeners("error");
      } catch {
        /* ignore */
      }
      // 去 BOM：Windows PowerShell 管道可能带入 ﻿，导致 JSON.parse 失败
      resolve(Buffer.concat(chunks).toString("utf8").replace(/^﻿/, ""));
    };
    const timer = setTimeout(done, STDIN_TIMEOUT_MS);
    try {
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (c) => {
        chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c), "utf8"));
      });
      process.stdin.on("end", done);
      process.stdin.on("error", done);
      if (process.stdin.readableEnded) done();
    } catch {
      done();
    }
  });
}

function allow(extra = {}) {
  if (GIT_MODE) {
    if (extra.agent_message) console.error(extra.agent_message);
    process.exit(0);
  }
  process.stdout.write(JSON.stringify({ permission: "allow", ...extra }));
  process.exit(0);
}

function git(cmd, cwd) {
  return execSync(cmd, {
    encoding: "utf8",
    cwd,
    // 关键：勿继承 hook 的 stdin，否则 git 可能阻塞读管道
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 5000,
    windowsHide: true,
  });
}

function normalizePath(f) {
  return String(f || "").replace(/\\/g, "/");
}

function getStagedFiles(root) {
  return git("git diff --cached --name-only", root)
    .split(/\r?\n/)
    .map(normalizePath)
    .filter(Boolean);
}

/**
 * 判断某 yml 的暂存 diff 新增行是否含定时任务关键词。
 * 用 execFileSync 数组传参，避免路径含空格 / 特殊字符时的拼接问题。
 */
function ymlDiffTouchesJobs(root, file) {
  let diff;
  try {
    diff = execFileSync("git", ["diff", "--cached", "-U0", "--", file], {
      encoding: "utf8",
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
      windowsHide: true,
    });
  } catch {
    return false;
  }
  return diff
    .split(/\r?\n/)
    .some(
      (l) => l.startsWith("+") && !l.startsWith("+++") && JOBS_DIFF_KEYWORD_RE.test(l)
    );
}

function isMigrationSql(f) {
  const p = normalizePath(f);
  return p.startsWith(MIGRATION_PREFIX) && p.endsWith(".sql");
}

/** 从 `git merge …` 命令解析合并源（最后一个非 option 参数）。 */
function parseMergeSource(command) {
  const m = String(command || "").match(/\bgit\s+merge\b(.*)$/i);
  if (!m) return null;
  const tokens = m[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !t.startsWith("-"));
  if (tokens.length === 0) return null;
  return tokens[tokens.length - 1];
}

/** 对 ref 做简单校验后 diff（避免 shell 注入）。 */
function getMergeIncomingFilesSafe(root, ref) {
  if (!/^[A-Za-z0-9_./~^{}@+-]+$/.test(ref)) {
    return [];
  }
  return git(`git diff --name-only HEAD...${ref}`, root)
    .split(/\r?\n/)
    .map(normalizePath)
    .filter(Boolean);
}

function collectMigrationEnvReminders(files) {
  if (!MIGRATION_ENVS) return [];
  const migrations = [...new Set(files.map(normalizePath).filter(isMigrationSql))].sort();
  if (migrations.length === 0) return [];
  return [
    "【SQL/环境】检测到 db/migration 变更：",
    ...migrations.map((p) => `  - ${p}`),
    `启动不自动迁库时，请按序人工执行到 ${MIGRATION_ENVS}（命名规范 ${MIGRATION_NAME_RE.source}）。`,
    "勿只合代码不跑 SQL；已执行过的版本勿重跑。",
  ];
}

function collectContractReminders(root, staged) {
  const contractLines = [];
  for (const check of CONTRACT_CHECKS) {
    const codeHit = staged.some(check.code);
    const docsHit = staged.some(check.docs);
    if (codeHit && !docsHit) {
      contractLines.push(`  - [${check.id}] 暂存含代码侧变更，未含对应文档：${check.tip}`);
    }
  }

  // jobs 的 yml 侧：仅当暂存 diff 新增行命中 cron/task_code 等关键词才提醒
  const jobsDocsHit = staged.some((f) => f.startsWith("docs/jobs/tasks/"));
  if (!jobsDocsHit) {
    const ymlJobsHit = staged
      .filter((f) => JOBS_YML_RE.test(f))
      .some((f) => ymlDiffTouchesJobs(root, f));
    if (ymlJobsHit) {
      contractLines.push(
        "  - [jobs] 暂存 yml 含 cron/task_code 相关新增配置，未含 docs/jobs/tasks：rule 20：同步 docs/jobs/tasks + 四件套"
      );
    }
  }
  return contractLines;
}

function codeTouchedByPrefixes(staged) {
  const prefixes =
    CODE_PREFIXES.length > 0
      ? CODE_PREFIXES
      : ["src/", "backend/", "frontend/", "apps/", "packages/"];
  return staged.some((f) => prefixes.some((p) => f.startsWith(p)));
}

function collectSuperpowersReminders(root, staged) {
  const plansDir = path.join(root, "docs", "superpowers", "plans");
  let activePlans = [];
  try {
    activePlans = fs
      .readdirSync(plansDir)
      .filter((f) => f.endsWith(".md") && f !== "README.md");
  } catch {
    activePlans = [];
  }
  const indexTouched = staged.some(
    (f) =>
      f === "docs/superpowers/README.md" ||
      f === "docs/superpowers/ARCHIVE.md" ||
      f.startsWith("docs/superpowers/archive/")
  );
  if (activePlans.length === 0 || !codeTouchedByPrefixes(staged) || indexTouched) {
    return [];
  }
  const shown = activePlans.slice(0, 3).join("、");
  const more = activePlans.length > 3 ? ` 等 ${activePlans.length} 个` : "";
  return [
    `- superpowers：仍有进行中 plan（${shown}${more}）；若本提交完成其主功能，先按 rule 18 收口（README→ARCHIVE），纯 fix/chore 可忽略`,
  ];
}

/**
 * agent-kb 回流软提醒：暂存含 pitfalls.md 时提醒跑 lint（脚本存在才提示）；
 * 暂存含业务代码但未含 pitfalls.md 时提醒按 rule 19 三问回流。
 */
function collectPitfallsReminders(root, staged) {
  if (!fs.existsSync(path.join(root, "docs", "agent-kb", "pitfalls.md"))) return [];
  const pitfallsTouched = staged.some(
    (f) => normalizePath(f) === "docs/agent-kb/pitfalls.md"
  );
  const lintExists = fs.existsSync(
    path.join(root, "scripts", "agent-kb", "lint-pitfalls.mjs")
  );
  const lines = [];
  if (pitfallsTouched && lintExists) {
    lines.push(
      "- agent-kb：pitfalls.md 已变更，请执行 node scripts/agent-kb/lint-pitfalls.mjs 校验"
    );
  } else if (!pitfallsTouched && codeTouchedByPrefixes(staged)) {
    lines.push(
      "- agent-kb：若本轮修复/确认了智能体易再犯的错误做法，按 rule 19 回流 pitfalls.md（三问）；否则忽略"
    );
  }
  return lines;
}

/**
 * agent-config 漂移防线（仅 L5 配置 SSOT 管线仓启用，运行时按目录存在性判定）：
 * - 暂存含 docs/agent-config/ 但未含任何生成物 → 提醒跑 sync.mjs 并一并暂存产物；
 * - 暂存含生成物但未含 docs/agent-config/ → 提醒生成物勿手改（跑过 sync 属正常）。
 */
const GENERATED_PATH_RE = /^(\.cursor|\.qoder|\.claude|\.trae|\.codebuddy)\//;
const GENERATED_FILES = new Set(["CLAUDE.md", ".mcp.json"]);
/** 工具目录中非生成器管理的内容（harness 元数据 / 本地覆盖） */
const GENERATED_EXCLUDE = new Set([
  ".cursor/harness-meta.yaml",
  ".cursor/mcp.local.json",
  ".cursor/mcp.local.json.example",
]);

function isGeneratedPath(f) {
  const p = normalizePath(f);
  if (GENERATED_EXCLUDE.has(p)) return false;
  return GENERATED_PATH_RE.test(p) || GENERATED_FILES.has(p);
}

function collectAgentConfigReminders(root, staged) {
  if (!fs.existsSync(path.join(root, "docs", "agent-config"))) return [];
  const ssotTouched = staged.some((f) => normalizePath(f).startsWith("docs/agent-config/"));
  const generatedTouched = staged.some(isGeneratedPath);
  if (ssotTouched && !generatedTouched) {
    return [
      "- agent-config：SSOT 已变更但生成物未暂存，请执行 node scripts/agent-config/sync.mjs 并一并暂存 .cursor/ 等生成物",
    ];
  }
  if (!ssotTouched && generatedTouched) {
    return [
      "- agent-config：暂存含 .cursor/ 等工具目录生成物；若为手改请改到 SSOT docs/agent-config/ 后跑 sync（跑过 sync 属正常，可忽略）",
    ];
  }
  return [];
}

/** commit 路径：全量软提醒（含 SQL/环境）。 */
function buildAgentMessageParts(root, staged) {
  const parts = [];
  // superpowers / agent-kb / agent-config 合并为一条「流程提醒」，降低提醒噪音
  const flowLines = [
    ...collectSuperpowersReminders(root, staged),
    ...collectPitfallsReminders(root, staged),
    ...collectAgentConfigReminders(root, staged),
  ];
  if (flowLines.length) {
    parts.push(["【流程提醒】", ...flowLines].join("\n"));
  }

  const contractLines = collectContractReminders(root, staged);
  if (contractLines.length) {
    parts.push(
      ["【契约同步】暂存疑似漏同步文档：", ...contractLines, "纯无关改动可忽略。"].join("\n")
    );
  }

  const migParts = collectMigrationEnvReminders(staged);
  if (migParts.length) {
    parts.push(migParts.join("\n"));
  }

  const openapiTip = "".trim();
  if (openapiTip) {
    const apiTouched = staged.some(
      (f) =>
        f.startsWith("docs/api/") ||
        /\/controller\//.test(f) ||
        /Controller\.(java|kt|ts|js)$/.test(f)
    );
    if (apiTouched) {
      parts.push(openapiTip);
    }
  }
  return parts;
}

// 供本地自检
module.exports = {
  collectContractReminders,
  collectSuperpowersReminders,
  collectMigrationEnvReminders,
  collectPitfallsReminders,
  collectAgentConfigReminders,
  isGeneratedPath,
  parseMergeSource,
  isMigrationSql,
  ymlDiffTouchesJobs,
  buildAgentMessageParts,
  CONTRACT_CHECKS,
  JOBS_YML_RE,
  JOBS_DIFF_KEYWORD_RE,
};

if (require.main === module) {
  (async () => {
    try {
      let command = "";
      if (GIT_MODE) {
        command = "git commit";
      } else {
        const raw = await readStdin();
        let payload = {};
        try {
          payload = JSON.parse(raw || "{}");
        } catch {
          if (process.env.GATE_DEBUG) {
            process.stderr.write(`parse-failed raw=${JSON.stringify(raw)}\n`);
          }
          allow();
        }
        command = String(payload.command || "");
      }
      const isCommit = /\bgit\s+commit\b/.test(command);
      const isMerge = /\bgit\s+merge\b/.test(command);
      if (!isCommit && !isMerge) {
        allow();
      }

      let root;
      try {
        root = git("git rev-parse --show-toplevel", process.cwd()).trim();
      } catch {
        allow();
      }

      /** @type {string[]} */
      let parts = [];

      if (isMerge) {
        const ref = parseMergeSource(command);
        if (!ref) {
          allow();
        }
        let files = [];
        try {
          files = getMergeIncomingFilesSafe(root, ref);
        } catch {
          allow();
        }
        const migParts = collectMigrationEnvReminders(files);
        if (migParts.length === 0) {
          allow();
        }
        parts = [migParts.join("\n")];
      } else {
        let stagedFiles = [];
        try {
          stagedFiles = getStagedFiles(root);
        } catch {
          allow();
        }
        parts = buildAgentMessageParts(root, stagedFiles);
      }

      if (parts.length === 0) {
        allow();
      }

      allow({ agent_message: parts.join("\n\n") });
    } catch (e) {
      if (process.env.GATE_DEBUG) {
        process.stderr.write(String((e && e.stack) || e) + "\n");
      }
      allow();
    }
  })();
}
