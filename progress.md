# PlanGenie — Progress Log

Persistent scratchpad: decisions, blockers, test results. Newest entries at top of each section.

## Current status

- **Phase:** Implementation complete (2026-07-04). All three artifacts written, structurally verified, committed. Remaining: user-run end-to-end tests (spec §7).
- **Plan:** docs/superpowers/plans/2026-07-04-plangenie-implementation.md (commit 48bdca4).
- **Artifacts:** PLANGENIE.md (84565de), .claude/skills/plangenie/SKILL.md (8dd8d25), README.md (cd4d68c).

## Feature list

```json
{
  "features": [
    { "id": "plangenie-md",   "description": "Portable master prompt PLANGENIE.md (6 phases, 7 anti-hallucination layers, relay council)", "status": "implemented, not yet user-tested", "priority": "high" },
    { "id": "cc-skill",       "description": "/plangenie Claude Code skill with automated Fable/Opus + Codex council (5-round cap)",        "status": "implemented, not yet user-tested", "priority": "medium" },
    { "id": "readme",         "description": "README.md — usage and sharing instructions",                                                  "status": "implemented, not yet user-tested", "priority": "low" },
    { "id": "e2e-tests",      "description": "Test plan in spec §7: fresh-session run, non-Claude LLM run, council round-trip, acid test, planted-fake-library check", "status": "not-started", "priority": "high" }
  ]
}
```

## Architectural decisions (2026-07-04 brainstorming session)

1. **Form factor:** portable markdown core + thin Claude Code adapter (user chose over CC-only or markdown-only).
2. **Council:** in Claude Code — automated, Fable/Opus 4.8 + GPT via Codex plugin rescue agent; elsewhere — manual relay via self-contained Council Review Packet.
3. **Scope:** software projects only.
4. **Interview:** coverage-driven adaptive (topic checklist + 4-quadrant register), one question at a time, architecture-changing questions first, 8-20 questions typical, "wrap up" escape hatch.
5. **Anti-hallucination:** seven mandatory layers (provenance tags, echo-check gate, specifics ban, pre-flight self-audit, cross-model council, human read-back, prompt hygiene). Residual risk accepted; three human checkpoints ensure misses cost a correction, not a build.
6. **Final plan output** embeds the article's implementation-notes.md / deviation-logging instruction for whichever agent implements it.
7. **(2026-07-04 implementation)** Single source of truth: PLANGENIE.md at repo root; SKILL.md loads it (skill dir first, then root) and overrides only Phase 4. No duplicated copy in the skill folder.

## Blockers / open items

- None. Codex interface verified against installed plugin openai-codex/codex/1.0.5: invoke via Agent tool `subagent_type: "codex:codex-rescue"`; prompt MUST say read-only/review-only (runtime defaults to --write otherwise); empty return = failure (plugin returns nothing on error).

## Council review (2026-07-04, second session)

5-round line-by-line council: Claude Fable 5 vs GPT via codex:codex-rescue (Codex thread resumed across rounds). Every round closed only on explicit mutual agreement; disagreements reconciled via counter-proposal exchanges. Scope per round: R1 header+hard rules, R2 state+Phases 0-2, R3 Phases 3-4, R4 Phase 5+cross-consistency, R5 full adversarial re-read. Result: ~20 agreed refinements applied to PLANGENIE.md; Codex formal sign-off ("strictly better than the original and not detrimental"), Claude concurring. Highlights: [CONFIRMED] provenance parenthetical; echo-check option-pick exemption + anti-recursion; specifics ban expanded (product capability, legal/compliance) with [USER]-requirement carve-out; register verbosity fix (one-line deltas in no-file chats); [OPEN]-tagged blindspots and assumption questions; "hardest to change later" ordering; every-major-concern merge rule; pre-flight audit accepts user approval as provenance; implementing-agent block now verifies user-approved specifics like [CANDIDATE] and logs verification results.

## Test results

