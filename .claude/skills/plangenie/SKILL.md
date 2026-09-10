---
name: plangenie
description: Use when the user wants to turn a software project idea into a fully-interviewed, council-reviewed implementation plan — triggers on /plangenie, "plan my idea", "interview me about my project", "help me plan this app". Runs the PlanGenie flow with an automated two-model council (Claude + GPT via the Codex plugin).
---

# PlanGenie — Claude Code adapter

## Step 0: Resume check (every invocation, before anything else)

`/plangenie` may be starting a new plan OR continuing one — the file
`planning/CHECKPOINT.md` under the current working directory decides which
(PLANGENIE.md's "State you maintain" defines the `planning/` layout; every
bare file name below lives there). Check for it FIRST, before loading
anything else, so a fresh session spends its context on the plan, not on
re-orientation. A `CHECKPOINT.md` or `council/` sitting at the directory
root instead belongs to a run from before the `planning/` layout: say so
and offer to move them into `planning/` (`council/LOG.md` to
`planning/council_state/`, the rest of `council/` to `planning/packets/`)
before
resuming — never move them silently.

- **`CHECKPOINT.md` exists and its `Status:` is `IN PROGRESS` or `PAUSED`:**
  read it (it is short), state in one line where the run stopped (its `Phase`,
  `Step` and `Next` lines) and AskUserQuestion: **Resume from there
  (recommended)** / **Start over** (the old run's files in `planning/` —
  `PLAN.md`, `UNKNOWNS.md`, `CHECKPOINT.md`, `packets/`,
  `council_state/`, `status/` — are
  moved to `planning/archive-<date-time>/` first; nothing is deleted) /
  **Something else**. **Start over with a live council:** if
  `planning/council_state/LOG.md` exists and its last `STATUS:` is neither
  `CLOSED` nor `ABANDONED`, run the council skill's Abandoning
  procedure (its section 10) BEFORE moving anything — cancel its logged Codex jobs, restore
  the agent files' previous `model:`/`effort:` values, write `STATUS:
  ABANDONED` — and only then archive. Archiving a live LOG.md first would
  leave its jobs running and let the next council record this one's
  temporary pins as the originals. `/plangenie resume` skips
  the question and resumes directly. On resume: load `PLANGENIE.md` (Step 1's
  lookup), then follow its "Pause and resume" section exactly — it lists the
  only files to read per phase; do not read anything else and never rebuild
  state from the transcript. If the checkpoint says Phase 4 with the
  automated council, the council stage comes from `planning/council_state/LOG.md` via the
  council skill's Resuming procedure (its section 9; Step 2) — `CHECKPOINT.md` only mirrors it.
  If the checkpoint's `Council:` line says `relay round N …` (relay chosen
  at the start, or the handoff in Step 2's preflight step 3), LOG.md is
  `HANDED OFF (relay, …)` or absent and is not consulted: follow
  PLANGENIE.md's relay mode from the checkpoint and its `Ledger:` file and
  skip Step 2's override entirely. **Interrupted handoff repair — check
  this BEFORE choosing between the automated and relay branches:** if
  `planning/council_state/LOG.md` exists and its last `STATUS:` is `HANDED
  OFF (relay, …)` while the checkpoint's `Council:` line does NOT yet say
  `relay`, the stop hit between the council skill's handoff write and this
  file's. Rebuild the relay state from LOG.md's `HANDED OFF:` line — set
  `Council:` to `relay round N — awaiting seat <its "next seat">` and
  `Ledger:` to the ledger path it names — write CHECKPOINT.md, then take
  the relay branch. Never take the automated branch on a `HANDED OFF`
  LOG.md (the council skill refuses to resume it and would send the user
  back here).
  **`Phase: 4` with LOG.md's last `STATUS:` `CLOSED`** (the checkpoint's
  `Council:` line says `closed`) means the council finished but Phase 5
  never ran — the stop came between the council's close and the final
  plan: run the council skill's close-out check (its section 10 — it
  commits a closing write left uncommitted), then go straight to Step 3
  (Phase 5). Never treat it as a completed
  council to archive or as a new council to set up.
- **`Status: FINISHED`:** say the plan was finished on the recorded date and
  AskUserQuestion: revise this plan (re-enter Phase 4 or edit) / start a new
  plan (ask for a different folder, or archive as above) / nothing.
- **No `CHECKPOINT.md`:** a new run. `/plangenie resume` with no checkpoint:
  say there is nothing to resume in this directory (name it) and stop.

A run that ended abruptly (Esc, Ctrl+C, /clear, a crash, a usage cutoff)
shows `Status: IN PROGRESS` — resume it exactly like a paused one; the
checkpoint is at most one step old (PLANGENIE.md's write cadence). Any stop
is a pause: never tell the user they should have typed `pause` first.

## Step 1: Load the core prompt

Read `PLANGENIE.md`:
1. First look in this skill's own directory (`~/.claude/skills/plangenie/PLANGENIE.md` — the user-level skills directory, not the project's `.claude/`).
2. If not there, a copy in the project root may exist — use it only if the user confirms that copy is the one they want.
3. If missing in both, ask the user where it is. Do NOT reconstruct it from memory.
4. **Drift check:** if a `PLANGENIE.md` also exists in the project root and differs from the copy loaded (`cmp -s`, or compare hashes), say which copy was loaded and which is newer, and AskUserQuestion which to use — in this repository the post-commit hook syncs the personal copy only on commit, so an uncommitted edit leaves the two apart. Then confirm the loaded copy's marker line reads `plangenie-core: v1` (this adapter was written against it); a different or missing marker means the core or the adapter needs review — say so and stop.

Before the first write: state the absolute path of the `planning/` folder
you are about to write into (created under the current working directory if
missing). If `PLAN.md`, `UNKNOWNS.md` or `CHECKPOINT.md` already exist there
and this session did not create them (and Step 0 did not already resolve
them), ask before overwriting — they may belong to an earlier run.

Follow PLANGENIE.md exactly — all Hard Rules, Phases 0–3 and 5 unchanged — with
these Claude Code specifics:
- Keep `PLAN.md` and `UNKNOWNS.md` as real files directly in `planning/`;
  update them at the cadence PLANGENIE.md defines (topic boundaries and
  before every phase transition or long-running step).
- Keep `planning/status/next_session.md` and `planning/status/progress.md`
  exactly as PLANGENIE.md's layout defines them (the hand-off paragraph,
  and one appended line per milestone). The council skill writes both each
  round; outside the council, PlanGenie writes them at every phase boundary
  and on pause.
- Keep `CHECKPOINT.md` as a real file too, rewritten at EVERY state change
  exactly as PLANGENIE.md's "Pause and resume" section defines (question
  asked, answer recorded, echo-check issued or answered, phase or step
  change, council stage change, final-review verdict). It is small; the cost is
  one short write per step, and it is what lets a stop at any moment resume
  from that exact step.
- Use the AskUserQuestion tool for multiple-choice interview questions, for
  the council's setup questions, and for the final-review verdicts on open
  items (there are no per-refinement verdicts). The user may answer any of
  them with `pause` (via "Other"), or reply `pause` as a plain message when
  PlanGenie is waiting on them; follow PLANGENIE.md's pause procedure and
  STOP — no further question in that turn. In Phase 4 with the automated
  council, the council skill's pause procedure (its section 9) runs first
  (it records the state of any seat in flight), then the PLANGENIE.md pause
  procedure writes `CHECKPOINT.md`.
- **Any interrupt is a pause.** While PlanGenie is working — above all
  during a council round, which is one long turn — the user cannot type
  anything it will act on; Esc (or Ctrl+C, closing the window, /clear, a
  crash) is the stop, and `CHECKPOINT.md` plus `planning/council_state/LOG.md` are at most
  one step stale. Tell the user this once, when the interview starts, in
  one sentence: "press Esc to stop at any time; run `/plangenie resume` to
  continue" (the council skill's Setup preface repeats it with the
  GPT-reviewer caveat). Never say the user should have typed `pause` first.
- After a `pause` or an interrupt, `resume` or `continue` in the same
  session goes through Step 0's resume path (re-read `CHECKPOINT.md`; do not
  trust memory). In a fresh session the user runs `/plangenie` or
  `/plangenie resume` in the same directory.

## Step 2: Phase 4 override — automated council (replaces relay mode)

**Mechanics come from the council skill; content comes from PLANGENIE.md.
This step adds only what PlanGenie changes.** Read the council skill and
follow it exactly — its state table (section 4) is authoritative. Find it
in this order and say which copy you are using:
1. the copy bundled with the project: `.claude/skills/council/SKILL.md`
   under the project root (it ships in this repo, so a clone has it);
2. the personal install: `~/.claude/skills/council/SKILL.md`.
This adapter was written against the marker `council-protocol: v11`; a
different or missing marker means the adapter needs review — say so and
stop. If the council skill is missing in both places, say so and run
PLANGENIE.md relay mode instead; never improvise dispatch mechanics.

**Preflight (before round 1), in this order:**
1. **Classify — nothing is moved, cancelled or written here.** If
   `planning/council_state/LOG.md` exists: `HANDED OFF` → Step 0's relay
   branch (this override does not run); `CLOSED` while `CHECKPOINT.md`
   says `Phase: 4` → the council finished without Phase 5: run the
   council skill's close-out check (section 10), then Step 3; any other
   state → a live council: the council skill's Resuming procedure
   (section 9) continues it, and a finished round is not a finished
   council. If the user declares a live run abandoned, note it for step
   4. Files under `planning/packets/` or `planning/council_state/` with
   no LOG.md are a completed foreign run: everything at the root of both
   folders is moved in step 4.
2. **Read-only environment checks:** the council skill's Setup step 2
   (companion resolved with the `printf` + `sort -V` snippet, never `ls`;
   smoke test; `node` runs), the agent files resolved per its Setup step
   0 (project `.claude/agents/` first, then `~/.claude/agents/`), and the
   `CHECKPOINTS:` decision — if the project root is not a git repository,
   AskUserQuestion now: `git init` it (then `git`) or `files-only`. A
   `LAUNCH FAILURE` here is a failure before any council exists (override
   3a).
3. **Setup questions = consent:** the council skill's Setup step 3 (its
   two AskUserQuestion calls and preface). Each answer is written to
   `CHECKPOINT.md`'s `Council: setup (…)` line the moment it arrives, so
   a stop between the two calls loses nothing and a resume asks only the
   missing question. **No LOG.md exists yet**, so a `pause` here is
   PLANGENIE.md's pause procedure alone — the council skill's pause runs
   only once LOG.md exists. Nothing is created, moved or pinned before
   all five answers are in.
4. **Only then create and move artifacts:** for an abandoned live run,
   the council skill's Abandoning procedure first (section 10); create
   `planning/packets/` and `planning/council_state/` if missing; move a
   previous COMPLETED run's files (LOG.md `CLOSED` / `ABANDONED`, or the
   no-LOG.md foreign run) to `planning/packets/archive-<date-time>/` and
   `planning/council_state/archive-<date-time>/` (same timestamp), and
   include the moved files' old paths in the next checkpoint commit so
   their deletion is staged. Then write LOG.md once, complete, from the
   answers in `CHECKPOINT.md` (the council skill's Setup step 4) with
   `CALLER: plangenie — resume with /plangenie resume; adapter <absolute
   path of this SKILL.md>` and the `CHECKPOINTS:` value from step 2, and
   only then pin the agent files (its Setup step 5).

**Overrides:**

1. **Rounds:** the round limit and stop rule are the Setup answers
   (defaults 5 and agreement ≥ 95%); PlanGenie sets no separate cap.
2. **Packet content** is PLANGENIE.md Phase 4's: self-contained, the FULL
   current tagged plan and the UNKNOWNS register embedded (never a summary
   or diff), the five critique criteria with the fabrication hunt, and the
   council skill's rounds-2+ verdict and settled-list instructions. The
   relay instructions (print the packet, ask the user to courier it) do
   NOT apply: packets exist only as `planning/packets/` files.
3. **If the Codex seat is unavailable**, two situations:
   (a) **before LOG.md exists** (preflight step 2 fails, or the plugin is
   not installed): no council has started, so nothing is handed off.
   AskUserQuestion — Claude-only (continue the preflight; LOG.md gets
   `SEATS: claude, claude-2`) or relay (`Council: relay round 1 —
   awaiting seat 1` in CHECKPOINT.md; no LOG.md is ever written, no pins
   touched; from then on Step 0's relay branch applies). Say plainly that
   Claude-only loses the cross-model check.
   (b) **an initialised council** (a dispatch or job failed): the council
   skill's seat-failure rule (section 6, step 3) asks the question and
   logs the choice. PlanGenie adds a third option, **relay**: run the
   council skill's Handing-off procedure (section 10) — it cancels the
   jobs, restores the pins, writes the handoff ledger and the `HANDED
   OFF:` line — then set CHECKPOINT.md's `Council:` line to `relay round
   N — awaiting seat <the line's "next seat">` and its `Ledger:` line to
   `planning/packets/handoff-ledger.md`, and continue PLANGENIE.md relay
   mode from the files in `planning/packets/`: the round's packet is what
   the user carries, a complete critique on disk is that seat's review,
   and IDs, ledger, stop rule, round limit and round number carry over.
   Every later resume follows Step 0's relay branch.
   Claude-only seats are fresh subagents with no shared context, pinned
   as the council skill says; if an agent file is missing from both
   locations the `general-purpose` fallback runs with an explicit
   different `model`, and the user is told the seat runs at session
   effort without an enforced read-only boundary.
