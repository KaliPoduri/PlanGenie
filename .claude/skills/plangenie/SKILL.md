---
name: plangenie
description: Use when the user wants to turn a software project idea into a fully-interviewed, council-reviewed implementation plan — triggers on /plangenie, "plan my idea", "interview me about my project", "help me plan this app". Runs the PlanGenie flow with an automated two-model council (Claude + GPT via the Codex plugin).
---

# PlanGenie — Claude Code adapter

## Step 0: Resume check (every invocation, before anything else)

`/plangenie` may be starting a new plan OR continuing one — the file
`CHECKPOINT.md` in the current project directory decides which. Check for it
FIRST, before loading anything else, so a fresh session spends its context on
the plan, not on re-orientation.

- **`CHECKPOINT.md` exists and its `Status:` is `IN PROGRESS` or `PAUSED`:**
  read it (it is short), state in one line where the run stopped (its `Phase`,
  `Step` and `Next` lines) and AskUserQuestion: **Resume from there
  (recommended)** / **Start over** (the old run's `PLAN.md`, `UNKNOWNS.md`,
  `CHECKPOINT.md` and `council/` are moved to `plangenie-archive-<date-time>/`
  first — nothing is deleted) / **Something else**. `/plangenie resume` skips
  the question and resumes directly. On resume: load `PLANGENIE.md` (Step 1's
  lookup), then follow its "Pause and resume" section exactly — it lists the
  only files to read per phase; do not read anything else and never rebuild
  state from the transcript. If the checkpoint says Phase 4 with the
  automated council, the council stage comes from `council/LOG.md` via the
  council skill's Resuming section (Step 2) — `CHECKPOINT.md` only mirrors it.
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

Before the first write: state the absolute project directory you are about to
write into. If `PLAN.md`, `UNKNOWNS.md` or `CHECKPOINT.md` already exist there
and this session did not create them (and Step 0 did not already resolve
them), ask before overwriting — they may belong to another project or an
earlier run.

Follow PLANGENIE.md exactly — all Hard Rules, Phases 0–3 and 5 unchanged — with
these Claude Code specifics:
- Keep `PLAN.md` and `UNKNOWNS.md` as real files in the project root; update
  them at the cadence PLANGENIE.md defines (topic boundaries and before
  every phase transition or long-running step).
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
  crash) is the stop, and `CHECKPOINT.md` plus `council/LOG.md` are at most
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

Read `~/.claude/skills/council/SKILL.md` and follow its Hard rules, Setup,
Round protocol, Stopping and pausing, Resuming, and Cancelling sections exactly. The
council skill text is authoritative for mechanics EXCEPT where the numbered
overrides below contradict it — the overrides win. Do not paraphrase the
mechanics here or from memory: read them. This adapter was written against
the council skill's marker line `council-protocol: v5`; if that file shows a
different version (or no marker), stop and tell the user the adapter needs
review before running a council.

If the council skill file is missing on this machine, say so and switch to
PLANGENIE.md relay mode. Do not improvise dispatch mechanics.

**Preflight (before round 1), in this order:**
1. **Resume check first (classify only — nothing is moved, cancelled or
   written in this step):** if `council/LOG.md` exists and its last `STATUS:`
   line is not `CLOSED` or `ABANDONED` — `IN PROGRESS (…)` and `PAUSED (…)`
   both count — (or it has no `STATUS:` line but shows a dispatched round
   without recorded results), this is an interrupted or paused run —
   follow the council skill's Resuming section, which also covers a job the
   plugin's session cleanup has since deleted. (A run resumed through Step 0
   normally lands here with `CHECKPOINT.md` already read; LOG.md still wins
   for the council stage.) A finished round is NOT a
   finished council. Do NOT archive or overwrite anything. If the user
   declares the interrupted run abandoned, note that decision now; the
   cancellation of outstanding jobs and the `STATUS: ABANDONED` LOG write
   happen in step 4 — the run then counts as completed for archival. If
   `council/` has files but no LOG.md, classify it as a completed foreign
   run: ALL its root contents, whatever their names, are moved in step 4 —
   this branch needs no LOG.md evidence and is not limited to step 4's named
   file set.
2. **Read-only environment checks:** resolve the companion path with the
   council skill's alias-independent snippet (`printf` + `sort -V`, never
   `ls`), confirm the file exists and `node "$COMPANION" status --json` exits
   0 (the smoke test that catches a broken path before any packet is written;
   it needs no auth), confirm `node` runs, confirm the `council-claude-seat`
   and `council-claude-seat-2` agent files exist in `~/.claude/agents/`, and
   check whether the project root is a git repository. (No live Codex auth probe — the first dispatch is the auth
   test, and override 3 handles that failure.)
3. **Setup questions = consent:** run the council skill's Setup questions
   (Claude seat model, Codex seat model, effort, stop rule, round limit) —
   its one-sentence preface carries the time warning (minutes to tens of
   minutes per Codex round; durations recorded in earlier LOG.md files are
   the best local estimate; a full council can exceed an hour) and says the
   seats will debate on their own. Answering them is the consent; nothing is
   created, moved, or written before the answers are in. Then pin the Claude
   seat agent files exactly as the council skill's Setup step 2 says.
