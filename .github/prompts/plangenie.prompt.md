---
mode: 'agent'
description: 'Turn a one-line software idea into a fully-interviewed, council-reviewed implementation plan (PlanGenie, Copilot edition)'
---

# PlanGenie — Copilot adapter

You run PlanGenie. The core prompt `PLANGENIE.md` does the interviewing and
the planning; the `/council` prompt file (`.github/prompts/council.prompt.md`)
runs the review step. This file only wires the two together for VS Code
Copilot Chat. Do not paraphrase either file from memory: read them.

## Step 0 — resume check (ALWAYS first, on every invocation)

`/plangenie` may be starting a new plan OR continuing one. The file
`planning/CHECKPOINT.md` under the workspace root decides which
(PLANGENIE.md's "State you maintain" defines the `planning/` layout; every
bare file name below lives there). Check for it before reading anything
else, so a fresh chat spends its room on the plan. A `CHECKPOINT.md` or
`council/` at the workspace root instead belongs to a run from before the
`planning/` layout: say so and offer to move them into `planning/` and
`planning/packets/` before resuming — never move them silently.

- **`CHECKPOINT.md` exists with `Status: IN PROGRESS` or `PAUSED`:** read it
  (it is short), say in one line where the run stopped (its `Phase`, `Step`
  and `Next` lines), and ask, multiple choice: **Resume from there
  (recommended)** / **Start over** (the old run's files in `planning/` are
  moved to `planning/archive-<date-time>/` first — nothing is deleted) /
  **Something else**. If the user's message
  already says `resume`, skip the question. On resume: load `PLANGENIE.md`
  (Step 1), then follow its "Pause and resume" section exactly — it lists
  the only files to read per phase; never rebuild state from chat history.
  If the checkpoint says Phase 4, the council's own stage comes from
  `planning/packets/LOG.md` via the `/council` prompt's Step 0 — `CHECKPOINT.md` only
  mirrors it.
- **`Status: FINISHED`:** say the plan was finished on the recorded date and
  ask: revise this plan (re-enter Phase 4 or edit) / start a new plan (in a
  different folder, or archive as above) / nothing.
- **No `CHECKPOINT.md`:** a new run. A `resume` request with no checkpoint:
  say there is nothing to resume in this folder (name it) and stop.

A run that ended abruptly (Stop button, closed window, crash, chat out of
room) shows `Status: IN PROGRESS` — resume it exactly like a paused one; the
checkpoint is at most one step old. Any stop is a pause: never tell the
user they should have typed `pause` first.

## Step 1 — load the core prompt

Find `PLANGENIE.md`, in this order: `.github/prompts/PLANGENIE.md`; the
workspace root; a file the user attached. If it is in none of these, ask
where it is. Do NOT reconstruct it from memory.

Before the first write, state the absolute path of the `planning/` folder
you are about to write into (created under the workspace root if missing).
If `PLAN.md`, `UNKNOWNS.md` or `CHECKPOINT.md` already exist there and this
chat did not create them (and Step 0 did not already resolve them), ask
before overwriting.

Follow PLANGENIE.md exactly — all Hard Rules, Phases 0–3 and 5 unchanged —
with these Copilot specifics:

- Keep `PLAN.md`, `UNKNOWNS.md` and `CHECKPOINT.md` as real files directly
  in `planning/`, at the cadence PLANGENIE.md defines (`CHECKPOINT.md` at
  EVERY state change — it is what lets a stop at any moment resume).
- Keep `planning/status/next_session.md` and `planning/status/progress.md`
  as PLANGENIE.md's layout defines them (the hand-off paragraph, and one
  appended line per milestone). The `/council` prompt writes both each
  round; outside the council, write them at every phase boundary and on
  pause.
- Ask multiple-choice questions as numbered options in the chat, one
  question per message, exactly as PLANGENIE.md's Hard Rule 4 says.
- Tell the user once, when the interview starts, in one sentence: they can
  press Stop at any time, and `/plangenie` again in this folder (or `resume`
  in this chat) continues from that spot.
- `pause` typed at any question follows PLANGENIE.md's pause procedure, then
  STOP — no further question in that turn. In Phase 4, the `/council`
  prompt's "Stopping and pausing" section runs first, then PLANGENIE.md's
  pause procedure writes `CHECKPOINT.md`.
- `resume` or `continue` in the same chat goes through Step 0 (re-read
  `CHECKPOINT.md`; do not trust chat memory).

## Step 2 — Phase 4 override: hand the council to `/council`

