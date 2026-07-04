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

## Quick start — run it anywhere

`PLANGENIE.md` is the whole product. No install, no coding required.

1. Open `PLANGENIE.md`. Copy ALL of it.
2. Paste it into a new chat with any AI (ChatGPT, Gemini, Claude, anything).
3. Type your project idea. Answer the questions.
4. When it produces the "Council Review Packet", paste that into a *different*
   AI, then paste the reply back. That's the review step, done by hand
   ("relay mode").

## Set up in your coding tool

Every setup below does the same thing: it registers `PLANGENIE.md` as a saved
prompt so you can start it with one slash command instead of pasting. In each
recipe, "the file" means the **full contents of `PLANGENIE.md`**.

One difference to know: the **automated** council (two AIs reviewing without
your help) exists only in Claude Code. In every other tool, PlanGenie notices
it can't call other models and automatically falls back to relay mode — that
behavior is built into the prompt, so nothing breaks.

### Claude Code

*This project only* — nothing to do. The skill ships in this repo at
`.claude/skills/plangenie/`. Start a session **in the repo folder** and type
`/plangenie`. (Starting the session in a parent or different folder is the
usual reason the command shows as "unknown".)

*Every project on your machine* — install it as a personal skill:

1. Copy the folder `.claude/skills/plangenie/` to `~/.claude/skills/plangenie/`
   (on Windows: `C:\Users\<you>\.claude\skills\plangenie\`).
2. Put a copy of `PLANGENIE.md` inside that same folder (the skill looks there
   first, because other projects won't have the file in their root).
3. Start a new Claude Code session anywhere and type `/plangenie`.

The Claude Code version keeps `PLAN.md` and `UNKNOWNS.md` as real files and, if
the OpenAI Codex plugin is installed, runs the council automatically: Claude
reviews, GPT reviews, you judge. No Codex plugin? It offers Claude-only review
or relay mode.

### Cursor

Cursor turns Markdown files in a `commands` folder into slash commands
([docs](https://cursor.com/docs)):

1. In your project, create the folder `.cursor/commands/` — or use
   `~/.cursor/commands/` to get the command in every project.
2. Save the file there as `plangenie.md`.
3. In Cursor's chat (Agent) input, type `/plangenie` and press enter, then
   give your idea.

### GitHub Copilot (VS Code)

Copilot Chat supports "prompt files" — Markdown prompts invoked as slash
commands ([docs](https://code.visualstudio.com/docs/agent-customization/prompt-files)):

1. In your repo, create `.github/prompts/plangenie.prompt.md` and paste the
   file into it. (Or run the **Chat: New Prompt File** command in VS Code and
   choose *user* storage to make it available in all projects.)
2. In the Copilot Chat input, type `/plangenie`.

Note: this works in VS Code's Copilot Chat. The separate Copilot CLI does not
support prompt files at the time of writing — paste the file there instead.

### OpenAI Codex (CLI and IDE extension)

Codex reads custom prompts from your home directory
([docs](https://developers.openai.com/codex/custom-prompts)):

1. Save the file as `~/.codex/prompts/plangenie.md`
   (Windows: `C:\Users\<you>\.codex\prompts\plangenie.md`).
2. In Codex, open the slash menu and pick it — `/prompts:plangenie` on current
   versions (`/plangenie` on older ones).

Note: OpenAI now marks custom prompts as deprecated in favor of "skills", but
they still work; if yours ever stops appearing, paste the file instead.

### Google Antigravity

Antigravity's "workflows" are saved prompts triggered with `/`
([docs](https://antigravity.google/docs/rules-workflows)):

1. In your workspace, create `.agent/workflows/plangenie.md` and paste the
   file into it. (Some newer builds use `.agents/workflows/` — if the command
   doesn't appear, try that spelling.)
2. In the agent chat, type `/` and pick **plangenie**.

### Anything else (Windsurf, JetBrains AI, web chats, …)

Paste the file into the chat. That is the officially supported universal
install method — PlanGenie was designed to survive as a plain pasted prompt.

## Share it

Email `PLANGENIE.md` to anyone. It is the whole product. To share the Claude
Code version, send the `.claude/skills/plangenie/` folder along with
`PLANGENIE.md` and point them at the setup steps above.

## Files

| File | What it is |
|---|---|
| `PLANGENIE.md` | The portable agent — paste into any AI chat |
| `.claude/skills/plangenie/SKILL.md` | Claude Code adapter (`/plangenie`) |
| `PLAN.md`, `UNKNOWNS.md` | Created per project while PlanGenie runs |
