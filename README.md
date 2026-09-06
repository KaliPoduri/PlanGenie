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
   8–20 questions, quit anytime with "wrap up", or stop at any moment and
   pick up later exactly where you left off.
4. **Draft plan** — every line tagged with where it came from
   (`[USER]` / `[CONFIRMED]` / `[CANDIDATE]` / `[OPEN]`); no unverified
   tool names stated as fact.
5. **Council review** — two other AIs critique the plan, hunt for made-up
   facts, and debate each other until they agree (you set the bar, for
   example 95% agreement, and a round limit); you decide only what they
   could not settle, at the end. The percentage is how much of their debate
   is settled, not a score for the plan — the leftovers they hand you are
   what matters.
6. **Final plan** — a PLAN.md any AI coding agent can implement: build
   steps in order, what each step needs first, how to tell each feature is
   done, and deviation-logging instructions baked in.

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
   `planning/packets/round-1-packet.md` when it can).
2. Open a NEW chat and paste the packet in — or attach the packet file.
   *Shortcut:* if your app has a model picker (GitHub Copilot, Cursor, and
   similar), open a new chat and pick a different model from the dropdown.
   That counts as a different AI — no second app or account needed.
3. Copy the reviewer's whole reply and paste it back to PlanGenie.
4. Do the same for the second reviewer seat when PlanGenie asks.
5. PlanGenie merges the two replies, applies what both reviewers agree on,
   and sends the rest back to them for another round. It prints a one-line
   round summary each time; it does not ask you anything.

Before round 1 it asks you three quick questions: the stop rule (keep going
until the reviewers agree on 95% of the points, or a fixed number of
rounds), the round limit (default 5), and which AI serves each seat. When the
rule is met, it shows you the finished plan and only the leftovers — points
the two reviewers could not settle, each with both sides in plain words,
plus anything still undecided when the rounds ran out, small points
included — and you pick a side or leave them open. Nothing a reviewer
raised is dropped on the way: every point ends up applied, withdrawn,
rejected by you, or listed as open. One last question: accept the plan,
or run more rounds. (In Claude Code with the Codex plugin the whole step
runs by itself: you answer the setup questions, wait, and judge the
leftovers.)

**Step 6 — Get your plan.** PlanGenie prints the final `PLAN.md` (with a
coding tool it is saved as `planning/PLAN.md` in the folder you started
from). Save it.
To build the project, open any AI coding tool and say "Implement this plan",
giving it the file. The plan already contains instructions telling that AI
what to verify and what to ask you about instead of guessing. Keep
`UNKNOWNS.md` nearby too — it lists the open questions to settle as you go.

## Stop and pick up later

You can stop at any moment — in the middle of the interview, while the
reviewers are debating, anywhere — and continue later from that exact spot.

- **To stop:** just stop. Press Esc in Claude Code, the Stop button in
  Copilot or Cursor, or close the window. PlanGenie writes its place down
  before every step, so at worst it re-asks the question you were on. You do
  not need to type anything first. (When PlanGenie is waiting for an answer,
  you can also type **"pause"** — it then prints three lines saying where it
  stopped and how to come back.)
- **To continue in the same chat:** type **"resume"**.
- **To continue in a new chat** (handy when a long chat gets slow or runs out
  of room): start PlanGenie again in the same folder — `/plangenie` in Claude
  Code or Copilot, or paste `PLANGENIE.md` and say "resume from
  CHECKPOINT.md". It reads only its own small state files, so the new chat
  has nearly all its room free. It will not repeat questions you already
  answered.

Where the place is kept: with a coding tool, in a small
`planning/CHECKPOINT.md` next to `planning/PLAN.md` (plus
`planning/council_state/LOG.md` during the review). In a plain web chat
that cannot save files, PlanGenie instead prints a RESUME BLOCK at every
phase boundary, after every council round, and whenever you type "pause" —
copy it somewhere safe and paste it, together with `PLANGENIE.md`, into the
new chat. The block carries everything, the reviewers' debate included, so
the new chat continues exactly; closing such a chat without a block loses
the work since the last one.

