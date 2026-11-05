# DigiTales AI: Design (Phase 1)

SEGP Group 012. Prototype for supervisor feedback.
Status: **waiting for approval.** No app code has been written. Phase 2 starts when the team says "approved".

Open `design/index.html` in a browser to see everything. It needs an internet connection for the two Google fonts. The previews are static HTML, CSS and a little JavaScript. No build step.

---

## 1. Direction

**Paper theatre after midnight.** A small stage made of cut-paper layers. Matte clay characters. At night the only light is a phone. The interface is warm paper and ink, like a theatre programme. One signal colour, persimmon (`ping`), means "a notification just arrived".

Why: the story starts with a phone lighting up a dark room. It should feel handmade and human, not like software.

The written reasoning step is the product. Voice and 3D are a layer on top. If they fail or are off, the story still plays start to finish with text only.

---

## 2. Tokens

Source files: `css/tokens.css` (all tokens), `css/base.css` (components).

### 2.1 Colour

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F4EEE3` | Main background, caption plate |
| `paper-deep` | `#E7DFCE` | Panels, hairlines |
| `ink` | `#1C1B19` | Text, outlines |
| `ink-soft` | `#4A4741` | Secondary text |
| `night` | `#10242B` | Night scenes, stage frame |
| `night-lift` | `#1D3B46` | Night scene layers |
| `phone-glow` | `#CFE8EF` | Phone light, chat panel |
| `morning` | `#F6D9B8` | Morning scenes |
| `ping` | `#E5502B` | Primary button, notification dot, focus ring. Nothing else |
| `ping-ink` | `#8A2A12` | Accent text on paper |
| `moss` | `#3F6B4F` | Calm confirmation |
| `butter` | `#F0C75E` | Highlighter under key words, Lisa's coat |

Speaker colours: narrator `ink`, Sarah chip `#27706D` (her sweater is `#2E7D7A`), Lisa `butter`, Marco `#2F5D3A`, Dev `#37393D`, You `#9A978F`.

No purple or blue-violet anywhere. The only gradients are four flat two-stop skies behind scenes: night, morning, warm, grey-blue. Light and glow are drawn as flat stepped shapes.

### 2.2 Contrast (WCAG 2.2 AA), measured

| Pairing | Used for | Ratio | Needs | Result |
|---|---|---|---|---|
| ink on paper | Body text | 14.90 | 4.5 | Pass |
| ink-soft on paper | Secondary text | 8.02 | 4.5 | Pass |
| ink on paper-deep | Panel text | 12.98 | 4.5 | Pass |
| ink-soft on paper-deep | Secondary on panels | 6.98 | 4.5 | Pass |
| paper on night | Stage frame text | 13.89 | 4.5 | Pass |
| phone-glow on night | Light text on night | 12.56 | 4.5 | Pass |
| ink on phone-glow | Chat panel | 13.48 | 4.5 | Pass |
| ink-soft on phone-glow | Chat names | 7.25 | 4.5 | Pass |
| **ink on ping** | **Primary button label** | **4.52** | 4.5 | **Pass** |
| paper on ping | (rejected) | 3.30 | 4.5 | Fails, not used |
| ping-ink on paper | Accent text | 7.51 | 4.5 | Pass |
| ping-ink on paper-deep | Accent on panels | 6.55 | 4.5 | Pass |
| ping-ink on morning | Accent on morning | 6.42 | 4.5 | Pass |
| moss on paper | Calm text | 5.31 | 4.5 | Pass |
| moss on paper-deep | Calm text on panels | 4.62 | 4.5 | Pass |
| ink on butter | Lisa chip, highlighter | 10.68 | 4.5 | Pass |
| ink on morning | Text on morning | 12.73 | 4.5 | Pass |
| paper on night-lift | Text on night layers | 10.30 | 4.5 | Pass |
| paper on Sarah chip `#27706D` | Sarah chip | 5.02 | 4.5 | Pass |
| paper on Sarah sweater `#2E7D7A` | (rejected) | 4.20 | 4.5 | Fails, not used for text |
| paper on Marco | Marco chip | 6.62 | 4.5 | Pass |
| paper on Dev | Dev chip | 10.02 | 4.5 | Pass |
| ink on You | You chip | 5.90 | 4.5 | Pass |
| ping on paper | Focus ring | 3.30 | 3 | Pass |
| ping on night | Focus ring on stage | 4.21 | 3 | Pass |
| ping on paper-deep | Focus ring on panels | 2.87 | 3 | Fails alone. Fixed with a 2px paper halo in the offset gap |

