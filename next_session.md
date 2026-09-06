# Next Session — PlanGenie

**Task:** PlanGenie built and council-tested. Deliverables committed (2026-07-04).
**Artifacts:** PLANGENIE.md (root), .claude/skills/plangenie/SKILL.md, README.md.

**Status:** 2026-09-07 (latest): council protocol v7 — the 7 numbered findings of `codex_review.md`'s REVIEW ITERATION 2 plus its two README discrepancies are implemented across PLANGENIE.md, both Claude skills, the two Copilot prompts and the README: LOG.md `LEDGER:` / CHECKPOINT.md `Ledger:` name the newest merge file and every resume loads it (a stop early in round N no longer loses round N-1's frozen points); CHECKPOINT.md `Unflushed answers` carries complete answer-log entries (question, options, answer, confirmation status) so the `(Qn)` trail survives a stop between batched writes; council-verified edits are `[CONFIRMED] (verified: <source>, <date>; council-agreed: <ids>)` so reconciliation can see them; the percentage denominator includes open-verification points and the percentage stop predicate also requires no unexamined single-seat point; `Phase: 4` + council `CLOSED` goes straight to Phase 5 in both the Claude and Copilot adapters; rounds 2+ packets list every settled/frozen ID ("do not raise again") and a restated point is logged as a duplicate under the existing ID; FINAL.md's ledger is updated at every verdict and rewritten before `FINAL REVIEW (resolved)`; README now says five setup questions in the automated councils and names the agent files as the one thing written outside `planning/`. NOT yet field-tested. Still not done: the comparative evaluation both reviews suggested. Previous: 2026-09-07 (later): council protocol v6 — the 12 numbered findings of `codex_review.md` plus its compatibility note are implemented across PLANGENIE.md, both Claude skills, the three Copilot prompts and the README: round-1 agreement requires the same fix; merge files are the cumulative point ledger; applies reconcile by marker/hash (`DOC BEFORE/AFTER APPLY`) so an interrupted apply is never repeated; new `FINAL REVIEW (resolved)` stage; every point ID ends applied/withdrawn/rejected/open; single-seat and no-concerns policies; Setup writes LOG.md before pinning agent files and saves each answer as given; resume checks the document path; `git add` before pathspec commits; seat agent files now ship in `.claude/agents/`; README Claude install lists council + agents + Codex plugin; Antigravity recipe is a 12k-safe pointer workflow; Copilot prompts use `agent:` front matter. Also from the review's product gaps: `(Qn)` answer references on user-sourced tags with an answer log in UNKNOWNS.md and a two-way self-audit; mandatory Implementation sequence / Dependencies / Acceptance criteria / Verification plan sections; the percentage is presented as debate progress, not confidence. NOT yet field-tested. Not done: the comparative evaluation the review suggested (generated plans vs a plain interview-and-review baseline). Previous: 2026-09-07: council protocol v5 — any interrupt (Esc / session end / crash) is the pause; typed `pause` only at a prompt; wait-or-cancel question removed. All generated files now live in `planning/` under the cwd (`planning/packets/` for the debate: packets / critiques / merges / FINAL.md; `planning/council_state/` for LOG.md; `planning/status/` for next_session.md and progress.md). Copilot `/plangenie` adapter added (`.github/prompts/plangenie.prompt.md`) that hands Phase 4 to `/council`; PLANGENIE.md's Copilot Appendix deleted. NOT yet field-tested. Previous: 2026-09-06: council protocol v4 written (autonomous debate; user sets models, effort, stop rule up front and judges only open items at the end) across council SKILL.md, plangenie SKILL.md, PLANGENIE.md, Copilot council.prompt.md, README — NOT yet field-tested. Previous: 2026-07-06: spec §7 tests 3 and 5 PASSED — full /plangenie council
stress test (3 rounds, Claude Fable seat + Codex seat, per-seat cross-exam
packets, verdict tallies, per-round commits) ran end-to-end with a toy idea
(family grocery app). BOTH seats independently caught BOTH planted traps
(fake "GroceryMesh" library; false Firebase 500-connection claim → 100).
Zero REBUT deadlocks; converged after round 3; final PLAN.md issued with the
implementing-agent block. Interview + accept/reject verdicts were SIMULATED
(scripted test user) — the AskUserQuestion interview path is still untested
with a live user. Test artifacts: scratchpad repo `plangenie-e2e-test`
(session-temp; will be cleaned up — see council/LOG.md there for verdicts).

**Remaining spec §7 tests (need the real user):**
1. Paste PLANGENIE.md into a fresh Claude chat; toy idea end-to-end. (test 1)
2. Paste into ChatGPT or Gemini; confirm flow off-Claude. (test 2)
4. Acid test: hand a generated PLAN.md to a new session — implements without
   clarifying questions. (test 4)
6. Copilot /council-review with attached packet file — untested. (test 6)

**Key facts:** council mechanics delegated to ~/.claude/skills/council/SKILL.md
(explicit model, codex-companion.mjs task --background, packet files, one poll
loop, per-round commits) — all worked as written; no protocol fixes needed.
Codex rounds took ~5–10 min each. Single source of truth = root PLANGENIE.md.

**User context:** newbie to tech — plain language, multiple-choice questions.