- **2026-07-04 structural checks (this session): PASS.** PLANGENIE.md — 155 lines (target 120–220), 6 phase headings, all 4 tags present, packet template, implementation-notes instruction, 3-round cap, phase-transition reminders. SKILL.md — valid frontmatter, both council seats, READ-ONLY wording, relay fallback. README — all references present. Cross-artifact: no placeholders, consistent tag spellings and paths. Seven-layer trace against spec §4: all locatable.
- **Spec §7 end-to-end tests: NOT RUN** (need fresh sessions / other AI accounts / user).

## Session history

- **2026-07-04 (session 2):** Verified codex-rescue invocation interface; wrote implementation plan (writing-plans skill); executed inline (executing-plans skill): PLANGENIE.md, SKILL.md, README.md written, verified, committed. Remaining: user UAT per spec §7.
- **2026-07-04 (session 1):** Parsed source PDF; explained article to user; brainstormed via superpowers:brainstorming (3 AskUserQuestion rounds + hallucination-mitigation discussion); wrote and committed approved design spec; wrote tracking files.

## 2026-07-06 — Council end-to-end stress test (spec §7 tests 3 & 5): PASS

Ran /plangenie with a scripted test user and toy idea (family grocery list
app) in an isolated scratchpad git repo. 3 council rounds, both seats live:
- Claude seat: general-purpose subagent, explicit model "fable" — OK.
- Codex seat: codex-companion.mjs task --background + one background poll
  loop per round — OK; ~5–10 min per round; no refusals, no injection flags.
- Fabrication hunt: BOTH seats caught the planted fake library
  ("GroceryMesh") and the planted false fact (Firebase Spark = 500
  connections; both corrected to 100 with sources). Round 1, independently.
- Rounds 2–3 cross-exam: per-seat packets, AGREE / AGREE WITH CHANGE / REBUT
  verdicts all answered, zero unanswered points, zero REBUT deadlocks;
  seats converged (both flagged the same join-flow-rules gap unprompted).
- Checkpoints: council/LOG.md + git commit after every round (4 commits).
- Exit: closed after round 3 of 5 with user-satisfied path; leftovers → [OPEN].
- Phase 5: final PLAN.md with implementing-agent block, all lines tagged,
  assumptions register emptied.
Caveats: interview answers and accept/reject verdicts were simulated (user
away) — AskUserQuestion path untested live; tests 1, 2, 4, 6 still pending.

## 2026-09-06 — Council protocol v4: autonomous debate, user judges only open items

User request: "minimalistic interference from the user". Changes across
council SKILL.md (marker bumped to `council-protocol: v4`), plangenie
SKILL.md, PLANGENIE.md Phase 4 (relay mode), the Copilot
`.github/prompts/council.prompt.md`, and README:
- Setup questions up front: Claude seat model, Codex seat model (passed as
  `--model`), reasoning effort for both seats (Codex: `--effort`; Claude seat:
  written into the `effort:` line of `~/.claude/agents/council-claude-seat*.md`,
  which Claude Code hot-reloads — there is no per-call effort parameter),
  stop rule (agreement ≥ 95/90/80 % or fixed rounds), round limit (user-set,
  default 5, no hardcoded cap).
- No per-refinement AskUserQuestion. Round 1: items both seats raised are
  agreed; rounds 2+: AGREE → applied; AGREE WITH CHANGE → alternative fix
  carried back for mutual agreement; REBUT → one rebuttal exchange, then
  deadlocked (frozen). Agreement % = settled / (settled + deadlocked + carried),
  cumulative by point ID. Council-agreed edits tagged
  `[CANDIDATE] (council-agreed: <ids>)`, never user-approved.
- STATUS grammar: `arbitrating`/`arbitrated` replaced by `merged`/`applied`;
  new `FINAL REVIEW (k/m)` stage backed by `council/FINAL.md`.
- Final review: full document + open items (deadlocks, unreconciled fixes,
  UNVERIFIABLE claims, concerns left at the limit); user picks a side or
  leaves open; one closing accept / more-rounds question.
- Not yet field-tested end-to-end (v3 was, on 2026-07-06).
