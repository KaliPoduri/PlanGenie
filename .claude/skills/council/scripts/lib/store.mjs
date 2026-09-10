// Durable state for a council: one JSON file written atomically, plus
// helpers shared by every command. No dependencies beyond Node's stdlib.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const PROTOCOL_VERSION = 13;
export const STATE_FILE = "council.json";
export const LOG_FILE = "LOG.md";

export class CouncilError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    this.extra = extra;
  }
}

// ---------------------------------------------------------------- fault injection
// COUNCIL_FAULT=<label> makes the process exit with code 99 the moment
// `fault(label)` is reached. Tests use it to stop the helper between two
// persistence steps and then check that the next command recovers.
export function fault(label) {
  if (process.env.COUNCIL_FAULT && process.env.COUNCIL_FAULT === label) {
    process.stderr.write(`FAULT INJECTED: ${label}\n`);
    process.exit(99);
  }
}

// ---------------------------------------------------------------- time
export function nowIso() {
  return new Date().toISOString();
}

export function compactStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// ---------------------------------------------------------------- hashing
// Same value as `git hash-object <file>`: sha1 over "blob <len>\0<bytes>".
export function blobHash(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer), "utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

export function hashFile(filePath) {
  return blobHash(fs.readFileSync(filePath));
}

// ---------------------------------------------------------------- atomic IO
function fsyncDir(dir) {
  try {
    const fd = fs.openSync(dir, "r");
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    // Directory fsync is not supported on every platform (Windows); ignore.
  }
}

