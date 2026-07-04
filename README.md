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