4. **Tags and the register.** Applied edits are tagged `[CANDIDATE]
   (council-agreed: <ids>)`, or `[CONFIRMED] (verified: <source>,
   <date>; council-agreed: <ids>)` only when a seat verified the claim
   with a tool and named the source — never `[CONFIRMED] (user
   approved)` (Hard Rule 1). An edit that touches a `[USER] (Qn)` or
   `[CONFIRMED] (user approved, …)` line is a user-decision point
   (council Hard rule 8), judged at the final review. Keep UNKNOWNS.md in
   sync after every apply: agreed items leave the register; deadlocked,
   open-verification and user-decision items are noted as open; a claim a
   seat marked UNVERIFIABLE that no seat can check becomes an unresolved
   verification obligation there.
5. **Checkpoint commits** use the council skill's path list plus
   `planning/PLAN.md planning/UNKNOWNS.md planning/CHECKPOINT.md`, under
   its existing-paths rule; never `planning/*/archive-*/`.
6. **Final review:** open items are asked as the council skill says
   (there are no per-refinement verdicts); a chosen resolution is tagged
   `[CONFIRMED] (user approved, final review item i)` — `i` the item's own
   number, unique across cycles — and every item left open is recorded in
   PLAN.md's Remaining Unknowns as `[OPEN]` at ANY exit. "Run more
   rounds" is the council skill's reopen transition; on "accept", its
   close-out, then Step 3.
7. **Pause and resume inside the council:** every interrupt is a pause.
   The council skill's pause procedure runs first (it records seats in
   flight and writes `PAUSED (…)` to LOG.md), THEN PLANGENIE.md's pause
   procedure writes `CHECKPOINT.md` (`Phase: 4`, `Council:` mirroring
   LOG.md's STATUS, `Ledger:` equal to LOG.md's `LEDGER:`) and prints the
   receipt, naming LOG.md's `PLANNING DIR` as the place to start a fresh
   session. Resuming (Step 0, or `/council resume`, which routes back here
   through LOG.md's `CALLER:` line) reads only what the council skill's
   Resuming step 5 lists; `CHECKPOINT.md` mirrors LOG.md and never
   overrides it for the council stage. Setup answers and final-review
   verdicts already logged are never re-asked.

## Step 3: Finish

Run Phase 5 exactly as PLANGENIE.md says: final PLAN.md ending with the
"Instructions for the implementing agent" block, and UNKNOWNS.md up to date.
Then set `CHECKPOINT.md` to `Status: FINISHED` with the finish date and the
readiness verdict, so a later `/plangenie` in this directory offers to revise
rather than resume.
