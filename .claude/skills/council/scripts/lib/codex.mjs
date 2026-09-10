// The Codex seat: everything that touches the Codex plugin's companion CLI.
// Verified against openai-codex/codex 1.0.6 (scripts/codex-companion.mjs):
//  - `task --background --json -- <prompt>` prints {jobId, status, summary,...}
//  - `status <id> --json` / `result <id> --json` / `cancel <id> --json` resolve
//    any job in the workspace store by explicit id, whatever session made it
//  - the bare `status --json --all` listing is filtered to the current
//    session only through env CODEX_COMPANION_SESSION_ID; with that variable
//    removed it lists every job in the store (how an orphan is found)
//  - job.summary is the first 96 characters of the prompt

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CouncilError } from "./store.mjs";

export const SESSION_ENV = "CODEX_COMPANION_SESSION_ID";

function versionKey(dir) {
  return path.basename(dir).split(".").map((x) => Number.parseInt(x, 10) || 0);
}

export function resolveCompanion(env = process.env) {
  if (env.COUNCIL_COMPANION && fs.existsSync(env.COUNCIL_COMPANION)) {
    return env.COUNCIL_COMPANION;
  }
  const home = env.HOME || env.USERPROFILE || os.homedir();
  const base = path.join(home, ".claude", "plugins", "cache", "openai-codex", "codex");
  if (!fs.existsSync(base)) {
    return null;
  }
  const versions = fs
    .readdirSync(base)
    .map((v) => path.join(base, v))
    .filter((d) => fs.existsSync(path.join(d, "scripts", "codex-companion.mjs")))
    .sort((a, b) => {
      const ka = versionKey(a);
      const kb = versionKey(b);
      for (let i = 0; i < Math.max(ka.length, kb.length); i += 1) {
        const d = (ka[i] ?? 0) - (kb[i] ?? 0);
        if (d !== 0) {
          return d;
        }
      }
      return 0;
    });
  return versions.length ? path.join(versions[versions.length - 1], "scripts", "codex-companion.mjs") : null;
}

export function runCompanion(companion, args, { cwd, env = process.env, dropSession = false } = {}) {
  const childEnv = { ...env };
  if (dropSession) {
    delete childEnv[SESSION_ENV];
  }
  const result = spawnSync(process.execPath, [companion, ...args], {
    cwd,
    env: childEnv,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error ?? null };
}

function parseJson(text, what) {
  try {
    return JSON.parse(text);
  } catch {
    throw new CouncilError("COMPANION_OUTPUT", `could not parse ${what}: ${text.slice(0, 300)}`);
  }
}

export function companionSmokeTest(companion, cwd) {
  const r = runCompanion(companion, ["status", "--json"], { cwd });
  return r.code === 0;
}

export function jobPrefix(state, round, attempt) {
  return `council ${state.id} round ${round} attempt ${attempt}`;
}

export function buildJobPrompt(state, round, attempt, packetPath) {
  return `${jobPrefix(state, round, attempt)}: READ-ONLY review - do not edit or create any files. Read the file ${packetPath} in full and return your full critique as your final answer.`;
}

export function launchJob(companion, { cwd, prompt, model, effort }) {
  const args = ["task", "--background", "--json"];
  if (model) {
    args.push("--model", model);
  }
  if (effort) {
    args.push("--effort", effort);
  }
  args.push("--", prompt);
  const r = runCompanion(companion, args, { cwd });
  if (r.code !== 0 || !r.stdout.trim()) {
    throw new CouncilError("LAUNCH_FAILURE", `companion task failed: ${(r.stderr || r.stdout || String(r.error)).slice(0, 500)}`);
  }
  const payload = parseJson(r.stdout, "launch output");
  if (!payload.jobId) {
    throw new CouncilError("LAUNCH_FAILURE", `no jobId in launch output: ${r.stdout.slice(0, 300)}`);
  }
  return payload;
}

export function jobStatus(companion, cwd, jobId) {
  const r = runCompanion(companion, ["status", jobId, "--json"], { cwd });
  if (r.code !== 0) {
    if (/No job found/i.test(r.stderr + r.stdout)) {
      return { status: "not found" };
    }
    return { status: "unreadable", detail: (r.stderr || r.stdout).slice(0, 300) };
  }
  const payload = parseJson(r.stdout, "status output");
  return { status: payload.job?.status ?? "unreadable", logFile: payload.job?.logFile ?? null, raw: payload };
}

export function jobResult(companion, cwd, jobId) {
  const r = runCompanion(companion, ["result", jobId, "--json"], { cwd });
  if (r.code !== 0) {
    return { status: "unreadable", detail: (r.stderr || r.stdout).slice(0, 300), rawOutput: null };
  }
  const payload = parseJson(r.stdout, "result output");
  const stored = payload.storedJob ?? {};
  return {
    status: stored.status ?? payload.job?.status ?? "unknown",
    rawOutput: stored.result?.rawOutput ?? null,
    errorMessage: stored.errorMessage ?? payload.job?.errorMessage ?? null
  };
}

export function cancelJob(companion, cwd, jobId) {
  const r = runCompanion(companion, ["cancel", jobId, "--json"], { cwd });
  if (r.code !== 0) {
    if (/No active job/i.test(r.stderr + r.stdout)) {
      return { status: "not active" };
    }
    return { status: "error", detail: (r.stderr || r.stdout).slice(0, 300) };
  }
  return { status: "cancelled" };
}

// Every job in the workspace store, whatever session launched it.
export function listAllJobs(companion, cwd) {
  const r = runCompanion(companion, ["status", "--json", "--all"], { cwd, dropSession: true });
  if (r.code !== 0) {
    throw new CouncilError("COMPANION_OUTPUT", `status listing failed: ${(r.stderr || r.stdout).slice(0, 300)}`);
  }
  const payload = parseJson(r.stdout, "status listing");
  const jobs = [...(payload.running ?? []), ...(payload.latestFinished ? [payload.latestFinished] : []), ...(payload.recent ?? [])];
  return jobs;
}

export function findJobsByPrefix(companion, cwd, prefix) {
  return listAllJobs(companion, cwd).filter((job) => typeof job.summary === "string" && job.summary.startsWith(prefix));
}
