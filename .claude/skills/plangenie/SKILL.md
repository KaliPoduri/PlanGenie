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
  `CLOSED` nor `ABANDONED`, run the council skill's "Abandoning a council"
  procedure BEFORE moving anything — cancel its logged Codex jobs, restore
  the agent files' previous `model:`/`effort:` values, write `STATUS:
  ABANDONED` — and only then archive. Archiving a live LOG.md first would
  leave its jobs running and let the next council record this one's
  temporary pins as the originals. `/plangenie resume` skips
  the question and resumes directly. On resume: load `PLANGENIE.md` (Step 1's
  lookup), then follow its "Pause and resume" section exactly — it lists the
  only files to read per phase; do not read anything else and never rebuild
  state from the transcript. If the checkpoint says Phase 4 with the
  automated council, the council stage comes from `planning/council_state/LOG.md` via the
  council skill's Resuming section (Step 2) — `CHECKPOINT.md` only mirrors it.
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
  plan: go straight to Step 3 (Phase 5). Never treat it as a completed
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
  council, the council skill's "Stopping and pausing" section runs first
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

**Mechanics come from the council skill; content comes from PLANGENIE.md.**

Read the council skill and follow its Hard rules, Setup, Round protocol,
Stopping and pausing, Resuming, and Cancelling sections exactly. Find it in
this order and say which copy you are using:
1. the copy bundled with the project: `.claude/skills/council/SKILL.md`
   under the project root (it ships in this repo, so a clone has it);
2. the personal install: `~/.claude/skills/council/SKILL.md`.
The council skill text is authoritative for mechanics EXCEPT where the
numbered overrides below contradict it — the overrides win. Do not
paraphrase the mechanics here or from memory: read them. This adapter was
written against the council skill's marker line `council-protocol: v10`; if
that file shows a different version (or no marker), stop and tell the user
the adapter needs review before running a council.

If the council skill file is missing in both places, say so and switch to
PLANGENIE.md relay mode. Do not improvise dispatch mechanics. The Codex
plugin (`openai-codex`) is what provides the GPT seat; without it the
council skill's step-3 fallback (Claude-only, or relay) applies.

**Preflight (before round 1), in this order:**
1. **Resume check first (classify only — nothing is moved, cancelled or
   written in this step):** if `planning/council_state/LOG.md` exists and its last `STATUS:`
   line is not `CLOSED`, `ABANDONED` or `HANDED OFF` — `IN PROGRESS (…)` and
   `PAUSED (…)` both count; `HANDED OFF (relay, …)` means the debate
   continues in PLANGENIE.md relay mode from `CHECKPOINT.md` (Step 0), and
   this override does not run — (or it has no `STATUS:` line but shows a dispatched round
   without recorded results), this is an interrupted or paused run —
   follow the council skill's Resuming section, which also covers a job the
   plugin's session cleanup has since deleted. (A run resumed through Step 0
   normally lands here with `CHECKPOINT.md` already read; LOG.md still wins
   for the council stage.) A finished round is NOT a
   finished council. A LOG.md whose last `STATUS:` is `CLOSED` while
   `CHECKPOINT.md` still says `Phase: 4` (not `FINISHED`) is a council
   that closed without Phase 5: skip this preflight and the council
   entirely and go to Step 3 — it is neither a run to archive nor a new
   council to set up. Do NOT archive or overwrite anything. If the user
   declares the interrupted run abandoned, note that decision now; the
   council skill's "Abandoning a council" procedure (cancel outstanding
   jobs, restore the agent pins, write `STATUS: ABANDONED`) runs in step 4
   — the run then counts as completed for archival. If
   `planning/packets/` or `planning/council_state/` has files but no
   LOG.md, classify it as a completed foreign run: ALL the root contents of
   both folders, whatever their names, are moved in step 4 —
   this branch needs no LOG.md evidence and is not limited to step 4's named
   file set.
2. **Read-only environment checks:** resolve the companion path with the
   council skill's alias-independent snippet (`printf` + `sort -V`, never
   `ls`), confirm the file exists and `node "$COMPANION" status --json` exits
   0 (the smoke test that catches a broken path before any packet is written;
   it needs no auth), confirm `node` runs, resolve the `council-claude-seat`
   and `council-claude-seat-2` agent files exactly as the council skill's
   Setup step 0 says (the project's `.claude/agents/` first — they ship in
   this repo — then `~/.claude/agents/`), and
   check whether the project root is a git repository. (No live Codex auth probe — the first dispatch is the auth
   test, and override 3 handles that failure.)
3. **Setup questions = consent:** run the council skill's Setup questions
   (Claude seat model, Codex seat model, effort, stop rule, round limit) —
   its one-sentence preface carries the time warning (minutes to tens of
   minutes per Codex round; durations recorded in earlier LOG.md files are
   the best local estimate; a full council can exceed an hour) and says the
   seats will debate on their own. Answering them is the consent; nothing is
   created or moved before the answers are in — but each answer is written
   to `CHECKPOINT.md`'s `Council: setup (…)` line the moment it arrives
   (PLANGENIE.md's rule), so a stop between the two AskUserQuestion calls
   loses nothing and a resume asks only the missing questions. The agent
   files are NOT pinned yet: that happens in step 4, after LOG.md has
   recorded their previous values.
4. **Only then create/move artifacts:** perform the actions classified in
   step 1 — for an abandoned run, the council skill's "Abandoning a
   council" procedure first (jobs cancelled, agent pins restored, `STATUS:
   ABANDONED` written); create `planning/packets/` and
   `planning/council_state/` if missing; if they hold files from a
   previous COMPLETED run (LOG.md `STATUS: CLOSED` or `ABANDONED` — never
   merely "last round finished" — or the no-LOG.md foreign-run case from
   step 1), move that run's debate files to
   `planning/packets/archive-<date-time>/` and its LOG.md to
   `planning/council_state/archive-<date-time>/` (same timestamp for both;
   same-day reruns must not collide), and include the moved files' old
   paths in the next round commit's `git add` — the old paths were
   committed, and nothing else will ever stage their removal (staging a
   deletion at `planning/packets/round-1-packet.md` does not violate the
   archive-*/ exclusion). Then write `planning/council_state/LOG.md` from the
   answers recorded in `CHECKPOINT.md` (the council skill's Setup step 3 —
   it records the agent files' current `model:`/`effort:` values), with
   its `CALLER:` line set to `CALLER: plangenie — resume with /plangenie
   resume; adapter <absolute path of this SKILL.md>` (so a bare `/council
   resume` on this council routes back through this adapter instead of
   dropping CHECKPOINT.md, UNKNOWNS.md and Phase 5), and only
   then pin the agent files (its Setup step 4). If the project root is not a
   git repository, AskUserQuestion —
   `git init` it, or run with file-only checkpoints (still write
   `planning/council_state/LOG.md` and `planning/status/next_session.md` each
   round; skip the commit).

PlanGenie overrides on top of the council skill's protocol:

1. **Rounds:** the round limit and the stop rule are whatever the user chose
   in the council skill's Setup questions (limit default 5; stop rule default
   agreement ≥ 95%). PlanGenie sets no separate cap.
2. **Packet content** is exactly as PLANGENIE.md Phase 4 defines it:
   self-contained, the FULL current tagged plan embedded (never a summary or
   diff), the five critique criteria including the fabrication-hunt, and —
   rounds 2+ — per-seat packets carrying the other seat's unresolved points as
   a numbered list with the AGREE / AGREE WITH CHANGE / REBUT verdict
   instruction. Content only: PLANGENIE.md's relay instructions — printing
   the packet for the user, asking them to courier it — do NOT apply here;
   packets exist only as `planning/packets/` files read by the seats.
3. **If the Codex seat is unavailable** — either launch failure (the
   companion path resolves to nothing or `task --background` errors out;
   there is no job id, so no `status` check is possible) or job failure
   (empty result or error confirmed via `status <job-id>`; a dead poll loop
   is NOT an empty result): AskUserQuestion — continue with a Claude-only
   council, or switch to PLANGENIE.md relay mode. Say plainly that
   Claude-only loses the cross-model check. **Two situations, two paths.**
   (a) The failure is found BEFORE `planning/council_state/LOG.md` exists —
   preflight step 2's companion smoke test fails, or the plugin is not
   installed: no council has started, so there is nothing to hand off. Ask
   the question then; "relay" enters PLANGENIE.md relay mode directly
   (`Council: relay round 1 — awaiting seat 1` in CHECKPOINT.md, no LOG.md
   is ever written, no pins are touched); "Claude-only" continues the
   preflight and writes LOG.md in step 4 with `SEATS: claude, claude-2`.
   (b) The failure hits an initialised council (LOG.md exists — a dispatch
   or job failed): "Claude-only" is the council skill's fallback (its
   `WAIVED` / `SEATS` lines are logged the moment the user answers), and
   **switching to relay is a
   defined handoff, done before anything else:** run the council skill's
   "Handing a council to relay mode" (cancel the Codex job(s), restore the
   agent pins, `STATUS: HANDED OFF (relay, round N, <stage>)`), then set
   CHECKPOINT.md's `Council:` line to `relay round N — awaiting seat <k>`
   and its `Ledger:` line to the path LOG.md's `LEDGER:` names, and
   continue PLANGENIE.md's relay mode from the files already in
   `planning/packets/`: the round's packet file is what the user carries; a
   complete critique already on disk is that seat's review (the Claude
   seat's counts as seat 1; the failed Codex seat becomes seat 2, the
   external AI the user couriers); point IDs, the ledger, the stop rule,
   the round limit and the round number carry over unchanged. From then
   on every resume follows Step 0's relay branch, never this override. Claude-only means BOTH seats are
   fresh Claude subagents with no shared context: seat 1 via
   `council-claude-seat` (pinned at Setup to the chosen model and effort,
   read-only tools), seat 2 via `council-claude-seat-2` (pins a DIFFERENT
   Claude model, the same effort and read-only tools), each with the explicit `model:` on the
   Agent call. Only if an agent file is missing from BOTH `.claude/agents/`
   and `~/.claude/agents/` fall back to `general-purpose`
   with an explicit different `model`, and say plainly that this seat runs at
   session effort and WITHOUT an enforced read-only tool boundary. If only one
   Claude model is available, say plainly the council is single-model. Record
   each seat's actual verification capabilities (its tools) in LOG.md rather
   than a blanket label. A round with one seat missing follows the council
   skill's single-seat rule: the lone seat's new points are never applied on
   its word alone; they stay carried and reach the user at the final review.
   The round protocol is otherwise unchanged.
4. **Merge, tally and apply per the council skill's step 4 — the seats
   decide, not the user.** No per-refinement AskUserQuestion. An edit the
   seats agreed on is applied to PLAN.md at once and tagged `[CANDIDATE]
   (council-agreed: <point ids>)` — or `[CONFIRMED] (verified: <source>,
   <date>; council-agreed: <point ids>)` only when a seat actually verified
   the claim with a tool and named the source in its critique — never
   `[CONFIRMED] (user approved)` (Hard Rule 1: the user did not approve
   it). Both forms carry the point IDs: they are the marker the council
   skill's reconciliation looks for after an interrupted apply, so a
   verified edit without them cannot be told from a pending one. **An
   agreed edit that changes, weakens, removes or contradicts a `[USER]
   (Qn)` line or a `[CONFIRMED] (user approved, …)` line is never applied
   on the seats' word** (council skill Hard rule 8): it becomes a
   `user decision` point — recorded in the ledger with the conflicting
   line, unresolved in the percentage, never sent back to the seats — and
   the user judges it at the final review ("keep what I said" versus the
   council's change). Every
   claim a seat marked UNVERIFIABLE gets its own point ID (state: open
   verification — it counts as unresolved in the percentage); route it to
   the seat that can check it in the next packet, or record it in
   UNKNOWNS.md as an unresolved verification obligation. If a
   seat left a point unanswered, re-send that seat's packet AT MOST ONCE per
   round; if the verdict is still missing, the point is deadlocked and the
   seat failed for the round; do not loop. Keep UNKNOWNS.md in sync after
   every apply (agreed items leave the register, deadlocked items are noted
   as open). Round 1 applies only what both seats fixed the same way — a
   shared concern with two different fixes is carried, per the council
   skill's step 4 — and every apply goes through the council skill's
   reconciliation on a resume, so an interrupted apply is never repeated.
   Round commits (and pause commits) are made BY explicit pathspec, staged
   first: `git add -- <paths>` then `git commit -m "..." -- <the same
   paths>`, where the paths are `planning/PLAN.md planning/UNKNOWNS.md
   planning/CHECKPOINT.md planning/council_state/LOG.md
   planning/packets/round-N-*.md planning/status/next_session.md
   planning/status/progress.md <old paths of files this run archived>`
   (the `git add` is what makes new packet and critique files known to git
   and stages the archived deletions; add `planning/packets/reopen-*-ledger.md`
   whenever such a file exists — a pathspec that matches nothing makes
   `git add` fail) — never `planning/*/archive-*/`, so
   the user's unrelated staged work is left untouched; review the set with
   `git status --short -- <the same paths>` first.
5. **Exit and final review:** the council skill's stop rule (its step 5)
   decides when the rounds end — there is no another-round question at
   round checkpoints, only the one-paragraph round summary. Then run the
   council skill's Final review: write `planning/packets/FINAL.md`, show the full
   current PLAN.md, ask the open items only (each with the seats' positions
   as options plus "leave open"), and the one closing question (accept, or
   run more rounds). The open items include every point still carried when
   the rounds stopped, minor ones and refinements included — FINAL.md's
   closing ledger lists every point ID with its final state, updated at
   every verdict and rewritten before `FINAL REVIEW (resolved)`, per the
   council skill's Final review step 3. A resolution
   the user picks is applied and tagged `[CONFIRMED] (user approved, final
   review item i)` — `i` is the item's own number, never the council
   skill's `k/m` counter; item numbers never restart within a council, so a
   second final review continues from the first one's last number; every
   item left open is recorded in PLAN.md's Remaining Unknowns as `[OPEN]`
   — at ANY exit, an early stop included. The council skill's `FINAL
   REVIEW (resolved)` stage separates "resolutions applied" from "closing
   question pending". If the user answers the closing question with "run
   more rounds", follow the council skill's reopen transition (Final
   review step 4): the reopen ledger is written and `LEDGER:` re-pointed
   before any packet, the items the user left open become carried again,
   the `[OPEN]` lines they got in Remaining Unknowns stay until the point
   is settled or judged again, and round numbering continues. Then, after
   "accept", Step 3.
6. **Pause and resume inside the council:** any interrupt (Esc, Ctrl+C,
   session end, a crash) is a pause — the council skill's "Stopping and
   pausing" section says what happens to seats in flight, and Step 0 or
   `/council resume` continues from `planning/council_state/LOG.md`. The typed word
   `pause` (at a setup question, a final-review verdict, a fallback choice,
   or as the first message after an Esc) runs that same section — which
   records the state of any Codex job, writes `STATUS: PAUSED (round N,
   <stage>)` and the `RESUME:` line to `planning/council_state/LOG.md`, and commits — and
   THEN PLANGENIE.md's pause procedure writes `CHECKPOINT.md` (`Phase: 4`,
   `Council:` mirroring the LOG's STATUS) and prints the receipt — the
   receipt names the directory `planning/` sits under (LOG.md's `PLANNING
   DIR`, the directory PlanGenie was started in), never the git root, as
   the place to start a fresh session. Resuming (Step 0, or `/council
   resume` from the same directory) reads `planning/council_state/LOG.md`, the
   merge file its `LEDGER:` line names (the newest one — the previous
   round's until the current round is merged, or the reopen ledger after
   "run more rounds"; the cumulative ledger of
   every point so far, and the only place a frozen point's arguments
   survive), the current round's packet(s) and whichever of its critiques
   are on disk (or `planning/packets/FINAL.md` during the final review) —
   nothing else — and continues at the recorded stage; keep
   `CHECKPOINT.md`'s `Ledger` line equal to LOG.md's `LEDGER:` at every
   mirror. Setup answers and final-review verdicts already logged are never
   re-asked; a round whose Codex job was lost is re-dispatched with its
   saved packet, but only if that packet ends with `END COUNCIL REVIEW
   PACKET` — a
   half-written one is rewritten first; and reconciliation of an
   interrupted apply compares only the current stage's own hash pair.

## Step 3: Finish

Run Phase 5 exactly as PLANGENIE.md says: final PLAN.md ending with the
"Instructions for the implementing agent" block, and UNKNOWNS.md up to date.
Then set `CHECKPOINT.md` to `Status: FINISHED` with the finish date and the
readiness verdict, so a later `/plangenie` in this directory offers to revise
rather than resume.