`tokens.html` recomputes this table live.

### 2.3 Type

Display: **Young Serif** (wordmark, headings, scene titles). Body: **Atkinson Hyperlegible Next**.

| Role | Size / line | Notes |
|---|---|---|
| Hero | 84 / 1.02 (fluid 40 to 84) | Home only |
| Heading 1 | 56 / 1.06 | |
| Heading 2 | 36 / 1.12 | Decision labels |
| Heading 3 | 28 / 1.3 | Why question |
| Body | **20** / 1.55 | Default. A- steps to 18 and no lower. A+ goes up |
| Caption | **24** / 1.42 | Allowed 22 to 26. Narration italic |
| Label | 16 bold, tracked | Chips, speaker names, footer. Never body copy |

Line length 62 characters at most (`--measure: 62ch`).

### 2.4 Shape, space, shadow

- Grid: 12 columns, 24px gutter, 64px side margin, used unevenly on purpose (text 7 and art 5, content at columns 3 to 9).
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius: 4px by default. 20px on chat bubbles only. Hairline rules instead of boxes.
- Paper lift: `0 1px 0 rgba(0,0,0,.12), 0 8px 16px rgba(0,0,0,.10)`. Small and night variants in `tokens.css`.
- Hard "ticket" shadow on buttons: `0 3px 0 ink`.
- Torn (deckle) edge on **three** things only: the Home diorama, the ending title card, the Why notebook's left edge.
- 4% paper grain on light surfaces (SVG noise). None on the dark stage.

### 2.5 Motion tokens

`--ease-paper: cubic-bezier(.22,.7,.2,1)`. Paper-slide 420ms. Choice cards rise 8px in 240ms. Lines appear whole, 120ms. Ping 900ms. Poses 400 to 600ms. With `prefers-reduced-motion`, every move becomes a 150ms crossfade. Details are in section 7.

---

## 3. Components

| Component | Spec |
|---|---|
| Wordmark | "DigiTales" in Young Serif. The persimmon ping dot replaces the dot of the **second** "i" (the first keeps its ink dot). Small "AI" after it in the body font, uppercase, tracked out. On a phone the stage uses just the dotted "i". |
| Top bar | Wordmark left. "About and AI use" and "Need support?" as plain links right. No hamburger on desktop. |
| Primary button | `ping` fill, **ink** label (not paper), 2px ink border, 4px radius, hard ticket shadow. Min height 56. |
| Paper button | Paper fill, same border. Quiet button is an underlined link. |
| Chip | 1.5px ink border, 4px radius, min height 44. Active is ink with a paper tick. Disabled is dashed. |
| Speaker chip | Name in caps in the speaker colour. Sits on the top edge of the caption plate. |
| Field | 2px ink border, warm white fill, 22px text, grows. No counter, no timer. |
| Option row | Hairline list. Square mark. Min height 64. |
| Caption plate | Paper strip along the bottom of the stage, 3px ink top edge. Narration in italic. Back one line, replay, hint. |
| Chat panel | `phone-glow` card with a slot at the top. Bubbles are the only heavily rounded things. Newest bubble gets the ping dot. Right side on desktop, bottom sheet on mobile. |
| Photo tile | Blurred stripe pattern labelled "Photo (hidden)". The photo is never drawn. |
| Decision cards | Two. Same size, same fill, same border, same type. No default focus. No confirm step. |
| Why notebook | Paper with ruled lines, a margin line and punched holes. Torn left edge. Stage slides to 40%. |
| Reader response | Paper-deep card with a heavy left rule, a ping dot and the text "A question for you". Own textarea. "Skip" is a link. |
| Reading state | "Reading your answer..." and three paper dots. Error state keeps the text. |
| Settings drawer | Sound, Simple visuals, text size (A-, A+), auto-advance. Switches are square, not coloured. |
| Support card | Shown in place of a follow-up if the safety flag is true. Never shows a score. |