What a stop does to a reviewer that is still working (Claude Code with the
automated council):

| How you stopped | What happens |
|---|---|
| Esc, session still open | The GPT reviewer keeps working in the background; "resume" collects its answer |
| Closed or cleared the session, crash, usage limit | The Codex plugin cancels that reviewer; the round is simply run again when you resume. Everything else is kept |

## Set up in your coding tool

Every setup below does the same thing: it registers `PLANGENIE.md` as a saved
prompt so you can start it with one slash command instead of pasting. In each
recipe, "the file" means the **full contents of `PLANGENIE.md`**.

One difference to know: the **automated** council (two AIs reviewing without
your help) exists in Claude Code and, when your Copilot has subagents, in
GitHub Copilot. In every other tool, PlanGenie notices it can't call other
models and automatically falls back to relay mode — that behavior is built
into the prompt, so nothing breaks.

### Claude Code

*This project only* — nothing to do. Everything ships in this repo: the
`/plangenie` skill (`.claude/skills/plangenie/`), the `/council` skill it
hands the review to (`.claude/skills/council/`), and the two reviewer-seat
agent files (`.claude/agents/council-claude-seat.md` and
`council-claude-seat-2.md`). Start a session **in the repo folder** and type
`/plangenie`. (Starting the session in a parent or different folder is the
usual reason the command shows as "unknown".)

*Every project on your machine* — install all four pieces as personal
files; the council and the agent files are dependencies, not extras:

