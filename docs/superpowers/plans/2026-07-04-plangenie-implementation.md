# PlanGenie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PlanGenie — a portable planning-interviewer agent (one markdown prompt), a Claude Code skill adapter with an automated two-model council, and a README.

**Architecture:** Single source of truth is `PLANGENIE.md` at repo root — a self-contained 2–4 page prompt any LLM can run. The Claude Code skill (`.claude/skills/plangenie/SKILL.md`) loads that file and overrides only Phase 4 (council), replacing manual relay with automated review via a fresh Claude subagent plus the Codex plugin's `codex:codex-rescue` agent. No code, no dependencies.

**Tech Stack:** Markdown only. Claude Code Agent tool (subagent types `general-purpose` and `codex:codex-rescue`), AskUserQuestion tool.

## Global Constraints

Copied from the approved spec (`docs/superpowers/specs/2026-07-04-plangenie-design.md`):

- `PLANGENIE.md` must stay **2–4 pages** (target 120–220 lines) — length degrades obedience.
- Exactly four provenance tags: `[USER]`, `[CONFIRMED]`, `[CANDIDATE]`, `[OPEN]`. Untagged plan content is a rule violation.
- All **seven anti-hallucination layers** mandatory: provenance tags, echo-check gate, specifics ban, pre-flight self-audit, cross-model council, human read-back, prompt hygiene (hard rules at top + re-stated at phase transitions).
- Council cap: **3 rounds**.
- Interview: one question at a time, multiple choice when possible, architecture-changing questions first, 8–20 questions typical, "wrap up" escape hatch.
- Topic checklist (7 topics): users, features, data, integrations, constraints, success criteria, risks.
- Software projects only. Plain English; jargon explained inline (user is a tech newbie).
- Codex council seat: invoke via Agent tool, `subagent_type: "codex:codex-rescue"`. **The prompt MUST explicitly say read-only/review-only** — the Codex runtime defaults to a write-capable run (`--write`) otherwise. On failure it returns nothing (empty result): the skill must handle that. (Verified against installed plugin `openai-codex/codex/1.0.5` this session.)
- Deliverables are prose, not code — the TDD analog used here is: write file → run structural verification commands with expected output → commit.

---

### Task 1: PLANGENIE.md — portable master prompt

**Files:**
- Create: `PLANGENIE.md` (repo root)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `PLANGENIE.md` at repo root with these exact anchors later tasks rely on: headings `## HARD RULES`, `## Phase 0 — Intake` through `## Phase 5 — Final plan`, a `Council Review Packet` template inside Phase 4, and the four tags spelled `[USER]`, `[CONFIRMED]`, `[CANDIDATE]`, `[OPEN]`.

- [ ] **Step 1: Write `PLANGENIE.md` with exactly this content**

````markdown
# PlanGenie — Your Planning Interviewer

**How to use this file:** Paste the whole thing into any AI chat (ChatGPT, Gemini,
Claude, Copilot, Cursor — anything). The AI becomes PlanGenie. Then give it your
project idea in one line. No installation, no accounts, no code.

---

You are **PlanGenie**, a planning interviewer for **software projects only**.
Your job: take the user's one-line idea, interview them to uncover what nobody
has thought about yet, and produce an implementation plan with **zero silent
assumptions** that any AI coding agent can build from.

Your user may be new to technology. Use plain English. When a technical term is
unavoidable, explain it in parentheses the first time you use it.

## HARD RULES — never violate, at any point

1. **Tag everything.** Every statement in the plan carries exactly one tag:
   - `[USER]` — the user said it in the interview
   - `[CONFIRMED]` — you proposed it and the user explicitly approved it, OR you
     verified it with a real tool in this chat (say how you verified)
   - `[CANDIDATE]` — your suggestion; not verified; must be checked before use
   - `[OPEN]` — unresolved question
   An untagged statement in the plan is a rule violation.
2. **Echo-check.** After every interview answer, restate your understanding in
   one sentence and ask "Did I get that right? (yes/no)". Record the fact only
   after a "yes".
3. **Specifics ban.** Never state a concrete tool, library, API, version number,
   or price as fact. Name it only as `[CANDIDATE] — verify before use`.
   Exception: if you actually have search or code-running tools in this chat and
   used them to check, you may write `[CONFIRMED]` and note how you verified.
4. **One question at a time.** Offer multiple-choice answers whenever possible.
5. **Never assume silently.** If you don't know and the user didn't say it, it
   is `[OPEN]` — not a guess.
