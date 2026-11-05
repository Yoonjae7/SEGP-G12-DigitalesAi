# DigiTales AI writing guide

Read this before you write or change any story, line, question or feedback text. It keeps every story sounding like the same project.

## What every story is about: digital citizenship

DigiTales AI is about how people behave online and what that does to real people. Every story puts the learner in one believable online moment, asks them to decide, and then asks them to explain who is responsible for what and why.

Good topics:

- Sharing or forwarding photos, screenshots and private messages, and consent
- Group chats, peer pressure and joining in
- Privacy and personal information
- Online bullying, teasing that goes too far, and leaving people out
- Respect and manners online, and apologising when you get it wrong
- Being a bystander: speak up, stay quiet, or help the person
- Digital footprint, and what stays online after you delete it
- Spotting fake, misleading or scam content
- Asking for help and reporting

Keep each story on online behaviour and its effect on people. Do not turn it into a general life lesson. The story never says what the right answer is, and neither does the wording around it. Every option has a cost.

## How it should sound

Write the way a person would tell a friend what happened. Then read it out loud. If it sounds like a poster, a script or a speech, rewrite it.

1. **Say it directly.** Name what someone feels or means. Do not hint at it with an image.
2. **Let sentences flow.** Join short ideas with "and", "but" and "so". Do not stack three or more short fragments in a row.
3. **Use contractions.** "doesn't", "isn't", "it's", "didn't". Chat messages should look like real chat messages ("Haha", "Wow. Okay.").
4. **Plain words.** No slang that needs explaining, and no local places, clubs or buildings. A reader from anywhere should get every line. (We removed "Hall B", "Film Night" and "Legend" for this reason.)
5. **One tense.** Narration is in the present tense, and "you" is the learner.
6. **Short enough to speak.** Most voiced lines are one idea, around 20 words or fewer. Every voiced line is read aloud.

## Patterns that sound AI-written. Avoid them.

- "She is not X. She is Y." and "not X, but Y" for effect
- Dramatic one-word or one-clause sentences: "Read." "She does not know."
- Pictures instead of facts: "fills the screen", "her face goes still", "your message sits there", "the cursor blinks", "goes red"
- Lists of three for rhythm
- Explaining the moral in the narration ("This shows that...")
- Colon reveals: "Now add one thing: ..."
- Stiff openers: "It is worth noting", "Let us"

## Before and after

| Before | After |
|---|---|
| Lisa is your friend. She is not trying to be cruel. She thinks it is a joke. | Lisa is your friend. She doesn't mean any harm. She just finds it funny and takes it lightly. |
| Laughing faces fill the screen. You are not laughing. | Everyone in the chat is laughing, but you don't think it's funny. |
| Nobody asked Sarah. She does not know. | Nobody asked Sarah before posting it, and she has no idea the photo exists. |
| Your message sits there. Read. | Lisa read your message but hasn't replied. |
| Her face goes still. | She looks shocked. |
| Lisa goes red. | Lisa looks embarrassed and a bit hurt. |
| Send this to Hall B. | Send this to our study group chat. |
| Ha! Legend. | Haha, this is so good. |
| You said who did what. Now add one thing: what could happen to Sarah? | You've said who did what. Can you add what could happen to Sarah because of it? |

## Questions and follow-ups

- Ask for reasons ("who is responsible for what, and why"), never for the "right" answer.
- A follow-up is a friendly question. It never judges the answer or says it was wrong.
- Feedback lines show a trade-off: what the choice protected, and what it cost.
- No points, scores, levels, badges or streaks. No claims that the story improves learning.

## Checklist for a new story

- It is about digital citizenship, set in an online moment that adults 18 and over will recognise.
- No real app, brand or platform names. A photo in the story is a cut-paper cartoon in the game's own style, never a real photograph or a real person.
- Three decisions. Each has two options with a real cost, and each leads to a short beat before the paths join again.
- Two written "why" questions with team-written follow-ups. The reader only picks which one shows.
- Two endings, picked from the written answers and not from the options chosen.
- A content note before the story, and a link to support (wellbeing email: Wellbeing.Ambassadors@nottingham.edu.my).
- Every line has an `id`. The `id` is also the audio file name.
- Run `npm test`. It catches brand names, banned words and the stiff phrases listed above. Add a phrase to the test in `tests/unit/story.test.ts` when you spot a new one.

The app plays one story today. A second story needs its own file in the same shape as `content/story.json` and a small change to load it. The tone rules above apply either way.