Hard rules this design carries: no points, badges, streaks, levels, timers, leaderboards (rule 2); no learning-impact claims (3); no real names or brands (5); photo never shown (6); neither choice is better (9); feedback asks first (10); support link on every screen (13).

---

## 4. Screens and states

All copy is from the brief. Each row opens with `?s=` in the file.

| Screen | File | States |
|---|---|---|
| Home | `home.html` | Hero, four facts, four tabs, sample "why", before you start |
| Start flow | `start.html` | `1` age gate, `1no`, `2` content note, `3` input, `4a` emotion guess, `4b` appraisal, `4c` skipped-writing variant, `5` match, `5b` off-topic note |
| Story player | `play.html` | `narration`, `dialogue`, `chat`, `decision`, `why`, `loading`, `followup`, `error`, `settings`, `exit` |
| Ending and feedback | `ending.html` | `title-a`, `lines-a`, `title-b`, `lines-b`, `ask-a`, `explain-a`, `ask-b`, `explain-b`, `explain-b-skipped`, `end` |
| Reflect | `reflect.html` | `offer`, `scenario`, `followup`, `ack` |
| About and AI use | `about.html` | One page. Quiet "Demo scoring" tag |
| Support | `support.html` | One page, plus the in-story support card |
| Lab (team only) | `lab.html` | Switches, ending decision, answer cards with rater form, event log, CSV preview |

Layout notes:
- Desktop story stage is 16:9 and fills the viewport. Top bar items hang from the top edge as paper tabs.
- Mobile stage is full-bleed. Scenes crop to a portrait column around a focus point (see section 6).
- On a phone: the Home headline may wrap, About moves to the footer, and the story bar uses a lifebuoy button for "Need support?".

---

## 5. Characters

Style: matte clay, slightly squashed proportions, simple faces. Thin ink outline from an inverted-hull pass. Toon shading in three steps (light, base, shade), light from the top left, shadows lean cool. Faces are two dots, brow lines and a small mouth, swapped by changing the face texture. Baked contact blob under the feet, no real-time shadows.

Skin and hair are varied across the cast and are not tied to role or personality.

| Character | Height | Build | Palette | Props | Expressions |
|---|---|---|---|---|---|
| Sarah | 0.80 | Shortest, round | Skin `#9A6A47`, hair `#241915`, sweater `#2E7D7A`, scarf `#C99A2E`, pack `#6B7A3E`, trousers `#38404D` | Round glasses, low braid, big backpack | Calm, worried, hurt, steady |
| Lisa | 1.00 | Tallest, long coat | Skin `#F2CFB3`, hair `#8A4B2A`, coat `#F0C75E`, denim `#4F6D8F`, white shoes | High ponytail, striped socks | Laughing, smirk, defensive, ashamed, sorry |
| Marco | 0.87 | Roundest, body x1.32 | Skin `#6B4129`, hair `#1F1612`, tee `#8F8E88`, beanie `#2F5D3A`, trousers `#6E6350` | Beanie with bobble | Amused, shrug, embarrassed |
| Dev | 0.96 | Tall, thin, body x0.80 | Skin `#D3A57C`, hair `#2B2420`, hoodie `#37393D`, headphones `#C9C4B6`, trousers `#202226` | Headphones around his neck | Flat, bored, uneasy |
| You | 0.90 | Middle | Skin `#C79A74`, hair `#3A2D26`, sweater `#9A978F`, trousers `#24272D` | Phone | None. **Never shown from the front.** Back, hands and phone only. No voice |

### 5.1 Pose table

Nine procedural poses. Each is a table of joint rotations with an ease between them, 400 to 600ms. No external rig.

Shoulder: upper arm angle from hanging straight down, positive away from the body. Elbow: extra turn of the forearm, positive opens it outward and up, negative folds inward. Lean is the upper body about the hips. Nod is positive looking down.

