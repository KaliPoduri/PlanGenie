# Codex review of PlanGenie

Independent read-only review by Codex (GPT, via the Codex plugin), run on
2026-09-07 against commit `62b6173` on `main`. The task was: read `README.md`,
parse every file in the repo, check that the codebase matches what the README
says, and give an independent review of the idea and the tool for loopholes,
bugs and misses. The text below is Codex's answer, unedited.

---

**The README is broadly aligned with the intended workflow, but several important promises exceed what the current prompts reliably specify.** The weakest areas are installation portability, interruption recovery, and council decision-making.

I reviewed all **12 working-tree files**, including hidden adapters and local metadata, plus the active Git hook. Three independent review agents checked the core, Claude, and Copilot workflows. Git's internal object database was excluded from the content audit. **No files were created or edited.**

This is a prompt-based product: there is no application runtime or automated test suite in the repository. The findings below are confirmed instruction/configuration defects; cross-platform execution remains **not yet verified**.

| README claim | Assessment |
|---|---|
| Intake, blindspots, adaptive interview, "wrap up" | Specified consistently |
| Provenance tags and explicit unknowns | Strong instructions; no automated enforcement |
| Two-reviewer council with configurable stopping | Present, but decision rules have gaps |
| Stop anywhere and resume exactly | Not supported reliably by the recovery protocol |
| Claude installation enables automated council | Installation recipe omits required dependencies |
| Portable setup across coding tools | Some recipes need correction |
| Final plan any coding agent can implement | Output requirements are too weak to ensure this |

The highest-priority findings are:

1. **High — Claude installation omits the council dependency.**
   The README tells users to install the `plangenie` folder and core prompt. However, the adapter loads the council exclusively from `~/.claude/skills/council/SKILL.md`, ignoring the council bundled in the project. On a clean machine, even with the Codex plugin installed, it falls back to relay mode. The dedicated reviewer-agent definitions are also absent; their fallback lacks an enforced read-only tool boundary.
   **Recommendation:** Package all dependencies and resolve the bundled council before relying on a personal installation. [Adapter lookup](.claude/skills/plangenie/SKILL.md:102), [reviewer fallback](.claude/skills/council/SKILL.md:68).

2. **High — Interrupt recovery can apply changes twice.**
   The Claude council records `merged`, edits the document, then records `applied`. If interrupted after the edit but before the status update, resume sees `merged` and reapplies the changes. Final-review resolutions have the same problem. Copilot also lacks a distinct state separating completed verdicts, applied resolutions, and pending acceptance. This contradicts "resume from that exact spot."
   **Recommendation:** Record document versions and reconcile whether each edit already happened before applying it again. [Claude apply/resume](.claude/skills/council/SKILL.md:155), [Copilot final application](.github/prompts/council.prompt.md:274).

3. **High — Portable resume blocks omit essential debate state.**
   A file-less resume block contains the plan, register, checkpoint, and certain critiques—but not a complete cumulative issue ledger or durable council configuration. A fresh chat can lose the threshold, round limit, settled counts, and frozen disagreements. Separately, file-backed core resume excludes `FINAL.md` from its allowed reads, although that file contains the numbered final-review questions.
   **Recommendation:** Preserve council configuration, every issue's state and arguments, and the final-review list in the recovery contract. [Resume block](PLANGENIE.md:212), [allowed resume files](PLANGENIE.md:223).

4. **High — Agreement on a problem can be mistaken for agreement on its solution.**
   Round 1 treats an issue independently raised by both reviewers as agreed and applies a concrete edit. But both might identify missing authentication while recommending incompatible fixes—password login versus SSO. Later rounds distinguish those cases; round 1 does not explicitly do so. This flaw appears across the core and adapters.
   **Recommendation:** Require agreement on the actual proposed change, not merely the concern. [Round-1 merge rule](PLANGENIE.md:425).

5. **High — Standalone council resume does not check document identity.**
   An active `planning/council_state/LOG.md` triggers resume without comparing the requested document with the logged document. Invoking `/council B.md` while A's review is paused can resume A's council despite the new request.
   **Recommendation:** Match the document path before resuming and handle mismatches explicitly. [Copilot resume](.github/prompts/council.prompt.md:25), [Claude resume](.claude/skills/council/SKILL.md:148).