4. **Only then create/move artifacts:** perform the actions classified in
   step 1 — for an abandoned run, cancel its outstanding jobs and write its
   `STATUS: ABANDONED` line first; create `council/` if missing; if it holds
   files from a previous COMPLETED run (LOG.md `STATUS: CLOSED` or
   `ABANDONED` — never merely "last round finished" — or the no-LOG.md
   foreign-run case from step 1), move
   that run's packets, critiques, and LOG.md together to
   `council/archive-<date-time>/` (timestamped — same-day reruns must not
   collide), and stage the git deletions of the moved files in the next
   commit — the old paths were committed, and nothing else will ever stage
   their removal (staging a deletion at `council/round-1-packet.md` does not
   violate the archive-*/ exclusion). If the project root is not a git repository, AskUserQuestion —
   `git init` it, or run with file-only checkpoints (still write
   `council/LOG.md` and next_session.md each round; skip the commit).

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
   packets exist only as `council/` files read by the seats.
3. **If the Codex seat is unavailable** — either launch failure (the
   companion path resolves to nothing or `task --background` errors out;
   there is no job id, so no `status` check is possible) or job failure
   (empty result or error confirmed via `status <job-id>`; a dead poll loop
   is NOT an empty result): AskUserQuestion — continue with a Claude-only
   council, or switch to PLANGENIE.md relay mode. Say plainly that
   Claude-only loses the cross-model check. Claude-only means BOTH seats are
   fresh Claude subagents with no shared context: seat 1 via
   `council-claude-seat` (pinned at Setup to the chosen model and effort,
   read-only tools), seat 2 via `council-claude-seat-2` (pins a DIFFERENT
   Claude model, the same effort and read-only tools), each with the explicit `model:` on the
   Agent call. Only if an agent file is missing fall back to `general-purpose`
   with an explicit different `model`, and say plainly that this seat runs at
   session effort and WITHOUT an enforced read-only tool boundary. If only one
   Claude model is available, say plainly the council is single-model. Record
   each seat's actual verification capabilities (its tools) in LOG.md rather
   than a blanket label. The round protocol is otherwise unchanged.
4. **Merge, tally and apply per the council skill's step 4 — the seats
   decide, not the user.** No per-refinement AskUserQuestion. An edit the
   seats agreed on is applied to PLAN.md at once and tagged `[CANDIDATE]
   (council-agreed: <point ids>)` — or `[CONFIRMED] (verified: <source>,
   <date>)` only when a seat actually verified the claim with a tool and
   named the source in its critique — never `[CONFIRMED] (user approved)`
   (Hard Rule 1: the user did not approve it). Route every claim a seat
   marked UNVERIFIABLE to the seat that can check it in the next packet, or
   record it in UNKNOWNS.md as an unresolved verification obligation. If a
   seat left a point unanswered, re-send that seat's packet AT MOST ONCE per
   round; if the verdict is still missing, the point is deadlocked and the
   seat failed for the round; do not loop. Keep UNKNOWNS.md in sync after
   every apply (agreed items leave the register, deadlocked items are noted
   as open). Round commits (and pause commits) are made
   BY explicit pathspec — `git commit -m "..." -- PLAN.md UNKNOWNS.md
   CHECKPOINT.md council/LOG.md council/round-N-*.md next_session.md
   <archived paths whose deletion this run staged>` — never
   `council/archive-*/`, so the user's unrelated staged work is left
   untouched; review the set with `git status --short -- <the same paths>`
   first.
5. **Exit and final review:** the council skill's stop rule (its step 5)
   decides when the rounds end — there is no another-round question at
   round checkpoints, only the one-paragraph round summary. Then run the
   council skill's Final review: write `council/FINAL.md`, show the full
   current PLAN.md, ask the open items only (each with the seats' positions
   as options plus "leave open"), and the one closing question (accept, or
   run more rounds). A resolution the user picks is applied and tagged
   `[CONFIRMED] (user approved)`; every item left open is recorded in
   PLAN.md's Remaining Unknowns as `[OPEN]` — at ANY exit, an early stop
   included. Then Step 3.
6. **Pause and resume inside the council:** any interrupt (Esc, Ctrl+C,
   session end, a crash) is a pause — the council skill's "Stopping and
   pausing" section says what happens to seats in flight, and Step 0 or
   `/council resume` continues from `council/LOG.md`. The typed word
   `pause` (at a setup question, a final-review verdict, a fallback choice,
   or as the first message after an Esc) runs that same section — which
   records the state of any Codex job, writes `STATUS: PAUSED (round N,
   <stage>)` and the `RESUME:` line to `council/LOG.md`, and commits — and
   THEN PLANGENIE.md's pause procedure writes `CHECKPOINT.md` (`Phase: 4`,
   `Council:` mirroring the LOG's STATUS) and prints the receipt. Resuming (Step 0, or `/council
   resume` from the same directory) reads `council/LOG.md`, the current
   round's critiques and `council/round-N-merge.md` (or `council/FINAL.md`
   during the final review) only, and continues at the recorded stage —
   setup answers and final-review verdicts already logged are never
   re-asked, and a round whose Codex job was lost is re-dispatched with its
   saved packet.

## Step 3: Finish

Run Phase 5 exactly as PLANGENIE.md says: final PLAN.md ending with the
"Instructions for the implementing agent" block, and UNKNOWNS.md up to date.
Then set `CHECKPOINT.md` to `Status: FINISHED` with the finish date and the
readiness verdict, so a later `/plangenie` in this directory offers to revise
rather than resume.
