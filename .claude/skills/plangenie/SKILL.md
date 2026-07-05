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

**Mechanics come from the council skill; content comes from PLANGENIE.md.**

Read `~/.claude/skills/council/SKILL.md` and follow its Hard rules, Setup,
Round protocol, and Cancelling section exactly. In brief (the council skill
text is authoritative, not this summary): explicit `model:` on the Claude
seat's Agent call; the Codex seat dispatched with codex-companion.mjs
`task --background` and the READ-ONLY prefix — never via the codex-rescue
subagent; packets written to `council/round-N-packet.md` files, never inlined
in a prompt; ONE background poll loop per Codex job; no raw subagent
transcripts or TaskOutput in main context; checkpoint + git commit after every
round. Each of those rules fixes a real past failure — do not relax them.

If the council skill file is missing on this machine, say so and switch to
PLANGENIE.md relay mode. Do not improvise dispatch mechanics.

PlanGenie overrides on top of the council skill's protocol:

1. **Rounds: 5 maximum** (not the council skill's default 3).
2. **Packet content** is exactly as PLANGENIE.md Phase 4 defines it:
   self-contained, the FULL current tagged plan embedded (never a summary or
   diff), the five critique criteria including the fabrication-hunt, and —
   rounds 2+ — per-seat packets carrying the other seat's unresolved points as
   a numbered list with the AGREE / AGREE WITH CHANGE / REBUT verdict
   instruction.
3. **If the Codex seat is unavailable** (empty result or error — plugin
   missing, CLI signed out): AskUserQuestion — continue with a Claude-only
   council, or switch to PLANGENIE.md relay mode. Say plainly that Claude-only
   loses the cross-model check.
4. **Merge and arbitrate per PLANGENIE.md Phase 4:** tally verdicts, re-send a
   packet if a seat left a point unanswered, present each refinement via
   AskUserQuestion with plain-language pros and cons, and never apply a
   refinement the user has not accepted. Apply accepted changes to PLAN.md.
5. **Exit check:** stop when (a) neither reviewer has major concerns AND the
   user is satisfied, or (b) 5 rounds are done. Concerns still standing at the
   cap are recorded in PLAN.md's Remaining Unknowns as `[OPEN]`.

## Step 3: Finish

Run Phase 5 exactly as PLANGENIE.md says: final PLAN.md ending with the
"Instructions for the implementing agent" block, and UNKNOWNS.md up to date.
