# DigiTales AI

A short, choice-driven story game about digital citizenship, for adults (18+). SEGP Group 012. Prototype for supervisor feedback, then a pilot with about 10 adults.

The learner reads one story ("The Photo in the Group Chat"), makes three decisions, and writes why at two of them. A reader looks at each written answer and picks a follow-up that fits it. The ending comes from the written answers, not from which option was picked. There are no points, scores, badges, timers or leaderboards.

The design pack is in [`design/`](design/index.html). The build follows it.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` first if you want to change anything. The defaults work.

| Command | What it does |
|---|---|
| `npm run dev` | Run locally |
| `npm run build` then `npm start` | Production build and server |
| `npm test` | Unit tests (rules, branching, endings, copy checks) |
| `npm run test:e2e` | Full-flow tests in a real browser (first run: `npx playwright install chromium`) |
| `npm run typecheck` | TypeScript check |
| `npm run audio` | Make the voice files (see below) |

## Edit the words

Everything the learner reads or hears is in two files. You do not need to touch code.

- `content/story.json`: the story, the decisions, the two "why" questions and every follow-up, the endings, the feedback, the Reflect scene. Each line has an `id`. The id is also the audio file name. `when` shows a line only if an earlier choice matches. `pose` and `expression` drive the 3D people.
- `content/ui-copy.json`: all interface words (Home, Start flow, buttons, About, Support). The university wellbeing email is under `contacts`. The placeholders the team still has to fill (emergency contact, survey link) are under `placeholders`.

Tests check these files for real brand names, banned words and the "no points" rule, so a slip is caught.

Writing or changing a story? Follow [`content/WRITING-GUIDE.md`](content/WRITING-GUIDE.md). It says what the project is about (digital citizenship) and how the words should sound.

## How a written answer is read

The browser sends the answer to `/api/score`. The route asks the provider for a reading and returns it. **The reader only picks which team-written text comes next (`textId`). It never writes anything the learner sees.**

- Rubric and rule table: `lib/ai/providers/mock.ts` (the rules are in `pickRule`, the cue words at the top).
- Branching, endings and the "keep the higher level" rule: `lib/engine/` (`adaptation.ts`, `endings.ts`, `flow.ts`, `state.ts`).
- Levels, rule IDs and flags are internal. They appear only in the Lab (`/lab`).

Demo mode (`AI_PROVIDER=mock`, the default) uses written rules, no model. It reads the learner's actual words, is deterministic, and waits 0.9 to 1.8 seconds so it feels like the real thing. Add `?fail=1` to any page URL to show the error state. `?fail=0` turns it off. The Lab has the same switch. `MOCK_FAIL_RATE` makes the mock fail at random.

### Switch to a real model

1. Set `AI_PROVIDER=llm` and `LLM_API_KEY` in the environment.
2. Fill in `callModel` in `lib/ai/providers/llm.ts`. The scoring prompt (Appendix C of the brief) is already in that file.

Nothing else changes. Replies are checked against the same zod schema. If a reply is invalid, it retries once and then falls back to the mock and logs `fallback_to_mock`. Compare the model's levels with the two human raters in the Lab CSV before the pilot.

## Voice

Voice is made ahead of time, never while someone plays. The key is never in the browser.

1. Put your key in `.env.local`: `ELEVENLABS_API_KEY=...` (local only, never on Vercel).
2. Pick a voice for each speaker from the ElevenLabs library (see the casting sheet, `design/motion-voice.html`) and paste the IDs into `voices.json`.
3. `npm run audio`. It writes `public/audio/<lineId>.mp3`, remembers a hash of each line, and only remakes lines that changed. Commit the files so a deploy needs no key.

There are 58 voiced lines (every variant). `npm run audio -- --dry` lists them. If ElevenLabs keeps failing, the script stops after three failures. You can make the files another way and drop them in `public/audio` with the same names.

Sound and auto-play start on. Each line plays its voice and moves on a moment after it ends. With no voice file, or if the browser blocks sound, a line stays long enough to read and then moves on. Decisions and written answers always wait for the learner. A **Pause** button, the sound button and Settings turn these off, and Space, a click or **Next** skip ahead. A missing file means captions only, and the story carries on. `NEXT_PUBLIC_VOICE=0` removes all audio controls.

Browsers only let a page make sound after the person has clicked something. The learner always clicks "Begin" first, so the voice normally starts at once. If a browser still blocks it, the line shows **Replay line** and the next click or key press unlocks sound.

## 3D and "Simple visuals"

The stage is 2D cut-paper by default and 3D when it can be. The 3D layer is loaded only when wanted (never in the first page bundle). It hangs the 2D scene's paper layers in space and puts clay people between them. The people are built from primitives (`scenes3d/characters/Clay.tsx`) and use the same joint table as the 2D figures (`lib/art/rig.ts`).

It is off if `NEXT_PUBLIC_3D=0`, if the learner turns on "Simple visuals", or if the Lab switch is off. If WebGL cannot start, or anything in 3D fails, it falls back to 2D and logs `fallback_2d`. The story plays start to finish with text only.

To use GLB models later, put them in `public/models/` and register a component in `scenes3d/characters/index.ts`. Scene code does not change.

## Privacy

- One anonymous session ID (a random UUID), created when the age gate is passed. No names, no emails, no accounts.
- Everything is kept in the browser (`localStorage`, key `dt_session_v1`). "Delete my data" clears it.
- The three API routes read a learner's text to answer, then forget it. They do not store or log it. The hosting provider may keep standard request logs.
- No cookies of our own. No third-party scripts or analytics.
- "Download my log" gives the learner their own JSON file.

## The Lab (team only)

`/lab?key=<LAB_KEY>`. Not linked anywhere. Without the right key it looks like a page that does not exist. It shows, for the current browser session: the event log, every written answer with the reader's result (level, rule, flags, evidence, provider, latency), the ending decision, a rater form (two columns), and **Export CSV** for the AI-versus-human comparison: `sessionId, promptId, attempt, answer, aiLevel, rater1, rater2, rule, flags`.

## Put it on GitHub and Vercel

1. Push this folder as the root of a repository, so `package.json` sits at the top. `.gitignore` already keeps out `node_modules`, `.next`, `.env.local` and test output. Never commit `.env.local`.
2. In Vercel choose **Add New > Project**, import the repository, and leave the settings as detected (Framework: Next.js, root directory: the repository root).
3. Before the first deploy, add these environment variables (Production and Preview): `AI_PROVIDER=mock`, `LAB_KEY=<a long random string>`, `NEXT_PUBLIC_VOICE=1`, `NEXT_PUBLIC_3D=1`. Do **not** set `ELEVENLABS_API_KEY` or `LLM_API_KEY` there. `NEXT_PUBLIC_*` values are fixed at build time, so redeploy after changing them.
4. Every push to a branch then gets its own preview URL, and the main branch is the live site.
5. The Lab is at `<your-url>/lab?key=<LAB_KEY>`. Share the key only with the team.

Voice files in `public/audio` are committed with the code (see Voice above). Without them the player shows captions only.

## Layout

```
app/              pages and the three API routes
components/       the stage, start flow, feedback, Reflect, Lab, and small parts
content/          story.json and ui-copy.json (all the words)
lib/story/        story types and loader (zod)
lib/ai/           provider types, mock, llm stub, browser client
lib/engine/       state, flow, adaptation rules, endings
lib/log/          events, export, Lab storage
lib/art/          the 2D cut-paper figures and scenes
lib/voice/        audio manifest
scenes3d/         the 3D layer: people, sets, layers, camera
scripts/          generate-audio.ts
tests/            unit (Vitest) and e2e (Playwright)
design/           the approved design pack
```

## Known limits

- One story. Off-topic text still gets that story, with a note.
- If an answer cannot be read after two tries, the learner can continue without a follow-up. That answer is unscored and counts as 0 for the ending.
- The mock reader works on English cue words. It is a stand-in for a model, not a measure of anyone's thinking.
- In 3D mode, text inside the scene layers (chat bubbles, the menu board) uses a plain font, because an image cannot reach the page's web fonts.
- Device tilt works where the browser allows it without asking. The app never prompts for it.
