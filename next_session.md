# Next Session — PlanGenie

**Task:** PlanGenie built. All 3 deliverables implemented and committed (2026-07-04).
**Artifacts:** PLANGENIE.md (root), .claude/skills/plangenie/SKILL.md, README.md.
**Plan:** docs/superpowers/plans/2026-07-04-plangenie-implementation.md.

**Status:** Structural checks passed. End-to-end behavior NOT yet verified — do not
mark features "passing" until the spec §7 tests below run.

**Next step — user-run tests (spec §7):**
1. Paste PLANGENIE.md into a fresh Claude chat; run a toy idea end-to-end.
2. Paste it into ChatGPT or Gemini; confirm the flow works off-Claude.
3. Run /plangenie in Claude Code; confirm the Codex council round-trip.
4. Acid test: give the generated PLAN.md to a brand-new session; it should start
   implementing without clarifying questions.
5. Planted-fake-library check: confirm the council flags an invented library name.

**Key facts:** council = general-purpose subagent + codex:codex-rescue (prompt must
say READ-ONLY or Codex runs write-capable; empty return = plugin failure → offer
Claude-only or relay fallback). Single source of truth = root PLANGENIE.md.

**User context:** newbie to tech — plain language, multiple-choice questions.
