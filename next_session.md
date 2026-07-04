# Next Session — PlanGenie

**Task:** Build PlanGenie (portable planning-interviewer agent). Design phase DONE.
**Spec (approved):** docs/superpowers/specs/2026-07-04-plangenie-design.md — READ THIS FIRST.
**Source article:** "A field guide to fable.pdf" (repo root) — 4 quadrants of unknowns.

**Status:** Spec written, self-reviewed, user-approved, committed (a610c8d). No code yet.

**Next step:** Invoke superpowers:writing-plans skill to create the implementation plan,
then implement the 3 deliverables:
1. PLANGENIE.md — portable master prompt (2-4 pages, 6 phases, 7 anti-hallucination layers)
2. .claude/skills/plangenie/SKILL.md — Claude Code adapter, council = Fable/Opus + Codex plugin
3. README.md

**Key decisions (locked):** software projects only; coverage-driven adaptive interview;
council capped at 3 rounds; provenance tags [USER]/[CONFIRMED]/[CANDIDATE]/[OPEN];
relay-mode council packet for non-Claude-Code harnesses.

**Known issue / [Unverified]:** exact invocation interface of Codex plugin's rescue agent
(codex:codex-rescue) — verify before writing the skill. /codex:review is diffs-only, don't use it.

**User context:** newbie to tech — plain language, multiple-choice questions, explain jargon.
