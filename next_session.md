# Next Session — PlanGenie

**Task:** PlanGenie built. All 3 deliverables implemented and committed (2026-07-04).
**Artifacts:** PLANGENIE.md (root), .claude/skills/plangenie/SKILL.md, README.md.
**Plan:** docs/superpowers/plans/2026-07-04-plangenie-implementation.md.

**Status:** Structural checks passed. 2026-07-04: 5-round Claude Fable 5 x Codex
council review of PLANGENIE.md completed — every section debated, all rounds closed
in agreement, ~20 refinements applied, joint sign-off. Relay mode (Phase 4B)
rewritten as a two-seat debate protocol ported from Improve_Claude
copilot/council.prompt.md (per-seat round-2+ packets, AGREE / AGREE WITH CHANGE /
REBUT verdicts, arbitration, round checkpoints) — commit d8bf5ed. End-to-end
behavior NOT yet verified — do not mark "passing" until the spec §7 tests run.

**Next step — user-run tests (spec §7):**
1. Paste PLANGENIE.md into a fresh Claude chat; run a toy idea end-to-end.
2. Paste it into ChatGPT or Gemini; confirm the flow works off-Claude.
3. Run /plangenie in Claude Code; confirm the Codex council round-trip.
4. Acid test: give the generated PLAN.md to a brand-new session; it should start
   implementing without clarifying questions.
5. Planted-fake-library check: confirm the council flags an invented library name.
6. Copilot: confirm /council-review appears and works with an attached packet file
   (.github/prompts/council-review.prompt.md — new, untested).

**Key facts:** 2026-07-06: skill Step 2 rewritten to delegate council mechanics to
~/.claude/skills/council/SKILL.md (explicit model, codex-companion.mjs background
dispatch — NOT codex-rescue, packet files, per-round commits); PlanGenie keeps 5-round
cap, packet content, relay fallback. Single source of truth = root PLANGENIE.md.

**User context:** newbie to tech — plain language, multiple-choice questions.
