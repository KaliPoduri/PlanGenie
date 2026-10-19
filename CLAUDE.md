# PlanGenie — project rules

- Source of truth for the core prompt is `PLANGENIE.md` in the repo root; the adapter is `.claude/skills/plangenie/SKILL.md`.
- The user-level copy in `~/.claude/skills/plangenie/` is auto-synced by the git post-commit hook (`.git/hooks/post-commit`). Commit after editing either file — uncommitted edits do not sync.

## Agent skills

### Issue tracker

GitHub Issues on KaliPoduri/PlanGenie, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