1. Copy the folder `.claude/skills/plangenie/` to `~/.claude/skills/plangenie/`
   (on Windows: `C:\Users\<you>\.claude\skills\plangenie\`).
2. Put a copy of `PLANGENIE.md` inside that same folder (the skill looks there
   first, because other projects won't have the file in their root).
3. Copy the folder `.claude/skills/council/` to `~/.claude/skills/council/`.
   Without it `/plangenie` cannot run the automated council and falls back
   to relay mode.
4. Copy the two files in `.claude/agents/` to `~/.claude/agents/`. They are
   the read-only reviewer seats; without them a seat runs as a
   general-purpose agent with no enforced read-only boundary.
5. For the GPT seat, install the OpenAI Codex plugin for Claude Code
   (`openai-codex`) and sign in to Codex once. Without it the council
   offers a Claude-only review (two different Claude models) or relay mode.
6. Start a new Claude Code session anywhere and type `/plangenie`.

The Claude Code version keeps `PLAN.md` and `UNKNOWNS.md` as real files in a
`planning/` folder under the directory you started from and, if
the OpenAI Codex plugin is installed, runs the council automatically: you pick
the two models, their reasoning effort, the stop rule and the round limit up
front; Claude and GPT then debate on their own, and you judge only the open
items at the end. No Codex plugin? It offers Claude-only review or relay mode.
One thing to know: the council pins the chosen model and effort into the two
agent files while it runs and puts them back when it closes, so run one
council at a time on a machine.

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

1. Copy the folder `.github/prompts/` from this repo into your project. It
   holds `plangenie.prompt.md`, `council.prompt.md` and
   `council-review.prompt.md`. Put a copy of `PLANGENIE.md` in that same
   `.github/prompts/` folder — `/plangenie` looks for it there first, then in
   the project root.
2. In the Copilot Chat input (agent mode), type `/plangenie`.

Note: this works in VS Code's Copilot Chat with the built-in agents that
run inside VS Code. VS Code's documentation says agents running on the
"Agent Host" (the hosted Copilot agent) do not use prompt files at all —
for those, paste `PLANGENIE.md` or convert it to an agent skill. The
separate Copilot CLI does not support prompt files either at the time of
writing — paste `PLANGENIE.md` there instead. The prompt files use the
`agent:` front-matter field that VS Code currently documents; if your VS
Code is older and expects `mode:`, rename that one line.

The three commands:

- `/plangenie` — the whole flow. The interview and the plan come from
  `PLANGENIE.md`; the review step is handed to `/council`, so the council
  logic lives in one place.
- `/council` — the council on its own, for any existing plan or document:
  type `/council` and attach the file. It asks which two models to use, the
  reasoning effort, the stop rule (for example 95% agreement) and a round
  limit; runs the rounds as Copilot subagents when your Copilot has them,
  and otherwise tells you which packet file to carry to a second chat;
  applies what both seats agree on; asks you only about the open items at
  the end; and keeps `planning/council_state/LOG.md` so a stop and a later `/council` on
  the same file resume where it stopped.
- `/council-review` — the reviewer seat for that second chat: pick a
  DIFFERENT model from the model picker, type `/council-review`, and attach
  the packet file.

None of the three is field-tested yet — if a command does not appear, check
that "Chat: Prompt Files" is enabled in VS Code settings; pasting
`PLANGENIE.md` works as always.

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
([docs](https://antigravity.google/docs/ide/workflows/)). A workflow file
is limited to 12,000 characters and `PLANGENIE.md` is about 39,000, so the
workflow cannot hold the file itself; it points at it instead:

1. Put a copy of `PLANGENIE.md` in the root of your workspace.
2. Create `.agent/workflows/plangenie.md` (some newer builds use
   `.agents/workflows/` — if the command doesn't appear, try that spelling)
   containing only this:

   ```
   ---
   description: PlanGenie — interview me about a software idea and produce an implementation plan
   ---
   Read the file PLANGENIE.md in the workspace root in full, in chunks if
   it is long, and follow it exactly from its first line: you are
   PlanGenie. If the file is missing, say so and stop — never reconstruct
   it from memory. Then ask for my one-line project idea.
   ```

3. In the agent chat, type `/` and pick **plangenie**.

### Anything else (Windsurf, JetBrains AI, web chats, …)

Paste the file into the chat. That is the officially supported universal
install method — PlanGenie was designed to survive as a plain pasted prompt.

## Share it

Email `PLANGENIE.md` to anyone. It is the whole product. To share the Claude
Code version, send the `.claude/skills/plangenie/` and
`.claude/skills/council/` folders and the `.claude/agents/` files along with
`PLANGENIE.md`, and point them at the setup steps above.

## Files

| File | What it is |
|---|---|
| `PLANGENIE.md` | The portable agent — paste into any AI chat |
| `.claude/skills/plangenie/SKILL.md` | Claude Code adapter (`/plangenie`) — hands the review step to the council skill |
| `.claude/skills/council/SKILL.md` | Claude Code `/council` — the council on any document, also used by `/plangenie` |
| `.claude/agents/council-claude-seat.md`, `council-claude-seat-2.md` | The two read-only Claude reviewer seats the council dispatches |
| `.github/prompts/plangenie.prompt.md` | Copilot adapter (`/plangenie`) — hands the review step to `/council` |
| `.github/prompts/council.prompt.md` | Copilot `/council` — the council on any document, also used by `/plangenie` |
| `.github/prompts/council-review.prompt.md` | Copilot reviewer-seat prompt for a second chat |
| `planning/` | Created in the folder you run PlanGenie from; everything it writes goes here |
| `planning/PLAN.md`, `planning/UNKNOWNS.md` | The plan and the register of knowns and unknowns |
| `planning/CHECKPOINT.md` | Where PlanGenie is right now — lets any stop continue from the exact step |
| `planning/packets/` | The reviewers' debate: packets, critiques, merge files (each one the running ledger of every point so far), `FINAL.md` |
| `planning/council_state/` | `LOG.md` — where the council is, used to pause and resume it |
| `planning/status/next_session.md` | One paragraph: where the run is and what happens next |
| `planning/status/progress.md` | One line per milestone (phase entered, round applied, pause, resume, finished) |
