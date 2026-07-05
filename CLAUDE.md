# PlanGenie — project rules

- Source of truth for the core prompt is `PLANGENIE.md` in the repo root; the adapter is `.claude/skills/plangenie/SKILL.md`.
- The user-level copy in `~/.claude/skills/plangenie/` is auto-synced by the git post-commit hook (`.git/hooks/post-commit`). Commit after editing either file — uncommitted edits do not sync.