// Write `content` to `target` so that a reader ever sees either the old file
// or the new one: temp file in the same directory, fsync, rename over.
export function atomicWrite(target, content) {
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(target)}.${process.pid}.${Date.now()}.tmp`);
  const fd = fs.openSync(tmp, "w");
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fault(`before-rename:${path.basename(target)}`);
  let lastError = null;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      fs.renameSync(tmp, target);
      lastError = null;
      break;
    } catch (error) {
      // Windows can refuse the replace briefly while another process holds
      // the file (an indexer, an editor): retry for up to ~2 s.
      lastError = error;
      if (error.code !== "EPERM" && error.code !== "EBUSY" && error.code !== "EACCES") {
        break;
      }
      const until = Date.now() + 100;
      while (Date.now() < until) {
        // busy wait; the helper is synchronous by design
      }
    }
  }
  if (lastError) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw lastError;
  }
  fsyncDir(dir);
}

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function exists(filePath) {
  return fs.existsSync(filePath);
}

// ---------------------------------------------------------------- state
export function statePath(planningDir) {
  return path.join(planningDir, "planning", "council_state", STATE_FILE);
}

export function logPath(planningDir) {
  return path.join(planningDir, "planning", "council_state", LOG_FILE);
}

export function loadState(planningDir) {
  const file = statePath(planningDir);
  if (!fs.existsSync(file)) {
    return null;
  }
  const state = JSON.parse(fs.readFileSync(file, "utf8"));
  if (state.protocol !== PROTOCOL_VERSION) {
    throw new CouncilError(
      "PROTOCOL_MISMATCH",
      `council.json is protocol ${state.protocol}; this helper is protocol ${PROTOCOL_VERSION}`
    );
  }
  return state;
}

// Every transition goes through here: the event is appended to the journal
// and the whole state is replaced atomically, then LOG.md (a rendering) is
// regenerated. LOG.md is never the source of truth.
export function saveState(planningDir, state, event) {
  if (event) {
    state.events.push({ at: nowIso(), ...event });
  }
  state.updatedAt = nowIso();
  atomicWrite(statePath(planningDir), `${JSON.stringify(state, null, 2)}\n`);
  fault("after-state-write");
  atomicWrite(logPath(planningDir), renderLog(state));
}

export function requireState(planningDir) {
  const state = loadState(planningDir);
  if (!state) {
    throw new CouncilError("NO_COUNCIL", `no council.json under ${path.join(planningDir, "planning", "council_state")}`);
  }
  return state;
}

// ---------------------------------------------------------------- rendering
export function statusLine(state) {
  const s = state.status;
  switch (s.state) {
    case "setup":
    case "dispatching":
    case "dispatched":
    case "collected":
    case "merged":
    case "applied":
      return `IN PROGRESS (round ${s.round}, ${s.state})`;
    case "final":
      return `FINAL REVIEW (${s.k}/${s.m})`;
    case "resolved":
      return "FINAL REVIEW (resolved)";
    case "paused":
      return `PAUSED (${statusLine({ status: s.of })})`;
    case "abandoning":
      return "ABANDONING";
    case "handing-off":
      return "HANDING OFF (relay)";
    case "handed-off":
      return `HANDED OFF (relay, round ${s.round}, ${s.stage})`;
    case "abandoned":
      return "ABANDONED";
    case "closed":
      return "CLOSED";
    default:
      return String(s.state).toUpperCase();
  }
}

export function renderLog(state) {
  const lines = [];
  lines.push(`# Council LOG — rendered from council.json (protocol v${state.protocol}); never edit by hand`);
  lines.push("");
  lines.push(`COUNCIL ID: ${state.id}`);
  lines.push(`HARNESS: ${state.harness}`);
  lines.push(`DOCUMENT: ${state.document.absolute} (${state.document.relative})`);
  lines.push(`PLANNING DIR: ${state.planningDir}`);
  lines.push(`JOB ROOT: ${state.jobRoot}`);
  lines.push(`CALLER: ${state.caller.kind === "standalone" ? "standalone" : `${state.caller.name} — resume with ${state.caller.resumeCommand}; adapter ${state.caller.adapterPath}`}`);
  lines.push(`CHECKPOINTS: ${state.checkpoints}`);
  lines.push(`SEATS: ${state.roster.join(", ")}`);
  for (const seat of state.seats) {
    lines.push(`SEAT ${seat.name} (${seat.letter}): kind ${seat.kind}${seat.model ? `, model ${seat.model}` : ""}${seat.agentFile ? `, agent file ${seat.agentFile}` : ""}${seat.waived ? ", waived" : ""}`);
  }
  const a = state.setup.answers;
  lines.push(`EFFORT: ${a.effort ?? "-"}`);
  lines.push(`STOP RULE: ${a.stopRule ? (a.stopRule.type === "percent" ? `agreement >= ${a.stopRule.threshold}%` : "fixed rounds") : "-"}`);
  lines.push(`ROUND LIMIT: ${a.roundLimit ?? "-"}`);
  lines.push(`ROUND TARGET: ${a.roundTarget ?? "-"}`);
  lines.push(`SETUP: ${state.setup.answered}/${state.setup.total} answered`);
  for (const pin of state.pins) {
    lines.push(`AGENT FILE ${pin.seat}: ${pin.file} (was model: ${pin.original.model ?? "-"}, effort: ${pin.original.effort ?? "-"})${pin.restored ? " — restored" : ""}`);
  }
  lines.push(`LEDGER: ${state.ledgerPath ?? "none"}`);
  lines.push(`DOC AT SETUP: ${state.hashes.atSetup}`);
  if (state.rebase) {
    lines.push(`REBASED (${state.rebase.state}): ${state.rebase.hash} — ${state.rebase.at}`);
  }
  lines.push("");
  lines.push("## Events");
  for (const event of state.events) {
    const rest = Object.entries(event)
      .filter(([key]) => key !== "at" && key !== "type")
      .map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`)
      .join(" ");
    lines.push(`- ${event.at} ${event.type}${rest ? ` ${rest}` : ""}`);
  }
  lines.push("");
  lines.push(`STATUS: ${statusLine(state)}`);
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------- misc
export function relativeTo(base, target) {
  return path.relative(base, target).split(path.sep).join("/");
}

export function ensureDirs(planningDir) {
  for (const sub of ["council_state", "packets", "status"]) {
    fs.mkdirSync(path.join(planningDir, "planning", sub), { recursive: true });
  }
}

export function appendLine(filePath, line) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${line}\n`, "utf8");
}

export function lastLine(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  while (lines.length && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  return lines.length ? lines[lines.length - 1].trim() : "";
}
