# PlanGenie — Design Spec

**Date:** 2026-07-04
**Status:** Approved by user (interview 2026-07-04); ready for implementation planning
**Source material:** "A Field Guide to Fable: Finding Your Unknowns" (Thariq, @trq212) — PDF in repo root

## 1. Problem & Goal

Project ideas fail in AI-assisted implementation because of *unknowns* — the gap
between what the user tells the model (the map) and reality (the territory). The
article identifies four kinds: known knowns, known unknowns, unknown knowns,
unknown unknowns.

PlanGenie is a portable "planning interviewer" agent. Given a one-line project
idea, it interviews the user to surface all four quadrants of unknowns, drafts an
implementation plan with zero silent assumptions, has a council of different LLMs
critique the plan, loops the human in for verdicts, and iterates until the user
approves. Output: a final plan any LLM/coding agent can implement.

**Users:** the owner (newbie-friendly wording is mandatory) and anyone they share
the file with, on any LLM harness (ChatGPT, Gemini, Cursor, Copilot, Antigravity,
Claude, etc.).

**Scope decision:** software projects only.

## 2. Deliverables

| # | Artifact | What it is |
|---|----------|------------|
| A | `PLANGENIE.md` | The portable agent: a single self-contained markdown prompt (~2–4 pages). Pasted into any LLM chat/harness, that LLM becomes the interviewer. Shareable by email. No code, no keys, no install. |
| B | `.claude/skills/plangenie/SKILL.md` (+ any support files) | Claude Code adapter: `/plangenie` runs the same flow but automates the council — Claude (Fable/Opus 4.8) as one reviewer, GPT via the installed Codex plugin's rescue/delegation agent as the second. |
| C | `README.md` | One page: what PlanGenie is, how to run it anywhere, how to share it. |

State lives in the conversation, plus two files when the harness can write files:
`PLAN.md` (evolving plan) and `UNKNOWNS.md` (quadrant register). In chat-only
harnesses the agent reprints these as maintained sections instead.

## 3. Agent Flow (identical in both pieces)

### Phase 0 — Intake
Ask for the one-liner. Then ask who the user is: experience level, familiarity
with the domain, what they already know/decided. (Article: context about the
person shapes everything downstream.)

### Phase 1 — Blindspot pass
Before interviewing, the agent teaches: "here is what people typically overlook
in this kind of project" — the user's unknown unknowns, in plain language.
Teaching first, asking second.

### Phase 2 — Interview
- One question at a time. Multiple-choice offered whenever possible. Plain
  English; jargon must be explained inline.
- Maintains a visible **4-quadrant register** (known knowns / known unknowns /
  unknown knowns / unknown unknowns) and a **topic checklist**: users, features,
  data, integrations, constraints, success criteria, risks.
- Questions whose answers would change the architecture come first.
- Stops when every topic is answered or explicitly marked **OPEN UNKNOWN**.
  User can say "wrap up" at any time. Typical length 8–20 questions.

### Phase 3 — Draft plan
- Leads with decisions most likely to change (data model, interfaces,
  user-facing flows); mechanical detail goes last.
- Mandatory honesty sections: **Challenges & Risks**, **Remaining Unknowns**,
  **Assumptions register** (empty, or each item awaiting explicit confirmation).
- Before the draft is shown: plain-language **read-back summary** ("the project
  as I understand it") — no jargon — for the user to correct.

### Phase 4 — Council review loop
- Reviewers critique: feasibility, completeness (missed unknowns), risks,
  simpler alternatives, fabricated/unverifiable claims (explicit instruction to
  try to refute the plan's facts).
- When reviewers converge on refinements, they are presented to the user with
  pros/cons; the user accepts/rejects each; plan revised; repeat.
- Cap: 3 council rounds. Exit when council has no major concerns AND user is
  satisfied.

### Phase 5 — Final plan output
`PLAN.md`, implementation-ready for any LLM. Includes the article's during-
implementation guidance baked in: the implementing agent must keep an
`implementation-notes.md`, log every deviation from the plan under
"Deviations", and choose the conservative option when improvising.

## 4. Anti-Hallucination Design (seven layers, all mandatory)

1. **Provenance tags.** Every statement in the plan carries exactly one tag:
   `[USER]` (said in interview), `[CONFIRMED]` (proposed by agent, explicitly
   approved), `[CANDIDATE]` (suggestion, unverified), `[OPEN]` (unresolved).
   Untagged content is a rule violation. Converts invisible assumptions into
   visible, checkable claims.
2. **Echo-check gate.** After each interview answer the agent restates its
   understanding in one sentence and gets yes/no before recording. Facts enter
   the registers only through this gate.
3. **Specifics ban.** Concrete tools, libraries, APIs, versions, prices may be
   named only as `[CANDIDATE] — verify before use`, unless the harness has
   search/code access and the agent actually verified (then upgradeable to
   `[CONFIRMED]` with the verification noted).
4. **Pre-flight self-audit.** Before emitting a draft, the agent traces every
   claim to an interview answer or a verification; untraceable claims move to
   Remaining Unknowns.
5. **Cross-model council.** Different models rarely fabricate the same
   specifics; reviewers are explicitly tasked with hunting fabrications.
6. **Human read-back checkpoint.** Plain-language summary before council rounds
   so a newbie can catch inverted unknown-knowns.
7. **Prompt hygiene.** Hard rules at the top of `PLANGENIE.md`; the critical
   rules re-stated at every phase transition (compliance decays over long
   conversations). File stays short (2–4 pages) — length degrades obedience.

**Accepted residual risk:** a weak model can still slip a fabrication past all
layers; the design guarantees three human checkpoints (echo-check, read-back,
council verdict) so a miss costs a correction, not a wasted build.

## 5. Council — Two Modes, One Protocol

**Claude Code mode (Piece B):** automated. Claude (Fable/Opus 4.8) reviews;
the Codex plugin's rescue/delegation agent has GPT review; each sees the other's
critique; up to 3 rounds; pauses for the user's verdict when they agree on a
refinement. Note: `/codex:review` reviews code diffs, not documents — the skill
must use the plugin's rescue agent (`codex:codex-rescue` subagent) for plan
review. **[Unverified]** Exact invocation interface to be confirmed against the
installed plugin when writing the skill.

**Relay mode (Piece A, everywhere else):** the agent emits a self-contained
**Council Review Packet** (plan + reviewer instructions including the
fabrication-hunt task). The user pastes it into any other AI(s), pastes the
critiques back, and the agent merges and continues the same loop.

## 6. Out of Scope

- No website, app, API keys, database, or hosted service.
- No non-software project support.
- No automated council outside Claude Code (impossible for a paste-in prompt).
- No guarantee of zero hallucination on arbitrary models (see accepted risk).

## 7. Testing

1. End-to-end run of `PLANGENIE.md` in a fresh Claude session on a sample idea.
2. User pastes `PLANGENIE.md` into at least one non-Claude LLM (ChatGPT or
   Gemini) and completes a session — confirms harness-agnostic behavior.
3. `/plangenie` end-to-end in Claude Code, confirming the Codex council
   round-trip works.
4. Acid test: hand the final generated plan to a brand-new session; it should
   begin implementing a toy project without needing clarifying questions.
5. Layer checks: verify tags present on every plan line; verify echo-check
   fires after answers; verify a planted fake library name gets flagged by the
   council.

## 8. Known Challenges

- Prompt-only agents obey imperfectly on weak models — mitigated by the seven
  layers, not eliminated.
- Codex round-trips are slow; the 3-round cap keeps the loop usable.
- Relay mode is manual by nature; packet must be fully self-contained so
  reviewers need zero prior context.