| Pose | Shoulder L / R | Elbow L / R | Lean | Roll | Nod |
|---|---|---|---|---|---|
| `idle-breathe` | 7 / 7 | -7 / -7 | 0 | 0 | 0 |
| `look-phone` | -8 / -8 | -118 / -118 | 2 | 0 | .9 |
| `laugh` | 44 / -4 | 12 / -88 | -3 | -7 | -.7 |
| `shrug` | 48 / 48 | 80 / 80 | 0 | 6 | 0 |
| `turn-away` | -6 / -6 | -104 / -104 | 3 | -3 | .2 (and body yaw .85) |
| `hands-to-head` | 105 / 105 | 95 / 95 | 1 | 0 | .3 |
| `slump` | 4 / 4 | -4 / -4 | 5 | -4 | .9 (and drop 2.5) |
| `stand-firm` | 14 / 14 | -2 / -2 | 0 | 0 | -.2 (and stance 3.5) |
| `reach-out` | 8 / 82 | -8 / 8 | 2 | 5 | 0 |

This table is `Rig.POSES` in `js/rig.js`, and the previews draw straight from it.

### 5.2 Build route

Default: build in code from primitives (capsule body, squashed sphere head, small sphere hands) with react-three-fiber. Keep a `CharacterModel` interface so GLB models can replace them at `/public/models/*.glb` without changing scene code. Never block on model files. Fallback "Simple visuals": the flat cut-outs in these previews, same colours and poses.

---

## 6. Scene boards

Preview: `scenes.html`. Each scene is a stack of layers with a depth (0 far, 1 near) that drives parallax.

| Scene | Set | Light | Camera | People |
|---|---|---|---|---|
| S1 Ping | Dorm room: bed, desk, lamp, window. Curtain, shelf, poster shapes (none real) | Night. Cool phone glow on hands. Warm lamp spill | Over the shoulder on the bed, phone in the foreground. Slow push-in | You (back, `look-phone`) |
| S2 Your Move | Same room. Phone fills the frame. Bubbles float as cut-outs | Night, phone glow only | Close on phone. Slight handheld sway | None |
| S3 Two More Groups | Three phones in a row, joined by a paper chain. A photo tile on each | Night, three small glows | Wide. Side-pan left to right | None |
| S4 Morning | Campus café: counter, queue rail, tall windows, small tables, faceless paper crowd | Morning. Warm window light, long shadows | Medium. Learner behind Sarah in the queue | You, Sarah (back); Marco, Dev (`look-phone`) |
| S5 Sarah Knows | Café table, two-shot | Morning, softer | Sarah left, you (from behind) right | Sarah (`hurt`), You |
| S6 Lisa's Excuse | Café corner by the door | Morning, flatter | Lisa facing camera, you from behind | Lisa (`shrug`, `defensive`), You |
| S7 Ending A | Library steps | Warm, low sun | Wide, then a slow push to the three of them | Sarah (`steady`), Lisa (`sorry`), You |
| S7 Ending B | Library steps, an empty bench | Flat grey-blue, long shadow | Wide, then a slow push to Sarah's empty place | You (`look-phone`), Marco, Dev, Lisa (small, far) |

Portrait crops (mobile): the stage shows a 585-unit column of the 1600-unit scene, centred on a focus point: S1 760, S2 800, S3 800, S4 560, S5 845, S6 800, S7A 790, S7B 940. Every key moment sits inside its column. Turn on "Show the phone crop" on the scene boards page to check.

Layer depths per scene are listed on the scene boards page.

---

## 7. Motion notes

One signature move: the **ping**, a persimmon dot that pops on the phone with a small wobble. It also marks the newest chat bubble and the reader's reply.

| Move | Where | Time | Curve | With reduced motion |
|---|---|---|---|---|
| Ping | Home phone (every 6s), chat, wordmark hover | 900ms | `cubic-bezier(.22,.7,.2,1)` | Dot shown, no motion |
| Paper-slide scene change | Every scene change | 420ms, layers at depth speed | same | 150ms crossfade |
| Line in | Each caption line | 120ms fade, whole line, no typewriter | linear | 150ms |
| Choice cards rise | Decisions | 240ms, 8px | same | 150ms fade |
| Stage to 40% | When a Why opens | 420ms | same | 150ms |
| Reading dots | After Send | 1s loop | same | Static |
| Pose change | Characters | 400 to 600ms | ease in-out | 150ms |
| Parallax | Home, stage | Pointer, or tilt after permission | direct | Off |
| Camera push, pan, sway | S1, S2, S3, S7 | 5 to 12s | ease in-out | Off |