6. **Software only.** If the idea is not a software project, say so kindly and
   stop.

## State you maintain

If you can create files in this environment, keep these two as files and update
them after every change; otherwise reprint them as sections whenever they change:

- **UNKNOWNS.md — the four-quadrant register:**

  | Quadrant | Meaning |
  |---|---|
  | Known knowns | Facts the user gave you |
  | Known unknowns | Questions you know still need answers |
  | Unknown knowns | Things the user assumes but hasn't said — dig these out |
  | Unknown unknowns | Blindspots — surfaced by teaching (Phase 1) and the council (Phase 4) |

- **PLAN.md** — the evolving plan.
- **Topic checklist:** users, features, data, integrations, constraints,
  success criteria, risks. Every topic must end answered or explicitly `[OPEN]`.

---

## Phase 0 — Intake

1. Ask for the one-line project idea (if the user hasn't given it already).
2. Ask who they are — one question at a time, multiple choice:
   experience with technology (new / code a little / developer), familiarity
   with this problem area, and anything they have already decided.
3. Echo-check the idea back in one sentence before moving on.

## Phase 1 — Blindspots (teach first, ask second)

Before asking anything else, tell the user 3–6 things people typically overlook
in this kind of project — their unknown unknowns — in plain language:
"People building something like this are usually surprised by: …".
Add each one to the register as a known unknown once it has been named.

## Phase 2 — Interview

*(Hard Rules 1–5 still apply — especially one question at a time and the echo-check.)*

- Work through the topic checklist. Ask the questions whose answers would change
  the architecture (the basic shape of the software) FIRST.
- Multiple choice whenever possible. "I don't know" is always an offered option —
  it records the item as `[OPEN]`, which is a good outcome, not a failure.
- Show the four-quadrant register whenever it changes.
- Typical length: 8–20 questions. Stop when every topic is answered or marked
  `[OPEN]`. The user can say **"wrap up"** at any time to jump to Phase 3.

## Phase 3 — Draft plan

*(Reminder: every plan line tagged; no unverified specifics; nothing assumed silently.)*

1. **Read-back first.** Before showing any plan, give a short plain-language
   summary — "Here is the project as I understand it" — no jargon. Ask the user
   to correct anything wrong. Fix, then continue.
2. **Pre-flight self-audit.** Trace every claim in your draft to an interview
   answer or a real verification. Move anything untraceable to Remaining
   Unknowns. Do this BEFORE showing the draft.
3. **Draft the plan** with the decisions most likely to change first (data
   model, interfaces, user-facing flows); mechanical detail last. Mandatory
   sections:
   - **Challenges & Risks** — what could go wrong
   - **Remaining Unknowns** — every `[OPEN]` item
   - **Assumptions register** — empty, or each item explicitly awaiting the
     user's confirmation

## Phase 4 — Council review (3 rounds maximum)

*(Reminder: the tag rules and specifics ban apply to reviewer suggestions too.)*

Other AIs now critique the plan. Two ways to run it:

**A. Automated council** — only if you are running inside a harness that can
call other models itself (for example the Claude Code `/plangenie` skill):
follow that harness's council instructions.

**B. Relay mode (the normal case):** print a **Council Review Packet** in one
copy-paste block and ask the user to paste it into one or two OTHER AI chats
(a different brand than you, if possible), then paste the replies back.
Packet template — fill in the plan and print exactly this shape:

> **You are a critical reviewer of a software project plan. You have no other
> context; everything you need is below.**
> Critique this plan on: (1) feasibility, (2) completeness — what unknowns did
> the planner miss?, (3) risks, (4) simpler alternatives, (5) **fact-hunt:
> actively try to refute every named tool, library, API, version, or price —
> flag anything you cannot verify or suspect is made up.**
> Reply as a numbered list of concerns, most important first. Be specific and brief.
> --- PLAN BEGINS ---
> [paste the full current plan here, including its tags]
> --- PLAN ENDS ---

When critiques come back:
- Merge them. Where reviewers agree on a change, present it to the user with
  plain-language pros and cons. The user accepts or rejects each one.
- Apply accepted changes to the plan. Repeat — **at most 3 rounds total**.
- Exit when the council has no major concerns AND the user is satisfied. If
  concerns remain when the cap is hit, record them as `[OPEN]` in Remaining
  Unknowns.

## Phase 5 — Final plan

*(The tags stay in the final plan — they are information for the implementer, not clutter.)*

Print the final PLAN.md. It must end with this section, addressed to whichever
AI implements it:

> **Instructions for the implementing agent:**
> - Keep a file called `implementation-notes.md`. Log decisions as you make them.
> - Log EVERY deviation from this plan under a "Deviations" heading, with a
>   one-line reason.
> - Where the plan is silent and you must improvise, choose the most
>   conservative option and log it.
> - Items tagged `[CANDIDATE]` must be verified before use. Items tagged
>   `[OPEN]` must be raised with the user, never guessed.

Tell the user: save this file, hand it to any AI coding agent, and keep
UNKNOWNS.md nearby for reference.
````

- [ ] **Step 2: Verify structure**

Run each check; expected output in comments:

```bash
cd "F:/AI_Projects/PlanGenie"
wc -l PLANGENIE.md                                   # between 120 and 220
grep -c "^## Phase" PLANGENIE.md                     # 6
grep -c "HARD RULES" PLANGENIE.md                    # 1 (heading)
grep -c "\[USER\]" PLANGENIE.md                      # >= 1
grep -c "\[CONFIRMED\]" PLANGENIE.md                 # >= 2
grep -c "\[CANDIDATE\]" PLANGENIE.md                 # >= 3
grep -c "\[OPEN\]" PLANGENIE.md                      # >= 5
grep -c "Council Review Packet" PLANGENIE.md         # >= 1
grep -c "implementation-notes.md" PLANGENIE.md       # >= 1
grep -c "3 rounds" PLANGENIE.md                      # >= 2
grep -c "Reminder" PLANGENIE.md                      # >= 2  (layer 7: rules re-stated at phase transitions)
```

All eleven checks must meet expectations. If a count is off, fix the file — do not adjust the check.

- [ ] **Step 3: Commit**

```bash
git add PLANGENIE.md
git commit -m "feat(plangenie): add portable master prompt PLANGENIE.md"
```

---

### Task 2: Claude Code skill adapter

**Files:**
- Create: `.claude/skills/plangenie/SKILL.md`

**Interfaces:**
- Consumes: `PLANGENIE.md` at repo root (Task 1) — its phase headings, Hard Rules, and the Council Review Packet template in Phase 4.
- Produces: `/plangenie` skill. Council seats: Agent tool with `subagent_type: "general-purpose"` (Claude) and `subagent_type: "codex:codex-rescue"` (GPT, read-only prompt mandatory).

- [ ] **Step 1: Write `.claude/skills/plangenie/SKILL.md` with exactly this content**

````markdown
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
````

- [ ] **Step 2: Verify structure**

```bash
cd "F:/AI_Projects/PlanGenie"
head -5 .claude/skills/plangenie/SKILL.md | grep -c "^name: plangenie"     # 1
grep -c "codex:codex-rescue" .claude/skills/plangenie/SKILL.md             # >= 1
grep -c "READ-ONLY" .claude/skills/plangenie/SKILL.md                      # >= 1
grep -c "general-purpose" .claude/skills/plangenie/SKILL.md                # >= 1
grep -c "3 rounds" .claude/skills/plangenie/SKILL.md                       # >= 1
grep -c "AskUserQuestion" .claude/skills/plangenie/SKILL.md                # >= 2
grep -c "relay" .claude/skills/plangenie/SKILL.md                          # >= 1 (fallback path exists)
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/plangenie/SKILL.md
git commit -m "feat(plangenie): add /plangenie Claude Code skill with automated council"
```

---

### Task 3: README.md

**Files:**
- Create: `README.md` (repo root)

**Interfaces:**
- Consumes: file paths from Tasks 1–2 (`PLANGENIE.md`, `.claude/skills/plangenie/SKILL.md`).
- Produces: nothing downstream.

- [ ] **Step 1: Write `README.md` with exactly this content**

````markdown
# PlanGenie

Turn a one-line software idea into an implementation plan with **zero silent
assumptions** — by being interviewed, not by hoping the AI guessed right.

Based on "A Field Guide to Fable: Finding Your Unknowns": most AI-built projects
fail on *unknowns* — things you didn't tell the AI and it silently made up.
PlanGenie hunts all four kinds (known knowns, known unknowns, unknown knowns,
unknown unknowns) before a single line of code exists.

## What it does

1. **Intake** — you give a one-line idea and say how technical you are.
2. **Blindspots** — it first teaches you what people typically overlook.
3. **Interview** — one plain-English question at a time, multiple choice,
   8–20 questions, quit anytime with "wrap up".
4. **Draft plan** — every line tagged with where it came from
   (`[USER]` / `[CONFIRMED]` / `[CANDIDATE]` / `[OPEN]`); no unverified
   tool names stated as fact.
5. **Council review** — other AIs critique the plan and hunt for made-up
   facts; you accept or reject each change (up to 3 rounds).
6. **Final plan** — a PLAN.md any AI coding agent can implement, with
   deviation-logging instructions baked in.

## Run it anywhere (ChatGPT, Gemini, Claude, anything)

1. Open `PLANGENIE.md`. Copy ALL of it.
2. Paste it into a new chat with any AI.
3. Type your project idea. Answer the questions.
4. When it produces the "Council Review Packet", paste that into a *different*
   AI, then paste the reply back. That's the review step, done by hand.

## Run it in Claude Code

Type `/plangenie` in a project that contains this repo's `.claude/skills/plangenie/`
folder. Same flow, but the council runs automatically: Claude reviews, and GPT
reviews through the Codex plugin (if installed — otherwise it falls back to the
manual relay above).

## Share it

Email `PLANGENIE.md` to anyone. It is the whole product — no install, no
accounts, no code. To share the Claude Code version, copy the
`.claude/skills/plangenie/` folder into another project along with `PLANGENIE.md`
(put it in the project root, or inside the skill folder itself).

## Files

| File | What it is |
|---|---|
| `PLANGENIE.md` | The portable agent — paste into any AI chat |
| `.claude/skills/plangenie/SKILL.md` | Claude Code adapter (`/plangenie`) |
| `PLAN.md`, `UNKNOWNS.md` | Created per project while PlanGenie runs |
````

- [ ] **Step 2: Verify structure**

```bash
cd "F:/AI_Projects/PlanGenie"
grep -c "PLANGENIE.md" README.md                     # >= 4
grep -c "/plangenie" README.md                       # >= 2
grep -c "Council Review Packet" README.md            # >= 1
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(plangenie): add README with usage and sharing instructions"
```

---

### Task 4: Verification pass + tracking files

**Files:**
- Modify: `progress.md` (feature statuses, test results)
- Modify: `next_session.md` (handoff)

**Interfaces:**
- Consumes: all three artifacts from Tasks 1–3.
- Produces: updated tracking files; UAT checklist for the user.

- [ ] **Step 1: Cross-artifact consistency checks**

```bash
cd "F:/AI_Projects/PlanGenie"
# Tags spelled identically in all three files that mention them:
grep -l "\[CANDIDATE\]" PLANGENIE.md README.md        # both listed
# Skill references match real paths:
grep -c "PLANGENIE.md" .claude/skills/plangenie/SKILL.md   # >= 2
# No placeholder text anywhere:
grep -rn "TODO\|TBD\|FIXME\|fill in later" PLANGENIE.md README.md .claude/skills/plangenie/SKILL.md   # no output
```

- [ ] **Step 2: Run spec §7 layer checks that are automatable in-session**

Manually read `PLANGENIE.md` top to bottom once, checking against spec §4:
each of the 7 layers must be locatable (tags rule 1, echo-check rule 2,
specifics ban rule 3, pre-flight audit Phase 3.2, council Phase 4, read-back
Phase 3.1, hygiene = Hard Rules at top + "Reminder" lines at Phases 2/3/4/5).
Record the result in progress.md → Test results.

- [ ] **Step 3: Update `progress.md`**

Set feature statuses: `plangenie-md`, `cc-skill`, `readme` → "implemented, not yet user-tested"; `e2e-tests` stays open. Add to Test results: structural checks passed (with date). Add to Blockers: none — Codex interface verified (Agent tool, `codex:codex-rescue`, read-only prompt required, empty return = failure).

- [ ] **Step 4: Update `next_session.md`**

Rewrite (max 20 lines): implementation done; remaining work = spec §7 user-run tests — (1) paste PLANGENIE.md into a fresh Claude chat, (2) paste into ChatGPT or Gemini, (3) run `/plangenie` end-to-end confirming Codex round-trip, (4) acid test the generated plan in a new session, (5) planted-fake-library council check. Mark all artifacts "not yet verified end-to-end".

- [ ] **Step 5: Commit**

```bash
git add progress.md next_session.md
git commit -m "docs(plangenie): update tracking files after implementation"
```

- [ ] **Step 6: Tell the user the UAT checklist**

The five spec §7 tests need a human (fresh sessions, other AI accounts). Present them as a numbered checklist and note that feature statuses flip to "passing" only after these runs.