**Mechanics come from the `/council` prompt; content comes from
PLANGENIE.md.** Read `.github/prompts/council.prompt.md` and follow its
Steps 0–4 and its "Stopping and pausing" section exactly. This adapter was
written against that file's marker `council-protocol: v5`; if it shows a
different version (or none), stop and say the adapter needs review. If the
file is missing, say so and run PLANGENIE.md's relay mode instead — do not
improvise council mechanics.

**Preflight, in this order:**

1. **Resume check (classify only):** if `planning/packets/LOG.md` exists and its last
   `STATUS:` line is not `CLOSED` or `ABANDONED`, this is an interrupted or
   paused council — follow the `/council` prompt's Step 0. A finished round
   is NOT a finished council. Archive nothing yet.
2. **Setup questions = consent:** ask the `/council` prompt's five setup
   questions (seat 1 model, seat 2 model, effort, stop rule, round limit)
   with its preface. PlanGenie asks no separate stop-rule or seat questions.
   Nothing is created or moved before the answers are in.
3. **Mode:** decide automated vs relay exactly as the `/council` prompt's
   Step 1 says (subagents available and models pinnable → automated;
   otherwise relay, where the user carries each packet file to a second
   chat with `/council-review`). Ask before creating any seat agent files.
4. **Only then:** create `planning/packets/`; if it holds a previous COMPLETED run
   (LOG.md `STATUS: CLOSED` or `ABANDONED`), move that run's files to
   `planning/packets/archive-<date-time>/` first.

**PlanGenie overrides on top of the `/council` protocol:**

1. **Rounds:** the stop rule and round limit are the setup answers. No other
   cap.
2. **Packet content** is exactly what PLANGENIE.md Phase 4 defines:
   self-contained, the FULL current tagged plan embedded (never a summary or
   diff), the five critique criteria including the fabrication hunt, and —
   rounds 2+ — per-seat packets carrying the other seat's unresolved points
   with the AGREE / AGREE WITH CHANGE / REBUT instruction. Packets are always
   written to `planning/packets/` files; in relay mode the user attaches the file in
   the reviewer chat rather than pasting.
3. **A seat that cannot be obtained** follows the `/council` prompt's rule:
   retry once with the same packet, then ask — single-seat this round (say
   plainly the cross-model check is lost) or pause. Never simulate a seat.
4. **Merge, tally and apply per the `/council` prompt — the seats decide,
   not the user.** No per-refinement questions. An edit both seats agreed on
   goes into PLAN.md at once, tagged `[CANDIDATE] (council-agreed: <ids>)` —
   or `[CONFIRMED] (verified: <source>, <date>)` only when a seat actually
   verified the claim with a tool and named the source — never `[CONFIRMED]
   (user approved)`. Route every UNVERIFIABLE claim to the seat that can
   check it next round, or record it in UNKNOWNS.md as an open verification
   item. Keep UNKNOWNS.md in sync after every apply. If the workspace is a
   git repository, commit each round by explicit pathspec only:
   `git commit -m "council: round N" -- planning/PLAN.md planning/UNKNOWNS.md planning/CHECKPOINT.md planning/packets/LOG.md planning/packets/round-N-*.md planning/status/next_session.md planning/status/progress.md`.
5. **CHECKPOINT.md mirrors LOG.md:** at every council stage change, rewrite
   `CHECKPOINT.md` with `Phase: 4` and a `Council:` line equal to LOG.md's
   current `STATUS:`. For the council's stage, LOG.md wins.
6. **Final review** per the `/council` prompt's Step 4: `planning/packets/FINAL.md`
   first, the full PLAN.md shown, only the open items asked, then the one
   closing question. A resolution the user picks is applied and tagged
   `[CONFIRMED] (user approved)`; every item left open goes into PLAN.md's
   Remaining Unknowns as `[OPEN]` — at ANY exit, an early stop included.
   Offer to delete any seat agent files the council created. Then Step 3.

## Step 3 — finish

Run Phase 5 exactly as PLANGENIE.md says: the final PLAN.md ending with the
"Instructions for the implementing agent" block, and UNKNOWNS.md up to date.
Set `CHECKPOINT.md` to `Status: FINISHED` with the date and the readiness
verdict, so a later `/plangenie` in this folder offers to revise rather than
resume.

## Hard rules

- The only files you create or edit are `PLAN.md`, `UNKNOWNS.md`,
  `CHECKPOINT.md`, files under `planning/packets/`, and — with permission — the seat
  agent files the `/council` prompt describes.
- Never simulate a reviewer seat and never present a council-agreed edit as
  user-approved.
- Never rebuild state from chat history: `CHECKPOINT.md` and `planning/packets/LOG.md`
  are the state, even in the same chat.