Never used: flashing, shaking, typewriter text, confetti, counters, streaks, timers. Live demos: `motion-voice.html`.

---

## 8. Voice casting (ElevenLabs)

Generated at build time. Keys never reach the browser. The team picks voices from the ElevenLabs library and pastes the IDs into `voices.json`. Settings are starting points. Chat lines use the sender's voice. Screen text and the learner are not voiced. Starts muted. Each line has a replay button. Missing audio means captions only.

| Speaker | Direction | Pace | Start with | Lines |
|---|---|---|---|---|
| Narrator | Calm, warm, mid-range, slightly slow. Late-night documentary, not a trailer | Slow | stability 0.60, similarity 0.75, style 0.10, speed 0.92 | 33 |
| Lisa | Bright, quick, young adult. Light laugh. Softer when sorry | Quick, softens for the apology | 0.40, 0.75, 0.30, 1.05 | 12 |
| Sarah | Soft, steady, young adult. Quiet strength. Not tearful, not dramatic | Even, a little slow | 0.65, 0.80, 0.10, 0.95 | 6 |
| Marco | Relaxed, easy, lower register | Easy | 0.50, 0.75, 0.15, 1.00 | 4 |
| Dev | Dry, flat, a little bored | Flat, slightly clipped | 0.70, 0.75, 0.00, 0.97 | 3 |
| You | No voice. Lines show as text only | | | 0 |

58 voiced lines in all, counting every variant. The full list by speaker, with line IDs, is on `motion-voice.html`.

**Lines that may run past about 6 seconds:** `eA_05` (19 words) and `s4d_04` (17 words). The brief says not to shorten the story, so they are kept as written and flagged.

**If ElevenLabs keeps failing:** the team makes the mp3 files from the line list and drops them in `public/audio` named by line ID, for example `s1_01.mp3`. Nothing else changes.

---

## 9. Accessibility

- WCAG 2.2 AA. Contrast is measured in 2.2. Focus ring is ping, 3px, 2px offset, with a paper halo on paper-deep.
- Full keyboard play: Space or Enter advances. Back one line works inside a scene. Choices are real buttons with no default focus.
- Captions are always on. Text size control (A- never below the 18px floor). Reduced motion respected. No flashing.
- Touch targets 44px or more. Works at 390px.
- Screen reader: scene titles, speaker and line are announced from the caption plate. The chat panel is visual history. The 3D canvas and scene art are `aria-hidden`, and every scene has a text description in the caption plate.
- "Need support?" is on every screen: a top-bar link, a stage bar link, and a lifebuoy button on a phone.

---

## 10. Checks against the brief

"Fail the design if" list: none of the ten items appears. See the table on `tokens.html`.

Open choices I made (also on the start page):
1. Primary button label is ink on persimmon, since paper on persimmon is 3.30:1.
2. The wordmark's persimmon dot is on the second "i".
3. Body is 20px by default so A- can reach 18px and stop there.
4. Sarah's chip is `#27706D`.
5. Focus ring has a paper halo on paper-deep.
6. The previews load fonts from Google Fonts. The build will self-host them.
7. The people in the previews are 2D renders of the clay look. The 3D build uses the same joints, poses and colours.

One contradiction in the brief: rule 1 says not to shorten the story, and section 3.6 says keep every spoken line under about 6 seconds. I took the safer option: the story stays as written and two lines are flagged.

---

## 11. File map

```
design/
  index.html            Start here
  tokens.html           Colour, contrast, type, space, components, self-check
  desktop.html          Every screen at 1440
  mobile.html           Every screen at 390
  characters.html       Sheets, expressions, poses
  scenes.html           Scene boards
  motion-voice.html     Motion demos, voice casting, voiced lines
  home.html start.html play.html ending.html reflect.html about.html support.html lab.html
  css/  tokens.css base.css play.css gallery.css
  js/   rig.js scenes.js chrome.js gallery.js
  DESIGN.md             This file
```

What Phase 2 takes from this: `tokens.css` becomes the global tokens. `rig.js` becomes the data for the 3D pose table and the "Simple visuals" cut-outs. `scenes.js` becomes the 2D fallback sets and the layer plan for the 3D sets. The page CSS becomes the component styles.
