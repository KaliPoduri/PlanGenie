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
   facts; you accept or reject each change (up to 5 rounds).
6. **Final plan** — a PLAN.md any AI coding agent can implement, with
   deviation-logging instructions baked in.

## Quick start — run it anywhere

`PLANGENIE.md` is the whole product. No install, no coding required.

1. Open `PLANGENIE.md`. Copy ALL of it.
2. Paste it into a new chat with any AI (ChatGPT, Gemini, Claude, anything).
3. Type your project idea. Answer the questions.
4. When it produces the "Council Review Packet", paste that into a *different*
   AI, then paste the reply back. That's the review step, done by hand
   ("relay mode"). Tip: in apps with a model picker (GitHub Copilot, Cursor),
   a new chat with a different model selected counts as a different AI.

New to this? The next section walks through every step in plain words.

## Step by step — what happens and what you do

You never need to write code or know technical terms. This is the whole
journey, in order.

**Step 1 — Start PlanGenie.** Copy everything in `PLANGENIE.md` and paste it
into a new AI chat. Or, if you set up a slash command (recipes below), just
type `/plangenie`.

**Step 2 — Give your idea in one line.** Example: "An app that reminds my
family whose turn it is to do the dishes."

**Step 3 — Answer its questions.** PlanGenie asks one question at a time,
usually multiple choice. Two things to know:

- "I don't know" is always a fine answer. It gets recorded as an open
  question instead of a silent guess — that is the whole point of the tool.
- Type **"wrap up"** any time you have had enough; it jumps to the draft.

It will also repeat your answers back ("Did I get that right?"). Just say yes,
or say no and correct it.

**Step 4 — Check the summary.** Before drafting anything, PlanGenie explains
the project back to you in plain words. Fix anything it got wrong.

**Step 5 — The council review (the only part with any legwork).** Two other
AI "reviewers" now criticize the plan and hunt for made-up facts. In most
chat apps, you are the messenger between them:

1. PlanGenie prints a "Council Review Packet" (and saves it as a file like
   `council/round-1-packet.md` when it can).
2. Open a NEW chat and paste the packet in — or attach the packet file.
   *Shortcut:* if your app has a model picker (GitHub Copilot, Cursor, and
   similar), open a new chat and pick a different model from the dropdown.
   That counts as a different AI — no second app or account needed.
3. Copy the reviewer's whole reply and paste it back to PlanGenie.
4. Do the same for the second reviewer seat when PlanGenie asks.
5. PlanGenie then shows you each suggested change with plain-language pros
   and cons. You say yes or no to each. Nothing changes without your OK.

This repeats for up to 5 rounds; usually the reviewers run out of complaints
sooner. (In Claude Code with the Codex plugin, this whole step runs by
itself — you only do the yes/no part.)

**Step 6 — Get your plan.** PlanGenie prints the final `PLAN.md`. Save it.
To build the project, open any AI coding tool and say "Implement this plan",
giving it the file. The plan already contains instructions telling that AI
what to verify and what to ask you about instead of guessing. Keep
`UNKNOWNS.md` nearby too — it lists the open questions to settle as you go.

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

This repo also ships `.github/prompts/council-review.prompt.md`, a
reviewer-seat prompt for the council step: open a second Copilot chat, pick a
DIFFERENT model from the model picker, type `/council-review`, and attach the
packet file PlanGenie saved. Not yet field-tested — if the command does not
appear, pasting the packet works as always.

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
| `.github/prompts/council-review.prompt.md` | Copilot reviewer-seat prompt for the council step |
| `PLAN.md`, `UNKNOWNS.md` | Created per project while PlanGenie runs |
