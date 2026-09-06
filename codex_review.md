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