6. **High — The Antigravity installation recipe exceeds its documented size limit.**
   The README says to paste the entire core into one workflow file. The core is **31,402 characters**; Antigravity documents a **12,000-character workflow limit**. The recipe therefore exceeds the supported limit by more than double.
   **Recommendation:** Use a short adapter that loads the core, or provide a compatible skill. [README recipe](README.md:236), [official workflow limits](https://antigravity.google/docs/ide/workflows/).

Other concrete issues also need attention:

7. **Medium — Unresolved points can disappear from the final review.**
   The final list explicitly includes still-carried **major** concerns at the round limit. Still-carried minor concerns and refinements lack a guaranteed disposition; threshold-based early exits are also underspecified.
   **Recommendation:** Every issue ID must finish as applied, withdrawn, explicitly rejected, or open. [Final-review enumeration](PLANGENIE.md:464).

8. **Medium — New council files are not staged before the prescribed commits.**
   The adapters prescribe `git commit -- <paths>` including newly created packets and logs, without instructing the agent to stage new files. Git requires those paths to already be known to its index. An agent must improvise a missing step for the recipe to work.
   **Recommendation:** Stage the explicit authorized paths before committing. [Commit recipe](.github/prompts/council.prompt.md:245), [Git documentation](https://git-scm.com/docs/git-commit).

9. **Medium — Claude councils modify shared personal agent settings.**
   Setup changes global reviewer model/effort settings before persisting their previous values. An interruption in that window loses restoration information. Two councils in different projects also share and rewrite those same files.
   **Recommendation:** Prefer per-run configuration; otherwise persist recovery information before mutation and define ownership. [Agent settings mutation](.claude/skills/council/SKILL.md:36).

10. **Medium — "Stop anywhere" does not cover setup consistently.**
    The standalone council asks all setup questions before creating its initial log. Stopping halfway through setup can therefore lose answers in a fresh chat.
    **Recommendation:** Save each setup answer immediately. [Copilot setup](.github/prompts/council.prompt.md:59).

11. **Medium — Single-seat continuation has no complete decision policy.**
    The portable prompt offers single-seat continuation, but the subsequent merge rules require both reviewers' agreement. It never defines what becomes settled or how the percentage works with one seat.
    **Recommendation:** Define a separate single-reviewer outcome and stopping rule. [Fallback](PLANGENIE.md:348), [merge rules](PLANGENIE.md:418).

12. **Low — A clean review produces an undefined percentage.**
    If neither reviewer raises a concern, the formula becomes `0 / 0`. No empty-case behavior is specified.
    **Recommendation:** Report "no concerns raised" and define when that ends the council. [Agreement formula](PLANGENIE.md:445).

The platform instructions also need a compatibility pass. Current VS Code documentation says prompt files work with local extension-host agents, but **not Agent Host agents**. The README does not explain this distinction. The prompts also use `mode:` while the current documented field is `agent:`; backward compatibility is **unverified**, so I would not call that alone a proven failure. [Prompt frontmatter](.github/prompts/plangenie.prompt.md:1), [official VS Code documentation](https://code.visualstudio.com/docs/agent-customization/prompt-files).

My independent assessment of the idea is positive, with a narrower promise than the README currently makes. **Interviewing before planning, separating user statements from suggestions, and recording unknowns are valuable features.** The explicit distinction between user approval and factual verification is particularly useful.

The main product gaps are:

- **Agreement is not correctness.** Your percentage measures settled discussion points, including withdrawals. Ninety-five trivial resolutions and five serious unresolved concerns can yield 95%. The readiness rules help, but the percentage should be presented as discussion progress, never confidence that the plan is correct.
- **The final-plan contract does not ensure an actionable handoff.** Mandatory sections cover risks, unknowns, and assumptions. There is no mandatory implementation sequence, dependencies, acceptance criteria, or verification plan. A compliant output can still leave the implementer substantial planning work. [Draft requirements](PLANGENIE.md:289).
- **"Zero silent assumptions" is an aspiration, not a verified property.** Tags identify provenance categories, but lack stable links to interview answers. No validator checks whether every requirement survived or whether a claimed verification has supporting evidence.
- **The workflow needs evidence of benefit.** The tracking files acknowledge that the latest protocol and several user journeys remain untested. Earlier reported stress tests do not establish current-version reliability. A useful evaluation would compare generated plans against a simpler interview-and-review baseline, measuring missed requirements, incorrect claims, user effort, and clarification needed during implementation. [Recorded test status](next_session.md).

I would prioritize **dependency packaging, reliable recovery, agreement on exact fixes, and complete issue preservation**, followed by a stronger final-plan template and repeatable evaluations.

Verification this session confirmed six core phases, matching v5 protocol markers across four files, and valid JSON metadata. `git diff --exit-code` returned **0**, and final status showed the same two pre-existing untracked files. **No end-to-end product run was performed, and no fixes were applied.**

---

# REVIEW ITERATION 2

Second independent read-only review by Codex (GPT, via the Codex plugin),
run on 2026-09-07 against commit `1d2ee40` on `main` (council protocol v6,
after the fixes for the review above were merged). Same task as before:
read `README.md`, parse every file in the repo, check that the codebase
matches what the README says, and give an independent review of the idea
and the tool for loopholes, bugs and misses. The text below is Codex's
answer, unedited apart from making its file links repo-relative.

---

**The README broadly matches the intended workflow, but its guarantees exceed what the current prompts reliably specify.** The main gaps are interruption recovery, preservation of review history, and council accounting.

I reviewed all **16 working-tree files**, including hidden adapters, reviewer definitions, local metadata, and the previous review, plus the active Git hook. Git's internal object database was excluded. **No files were created or edited.**

This is a prompt-based product: the implementation consists of Markdown instructions, with no application runtime or automated test suite. The findings below concern those instructions; live execution across the supported tools remains **not yet verified**.

| README claim | Assessment |
|---|---|
| Intake, blindspots, adaptive interview, "wrap up" | Consistently specified |
| Provenance tags and explicit unknowns | Specified, including answer references and a self-audit |
| Two-reviewer council with configurable stopping | Present, with accounting contradictions |
| Stop anywhere and resume exactly | Recovery gaps remain |
| Every reviewer point receives a final disposition | Intended, but state preservation is incomplete |
| Ordered implementation steps, dependencies, acceptance criteria | Required by the current prompt |
| Portable operation across AI tools | Adapters exist; universal behavior is not demonstrated |

The current revision addresses several issues in [the previous review](codex_review.md): installation dependencies are documented, reviewer files ship, round-one agreement requires compatible fixes, and the final-plan requirements are stronger.

The remaining findings, in priority order:

1. **High — resuming between rounds can lose access to frozen concerns.**

   Recovery permits the **current round's** merge file, but that file does not exist until the current reviews have been collected and merged. The latest cumulative ledger therefore remains in the previous round.

   For example, round 3 deadlocks a security concern; round 4 starts; the session closes before its merge. Recovery cannot load the previous merge under the prescribed read restrictions. Because deadlocked concerns are excluded from subsequent debate packets, their full arguments may be unavailable.

   **Recommendation:** Record the latest completed ledger's path independently of the active round, and always load it on resume.

   Evidence: [portable recovery](PLANGENIE.md:250), [Claude recovery](.claude/skills/council/SKILL.md:156), [Copilot recovery](.github/prompts/council.prompt.md:36).

2. **Medium — interview recovery can preserve a fact while losing its provenance record.**

   `UNKNOWNS.md` writes are batched. Its answer log must contain the original question, options, and answer. However, the checkpoint preserves only the current pending question and tagged "unflushed facts."

   If Q8 is answered and Q9 becomes pending before a batch write, an interruption can leave Q8's fact recoverable but its question and options missing. The required `(Q8)` audit trail cannot then be reconstructed without consulting the prohibited chat history.

   **Recommendation:** Checkpoint complete unflushed answer-log entries, including question IDs, options, answers, and confirmation status.

   Evidence: [write cadence](PLANGENIE.md:118), [answer-log requirements](PLANGENIE.md:151), [checkpoint fields](PLANGENIE.md:191).

3. **Medium — verified council edits lack the marker used to prevent duplicate application.**

   Resume identifies completed edits through their council point IDs. But the verified-edit alternative permits `[CONFIRMED] (verified: <source>, <date>)` without those IDs.

   An interruption during a partially completed apply therefore leaves some valid edits without the marker the recovery procedure expects. Whole-document hashes help when the entire apply completed and its hash was recorded; they do not resolve this partial-application case.

   **Recommendation:** Preserve council point IDs on verified edits as well.

   Evidence: [marker-based recovery](PLANGENIE.md:268), [verified-edit format](PLANGENIE.md:535), [Claude adapter equivalent](.claude/skills/plangenie/SKILL.md:217).

4. **Medium — the agreement formula contradicts two council rules.**

   Read-only arithmetic checks produced these counterexamples:

   | Scenario | Prescribed calculation |
   |---|---|
   | 99 settled points, one unexamined single-seat point | **99%**, satisfying a 95% stopping threshold |
   | Nine settled points, one separate open-verification point | **100%**, because open verification is omitted |

   The first contradicts the promise that unexamined single-seat points prevent percentage-based stopping. The second overstates debate completion. Open verification still reaches final review, so this is an accounting and stopping defect, rather than necessarily lost final content.

   **Recommendation:** Explicitly include verification obligations in unresolved counts and add the single-seat condition to the stopping predicate.

   Evidence: [single-seat policy](PLANGENIE.md:419), [formula and ledger states](PLANGENIE.md:521), [stopping predicate](PLANGENIE.md:543). Both automated councils repeat these rules.

5. **Medium — Copilot lacks a recovery branch between council closure and final-plan completion.**

   The adapter mirrors every council status into a Phase 4 checkpoint, including `CLOSED`. Phase 5 marks the overall run finished later.

   If interrupted between those actions, recovery returns to Phase 4. Its preflight treats only non-closed councils as resumable and proceeds toward new setup and archival. There is no explicit branch that recognizes "council completed; finalization pending."

   **Recommendation:** Route `Phase: 4` plus council `CLOSED` directly to Phase 5.

   Evidence: [checkpoint mirroring](.github/prompts/plangenie.prompt.md:146), [preflight](.github/prompts/plangenie.prompt.md:95), [finalization](.github/prompts/plangenie.prompt.md:159).

6. **Medium — fresh reviewers cannot reliably avoid repeating previously settled objections.**

   Reviewers receive fresh context and packets containing the document and carried points. They are told not to repeat settled points, but receive no required history of withdrawn or frozen objections.

   A withdrawn objection may leave the document unchanged, so a fresh reviewer can raise it again as a new concern. This can reopen disputes and distort the cumulative count.

   **Recommendation:** Include a compact previous-issues ledger in packets and explicitly match new concerns against existing IDs.

   Evidence: [Claude packet contract](.claude/skills/council/SKILL.md:68), [Copilot packets](.github/prompts/council.prompt.md:189).

7. **Medium — final-disposition bookkeeping needs an explicit update step.**

   `FINAL.md` is written before the user answers. Subsequent steps explicitly update verdicts in the log and apply changes to the plan, but do not explicitly refresh `FINAL.md`'s disposition ledger.

   Its stated invariant implies that updating is intended, so I classify this as a **specification ambiguity**, not a demonstrated runtime failure. A literal execution can leave accepted or rejected items listed as open.

   **Recommendation:** Update each affected ID's disposition and resolution record before advancing the final-review status.

   Evidence: [Claude final review](.claude/skills/council/SKILL.md:123), [Copilot final review](.github/prompts/council.prompt.md:336).

Two smaller README discrepancies remain: the walkthrough says **three setup questions**, whereas the automated adapters ask five; and "everything it writes" being under `planning/` excludes reviewer-agent files created or modified elsewhere. [Setup wording](README.md:86), [output-location wording](README.md:307).

My independent assessment is that **the interview, answer traceability, and explicit unknowns are the strongest parts of the idea**. They give users something concrete to inspect before implementation.

The council's added value is still unproven. The README correctly distinguishes agreement from correctness, but two reviewers can accept the same unsupported premise. A useful evaluation would compare PlanGenie against a simpler interview plus one independent review, measuring:

- Missed or altered user requirements.
- Unsupported factual claims.
- Clarifications needed during implementation.
- User effort, elapsed time, and review cost.

"Zero silent assumptions" should be presented as a design objective. The final handoff itself permits conservative improvisation with logging, and readiness can still include unresolved details. Those are reasonable choices, but the promise needs to reflect them.

The immediate priority is **complete recoverable state**, followed by consistent council accounting and interruption tests. The tracking files explicitly say the latest protocol is not field-tested; historical runs do not establish current-version reliability. [Recorded status](next_session.md).

Verification this session confirmed valid JSON metadata, six core phases, and matching v6 compatibility markers across all four adapters/councils. Current Claude documentation supports the agent-file hot-reloading and effort-setting approach. [Official Claude documentation](https://code.claude.com/docs/en/sub-agents).

`git diff --exit-code` returned **0**. Final Git status showed the same pre-existing untracked `.claude/settings.local.json`. No live planning workflow or fixes were executed.

---

# REVIEW ITERATION 3

Third independent read-only review by Codex (GPT, via the Codex plugin),
run on 2026-09-07 against commit `bba1f6a` on `main` (council protocol v7,
after the fixes for REVIEW ITERATION 2 were merged). Same task as before:
read `README.md`, parse every file in the repo, check that the codebase
matches what the README says, and give an independent review of the idea
and the tool for loopholes, bugs and misses. The text below is Codex's
answer, unedited apart from making its file links repo-relative.

---

**The README broadly matches the current implementation, but its promises of exact recovery and reliable council completion are stronger than the protocol supports.** The interview and provenance design are useful; interruption handling and repeated reviews still have concrete gaps.

I reviewed all **16 working-tree files**, including hidden adapters, reviewer definitions, metadata, tracking files, and previous reviews, plus the active Git hook. Git's internal history/object database was excluded. **No files were created or edited.**

This is a prompt-based product: Markdown instructions are its implementation. Findings below distinguish instruction defects from behavior that still needs live testing.

| README claim | Assessment |
|---|---|
| Intake, blindspots, adaptive interview, "wrap up" | Consistently specified |
| Provenance tags, answer references, explicit unknowns | Specified; enforced only through model instructions |
| Two-reviewer council and configurable stopping | Present, with lifecycle gaps |
| Every concern gets a final disposition | Required, but reopening reviews can invalidate that bookkeeping |
| Stop anywhere and resume exactly | Recovery defects remain |
| Ordered build steps, dependencies, acceptance criteria | Required by the core prompt |
| Claude/Copilot installation files | Present; earlier missing-dependency issues are addressed |
| Universal operation across AI tools | Portable prompt exists; cross-platform reliability remains unverified |

The main findings, in priority order:

1. **High — An interruption can cause resume to skip newly approved fixes.**

   Both automated councils save `FINAL REVIEW (m/m)` before recording the fresh document hash for applying those verdicts. If interrupted between those writes, the stored hashes still describe the preceding round.

   Resume then sees the document matching the old "after" hash and says **"nothing to apply, advance the stage"**, although the user's new resolutions remain unapplied. An in-memory walkthrough of the prescribed branches reproduced that decision. The final-ledger guard conflicts with it, so recovery can skip work or stall.

   **Recommendation:** Persist an identified resolution batch and its fresh baseline before publishing the resumable application stage; invalidate previous application hashes.

   Evidence: [Claude final application](.claude/skills/council/SKILL.md:125), [Claude reconciliation](.claude/skills/council/SKILL.md:64), [Copilot equivalent](.github/prompts/council.prompt.md:391).

2. **Medium — Recovery markers collide across repeated reviews.**

   Final resolutions use markers such as `user approved, final review item 1`. Another final-review cycle starts numbering at 1 again, while the old marker remains in the document. Council point IDs also lack a run identifier.

   During partial-application recovery, the old marker can make a **new** edit look already applied. The read-only counterexample confirmed that marker presence cannot distinguish those cases.

   **Recommendation:** Use unique run, review-cycle, and edit identifiers; verify the expected resulting content as well as marker presence.

   Evidence: [Core recovery markers](PLANGENIE.md:285), [Copilot marker comparison](.github/prompts/council.prompt.md:177).

3. **Medium — "Run more rounds" conflicts with permanently frozen disagreements.**

   The closing question promises to send open items back into debate. Elsewhere, deadlocked items are explicitly frozen and **never carried again**. There is no reopening transition.

   Additionally, user verdicts update `FINAL.md`, while the authoritative `LEDGER` still points to the preceding round's merge file. A subsequent round or fresh-session resume can therefore use states from before the user's decisions.

   **Recommendation:** Create an updated authoritative ledger before continuing, explicitly reopen the selected unresolved points, and persist the extended round limit.

   Evidence: [Core freeze rule](PLANGENIE.md:542), [continuation promise](PLANGENIE.md:630), [Claude ledger construction](.claude/skills/council/SKILL.md:112).

4. **Medium — Claude's "Start over" path skips active-council cleanup.**

   The adapter archives the old run immediately. It does not first cancel its background reviewer jobs or restore temporarily modified reviewer-agent settings.

   A new council can then record the abandoned council's temporary settings as the "original" values. Its eventual restoration preserves those wrong settings, while an old reviewer may continue consuming resources.

   **Recommendation:** Route "Start over" through the existing abandonment procedure—cancel, restore, record abandonment—before archiving.

   Evidence: [Start-over path](.claude/skills/plangenie/SKILL.md:24), [existing cleanup procedure](.claude/skills/council/SKILL.md:155).

5. **Medium — Claude resume confuses the starting directory with the Git root.**

   Output belongs under the directory where PlanGenie started. However, the council records the Git top-level directory as its workspace root and instructs recovery to work from there.

   Starting in `repo/subproject/` creates `repo/subproject/planning/`; resolving the same relative paths during recovery from the Git root points to `repo/planning/`.

   **Recommendation:** Record separate absolute paths for the artifact directory and the reviewer-job workspace.

   Evidence: [Output location](.claude/skills/council/SKILL.md:10), [recorded root](.claude/skills/council/SKILL.md:46), [resume directory](.claude/skills/council/SKILL.md:154).

6. **Medium — Incomplete packets and unsuccessful critiques lack a reliable recovery state.**

   Copilot resume reuses an existing packet based on its presence. A write interrupted halfway can leave an incomplete packet. Reviewers are correctly instructed to stop on truncation, but collection does not explicitly require proof that a complete review occurred before accepting the reply.

   This leaves an undefined path between a truncation notice, a saved critique, and the "no concerns raised" exit. **A false clean review is a risk, not a live-reproduced result.**

   **Recommendation:** Validate packet completeness before dispatch and require an explicit completed-review result before counting a seat as collected.

   Evidence: [Packet reuse](.github/prompts/council.prompt.md:167), [collection and failure handling](.github/prompts/council.prompt.md:253), [clean-review exit](.github/prompts/council.prompt.md:288).

There are also smaller documentation and compatibility issues:

- **Crash cleanup is overstated.** The [README](README.md:144) says crashes and usage limits cancel the GPT reviewer. The [council's own recovery instructions](.claude/skills/council/SKILL.md:160) correctly acknowledge that jobs may survive when session cleanup did not execute.
- **Antigravity's recipe needs a migration note.** Its workflow size workaround is correct, but current official documentation says workflows retire **November 1, 2026**. New installation guidance should use skills. [README recipe](README.md:264), [official migration guide](https://antigravity.google/docs/migration/workflows-to-skills).
- **Copilot model selection omits a prerequisite.** Official documentation restricts subagents from selecting a more expensive model than their parent. The setup should check this before promising automated seats; the existing fallback mitigates failure. [Model setup](.github/prompts/council.prompt.md:80), [official subagent documentation](https://code.visualstudio.com/docs/agents/run/subagents).
- **Codex setup omits the restart step.** Its deprecated custom-prompt recipe otherwise matches current documentation. [README](README.md:249), [official custom-prompt instructions](https://learn.chatgpt.com/docs/custom-prompts).

My independent assessment of the idea: **the strongest value is turning vague wishes into traceable requirements before implementation.** Teaching blindspots, separating approval from verification, and recording unanswered questions all serve that purpose.

The main product gaps are:

- **"Zero silent assumptions" is an objective, not an established guarantee.** Tags and self-audits depend on the same model following the instructions correctly. The final handoff also permits conservative improvisation with logging.
- **User requirements need an explicit conflict rule.** Council edits are automatically applied, while the self-audit checks that each answer appears somewhere—even in Remaining Unknowns. It does not explicitly prevent a council suggestion from contradicting a preserved user requirement. Final acceptance mitigates this, but a requirement-conflict check would be stronger. [Apply rule](PLANGENIE.md:578), [self-audit](PLANGENIE.md:340).
- **The council's added value remains unmeasured.** Compare it with the same interview followed by one independent review. Measure missed requirements, incorrect claims, implementation clarifications, user effort, elapsed time, and cost.
- **The protocol needs repeatable evaluation more than additional prose.** Current v7 behavior is explicitly marked not field-tested. Retain fixtures for interruptions, changed answers, failed reviewers, repeat councils, and implementation handoffs. Historical tests do not establish current-version reliability. [Recorded status](next_session.md:6).

Verification this session confirmed **six core phases, matching v7 markers across all four adapters/councils, all eight advertised product files present, and valid JSON metadata**. Both working-tree and staged `git diff --exit-code` checks returned **0**; the pre-existing untracked `.claude/settings.local.json` remained.

**No live end-to-end workflow was run, and no fixes were applied.** CodeRabbit's CLI was unavailable; this report comes from direct inspection and independent agent reviews.

# REVIEW ITERATION 4

Fourth independent read-only review by Codex (GPT, via the Codex plugin),
run on 2026-09-07 against commit `98e2dc5` on `main` (council protocol v8,
after the fixes for REVIEW ITERATION 3 were merged). Same task as before:
read `README.md`, parse every file in the repo, check that the codebase
matches what the README says, and give an independent review of the idea
and the tool for loopholes, bugs and misses. The text below is Codex's
answer, unedited apart from making its file links repo-relative.
**The README broadly matches the intended workflow, but the current tool does not fully support its promises of exact recovery and reliable council completion.** The interview and provenance design are useful; the remaining weaknesses are mainly in interrupted reviews, fallback transitions, and repeated review cycles.

I reviewed all **16 working-tree files**, including hidden adapters, reviewer definitions, metadata, tracking files, and previous reviews, plus the active Git hook. Two independent agents reviewed the Claude and Copilot implementations. Git’s internal history and object database were excluded. **No files were created or edited.**

This is a prompt-based product. The findings below are defects or ambiguities in its instructions; live behavior is **not yet verified**.

| README claim | Assessment |
|---|---|
| Intake, blindspots, adaptive interview, “wrap up” | Consistently specified |
| Provenance tags, answer references, explicit unknowns | Specified; enforcement depends on model compliance |
| Two reviewers, configurable rounds, final user decisions | Implemented in prompts, with lifecycle gaps |
| Stop anywhere and resume exactly | Overstated; concrete recovery defects remain |
| Every concern retains a disposition | Required, but interrupted persistence can undermine it |
| Ordered build steps, dependencies, acceptance criteria | Required by the current core |
| Claude/Copilot installation and dependencies | Mostly aligned; personal-copy precedence remains problematic |

The most significant findings are:

1. **High — Claude’s pause path can mark an incomplete round as collected.**

   The pause procedure says that collecting a completed Codex result makes the pause land at `collected`. However, Esc may have killed the Claude reviewer before its critique was saved. Elsewhere, `collected` means **both** critiques exist, and resuming that state immediately proceeds to merge.

   **Trigger:** Codex finishes → Claude is still working → Esc → type “pause” → only Codex’s critique is saved → resume proceeds to merge.

   **Recommendation:** Advance to `collected` only after validating both critiques, or recording the user’s explicit single-seat choice. [Pause procedure](.claude/skills/council/SKILL.md:151), [state definition](.claude/skills/council/SKILL.md:57).

2. **High — Switching from automated review to relay mode lacks a durable transition.**

   After Codex fails, the Claude adapter offers relay mode. By then, automated council state and temporary reviewer settings may already exist. The fallback does not specify how to transfer that state, record the new mode, or restore the settings. On a fresh-session resume, the adapter prioritizes the still-live automated log.

   Consequently, a user who chose relay can be routed back into automated review.

   **Recommendation:** Define a persisted handoff that transfers the ledger and pending seats, handles outstanding jobs, and restores settings. [Fallback](.claude/skills/plangenie/SKILL.md:214), [resume precedence](.claude/skills/plangenie/SKILL.md:132).

3. **Medium — “Run more rounds” introduces ambiguous voting on reopened points.**

   Reopened disagreements go to **both** reviewers. The ordinary tallying rule assumes a point is going to the other reviewer and says `AGREE` means apply. There is no explicit rule for receiving `AGREE` from one reviewer and `REBUT` from the other on the same reopened point.

   **Recommendation:** Require both current reviewers to agree on the same proposed change before applying a reopened point. [Reopen rule](PLANGENIE.md:669), [ordinary tallying](PLANGENIE.md:553).

4. **Medium — Final-review item numbers conflict with cycle progress counters.**

   Item numbers continue across cycles, but `FINAL REVIEW(k/m)` represents the number answered within the current cycle. The instructions reuse `k` for both purposes.

   For example, after three items in cycle one, cycle two’s two items are numbered **4 and 5**. Literal application yields `4/2` and `5/2`, while the apply/resume transition expects `2/2`.

   **Recommendation:** Separate permanent `item_id` from the current cycle’s `answered_count`. This ambiguity appears in both automated councils. [Copilot verdict handling](.github/prompts/council.prompt.md:440), [Claude equivalent](.claude/skills/council/SKILL.md:129).

5. **Medium — Saved critiques are trusted by existence during recovery.**

   Copilot validates incoming critique completeness, but resume explicitly collects only missing critique files and prohibits requesting an existing one again. It does not revalidate the saved file.

   Under the protocol’s stated interrupted-write scenario, a partial critique can therefore count as present and prevent recovery of its missing concerns. Packets already receive an explicit completeness check; critiques need the same treatment.

   **Recommendation:** Validate persisted critiques before counting a seat as complete. [Resume rule](.github/prompts/council.prompt.md:59), [collection and validation](.github/prompts/council.prompt.md:283).

6. **Medium — Cross-tool resume is claimed without host-specific cleanup.**

   The Copilot council says a Claude council can resume in Copilot. Claude state can contain running Codex jobs and temporarily modified Claude agent settings. Copilot’s resume and close procedures neither audit those jobs nor restore those settings.

   **Recommendation:** Record the originating tool and implement migration, or restrict cross-tool continuation to explicitly supported boundaries. [Compatibility claim](.github/prompts/council.prompt.md:18), [Copilot close](.github/prompts/council.prompt.md:500), [Claude cleanup](.claude/skills/council/SKILL.md:134).

7. **Medium — Reopened councils reference a ledger omitted from checkpoint commits.**

   Reopening creates `reopen-<c>-ledger.md` and makes it authoritative. The explicit commit paths include `round-N-*.md` and later `FINAL.md`, but omit the reopen ledger.

   Same-disk recovery can still work. Restoring a checkpoint commit, however, can produce a log pointing to a missing file.

   **Recommendation:** Include the authoritative ledger in each checkpoint’s staged paths. [Ledger creation](.claude/skills/council/SKILL.md:131), [commit paths](.claude/skills/plangenie/SKILL.md:264).

8. **Low — Running the repository can silently select an older personal core.**

   The Claude adapter explicitly loads the personal `PLANGENIE.md` before the repository copy. This can combine a stale personal core with current project adapters. The core has no corresponding compatibility check.

   **Recommendation:** Resolve the core relative to the loaded installation, with an explicit version check. [Core lookup](.claude/skills/plangenie/SKILL.md:59).

**My independent assessment of the idea:** its strongest value is converting vague wishes into traceable requirements. Teaching blindspots, recording exact answers, distinguishing approval from verification, and requiring acceptance criteria are worthwhile features.

The council’s additional value remains unmeasured. Different models can share the same mistaken premise, and negotiated agreement can suppress a valid objection. The README correctly says agreement measures debate progress, not correctness.

Three product priorities follow:

- **Make the promise measurable.** “Zero silent assumptions” is a design objective, not an established guarantee.
- **Evaluate the cost of the workflow.** Compare the same interview plus one independent review against the full council. Measure missed requirements, unsupported claims, implementation clarifications, user effort, elapsed time, and cost.
- **Test the current protocol before expanding it.** Retain repeatable cases for interrupted collection, partial writes, relay fallback, reopened disagreements, changed answers, and implementation handoff. The tracking files explicitly say v8 is not field-tested. [Recorded status](next_session.md:6).

The README’s updated Copilot restrictions match current official documentation: prompt files exclude Agent Host agents, and subagents cannot exceed their parent’s model cost tier. [Prompt-file documentation](https://code.visualstudio.com/docs/agent-customization/prompt-files), [subagent documentation](https://code.visualstudio.com/docs/agents/run/subagents).

Verification this session confirmed **all eight advertised product files, six core phases, matching v8 markers across four adapters/councils, and valid JSON metadata**. Working-tree and staged diff checks both returned **0**; the pre-existing untracked `.claude/settings.local.json` remained. **No live end-to-end workflow was run, and no fixes were applied.**
