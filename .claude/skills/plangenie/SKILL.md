---
name: plangenie
description: Use when the user wants to turn a software project idea into a fully-interviewed, council-reviewed implementation plan — triggers on /plangenie, "plan my idea", "interview me about my project", "help me plan this app". Runs the PlanGenie flow with an automated two-model council (Claude + GPT via the Codex plugin).
---

# PlanGenie — Claude Code adapter

## Step 1: Load the core prompt

Read `PLANGENIE.md`:
1. First look in this skill's own directory (`.claude/skills/plangenie/PLANGENIE.md`).
2. If not there, look in the project root.
3. If missing in both, ask the user where it is. Do NOT reconstruct it from memory.

Follow PLANGENIE.md exactly — all Hard Rules, Phases 0–3 and 5 unchanged — with
these Claude Code specifics:
- Keep `PLAN.md` and `UNKNOWNS.md` as real files in the project root; update
  them after every change.
- Use the AskUserQuestion tool for multiple-choice interview questions and for
  accept/reject verdicts on council refinements.

## Step 2: Phase 4 override — automated council (replaces relay mode)

Cap: **3 rounds maximum.** One round is:

1. **Build the Council Review Packet** exactly as PLANGENIE.md Phase 4 defines
   it: self-contained, reviewer needs zero prior context, includes the
   fabrication-hunt instruction, contains the full current plan with tags.
2. **Claude seat:** spawn a fresh subagent — Agent tool, `subagent_type:
   "general-purpose"` — whose prompt is ONLY the packet. A fresh subagent has
   fresh eyes; do not review inline in this conversation. Spawn both seats in
   the same message so they run in parallel.
3. **GPT seat:** spawn Agent tool, `subagent_type: "codex:codex-rescue"`, with
   this prompt shape:

   "READ-ONLY review — do not edit or create any files, no code changes,
   review only. [then the full packet]"

   The read-only wording is mandatory: without it the Codex runtime defaults to
   a write-capable run. If the result is empty or an error (plugin missing,
   Codex CLI not signed in), tell the user the GPT seat is unavailable and ask
   (AskUserQuestion): continue with a Claude-only council, or switch to
   PLANGENIE.md relay mode.
4. **Cross-examination (rounds 2 and 3 only):** include the other reviewer's
   previous critique in each packet under "A previous reviewer said: …" so each
   seat can rebut or agree.
5. **Merge and verdict:** merge the two critiques. For each refinement the
   reviewers converge on, present it to the user via AskUserQuestion with
   plain-language pros and cons. Apply accepted changes to PLAN.md.
6. **Exit check:** stop when (a) neither reviewer has major concerns AND the
   user is satisfied, or (b) 3 rounds are done. Concerns still standing at the
   cap are recorded in PLAN.md's Remaining Unknowns as `[OPEN]`.

## Step 3: Finish

Run Phase 5 exactly as PLANGENIE.md says: final PLAN.md ending with the
"Instructions for the implementing agent" block, and UNKNOWNS.md up to date.
