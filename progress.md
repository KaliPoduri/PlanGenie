# PlanGenie — Progress Log

Persistent scratchpad: decisions, blockers, test results. Newest entries at top of each section.

## Current status

- **2026-09-07 (v9):** Codex review iteration 4 (against protocol v8, commit `98e2dc5`) appended to `codex_review.md`; all eight findings verified real against the source and fixed (protocol v9, branch `worktree-codex-review-4-fixes`): (1) pause lands at `collected` only when both critiques are on disk, else `dispatched`; (2) the plangenie adapter's relay fallback is a defined handoff — new council-skill section "Handing a council to relay mode" (cancel jobs, restore pins, `STATUS: HANDED OFF (relay, round N, <stage>)`, debate files kept live), `HANDED OFF` recognised as terminal by Setup, Resuming, Abandoning and both plangenie preflights, CHECKPOINT.md's relay `Council:` line authoritative from then on; (3) tally rule for a reopened point that sits with both seats (agreed only when both name the same edit; any REBUT re-freezes it, no second carry-back) in council skill, core and Copilot council; (4) final-review counter `k` is a count, `FINAL item i` the item number, in all three; (5) a critique file counts as saved on resume only if it ends with `END OF CRITIQUE` (Claude Resuming steps 2 and `collected`, Copilot Step 0 and `dispatched` row); (6) Copilot council's cross-tool claim gated — a Claude Code LOG.md with a live Codex job or unrestored pins must be resumed in Claude Code; (7) `planning/packets/reopen-*-ledger.md` added to every commit pathspec and the reopen step commits; (8) `plangenie-core: v1` marker in PLANGENIE.md, checked by both plangenie adapters, plus a drift check between the personal and repo copies in the Claude adapter. Marker bumped to `council-protocol: v9` in the council skill, Copilot council and both plangenie adapters. NOT field-tested.
- **2026-09-07 (v8):** Codex review iteration 3 fixes applied (protocol v8, branch `worktree-council-protocol-v8`): stage-labeled `DOC BEFORE/AFTER APPLY (round N | final review c)` hashes, the `m/m` status and its BEFORE hash in one write, reconciliation scoped to the current stage's pair, marker walk checks marker + edit text; final-review item numbers continue across cycles; "run more rounds" = reopen ledger (`planning/packets/reopen-<c>-ledger.md`) + `REOPENED:` + `LEDGER:` re-pointed, user-left-open items reset to carried, round numbers continue; new "Abandoning a council" section (cancel jobs, restore pins, `ABANDONED`, then archive) used by plangenie Start over and the document-mismatch branch; LOG.md `PLANNING DIR:` + `JOB ROOT:`, receipt names the planning dir; packet reuse needs its END line, critiques end with `END OF CRITIQUE`, truncation replies are seat failures; Hard rule 8 / `user decision` state — council edits never override `[USER]`/`(user approved)` lines. README: crash row softened, Start-over/planning-folder note, VS Code subagent cost-tier rule, Codex restart step (both verified against the official docs). Antigravity item skipped on the user's instruction. Not field-tested.
- **2026-09-07 (review 3):** Codex review iteration 3 (against protocol v7, commit `bba1f6a`) appended to `codex_review.md` — PR #3 merged as `25d10ef`. Six numbered findings, all verified real against the source: (1) High — `FINAL REVIEW (m/m)` written before `DOC BEFORE APPLY`, so a stop in the gap resumes as "nothing to apply" and drops the user's verdicts; (2) final-review item markers restart at 1 on a second cycle; (3) "run more rounds" has no reopen transition for frozen points and `LEDGER:` stays pre-verdict; (4) plangenie "Start over" archives a live council without cancelling jobs or restoring agent pins; (5) pause receipt names the git root while `planning/` is under the cwd; (6) packet reuse-by-presence and truncation replies not treated as seat failure. Plus: no rule stops a council-agreed edit from contradicting a `[USER] (Qn)` line. Next: implement 1, 3, 4, 5, 6 + the `[USER]`-conflict rule as protocol v8, then field-test with deliberate interrupts instead of a fourth review.
- **2026-09-07 (v7):** Codex review iteration 2 fixes applied (protocol v7): `LEDGER:`/`Ledger:` pointer to the newest merge file, always loaded on resume (frozen points survive a stop early in the next round); `Unflushed answers` checkpoint field carries complete answer-log entries so a `(Qn)` trail is never lost between batched UNKNOWNS.md writes; council-verified edits tagged `(verified: …; council-agreed: <ids>)`; open-verification points in the percentage denominator and unexamined single-seat points in the stop predicate; Phase 4 + council `CLOSED` routes straight to Phase 5 in both adapters; rounds 2+ packets carry an "already settled or frozen" ID list and restated points are logged as duplicates; FINAL.md's ledger updated per verdict and rewritten before `resolved`; README setup-question count and `planning/` exception fixed. Not field-tested.
- **2026-09-07 (later):** Codex review fixes applied (protocol v6): same-fix rule for round-1 agreement, cumulative ledger in merge files, reconcile-before-reapply with `DOC BEFORE/AFTER APPLY` hashes and `FINAL REVIEW (resolved)`, every point ID gets a final disposition, single-seat and no-concerns rules, LOG.md before agent-file pins with ownership rule, per-answer setup saves, document-identity check on resume, `git add` before pathspec commits, agent files shipped in `.claude/agents/`, README install/Antigravity/VS Code fixes, `(Qn)` provenance links + answer log, mandatory sequence/dependencies/acceptance/verification plan sections. Not field-tested.
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
